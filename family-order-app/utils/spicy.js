/**
 * 辣度档位：**唯一的事实来源**
 *
 * 三处共用：菜谱列表页的角标文字、菜谱详情页的抽屉选项、详情页浏览态的辣椒根数
 * 与保存时的合法性校验。
 *
 * 为什么必须抽成一个文件：这四个档位原先在两个页面里各存了一份（列表页存
 * `{ 值: 文案 }`、详情页存 `{ 值, 文案, 图标 }`）。扩到四档时只改了其中一份，
 * 于是「特辣」在列表页被 `|| 默认值` 吃成了「不辣」—— 而页面本身**毫无报错**，
 * 这类"值域变更必须同时改多处"的枚举就不该存在第二份拷贝。
 *
 * 顺序即档位高低：浏览态的辣椒根数直接用 `SPICY_LEVELS.indexOf()` 取，
 * 所以数组顺序不能随便调整。
 */

export const SPICY_OPTIONS = [
  { value: 'none', label: '不辣', image: '/static/images/recipes/spicy/none-v1.png' },
  { value: 'mild', label: '微辣', image: '/static/images/recipes/spicy/mild-v1.png' },
  { value: 'medium', label: '中辣', image: '/static/images/recipes/spicy/medium-v1.png' },
  { value: 'hot', label: '特辣', image: '/static/images/recipes/spicy/hot-v1.png' }
]

/** 档位值数组（顺序即辣度高低）：保存校验与辣椒根数用它 */
export const SPICY_LEVELS = SPICY_OPTIONS.map((option) => option.value)

/**
 * 值 → 中文文案
 *
 * 给只显示文字的地方用（如列表页卡片角标）。未设置与非法值取不到，
 * 调用方一般写 `SPICY_TEXT[value] || SPICY_TEXT.none` 落到「不辣」。
 */
export const SPICY_TEXT = SPICY_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label
  return map
}, {})
