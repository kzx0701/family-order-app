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
  { value: 'none', label: '不辣', image: '/static/images/recipes/spicy/none-v2.svg' },
  { value: 'mild', label: '微辣', image: '/static/images/recipes/spicy/mild-v2.svg' },
  { value: 'medium', label: '中辣', image: '/static/images/recipes/spicy/medium-v2.svg' },
  { value: 'hot', label: '特辣', image: '/static/images/recipes/spicy/hot-v2.svg' }
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

/**
 * 值 → 档位图案路径
 *
 * 辣度的展示原先分成两派：菜谱列表卡片与详情页浏览态用 Icon.vue 里的**单色**辣椒
 * 循环 N 根，编辑抽屉用 `SPICY_OPTIONS.image` 那套**彩色**素材图 —— 同一档辣度在
 * 页面里长得不一样。现在四处（列表 / 详情浏览 / 点单抽屉只读行 / 编辑抽屉选项）
 * 统一走这一份映射，改素材只改 utils/spicy.js。
 *
 * **非法值、未设置一律返回空串**，而不是兜底成「不辣」：
 * 「没设置辣度」和「明确设为不辣」是两回事 —— 前者应当整个不显示。返回空串后
 * 调用方一个 `v-if` 就能收掉（`v-if="spicyImage(x)"`），也不必各自再写一遍校验；
 * 若在这里兜底成 none，脏数据会静默显示成「不辣」，反而看不出问题。
 *
 * @param {string} value - 档位值（none / mild / medium / hot）
 * @returns {string} 素材路径；非四档之一时为空串
 */
export const spicyImage = (value) => {
  const hit = SPICY_OPTIONS.find((option) => option.value === value)
  return hit ? hit.image : ''
}

/**
 * 同上，但**给「标记」语义的展示位用**：不辣与未设置都返回空串
 *
 * 两种展示语义要分开，别混：
 * - **字段**（点单抽屉里的「辣度 不辣」）—— 四档都要画出来，包括不辣的那枚斜线辣椒，
 *   因为一行里必须有图标，而且"不辣"是一个要读出来的值；
 * - **标记**（菜谱列表卡片的元信息行、菜谱详情的菜名下）—— 「不辣」是默认状态，
 *   每道不辣的菜都挂一枚斜线辣椒只是噪音，所以整个不显示。
 *
 * 这条规则原先散在两个页面的模板条件里（`v-if="spicyCount"`），现在收成一处 ——
 * 再加展示位时调这个函数就行，不会各写一遍判断。
 */
export const spicyMark = (value) => (value && value !== 'none' ? spicyImage(value) : '')

/**
 * 【尺寸换算须知 —— 改辣度图案尺寸前必读】
 *
 * 四张素材都是 `viewBox="0 0 96 96"` 的方形画布，而辣椒主体只占画布中间**约 53% 高**
 * （y 从 21 到 72；宽度随档位变化：不辣含斜线约 39、微辣 25、中辣 56、特辣 87）。
 * 所以 `aspectFit` 装进边长为 S 的方框时，**辣椒实际只有 `S × 0.531` 高**：
 *
 *   想让辣椒看起来高 H  →  方框给 `H ÷ 0.531 ≈ H × 1.88`
 *
 * ⚠️ **别拿旧 Icon 的 `size` 直接当目标高** —— 这是最容易算错的一步：
 * `Icon.vue` 的 `size` 是**元素尺寸**，而辣椒 path 只占它 `24` 画布的约 **86%**
 * （y 从 1.3 到 22）。所以旧的 `:size="13"`（= 26rpx）画出来的辣椒只有 `26 × 0.86 ≈ 22rpx` 高。
 *
 * 三处展示位**统一取「辣椒视觉高 ≈ 24rpx」**，即方框一律 `24 ÷ 0.531 ≈ 45.2 → 46rpx`。
 * 换素材前各自的尺寸与换算后的对照（便于回滚核对）：
 *
 *   - 菜谱列表卡片：旧 `:size="13"`（26rpx 元素）→ 辣椒实际 22.4rpx → 新方框 46rpx，辣椒 24.4rpx
 *   - 菜谱详情浏览态：旧 `size="28rpx"` → 辣椒实际 24.2rpx → 新方框 46rpx，辣椒 24.4rpx
 *   - 点单抽屉只读行：旧 `:size="15"`（30rpx 元素）→ 辣椒实际 25.9rpx → 新方框 46rpx，辣椒 24.4rpx
 *
 * 三处取同一个值而不是各拍一个：**「统一样式」的要义就是同一档辣度在任何页面都一样大**，
 * 而且素材辣椒比旧 icon 瘦（宽高比 0.47 vs 0.58），视觉重量轻，略放大一点反而更接近。
 *
 * 另外两点从素材本身推出来的：① **框必须给正方形**，给长方形（哪怕更宽）`aspectFit`
 * 会按短边铺满，辣椒反而更小；② 不同档位的**内容宽度不同但框宽相同**，所以同一行里
 * 卡片不会因为辣度多少而错位 —— 这是固定方框的附带好处，别改成"按内容自适应宽度"。
 */
