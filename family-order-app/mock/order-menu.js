/**
 * 点单页的**购物车行逻辑**
 *
 * ⚠️ 文件名还叫 mock，但它已经**不是 mock 数据源**了：2026-09-20 按主人要求，
 * 菜单数据（原 menuItems / menuCategories）已清掉，点单页改读云端 `menu-list` 接口；
 * 装饰插画搬去了 `utils/menu-art.js`。这里只剩下**纯前端**的购物车行操作 ——
 * 与 `mock/recipe-editor.js` 里 `validateRecipe` 同样的情况（名字叫 mock、内容是生产逻辑）。
 * 文件名保留，是为了避免一次纯改名牵动页面的 import 与产物路径。
 */

/**
 * 清单行的 key：**只由菜品 id 决定**
 *
 * 2026-09-20 定稿：同一个菜品在清单里**只占一条**，不支持多份。
 * 改备注是「更新这一条」，不是「再开一条」—— 原先 key 里带着口味，
 * 同一道菜选两种口味就各占一行、数量还会各自累加，与「一道菜就是一道菜」的直觉不符。
 */
export const cartKey = id => String(id)

/**
 * 加入清单 / 更新已在清单里的那一条
 *
 * 重复加入同一个菜品**不新增、不累加**：备注以最后一次为准。
 * 因此没有 quantity 字段（每条的份数恒为 1），也不再需要「最多 20 份」的拦截。
 *
 * **没有 options 参数**了：菜品的固有属性（辣度、咖啡冷热）由菜谱决定、用户不可改；
 * 而「用户可选的口味」云端 dishes 还没有对应字段（2026-09-20 与主人确认「先不做」），
 * 所以一条清单行里只剩「这份菜单独的备注」这一项用户输入。
 */
export function addToCart(lines, item, note = '') {
  const key = cartKey(item.id)
  const line = lines.find(value => value.key === key)
  const trimmed = String(note || '').trim()
  if (line) {
    line.note = trimmed
    return
  }
  lines.push({ key, id: item.id, name: item.name, image: item.image, note: trimmed })
}

/** 从清单里移除一条。份数恒为 1，所以「减」就是「删」，直接摘掉整行。 */
export function removeLine(lines, key) {
  const index = lines.findIndex(item => item.key === key)
  if (index >= 0) lines.splice(index, 1)
}
