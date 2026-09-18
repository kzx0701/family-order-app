<template>
  <view class="recipe-page">
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
              <text>{{ category.name }}</text><view class="category-mark" />
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
    </view>
    <view class="page-footnote"><text>—</text><Icon name="food" :size="14" /><text>好好吃饭，就是日常的小浪漫</text><text>—</text></view>
    <view class="preview-note"><text>家里的味道，慢慢记下来</text><button v-if="userStore.isCook" class="manage-button" @tap="showConfigurationScope"><Icon name="edit" :size="13" />菜谱配置</button></view>
    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'
import { imgUrl } from '@/utils/image.js'
import RecipeArt from '@/components/recipe-art/recipe-art.vue'
const userStore = useUserStore()
const { statusBarHeight, menuButton } = useSafeArea()
const headerTop = computed(() => menuButton.value?.bottom ? Math.round(menuButton.value.bottom + 12) : statusBarHeight.value + 26)
const search = ref('')
const searchFocused = ref(false)
// 与 fo-dialog 的输入框保持同一套：placeholder-class 在 scoped 样式下对小程序内部
// 渲染的 placeholder 不生效，必须用内联 placeholder-style；
// 色值 = $p2-ink-soft(#8c725e) 的 55% 透明版
const PLACEHOLDER_STYLE = 'color: rgba(140, 114, 94, 0.55)'
// 辣度：云端存英文枚举（dishes.schema.json），展示层映射成中文
const SPICY_TEXT = { none: '不辣', mild: '微辣', medium: '中辣' }

const categories = ref([])
const dishes = ref([])
const loading = ref(false)
const loaded = ref(false)
const activeCategory = ref('all')

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
 * 云端字段 → 视图模型在这一层收敛，模板不直接碰原始文档，
 * 后续字段调整只改这里。
 */
const loadRecipes = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const dishRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'dishes-crud', action: 'list' } })
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
      const catRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list' } })
      const catResult = catRes.result || {}
      catList = (catResult.code === 0 ? catResult.list || [] : []).map((c) => ({ id: c._id, name: c.name }))
    }
    categories.value = catList.map((c) => ({ id: c.id || c._id, name: c.name }))
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
const categoryTabs = computed(() => [{ id: 'all', name: '全部' }, ...categories.value])

const filtered = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return dishes.value.filter((dish) => (activeCategory.value === 'all' || dish.categoryId === activeCategory.value)
    && (!keyword || [dish.name, dish.tip].some((value) => String(value).toLocaleLowerCase().includes(keyword))))
})
const openRecipe = recipe => uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?id=' + recipe.id, animationType: 'slide-in-right', animationDuration: 260 })
const resetFilters = () => { search.value = ''; activeCategory.value = 'all' }
const showConfigurationScope = () => uni.showModal({ title: '菜谱配置', content: '名称、图片、辣度、招牌与备注已在云端维护；配料、口味和步骤还没接入，补齐后才是完整菜谱、才能加入菜单。', showCancel: false, confirmText: '知道啦', confirmColor: '#624735' })
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
.category { position: relative; flex-shrink: 0; padding: 8rpx 10rpx 14rpx; font-size: $p2-fs-body; line-height: 1.4; color: $p2-ink-soft; transition: color $p2-dur-fast $p2-ease; &:active { opacity: .55; } &.selected { color: $p2-ink; .category-mark { opacity: 1; transform: rotate(-2deg) scaleX(1); } } }
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
.preview-note { display: flex; justify-content: center; align-items: center; gap: 20rpx; font-size: 19rpx; color: $p2-ink-soft; }
.manage-button { display: flex; align-items: center; gap: 6rpx; text-decoration: underline; min-height: 60rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 94rpx 16rpx 70rpx; }
.empty-book { display: flex; align-items: center; justify-content: center; width: 140rpx; height: 140rpx; border-radius: 50%; background: $p2-butter-soft; margin-bottom: 28rpx; transform: rotate(-8deg); }
.reset-button { background: $p2-leaf-soft; border: 2rpx solid $p2-line; padding: 20rpx 32rpx; margin-top: 30rpx; border-radius: 18rpx; font-size: $p2-fs-body; }
@keyframes card-arrive { from { opacity: 0; transform: translateY(12rpx); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .recipe-card { animation: none; } .recipe-card, .category, .card-photo { transition: none; } }
@media screen and (max-width: 360px) { .page-title { font-size: 49rpx; } .section-title { font-size: 32rpx; } .dish-name { font-size: 33rpx; } }
</style>
