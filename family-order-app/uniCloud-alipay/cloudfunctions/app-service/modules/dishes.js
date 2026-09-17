'use strict'
const { requireCook } = require('../utils/auth.js')

// 辣度档位：与 mock/recipes.js 的 flavors 一致（不辣 / 微辣 / 中辣）
const SPICY_LEVELS = ['none', 'mild', 'medium']

/**
 * 菜品 CRUD 云函数
 *
 * 与菜谱业务对齐的字段（写入时统一归一化，见 createDish / updateDish）：
 *   - image        菜品图片（uniCloud 云存储 URL）
 *   - name         菜品名称
 *   - spicy        辣度：none 不辣 / mild 微辣 / medium 中辣
 *   - isSignature  是否招牌（本家拿手菜）
 *   - note         菜品备注（做饭人的经验提醒，≤200 字）
 *
 * 支持的 action：
 *   - list       查询菜品（支持 type、categoryId、isOnSale 筛选），返回列表（含分类名 join）
 *   - create     新增菜品（仅饲养员）
 *   - update     编辑菜品（仅饲养员）
 *   - delete     删除菜品（仅饲养员）
 *   - toggleSale 切换上下架（仅饲养员）
 *   - sort       批量更新排序（仅饲养员，长按拖拽排序后调用）
 *
 * 鉴权方式：
 *   前端传入 token（user-login 返回的 openid），云函数查询 users 集合确认 lastMode == 'cook'。
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

  // 其余操作需饲养员鉴权
  const authRes = await requireCook(token)
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
    case 'sort':
      return await sortDishes(payload, dishCol)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
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

  // 用 where 查询替代 doc(_id).get()，保持不同 uniCloud 服务商下的查询兼容性
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

  // 一次性查询所有分类：既用于 join 分类名，也随 list 一起返回给菜谱页。
  // 排序必须与 categories-crud/list 完全一致（sortOrder asc, createTime asc），
  // 否则菜谱页分类栏的顺序会与直接从分类接口取时不同。
  const catRes = await catCol
    .orderBy('sortOrder', 'asc')
    .orderBy('createTime', 'asc')
    .get()
  const catMap = {}
  catRes.data.forEach((c) => {
    catMap[c._id] = c
  })

  const list = res.data.map((d) => ({
    ...d,
    categoryName: (catMap[d.categoryId] && catMap[d.categoryId].name) || ''
  }))

  // 分类栏数据：这次分类查询本来就已经付过成本（join 分类名必需），顺带返回
  // 即可让菜谱页省掉一整次 categories-crud/list 调用 —— 少一次网络往返，
  // 图片也就能更早开始加载。字段形状与 categories-crud/list 保持一致。
  const categories = catRes.data.map((c) => ({
    id: c._id,
    name: c.name,
    type: c.type,
    sortOrder: c.sortOrder || 0
  }))

  return { code: 0, list, categories }
}

/**
 * 新增菜品
 * 必填：name、type
 */
async function createDish({ name, image, description, spicy, note, type, categoryId, isOnSale, isRecommended, isSignature, sortOrder, temp } = {}, dishCol) {
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
    // 辣度：不在档位内一律落回「不辣」，避免脏值进库
    spicy: SPICY_LEVELS.includes(spicy) ? spicy : 'none',
    note: note ? String(note).trim().slice(0, 200) : '',
    type,
    categoryId: categoryId || '',
    isOnSale: isOnSale !== false,
    isRecommended: !!isRecommended,
    isSignature: !!isSignature,
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
  if (patch.spicy !== undefined) {
    patch.spicy = SPICY_LEVELS.includes(patch.spicy) ? patch.spicy : 'none'
  }
  if (patch.note !== undefined) {
    patch.note = patch.note ? String(patch.note).trim().slice(0, 200) : ''
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
  if (patch.isSignature !== undefined) {
    patch.isSignature = !!patch.isSignature
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

/**
 * 批量更新排序
 * 接收 items: [{ _id, sortOrder }, ...]（拖拽排序后前端一次性提交整个菜单类型的连续序号）
 */
async function sortDishes({ items } = {}, dishCol) {
  if (!Array.isArray(items) || items.length === 0) {
    return { code: 400, message: '缺少排序数据' }
  }

  const tasks = items.map((it) =>
    dishCol.doc(it._id).update({ sortOrder: Number(it.sortOrder) || 0 })
  )
  await Promise.all(tasks)

  return { code: 0, updated: tasks.length }
}
