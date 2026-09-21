/**
 * 菜品分类图标：**唯一的事实来源**
 *
 * 两处共用同一份：菜谱列表页顶部的分类 tab、菜谱详情页编辑态的「菜品分类」
 * 选择行与分类选择抽屉。加一个分类、换一张素材，只改这里。
 *
 * 为什么必须抽成一个文件：这六个图标原先在两个页面里**各存了一份** ——
 * 列表页存素材路径（彩色 SVG），详情页存 Icon.vue 的线性图标名。同一批分类
 * 在列表页是彩色小插画、在编辑页是单色线稿，改一处另一处不会跟着动，
 * 用户一眼就能看出「这不是同一套图标」。与辣度档位（utils/spicy.js）同一个教训：
 * **跨页面共用的值域只能有一份拷贝**。
 *
 * 为什么用素材文件而不是 Icon.vue 的路径：这六个是彩色插画，靠锅/蒸笼/碗的
 * **颜色**区分（蓝汤、绿叶、暖色主食）；Icon.vue 是单色 mask、强制继承
 * currentColor，套上去会把颜色信息全部抹掉，六类就只剩轮廓差异了。
 * 反过来说，单色、要跟着文字色走的图标（箭头、加号、辣椒…）仍然走 Icon.vue。
 *
 * 路径按分类名匹配；云端分类名字不固定，故留了几个同义名（见 ALIAS），
 * 全都命中不了时返回空串 —— 由调用方决定兜底（详情页会退回 Icon.vue 的餐具图标）。
 * 另外，云端 `categories.image` 若填了图**优先于**这里的素材（见详情页 categoryOptions）。
 */

const CATEGORY_ART = {
  // 「全部」不是一个菜系，但它同样要占着分类行第一格。给它一份**同族**的插画：
  // 同一套碗身/碗沿，碗里堆四团颜色各异的食物（正好取其余图标的主色
  // #9DBBC0 蓝灰 / #85A96F 叶绿 / #F2C65D 黄油 / #E97768 珊瑚）——
  // 「什么都有」即「全部」。2026-09-21 按主人要求补，此前这一格只有文字、在图标行里看着是空的。
  全部: '/static/images/recipes/categories/all-v2.svg',
  炒菜: '/static/images/recipes/categories/stir-fry-v2.svg',
  蒸菜: '/static/images/recipes/categories/steam-v2.svg',
  烧菜: '/static/images/recipes/categories/braise-v2.svg',
  汤类: '/static/images/recipes/categories/soup-v2.svg',
  凉菜: '/static/images/recipes/categories/cold-v2.svg',
  主食: '/static/images/recipes/categories/staple-v2.svg'
}

/** 同义名 → 上面表里的正名（云端把它们写成这些叫法时也能拿到图） */
const ALIAS = { 汤: '汤类', 炖汤: '汤类', 煲汤: '汤类', 凉拌: '凉菜', 主: '主食', 饭: '主食' }

/**
 * 按分类名取图标路径；取不到返回空串
 *
 * 返回空串而不是某个默认图：调用方在列表页是「不渲染图标」、在详情页是
 * 「退回内置餐具图标」，两种兜底方式不同，不该由这里替它们决定。
 */
export const categoryArt = (name) => {
  const key = String(name === null || name === undefined ? '' : name).trim()
  return CATEGORY_ART[key] || CATEGORY_ART[ALIAS[key]] || ''
}
