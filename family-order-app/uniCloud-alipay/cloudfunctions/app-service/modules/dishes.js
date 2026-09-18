'use strict'
const { requireCook } = require('../utils/auth.js')

// 辣度档位：四档（不辣 / 微辣 / 中辣 / 特辣）。不在档位内的值一律落回 none。
// 注：不再与 mock/recipes.js 的 flavors 对齐 —— 那份演示数据里的「口味」是三档的（清淡/蒜香等），
// 与辣度是两回事，不要混用
const SPICY_LEVELS = ['none', 'mild', 'medium', 'hot']

// 单条配料用量的长度上限（自由文本，与 note 同思路做保护性截断）
const MAX_QUANTITY_LENGTH = 40

/**
 * 归一化配料引用数组（ingredients / seasonings 共用）
 *
 * 入参形如 [{ materialId, quantity }]：
 *   - materialId 必须是非空字符串，否则渲染时查不到物料、界面留空白，直接丢弃
 *   - 同一物料在一道菜里只应出现一次，重复项去重（保留首次出现的用量）
 *   - quantity 转字符串 + trim + 截断，防超长文本进库
 *   - 入参不是数组时落回空数组 —— 保证 dishes 里始终有这个字段，前端不必判 undefined
 */
function normalizeMaterials(input) {
  if (!Array.isArray(input)) return []
  const seen = new Set()
  const list = []
  for (const item of input) {
    if (!item || typeof item.materialId !== 'string') continue
    const materialId = item.materialId.trim()
    if (!materialId || seen.has(materialId)) continue
    seen.add(materialId)
    list.push({
      materialId,
      quantity: item.quantity ? String(item.quantity).trim().slice(0, MAX_QUANTITY_LENGTH) : ''
    })
  }
  return list
}

// 步骤上限与前端 addStep 的 30 步限制一致；三个长度上限与模板里的 maxlength 一一对应，
// 避免接口被直接调用时存进超过输入框允许长度的数据
const MAX_STEPS = 30
const MAX_STEP_TITLE_LENGTH = 50
const MAX_STEP_DESCRIPTION_LENGTH = 1000
const MAX_STEP_TIP_LENGTH = 300

/**
 * 归一化步骤数组
 *
 * 入参形如 [{ title, description, tip }]：
 *   - **数组顺序即步骤顺序**，与前端 draft.steps 的顺序一一对应，故不存 order 字段
 *   - **不存 id**：那是前端渲染用的标识（v-for 的 key、pageScrollTo 的锚点），
 *     不属于业务数据，前端每次读取时按位置生成
 *   - title 必填，为空的整条丢弃（前端 validateRecipe 已拦截，这里是防御）
 *   - description / tip 选填，trim + 截断
 *   - 元素数量上限 MAX_STEPS
 *   - 入参不是数组时落回空数组 —— 保证 dishes 里始终有这个字段，前端不必判 undefined
 */
function normalizeSteps(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter(step => step && typeof step === 'object' && String(step.title || '').trim())
    .slice(0, MAX_STEPS)
    .map(step => ({
      title: String(step.title).trim().slice(0, MAX_STEP_TITLE_LENGTH),
      description: step.description ? String(step.description).trim().slice(0, MAX_STEP_DESCRIPTION_LENGTH) : '',
      tip: step.tip ? String(step.tip).trim().slice(0, MAX_STEP_TIP_LENGTH) : ''
    }))
}

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
async function createDish({ name, image, description, spicy, note, ingredients, seasonings, steps, type, categoryId, isOnSale, isRecommended, isSignature, sortOrder, temp } = {}, dishCol) {
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
    // 配料：只存对 materials 集合的引用 + 本菜用量，名称与图片不落库
    //（否则同一物料在 N 道菜里存 N 份，改一次图就要遍历所有菜品）
    ingredients: normalizeMaterials(ingredients),
    seasonings: normalizeMaterials(seasonings),
    // 步骤：数组顺序即步骤顺序，元素不存 id / order（详见 normalizeSteps 的说明）
    steps: normalizeSteps(steps),
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
  // 分类：空串是合法值（菜品可以不归类）。只做字符串化 + trim，**不校验该分类是否存在** ——
  // 分类被删掉后菜品里会留下一个查不到的 id，那种情况按「未分类」渲染即可，不该拦住保存
  if (patch.categoryId !== undefined) {
    patch.categoryId = patch.categoryId ? String(patch.categoryId).trim() : ''
  }
  // 配料：整组替换而非合并 —— 编辑器提交的就是完整列表，
  // 合并语义会让「删掉一个配料」这件事无法表达
  if (patch.ingredients !== undefined) {
    patch.ingredients = normalizeMaterials(patch.ingredients)
  }
  if (patch.seasonings !== undefined) {
    patch.seasonings = normalizeMaterials(patch.seasonings)
  }
  // 步骤同样是整组替换 —— 编辑器提交的就是完整列表，步骤顺序也由它决定
  if (patch.steps !== undefined) {
    patch.steps = normalizeSteps(patch.steps)
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
