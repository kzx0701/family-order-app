'use strict'
const { requireCook } = require('../utils/auth.js')

/**
 * 物料 CRUD 云函数（食材 / 调料共用一张表）
 *
 * 为什么合并为一张表：食材与调料的字段完全同构（名称、图片、分组、排序、启用），
 * 拆成两张表会带来两套几乎一样的结构与代码。靠 group 字段区分即可，
 * 将来新增分组（干货、冷冻等）只需扩展 enum，不必建表。
 *
 * 支持的 action：
 *   - list    查询物料（支持 group / isActive 筛选），按 sortOrder 升序
 *   - create  新增物料（仅饲养员）
 *   - update  编辑物料（仅饲养员，含启用/停用）
 *   - delete  删除物料（仅饲养员）；被菜品引用时拒绝删除
 *
 * 鉴权方式：前端传入 token（openid），查询 users 集合确认 lastMode == 'cook'
 */

// 允许的分组（与 materials.schema.json 的 enum 保持一致）
const GROUPS = ['ingredient', 'seasoning']

exports.main = async (event, context) => {
  const { action, token, ...payload } = event
  const db = uniCloud.database()
  const materialCol = db.collection('materials')

  // 查询接口无需鉴权（干饭人看菜谱也要读到配料的名称与图片）
  if (action === 'list') {
    return await listMaterials(payload, materialCol)
  }

  // 其余操作需饲养员鉴权
  const authRes = await requireCook(token)
  if (!authRes.ok) {
    return { code: 401, message: authRes.message }
  }

  switch (action) {
    case 'create':
      return await createMaterial(payload, materialCol)
    case 'update':
      return await updateMaterial(payload, materialCol)
    case 'delete':
      return await deleteMaterial(payload, materialCol)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}


/**
 * 查询物料列表
 * 支持筛选：group（ingredient/seasoning）、isActive（是否启用）
 * 按 sortOrder 升序、createTime 升序排列（与 categories-crud/list 一致）
 */
async function listMaterials({ group, isActive } = {}, materialCol) {
  const where = {}
  if (group) where.group = group
  if (typeof isActive === 'boolean') where.isActive = isActive

  let query = materialCol
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
 * 新增物料
 * 必填：name、group
 */
async function createMaterial({ name, group, image, defaultQuantity, sortOrder } = {}, materialCol) {
  if (!name || !String(name).trim()) {
    return { code: 400, message: '物料名称必填' }
  }
  if (!GROUPS.includes(group)) {
    return { code: 400, message: '分组必填且只能为 ingredient 或 seasoning' }
  }

  const now = Date.now()
  const doc = {
    name: String(name).trim(),
    group,
    image: image || '',
    defaultQuantity: defaultQuantity ? String(defaultQuantity).trim() : '',
    sortOrder: Number(sortOrder) || 0,
    isActive: true,
    createTime: now,
    updateTime: now
  }
  const addRes = await materialCol.add(doc)
  return { code: 0, _id: addRes.id, material: { _id: addRes.id, ...doc } }
}

/**
 * 编辑物料
 * 仅更新传入的字段，createTime 不可变
 */
async function updateMaterial({ _id, ...patch } = {}, materialCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  // 防御性清理：移除不可变字段
  delete patch.createTime
  delete patch._id

  if (patch.name !== undefined) {
    patch.name = String(patch.name).trim()
    if (!patch.name) return { code: 400, message: '物料名称不能为空' }
  }
  if (patch.group !== undefined && !GROUPS.includes(patch.group)) {
    return { code: 400, message: '分组无效' }
  }
  if (patch.image !== undefined) {
    patch.image = patch.image || ''
  }
  if (patch.defaultQuantity !== undefined) {
    patch.defaultQuantity = patch.defaultQuantity ? String(patch.defaultQuantity).trim() : ''
  }
  if (patch.sortOrder !== undefined) {
    patch.sortOrder = Number(patch.sortOrder) || 0
  }
  // 停用即软删除：不再出现在选择器里，但已被引用的菜品仍能正常渲染
  if (patch.isActive !== undefined) {
    patch.isActive = !!patch.isActive
  }
  patch.updateTime = Date.now()

  const res = await materialCol.doc(_id).update(patch)
  if (res.updated === 0) {
    return { code: 404, message: '物料不存在' }
  }
  return { code: 0, updated: res.updated }
}

/**
 * 删除物料
 *
 * 被菜品引用时**拒绝物理删除** —— 否则菜品里会留下查不到的 materialId，界面上变成空白格。
 * 这种情况应改用 update 把 isActive 置 false（软删除）。
 *
 * 与 categories 的做法不同：分类被删时可以把菜品的 categoryId 置空（菜品本身还成立），
 * 而配料少一项会让菜品信息不完整、无法优雅降级，所以这里直接拦住并给出可选路径。
 */
async function deleteMaterial({ _id } = {}, materialCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  const originRes = await materialCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '物料不存在' }
  }

  // 引用检查：分别统计它作为「食材」和「调料」被多少道菜引用
  const dishCol = uniCloud.database().collection('dishes')
  const [asIngredient, asSeasoning] = await Promise.all([
    dishCol.where({ 'ingredients.materialId': _id }).count(),
    dishCol.where({ 'seasonings.materialId': _id }).count()
  ])
  const used = (asIngredient.total || 0) + (asSeasoning.total || 0)
  if (used > 0) {
    return {
      code: 409,
      message: `还有 ${used} 道菜在用它，不能删除。可以改为「停用」—— 已引用的菜品仍能正常显示。`,
      used
    }
  }

  const res = await materialCol.doc(_id).remove()
  if (res.deleted === 0) {
    return { code: 404, message: '物料不存在' }
  }
  return { code: 0, deleted: res.deleted }
}
