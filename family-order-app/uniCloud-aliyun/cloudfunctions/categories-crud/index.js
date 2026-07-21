'use strict'

/**
 * 分类 CRUD 云函数
 *
 * 支持的 action：
 *   - list    查询分类（支持 type 筛选），返回列表（按 sortOrder 升序）
 *   - create  新增分类（仅 admin）
 *   - update  编辑分类（仅 admin）
 *   - delete  删除分类（仅 admin，"推荐"分类为系统内置不可删除）
 *   - sort    批量更新排序（仅 admin）
 *
 * 鉴权方式：前端传入 token（openid），查询 users 集合确认 role == 'admin'
 */

// 系统内置分类名，受保护不可删除
const SYSTEM_CATEGORY_NAMES = ['推荐']

exports.main = async (event, context) => {
  const { action, token, ...payload } = event
  const db = uniCloud.database()
  const catCol = db.collection('categories')

  // 查询接口无需鉴权
  if (action === 'list') {
    return await listCategories(payload, catCol)
  }

  // 其余操作需管理员鉴权
  const authRes = await requireAdmin(token, db)
  if (!authRes.ok) {
    return { code: 401, message: authRes.message }
  }

  switch (action) {
    case 'create':
      return await createCategory(payload, catCol)
    case 'update':
      return await updateCategory(payload, catCol)
    case 'delete':
      return await deleteCategory(payload, catCol)
    case 'sort':
      return await sortCategories(payload, catCol)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}

/**
 * 鉴权：token 即 openid，查询 users 集合确认 role == 'admin'
 */
async function requireAdmin(token, db) {
  if (!token) {
    return { ok: false, message: '未授权：缺少登录凭证' }
  }
  const userCol = db.collection('users')
  const res = await userCol.where({ openid: token }).get()
  if (res.data.length === 0) {
    return { ok: false, message: '用户不存在' }
  }
  if (res.data[0].role !== 'admin') {
    return { ok: false, message: '无权限：仅管理员可操作' }
  }
  return { ok: true }
}

/**
 * 查询分类列表
 * 支持筛选：type（coffee/food）
 * 按 sortOrder 升序、createTime 升序排列
 */
async function listCategories({ type } = {}, catCol) {
  const where = {}
  if (type) where.type = type

  let query = catCol
  if (Object.keys(where).length > 0) {
    query = query.where(where)
  }
  const res = await query
    .orderBy('sortOrder', 'asc')
    .orderBy('createTime', 'asc')
    .get()

  return { code: 0, list: res.data }
}

/**
 * 新增分类
 * 必填：name、type
 */
async function createCategory({ name, type, sortOrder } = {}, catCol) {
  if (!name || !String(name).trim()) {
    return { code: 400, message: '分类名称必填' }
  }
  if (!['coffee', 'food'].includes(type)) {
    return { code: 400, message: '类型必填且只能为 coffee 或 food' }
  }

  const doc = {
    name: String(name).trim(),
    type,
    sortOrder: Number(sortOrder) || 0,
    createTime: Date.now()
  }
  const addRes = await catCol.add(doc)
  return { code: 0, _id: addRes.id, category: { _id: addRes.id, ...doc } }
}

/**
 * 编辑分类
 * 仅更新传入的字段，createTime 不可变
 */
async function updateCategory({ _id, ...patch } = {}, catCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  delete patch.createTime
  delete patch._id
  if (patch.name !== undefined) {
    patch.name = String(patch.name).trim()
    if (!patch.name) return { code: 400, message: '分类名称不能为空' }
  }
  if (patch.type !== undefined && !['coffee', 'food'].includes(patch.type)) {
    return { code: 400, message: '类型无效' }
  }
  if (patch.sortOrder !== undefined) {
    patch.sortOrder = Number(patch.sortOrder) || 0
  }

  // 校验原分类是否为系统内置，系统分类名称不可改
  const originRes = await catCol.doc(_id).get()
  if (originRes.data.length > 0) {
    const origin = originRes.data[0]
    if (SYSTEM_CATEGORY_NAMES.includes(origin.name) && patch.name && patch.name !== origin.name) {
      return { code: 403, message: '系统内置分类名称不可修改' }
    }
  }

  const res = await catCol.doc(_id).update(patch)
  if (res.updated === 0) {
    return { code: 404, message: '分类不存在' }
  }
  return { code: 0, updated: res.updated }
}

/**
 * 删除分类
 * "推荐"分类为系统内置，不可删除
 */
async function deleteCategory({ _id } = {}, catCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  // 查询分类，系统内置不可删除
  const originRes = await catCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '分类不存在' }
  }
  if (SYSTEM_CATEGORY_NAMES.includes(originRes.data[0].name)) {
    return { code: 403, message: '系统内置分类不可删除' }
  }

  const res = await catCol.doc(_id).remove()
  if (res.deleted === 0) {
    return { code: 404, message: '分类不存在' }
  }
  return { code: 0, deleted: res.deleted }
}

/**
 * 批量更新排序
 * 接收 items: [{ _id, sortOrder }, ...]
 */
async function sortCategories({ items } = {}, catCol) {
  if (!Array.isArray(items) || items.length === 0) {
    return { code: 400, message: '缺少排序数据' }
  }

  const tasks = items.map((it) =>
    catCol.doc(it._id).update({ sortOrder: Number(it.sortOrder) || 0 })
  )
  await Promise.all(tasks)

  return { code: 0, updated: tasks.length }
}
