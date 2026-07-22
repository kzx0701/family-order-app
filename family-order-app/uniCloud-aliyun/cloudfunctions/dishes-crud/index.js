'use strict'

/**
 * 菜品 CRUD 云函数
 *
 * 支持的 action：
 *   - list       查询菜品（支持 type、categoryId、isOnSale 筛选），返回列表（含分类名 join）
 *   - create     新增菜品（仅 admin）
 *   - update     编辑菜品（仅 admin）
 *   - delete     删除菜品（仅 admin）
 *   - toggleSale 切换上下架（仅 admin）
 *
 * 鉴权方式：
 *   前端传入 token（user-login 返回的 openid），云函数查询 users 集合确认 role == 'admin'。
 *   list 接口无需鉴权（所有人可读，点单页也需查询菜品）。
 */

exports.main = async (event, context) => {
  const { action, token, ...payload } = event
  const db = uniCloud.database()
  const dishCol = db.collection('dishes')
  const catCol = db.collection('categories')

  // 查询接口无需鉴权
  if (action === 'list') {
    return await listDishes(payload, dishCol, catCol)
  }

  // 详情查询也无需鉴权（点单页跳详情需要）
  if (action === 'detail') {
    return await getDishDetail(payload, dishCol, catCol)
  }

  // 其余操作需管理员鉴权
  const authRes = await requireAdmin(token, db)
  if (!authRes.ok) {
    return { code: 401, message: authRes.message }
  }

  switch (action) {
    case 'create':
      return await createDish(payload, dishCol)
    case 'update':
      return await updateDish(payload, dishCol)
    case 'delete':
      return await deleteDish(payload, dishCol)
    case 'toggleSale':
      return await toggleSale(payload, dishCol)
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
 * 查询单个菜品详情
 * 入参：_id 菜品 ID
 * 返回菜品完整信息 + categoryName
 */
async function getDishDetail({ _id } = {}, dishCol, catCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  // 用 where 查询替代 doc(_id).get()
  // 阿里云 uniCloud 的 doc(_id) 在云函数环境中对部分 _id 有兼容性问题
  const res = await dishCol.where({ _id }).get()
  if (!res.data || res.data.length === 0) {
    return { code: 404, message: '菜品不存在或已下架' }
  }
  const d = res.data[0]

  // 查询分类名（失败不影响主流程）
  let categoryName = ''
  if (d.categoryId) {
    try {
      const catRes = await catCol.where({ _id: d.categoryId }).get()
      if (catRes.data && catRes.data.length > 0) {
        categoryName = catRes.data[0].name || ''
      }
    } catch (e) {
      // 忽略分类查询失败
    }
  }
  return { code: 0, dish: { ...d, categoryName } }
}

/**
 * 查询菜品列表
 * 支持筛选：type（coffee/food）、categoryId、isOnSale
 * 返回列表按 sortOrder 升序、createTime 降序排列，并 join 分类名
 */
async function listDishes({ type, categoryId, isOnSale } = {}, dishCol, catCol) {
  const where = {}
  if (type) where.type = type
  if (categoryId) where.categoryId = categoryId
  if (typeof isOnSale === 'boolean') where.isOnSale = isOnSale

  let query = dishCol
  if (Object.keys(where).length > 0) {
    query = query.where(where)
  }
  const res = await query
    .orderBy('sortOrder', 'asc')
    .orderBy('createTime', 'desc')
    .get()

  // 一次性查询所有分类用于 join 分类名
  const catRes = await catCol.get()
  const catMap = {}
  catRes.data.forEach((c) => {
    catMap[c._id] = c
  })

  const list = res.data.map((d) => ({
    ...d,
    categoryName: (catMap[d.categoryId] && catMap[d.categoryId].name) || ''
  }))

  return { code: 0, list }
}

/**
 * 新增菜品
 * 必填：name、type
 */
async function createDish({ name, image, description, type, categoryId, isOnSale, isRecommended, sortOrder, temp } = {}, dishCol) {
  if (!name || !String(name).trim()) {
    return { code: 400, message: '菜品名称必填' }
  }
  if (!['coffee', 'food'].includes(type)) {
    return { code: 400, message: '类型必填且只能为 coffee 或 food' }
  }

  const now = Date.now()
  const doc = {
    name: String(name).trim(),
    image: image || '',
    description: (description || '').trim(),
    type,
    categoryId: categoryId || '',
    isOnSale: isOnSale !== false,
    isRecommended: !!isRecommended,
    sortOrder: Number(sortOrder) || 0,
    // 冷热配置：仅咖啡有效，美食留空
    temp: type === 'coffee' && (temp === 'ice' || temp === 'hot') ? temp : '',
    createTime: now,
    updateTime: now
  }
  const addRes = await dishCol.add(doc)
  return { code: 0, _id: addRes.id, dish: { _id: addRes.id, ...doc } }
}

/**
 * 编辑菜品
 * 仅更新传入的字段，createTime 不可变
 */
async function updateDish({ _id, ...patch } = {}, dishCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  // 防御性清理：移除不可变字段
  delete patch.createTime
  delete patch._id
  if (patch.name !== undefined) {
    patch.name = String(patch.name).trim()
    if (!patch.name) return { code: 400, message: '菜品名称不能为空' }
  }
  if (patch.type !== undefined && !['coffee', 'food'].includes(patch.type)) {
    return { code: 400, message: '类型无效' }
  }
  if (patch.description !== undefined) {
    patch.description = String(patch.description).trim()
  }
  if (patch.sortOrder !== undefined) {
    patch.sortOrder = Number(patch.sortOrder) || 0
  }
  if (patch.isOnSale !== undefined) {
    patch.isOnSale = !!patch.isOnSale
  }
  if (patch.isRecommended !== undefined) {
    patch.isRecommended = !!patch.isRecommended
  }
  // 冷热配置：仅 coffee 有效；切换为 food 时清空 temp
  if (patch.temp !== undefined) {
    patch.temp = (patch.type === 'coffee' || patch.type === undefined) && (patch.temp === 'ice' || patch.temp === 'hot') ? patch.temp : ''
  }
  if (patch.type === 'food') {
    patch.temp = ''
  }
  patch.updateTime = Date.now()

  const res = await dishCol.doc(_id).update(patch)
  if (res.updated === 0) {
    return { code: 404, message: '菜品不存在' }
  }
  return { code: 0, updated: res.updated }
}

/**
 * 删除菜品
 */
async function deleteDish({ _id } = {}, dishCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  const res = await dishCol.doc(_id).remove()
  if (res.deleted === 0) {
    return { code: 404, message: '菜品不存在' }
  }
  return { code: 0, deleted: res.deleted }
}

/**
 * 切换上下架状态
 */
async function toggleSale({ _id, isOnSale } = {}, dishCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  const res = await dishCol.doc(_id).update({
    isOnSale: !!isOnSale,
    updateTime: Date.now()
  })
  if (res.updated === 0) {
    return { code: 404, message: '菜品不存在' }
  }
  return { code: 0, updated: res.updated }
}
