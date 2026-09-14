'use strict'

/**
 * 菜单查询云函数：点单页专用聚合接口
 *
 * 入参：
 *   - type  菜单类型：'coffee' | 'food'
 *
 * 行为：
 *   1. 校验 type
 *   2. 查询 categories 集合：按 type 筛选，sortOrder 升序
 *   3. 查询 dishes 集合：按 type 筛选 + isOnSale==true，sortOrder 升序、createTime 降序
 *   4. 构造"推荐"分类（系统内置）：
 *      - 作为分类列表的第一项，id='recommend'，name='推荐'
 *      - 推荐菜品：取 isRecommended=true 的菜品（由管理员在菜品表单中配置）
 *   5. 返回 { code, categories, dishes }
 *      - categories：[{ id, name, type, sortOrder }, ...]，首项为推荐
 *      - dishes：[{ dishId, name, image, description, type, categoryId, categoryName, sortOrder, isRecommended }, ...]
 *        其中 isRecommended=true 表示该菜品出现在推荐区
 */

// 推荐分类的系统内置 id 与名称
const RECOMMEND_ID = 'recommend'
const RECOMMEND_NAME = '推荐'

exports.main = async (event, context) => {
  const { type } = event

  // 1. 参数校验
  if (!['coffee', 'food'].includes(type)) {
    return { code: 400, message: 'type 参数无效，必须为 coffee 或 food' }
  }

  const db = uniCloud.database()
  const catCol = db.collection('categories')
  const dishCol = db.collection('dishes')

  try {
    // 2. 并行查询分类与菜品
    const [catRes, dishRes] = await Promise.all([
      catCol
        .where({ type })
        .orderBy('sortOrder', 'asc')
        .orderBy('createTime', 'asc')
        .get(),
      dishCol
        .where({ type, isOnSale: true })
        .orderBy('sortOrder', 'asc')
        .orderBy('createTime', 'desc')
        .get()
    ])

    // 3. 构造分类映射，便于菜品 join 分类名
    const catMap = {}
    catRes.data.forEach((c) => {
      catMap[c._id] = c
    })

    // 4. 构造菜品列表（统一字段名 dishId，附加 categoryName）
    const allDishes = dishRes.data.map((d) => ({
      dishId: d._id,
      name: d.name,
      image: d.image || '',
      description: d.description || '',
      type: d.type,
      categoryId: d.categoryId || '',
      categoryName: (catMap[d.categoryId] && catMap[d.categoryId].name) || '',
      sortOrder: d.sortOrder || 0,
      isRecommended: !!d.isRecommended,
      // 冷热配置：仅咖啡有值（ice/hot），美食为空字符串
      temp: d.temp === 'ice' || d.temp === 'hot' ? d.temp : ''
    }))

    // 6. 构造分类列表（推荐置顶）
    const categories = [
      { id: RECOMMEND_ID, name: RECOMMEND_NAME, type, sortOrder: -1 },
      ...catRes.data.map((c) => ({
        id: c._id,
        name: c.name,
        type: c.type,
        sortOrder: c.sortOrder || 0
      }))
    ]

    return { code: 0, categories, dishes: allDishes }
  } catch (e) {
    console.error('[menu-list] query error', e)
    return { code: 500, message: '菜单查询失败' }
  }
}
