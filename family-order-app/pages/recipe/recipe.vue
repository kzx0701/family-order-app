<template>
  <view class="recipe-page" :class="{ 'has-add-bar': showAddBar }">
    <view class="recipe-sticky">
      <view class="recipe-header" :style="{ paddingTop: headerTop + 'px' }">
        <view class="heading-row">
          <text class="page-title">家里的拿手好菜</text>
        </view>
      </view>

      <view class="recipe-tools">
        <view class="search-box" :class="{ 'is-focused': searchFocused }">
          <Icon name="search" :size="18" :stroke-width="2.2" />
          <input v-model="search" class="search-input" placeholder="找道菜，或搜搜备注…" :placeholder-style="PLACEHOLDER_STYLE" confirm-type="search" :maxlength="40" aria-label="搜索菜谱名称或备注" @focus="searchFocused = true" @blur="searchFocused = false" />
          <button v-if="search" class="icon-button clear-button" aria-label="清空搜索" @tap="search = ''"><Icon name="close" :size="16" /></button>
        </view>
        <scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
          <view class="categories">
            <button v-for="category in categoryTabs" :key="category.id" class="category" :class="{ selected: activeCategory === category.id }" :aria-pressed="activeCategory === category.id" @tap="activeCategory = category.id">
              <view class="category-icon-slot"><image v-if="category.icon" class="category-icon" :src="category.icon" mode="aspectFit" /></view><text>{{ category.name }}</text><view class="category-mark" />
            </button>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="loading && !dishes.length" class="recipe-skeleton"><skeleton type="dish" :count="4" /></view>
    <view v-else-if="filtered.length" :key="activeCategory" class="recipe-grid">
      <button v-for="(recipe, index) in filtered" :key="recipe.id" class="recipe-card" :style="{ animationDelay: Math.min(index, 5) * 35 + 'ms' }" :aria-label="'查看' + recipe.name + '菜谱'" @tap="openRecipe(recipe)">
        <view class="card-picture">
          <view v-if="recipe.image" class="card-photo-box"><image class="card-photo" :class="{ 'is-loaded': photoReady[recipe.id] }" :src="imgUrl(recipe.image, { w: 480 })" mode="aspectFit" :webp="true" @load="markPhotoReady(recipe.id)" @error="markPhotoReady(recipe.id)" /></view>
          <RecipeArt v-else :index="index % 6" :label="recipe.name" />
          <text class="card-label" :class="{ signature: recipe.isSignature }">{{ recipe.isSignature ? '家的拿手菜' : recipe.spicy }}</text>
        </view>
        <view class="card-copy">
          <text class="dish-name">{{ recipe.name }}</text>
          <view class="card-meta"><text class="card-tip">{{ recipe.tip || '做法还在记' }}</text><Icon name="chevron-right" :size="15" /></view>
        </view>
      </button>
    </view>
    <view v-else-if="loaded" class="empty-state">
      <view class="empty-book"><Icon name="book-open" :size="42" :stroke-width="1.3" /></view>
      <text class="section-title">{{ dishes.length ? '这道味道，还没翻到' : '第一道菜，还等你记下来' }}</text><text class="page-subtitle">{{ dishes.length ? '试试其他菜名、备注，或放宽筛选吧。' : '饲养员添几道拿手菜，就会出现在这里。' }}</text>
      <button v-if="dishes.length" class="reset-button" @tap="resetFilters">看看全部菜谱</button>
      <button v-else-if="canAdd" class="reset-button" @tap="createRecipe"><Icon name="plus" :size="16" />添第一道菜</button>
    </view>
    <view class="page-footnote"><text>—</text><Icon name="food" :size="14" /><text>好好吃饭，就是日常的小浪漫</text><text>—</text></view>
    <!-- 新建入口：常驻在底栏之上的固定卡槽 —— 无论列表多长、滚到哪里都点得到。
         形态沿用网格里那一版的语汇（虚线 + 手绘不规则圆角 + 手绘贴纸圆 + 手写体），
         只是改成横向单行的窄条（96rpx）：固定元素要长期占用视口，不能像原位版那样占两行。
         外层 .add-bar 铺不透明纸色底，滚上来的卡片会被它挡住，不会从虚线框里透出来。 -->
    <view v-if="showAddBar" class="add-bar">
      <button class="add-slot" aria-label="再记一道拿手菜" @tap="createRecipe">
        <view class="add-slot-art"><Icon name="plus" :size="20" :stroke-width="2.2" /></view>
        <text class="add-slot-title">再记一道拿手菜</text>
      </button>
    </view>
    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'
import { imgUrl } from '@/utils/image.js'
import { SPICY_TEXT } from '@/utils/spicy.js'
import { categoryArt } from '@/utils/category-art.js'
import RecipeArt from '@/components/recipe-art/recipe-art.vue'
const { statusBarHeight, menuButton } = useSafeArea()
const userStore = useUserStore()
/**
 * 能不能加菜谱：只有饲养员（cook）。
 *
 * 这与云端的鉴权一致 —— `dishes-crud` 的 create 走 `requireCook`，干饭人点了必然 401。
 * 所以入口不是「藏起来更好看」，而是**权限决定它存不存在**：
 * 干饭人看不到底部卡槽、也看不到空态里的「添第一道菜」。
 */
const canAdd = computed(() => userStore.isCook)
const headerTop = computed(() => menuButton.value?.bottom ? Math.round(menuButton.value.bottom + 12) : statusBarHeight.value + 26)
const search = ref('')
const searchFocused = ref(false)
// 与 fo-dialog 的输入框保持同一套：placeholder-class 在 scoped 样式下对小程序内部
// 渲染的 placeholder 不生效，必须用内联 placeholder-style；
// 色值 = $p2-ink-soft(#8c725e) 的 55% 透明版
const PLACEHOLDER_STYLE = 'color: rgba(140, 114, 94, 0.55)'
// 辣度文案来自 utils/spicy.js —— 本页不要再维护一份映射：四档曾在列表页与详情页
// 各存一份，扩档时只改了一处，「特辣」就被这里的 `|| 默认值` 吃成了「不辣」，
// 而且页面毫无报错（2026-09-18 的实际事故）。

const categories = ref([])
const dishes = ref([])
const loading = ref(false)
const loaded = ref(false)
const activeCategory = ref('all')

/**
 * 底部「再记一道拿手菜」卡槽是否常驻
 *
 * 条件是「饲养员 + 家里已经有菜谱」：
 * - 干饭人不显示（云端 create 走 requireCook，点了必然 401）
 * - 一道菜都没有时也不显示 —— 那种情况由空态自己的「添第一道菜」承接，
 *   否则页面上会同时冒出两个新增入口
 * 其余时候常驻，且**不跟搜索/分类筛选联动**（否则筛到空结果时底栏一闪一闪的）。
 * 它常驻后，正文要按 .has-add-bar 多让出一段底部留白，见样式里的说明。
 */
const showAddBar = computed(() => canAdd.value && dishes.value.length > 0)

/**
 * 成品图是否已就绪（key = 菜品 id）
 *
 * 卡片入场动画（card-arrive 300ms）结束时图片往往还在路上，没有过渡就是
 * "空框 → 图凭空出现"，视觉上会被读成一次卡顿。这里让图片淡入，与卡片
 * 入场动画接上，把"等图"变成"图自己浮现出来"。
 * 加载失败同样标记为就绪 —— 否则图会永远停在 opacity:0，卡片变成一块空白。
 */
const photoReady = reactive({})
const markPhotoReady = (id) => {
  photoReady[id] = true
}

/**
 * 取菜谱数据
 *
 * 只调 dishes-crud / list 一个接口（无需鉴权，干饭人也要能看菜谱）：
 * 分类栏数据由它顺带返回 —— 该接口内部本来就要查一次 categories 做
 * categoryName join，顺带返回是零额外成本，省掉一整次云函数网络往返。
 * 少一次往返 = 卡片渲染更早 = 图片请求更早发出，这是首屏最直接的提速。
 *
 * 降级：云函数尚未重新上传时拿不到 categories 字段，此时回退调一次
 * categories-crud / list，保证分类栏不会空（不依赖云函数先更新）。
 *
 * 口径：本页只取 `type: 'food'` 的菜谱与分类。详情页的分类选择同样只取 food
 * （categories-crud/list 带 type），两处必须一致 —— 否则会出现「列表多出一个
 * 永远点不出菜的 tab」或「详情页能选、列表页筛不到」。咖啡（coffee）属点单页范畴。
 *
 * 云端字段 → 视图模型在这一层收敛，模板不直接碰原始文档，
 * 后续字段调整只改这里。
 */
const loadRecipes = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const dishRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'dishes-crud', action: 'list', type: 'food' } })
    const dishResult = dishRes.result || {}
    if (dishResult.code !== 0) {
      uni.showToast({ title: dishResult.message || '菜谱加载失败', icon: 'none' })
      return
    }
    dishes.value = (dishResult.list || []).map((d) => ({
      id: d._id,
      name: d.name,
      image: d.image || '',
      spicy: SPICY_TEXT[d.spicy] || SPICY_TEXT.none,
      isSignature: !!d.isSignature,
      categoryId: d.categoryId || '',
      // 卡片副行：优先备注（做饭人的经验），没有就退回描述
      tip: d.note || d.description || ''
    }))
    // 分类优先取 list 顺带返回的（形状为 { id, name }）；旧版云函数无此字段则回退
    let catList = dishResult.categories
    if (!Array.isArray(catList)) {
      const catRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list', type: 'food' } })
      const catResult = catRes.result || {}
      catList = (catResult.code === 0 ? catResult.list || [] : []).map((c) => ({ id: c._id, name: c.name }))
    }
    // 只保留 food 分类：新版权云函数已按 type 过滤，但**没重传时返回的仍是全类型**
    // （与本页既有的「旧版云函数则回退」同一思路），兜一道才不会多出咖啡 tab。
    categories.value = catList.filter((c) => !c.type || c.type === 'food').map((c) => ({ id: c.id || c._id, name: c.name }))
    // 选中的分类被删掉时退回「全部」，避免停在空列表
    if (activeCategory.value !== 'all' && !categories.value.some((c) => c.id === activeCategory.value)) {
      activeCategory.value = 'all'
    }
  } catch (e) {
    console.error('[recipe] loadRecipes error', e)
    uni.showToast({ title: '网络不太好，稍后再试', icon: 'none' })
  } finally {
    loading.value = false
    loaded.value = true
  }
}

// 每次进入页面静默刷新（首次才显示骨架屏）：饲养员新加的菜谱切回来就能看到
onShow(loadRecipes)

// 分类栏：固定「全部」置首，其余来自 categories 集合
// 图标只由分类名映射（utils/category-art.js），后端仍可继续返回动态分类 ——
// 命中不了的分类不显示图标（文字 tab 仍成立），不会因为多了个分类就报错。
// 这份映射与菜谱详情页编辑态的「菜品分类」**共用同一个文件**：两处曾各存一份，
// 列表页是彩色素材、编辑页是单色线稿，同一批分类在两个页面长得不一样。
const categoryTabs = computed(() => [
  { id: 'all', name: '全部', icon: '' },
  ...categories.value.map(item => ({ ...item, icon: categoryArt(item.name) }))
])

const filtered = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return dishes.value.filter((dish) => (activeCategory.value === 'all' || dish.categoryId === activeCategory.value)
    && (!keyword || [dish.name, dish.tip].some((value) => String(value).toLocaleLowerCase().includes(keyword))))
})
const openRecipe = recipe => uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?id=' + recipe.id, animationType: 'slide-in-right', animationDuration: 260 })
/**
 * 新建菜谱：进详情页的**新建态**（`mode=create`）
 *
 * 详情页是「编辑菜谱」的唯一表单（名称 / 封面 / 分类 / 辣度 / 配料 / 步骤都在那儿），
 * 所以新增不再另做一个表单页 —— 同一份编辑器、同一套校验，差别只在起点数据与保存时
 * 调的是 create 而不是 update（见 recipe-detail 的 creating）。
 * 返回本页时 onShow(loadRecipes) 会静默刷新，新菜谱立刻出现在列表里。
 */
const createRecipe = () => uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?mode=create', animationType: 'slide-in-right', animationDuration: 260 })
const resetFilters = () => { search.value = ''; activeCategory.value = 'all' }
</script>

<style lang="scss" scoped>
@import '@/scss/font-recipe.scss';
.recipe-page { min-height: 100vh; padding: 0 32rpx calc(160rpx + env(safe-area-inset-bottom)); background: $p2-paper; color: $p2-ink; }
button { padding: 0; margin: 0; background: none; color: inherit; font: inherit; line-height: inherit; border-radius: 0; &::after { border: 0; } }
// 背景须铺满整屏宽：页面容器带 32rpx 左右 padding，吸顶块作为子元素若只铺内容盒，
// 左右各 32rpx 就成了它永远盖不到的 gutter —— 列表滚动时下层卡片溢出的
// box-shadow（3rpx 4rpx 0）与吸顶块自身边缘缝隙会在那里露出竖直细线。
// 负 margin + 等量 padding 把背景扩到 750rpx，内容盒仍是 686rpx，内层排版零位移。
.recipe-sticky { position: sticky; top: 0; z-index: 20; background: $p2-paper; margin: 0 -32rpx; padding: 0 32rpx; }
.recipe-header { padding-bottom: 10rpx; }
.heading-row { display: flex; align-items: center; }
.page-title { display: block; font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-display; line-height: 1.2; letter-spacing: 2rpx; }
// 新建入口 = 常驻底栏之上的固定卡槽（v2）。
// 语汇沿用网格里那一版（虚线 + 手绘不规则圆角 + 手绘贴纸圆 + 手写体），但版式改成
// **横向单行窄条**：固定元素要长期占着视口，不能像原位版那样占两行。
// 位置贴着底栏上沿，外层 .add-bar 铺不透明纸色底 —— 滚上来的卡片会被它挡住，
// 不会从虚线框里透出来；纸色底与底栏（.tabbar-footer 同为 $p2-paper）连成一片，
// 阅读上是一整块底部区域，而不是"浮着一张条"。
// 与底栏的接缝：底栏上沿在 `safe-area + 118rpx`（6rpx 内边距 + 112rpx 栏高），
// 这里取 124rpx 故意**压过去 4rpx**，避免四舍五入后露出一条透出内容的发丝缝。
.add-bar { position: fixed; left: 0; right: 0; bottom: calc(124rpx + env(safe-area-inset-bottom)); z-index: 190; padding: 14rpx 32rpx 12rpx; background: $p2-paper; }
.add-slot { display: flex; align-items: center; justify-content: center; gap: 14rpx; height: 96rpx; border: 2rpx dashed #a8b68b; border-radius: 22rpx 18rpx 24rpx 17rpx; color: #63784f; animation: card-arrive 300ms $p2-ease backwards; transition: transform $p2-dur-tap $p2-ease; &:active { transform: scale(.98); } }
// 手绘贴纸圆：与空态的书本圈（.empty-book）同一手法 —— 不规则圆 + 轻微旋转 + 纸片色，
// 也就是 custom-tabbar 里那块「菜谱」选中贴纸的语汇。图标走 Icon.vue，颜色单独压深一档，
// 否则绿色加号落在绿贴上会糊成一片。
.add-slot-art { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; flex-shrink: 0; border-radius: 47% 53% 46% 54%; background: $p2-leaf-soft; color: $p2-ink; transform: rotate(-6deg); }
// 标题用手写体 —— 与卡片上的菜名同源，读起来是「同一本本子上的字」，不是界面文案
.add-slot-title { font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-control; line-height: 1.3; }
// 卡槽常驻时正文多让出的底部留白：底栏（128rpx + safe-area）+ 卡槽（14 + 96 + 12 = 122rpx）
// 再加一点呼吸。**只在卡槽真的显示时才加**（.has-add-bar 类由 showAddBar 控制），
// 否则干饭人、或家里还没有菜谱的页面底部会凭空多出一大块空白。
.recipe-page.has-add-bar { padding-bottom: calc(272rpx + env(safe-area-inset-bottom)); }
.page-subtitle { display: block; margin-top: 10rpx; color: $p2-ink-soft; font-size: $p2-fs-caption; line-height: 1.7; }
// 顶部占位压缩（方案 A，合计 −47rpx）：间距全部按「够用」取最小值，不动标题位置。
// 已移除 box-shadow：blur 型投影会从四边外溢（无 blur 的 0 0 才不外溢），分类行改成纯文字后
// 内容区左右边缘外侧各 4~5px 的浅带就变成了显眼的竖线。项目里粘顶头部（submit.vue 的 .header）
// 一律只有背景色、无分隔投影，这里对齐该做法；滚动时卡片自身的描边足以界定边界。
.recipe-tools { padding: 4rpx 0 0; }
// 搜索框：对齐二期输入框规范（同 components/fo-dialog 的 .fo-dialog-field）
// —— 奶油底 + 实棕描边 + 不规则圆角，聚焦时描边转珊瑚色；图标走 Icon.vue，不再 CSS 手绘。
// 高度 72rpx（36pt，iOS 搜索栏标准高度），与本页 chip 行（74rpx）同高，不再单独占一条宽带。
.search-box { display: flex; align-items: center; gap: 14rpx; height: 72rpx; padding: 0 24rpx; color: $p2-ink-soft; background: $p2-surface; border: 2rpx solid $p2-line; border-radius: 20rpx 24rpx 19rpx 23rpx; transition: border-color $p2-dur-fast $p2-ease; &.is-focused { border-color: $p2-coral; } }
.search-input { flex: 1; min-width: 0; height: 64rpx; font-size: $p2-fs-control; color: $p2-ink; }
.icon-button { display: flex; align-items: center; justify-content: center; width: 60rpx; height: 60rpx; color: $p2-ink-soft; }
// 分类行：文字 tab + 手绘标记线（同 custom-tabbar 的 .tab-underline 手法：不规则圆角 + 轻微旋转）。
// 去掉原来的圆角方块（描边 + 实底 + 硬投影），一屏六类共 564rpx，宽 686rpx 放得下、不再被右边缘裁切。
// 行高由 108rpx 收到 85rpx；未选中为次要文字色，选中转主文字色 + 叶片色标记线。
.category-scroll { width: 100%; white-space: nowrap; }
// 与详情页食材行同一处理：横向滚动列表必须用 inline-flex —— 容器宽度由内容决定，
// 分类一多必然溢出容器、必然可滚。块级 flex 的宽度恒等于父容器宽，靠子项溢出不可靠。
// vertical-align:top 消除 inline 元素固有的基线间隙（本行已有 white-space:nowrap，
// 分类名短、不涉及长文本折行问题，故保留）。
.categories { display: inline-flex; vertical-align: top; gap: 16rpx; padding: 10rpx 0 14rpx; }
.category { position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 2rpx; padding: 4rpx 10rpx 14rpx; font-size: $p2-fs-body; line-height: 1.4; color: $p2-ink-soft; transition: color $p2-dur-fast $p2-ease; &:active { opacity: .55; } &.selected { color: $p2-ink; .category-mark { opacity: 1; transform: rotate(-2deg) scaleX(1); } } }
// 图标槽：**没有图标时也要占住这 52rpx**。「全部」不在图标映射里（它不是一个菜系），
// 少了这一格它的文字就会顶到行首 —— .categories 是 flex 行、子项被拉伸到同一高度后
// 内容默认从顶排起，于是「全部」二字会比右侧同排的分类名高出一个图标的高度，整行读起来是歪的。
// 槽固定高度 + 居中，六类与「全部」的文字基线就永远在同一行。
.category-icon-slot { display: flex; align-items: center; justify-content: center; height: 52rpx; }
.category-icon { width: 52rpx; height: 52rpx; display: block; }
.category-mark { position: absolute; left: 10rpx; right: 10rpx; bottom: 3rpx; height: 6rpx; border-radius: 55% 45% 60% 40%; background: $p2-leaf; opacity: 0; transform: rotate(-2deg) scaleX(.5); transition: opacity $p2-dur-fast $p2-ease, transform $p2-dur-settle $p2-ease; }
.section-title { font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-title; }
.recipe-skeleton { padding-top: 24rpx; }
.recipe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26rpx 22rpx; padding-top: 16rpx; }
.recipe-card { text-align: left; min-width: 0; overflow: hidden; background: $p2-surface; border: 2rpx solid rgba(118,85,64,.7); border-radius: 24rpx 20rpx 26rpx 19rpx; box-shadow: 3rpx 4rpx 0 rgba(98,71,53,.08); animation: card-arrive 300ms $p2-ease backwards; transition: transform $p2-dur-tap $p2-ease, box-shadow $p2-dur-tap; &:active { transform: scale(.97); box-shadow: none; } &:nth-child(even) { border-radius: 19rpx 26rpx 21rpx 25rpx; } }
.card-picture { position: relative; overflow: hidden; }
// 成品图放在 75%（4:3）定比框里，与 RecipeArt 插画比例一致，卡片高度不跳。
// 素材是 1:1 透明抠图，故用 aspectFit 完整显示：aspectFill 会把上下裁掉约 25%，
// 并让盘子宽度铺满整卡，视觉上像"顶出卡片边界"。
.card-photo-box { position: relative; width: 100%; padding-top: 75%; }
// 淡入而非瞬时跳现：加载期间保持透明（露出卡片底色），@load 后才浮出来。
// 不加占位底色 —— aspectFit 下 1:1 素材左右本就留空，底色会变成一块可见色块。
.card-photo { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; transition: opacity $p2-dur-base $p2-ease; &.is-loaded { opacity: 1; } }
.card-label { position: absolute; bottom: 12rpx; left: 18rpx; font-size: 18rpx; padding: 5rpx 12rpx; background: #edf1db; border-radius: 7rpx 10rpx 7rpx 9rpx; color: #536844; &.signature { background: $p2-butter-soft; color: $p2-ink; } }
.card-copy { padding: 19rpx 18rpx 20rpx; }
.dish-name { display: block; font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-title; line-height: 1.3; }
.card-meta { display: flex; justify-content: space-between; gap: 16rpx; align-items: center; margin-top: 22rpx; color: $p2-ink-soft; font-size: 19rpx; }
.card-tip { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.page-footnote { display: flex; align-items: center; justify-content: center; gap: 13rpx; color: $p2-ink-soft; font-size: 21rpx; margin: 46rpx 0 22rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 94rpx 16rpx 70rpx; }
.empty-book { display: flex; align-items: center; justify-content: center; width: 140rpx; height: 140rpx; border-radius: 50%; background: $p2-butter-soft; margin-bottom: 28rpx; transform: rotate(-8deg); }
// 空态按钮：页面里两处空态共用同一形态（$p2-leaf-soft 底 + 实棕描边）——
// 筛选无结果时是「看看全部菜谱」，**还没有任何菜谱时是「添第一道菜」**（只对饲养员渲染）。
// 空态文案本来就写着「饲养员添几道拿手菜，就会出现在这里」，这里把这句话接到一个动作上，
// 否则新用户读完提示却无处可点。display:flex 是给带前导加号的后者排版用。
.reset-button { display: flex; align-items: center; gap: 10rpx; background: $p2-leaf-soft; border: 2rpx solid $p2-line; padding: 20rpx 32rpx; margin-top: 30rpx; border-radius: 18rpx; font-size: $p2-fs-body; transition: transform $p2-dur-tap $p2-ease; &:active { transform: scale(.96); } }
@keyframes card-arrive { from { opacity: 0; transform: translateY(12rpx); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .recipe-card, .add-slot { animation: none; } .recipe-card, .category, .card-photo, .add-slot, .reset-button { transition: none; } }
@media screen and (max-width: 360px) { .page-title { font-size: 49rpx; } .section-title { font-size: 32rpx; } .dish-name { font-size: 33rpx; } }
</style>
