'use strict'
const { requireCook } = require('../utils/auth.js')

/**
 * 分类 CRUD 云函数
 *
 * 支持的 action：
 *   - list    查询分类（支持 type 筛选），返回列表（按 sortOrder 升序）
 *   - create  新增分类（仅饲养员）
 *   - update  编辑分类（仅饲养员）
 *   - delete  删除分类（仅饲养员）。删除会把引用它的菜品 categoryId 置空，见 deleteCategory
 *   - sort    批量更新排序（仅饲养员）
 *
 * 鉴权方式：前端传入 token（openid），查询 users 集合确认 lastMode == 'cook'
 */

// 【2026-09-21 已删除】原先这里有一份「系统内置分类名」白名单（值为 ['推荐']），以及配套的两道保护
// （改名拦截、删除拦截）。云端 categories 集合里**从来没有叫「推荐」的记录** —— 那是 menu-list
// 接口凭代码构造的虚拟分类（同批已下线），所以这两道判断永远不命中，属纯残留。

exports.main = async (event, context) => {
  const { action, token, ...payload } = event
  const db = uniCloud.database()
  const catCol = db.collection('categories')

  // 查询接口无需鉴权
  if (action === 'list') {
    return await listCategories(payload, catCol)
  }

  // 其余操作需饲养员鉴权
  const authRes = await requireCook(token)
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

  const res = await catCol.doc(_id).update(patch)
  if (res.updated === 0) {
    return { code: 404, message: '分类不存在' }
  }
  return { code: 0, updated: res.updated }
}

/**
 * 删除分类
 *
 * ⚠️ 原先这里会先拦一道「系统内置分类（名为『推荐』）不可删除」，2026-09-21 随那份白名单一起删除。
 * 删除后仍会把引用该分类的菜品 `categoryId` 置空 —— 否则会留下挂着旧 id 的「孤儿菜品」，
 * 在列表页与点单页都查不到分类名（分类删除又重建后 _id 会变，旧 id 永远匹配不上）。
 */
async function deleteCategory({ _id } = {}, catCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  // 先确认存在：remove 对不存在的记录返回 deleted:0，但先查一次能给出更明确的 404
  const originRes = await catCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '分类不存在' }
  }

  const res = await catCol.doc(_id).remove()
  if (res.deleted === 0) {
    return { code: 404, message: '分类不存在' }
  }

  // 清理引用该分类的菜品：置空 categoryId，避免产生"孤儿菜品"
  // （分类删除又重建后 _id 会变，菜品挂旧 ID 会在点单页全部"暂无菜品"）
  let orphaned = 0
  try {
    const dishCol = uniCloud.database().collection('dishes')
    const orphanRes = await dishCol.where({ categoryId: _id }).update({
      categoryId: '',
      updateTime: Date.now()
    })
    orphaned = orphanRes.updated || 0
  } catch (e) {
    console.error('[categories-crud] clear orphan dishes error', e)
  }

  return { code: 0, deleted: res.deleted, orphaned }
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
