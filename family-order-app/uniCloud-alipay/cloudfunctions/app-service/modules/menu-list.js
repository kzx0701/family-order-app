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
 *   4. 返回 { code, categories, dishes }
 *      - categories：[{ id, name, type, sortOrder }, ...] —— **全部来自 categories 集合**，
 *        接口不再构造任何虚拟分类
 *      - dishes：[{ dishId, name, image, description, spicy, note, type, categoryId,
 *                   categoryName, sortOrder, isSignature }, ...]
 *        其中 isSignature=true 表示招牌/拿手菜（⚠️ 点单页**不再**为它单开筛选入口，
 *        见下面的说明；字段本身保留，菜谱页卡片上的「家的拿手菜」角标仍由它驱动）
 *
 * ⚠️ 2026-09-21 删除了「推荐」相关的一切，原因与范围：
 *   · 这里原先会**凭空构造**一条 `{ id: 'recommend', name: '推荐' }` 置于分类首位，
 *     但 categories 集合里从来没有叫「推荐」的记录（云端已确认）—— 那个分类是代码造出来的，
 *     一旦集合里真出现同名分类，界面上就会出现**两个「推荐」**；
 *   · 同时删掉菜品里的 `isRecommended`，配套改动见 dishes.schema.json（删字段）、
 *     admin.vue（删「是否推荐」开关与角标）、dish-detail.vue（删「推荐」标签）、
 *     order.vue（删推荐分类的分支与字段）、categories.js（删「推荐」分类的保护逻辑）。
 *   · 分类栏现在只反映 categories 集合的真实内容。
 *   · ⚠️ 2026-09-22 补充：前端那个按 isSignature 本地筛的虚拟「拿手菜」tab 也删掉了
 *     （在 order.vue，本模块不涉及）—— 与「推荐」是同一类问题：**分类栏里只能有
 *     categories 集合的真实记录**，凭空补的分类会让点单页与菜谱页对不上。
 *     这次只删前端入口，`isSignature` 字段与数据都保留。
 */

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
      // 辣度：档位必须与 dishes.schema.json 的 enum **逐字一致**（none/mild/medium/hot），
      // 脏值落回不辣。⚠️ 这里原先漏了 hot，导致「特辣」被静默改写成「不辣」——
      // 云函数里不能 import 前端的 utils/spicy.js（不同运行环境），所以这份白名单是**第二份拷贝**，
      // 改档位时必须两边一起改（2026-09-20 修复）。
      spicy: ['none', 'mild', 'medium', 'hot'].includes(d.spicy) ? d.spicy : 'none',
      note: d.note || '',
      type: d.type,
      categoryId: d.categoryId || '',
      categoryName: (catMap[d.categoryId] && catMap[d.categoryId].name) || '',
      sortOrder: d.sortOrder || 0,
      isSignature: !!d.isSignature,
      // 冷热配置：仅咖啡有值（ice/hot），美食为空字符串
      temp: d.temp === 'ice' || d.temp === 'hot' ? d.temp : ''
    }))

    // 5. 分类列表：直接映射 categories 集合，**不做任何构造**（排序沿用查询里的 sortOrder asc）
    const categories = catRes.data.map((c) => ({
      id: c._id,
      name: c.name,
      type: c.type,
      sortOrder: c.sortOrder || 0
    }))

    return { code: 0, categories, dishes: allDishes }
  } catch (e) {
    console.error('[menu-list] query error', e)
    return { code: 500, message: '菜单查询失败' }
  }
}
