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
              <view class="category-body">
              <view class="category-icon-slot">
                <!-- 静态层：**动图加载完成之前一直露着**，所以它的显隐不能绑在"已选中"上（见 iconDimmed） -->
                <image v-if="category.icon" class="category-icon" :class="{ 'is-dim': iconDimmed(category) }" :src="category.icon" mode="aspectFit" />
                <image v-if="category.iconActive && activeCategory === category.id" class="category-icon category-icon-moving" :src="category.iconActive" mode="aspectFit" @load="markIconLoaded(category.id)" @error="markIconFailed(category.id)" />
                </view>
                <text class="category-label">{{ category.name }}</text>
              </view>
              <view class="category-mark" />
            </button>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="loading && !dishes.length" class="recipe-skeleton"><skeleton type="dish" :count="4" /></view>
    <view v-else-if="filtered.length" :key="activeCategory" class="recipe-grid">
      <button v-for="(recipe, index) in filtered" :key="recipe.id" class="recipe-card" :style="{ animationDelay: Math.min(index, 5) * 35 + 'ms' }" :aria-label="'查看' + recipe.name + '菜谱'" @tap="openRecipe(recipe)">
        <view class="card-picture">
          <view v-if="recipe.image" class="card-photo-box"><image class="card-photo" :class="{ 'is-loaded': photoReady[recipe.id] }" :src="imgUrl(recipe.image, { w: IMG_W.dishCard })" mode="aspectFit" :webp="true" :lazy-load="true" @load="markPhotoReady(recipe.id)" @error="markPhotoReady(recipe.id)" /></view>
          <RecipeArt v-else :index="index % 6" :label="recipe.name" />
          <!-- 角标只说「招牌」这一件事。辣度已经由下方的辣椒表达，同一张卡上说两遍是重复，
               而且角标压在图片上、辣椒在信息行里，两者的读法也不一样（前者是标签、后者是量）。 -->
          <text v-if="recipe.isSignature" class="card-label">家的拿手菜</text>
        </view>
        <view class="card-copy">
          <!-- 菜名与辣度**同一行、两端对齐**：左端菜名、右端辣度。
               2026-09-21 按主人要求改版：原先「菜名」独占一行、下面再走一行「辣度 + 时长」，
               卡片平白多出一行高；现在并成一行，并**删掉时长**（那一行原本就是临时假数据，
               云端 dishes 至今没有 minutes 字段，留在界面上是把假数据当内容读）。
               行内靠 space-between + 菜名 flex:1 把辣椒顶到右端 —— 无需再留一个空容器占位。 -->
          <view class="card-meta">
            <text class="dish-name">{{ recipe.name }}</text>
            <image v-if="recipe.spicyArt" class="card-spicy" :class="'pull-' + recipe.spicy" :src="recipe.spicyArt" mode="aspectFit" />
          </view>
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
         外层 .add-bar 铺不透明纸色底，滚上来的卡片会被它挡住，不会从虚线框里透出来。
         2026-09-22：**一行拆成左右两个入口**（左菜谱、右咖啡）。两个槽位**除了图标与文案完全同形**
         （同一套虚线 / 手绘圆角 / 贴纸圆 / 手写体），不做配色区分 —— 区分靠图标与文字，
         多引入一套颜色只会让这一行读起来是「一个主按钮 + 一个次按钮」，而它们是平级的。
         ⚠️ 文案必须短：槽位宽度从 686rpx 砍到 (686−16)/2 = **335rpx**，内容宽 = 图标 64 + 间隙 14 +
         文字。手写体全角字宽≈字号(32rpx)，即最多放得下 8 字；现取 5 字 / 6 字，两侧各余 32rpx 以上。 -->
    <view v-if="showAddBar" class="add-bar">
      <view class="add-slots">
        <button class="add-slot" aria-label="再记一道拿手菜" @tap="createRecipe">
          <view class="add-slot-art"><Icon name="plus" :size="20" :stroke-width="2.2" /></view>
          <text class="add-slot-title">再记一道菜</text>
        </button>
        <button class="add-slot" aria-label="再添一杯咖啡" @tap="createCoffee">
          <view class="add-slot-art"><Icon name="coffee" :size="20" :stroke-width="2.2" /></view>
          <text class="add-slot-title">再添一杯咖啡</text>
        </button>
      </view>
    </view>
    <!-- 进详情页前的封面预热
         详情页封面用 IMG_W.dishCover(960)、列表卡片用 IMG_W.dishCard(576) —— 是**两个不同的 URL**，
         客户端图片缓存不共享。所以点开卡片时先把 960 那份取上：跳转动画（260ms）＋ 详情页
         onLoad 拉接口这段时间里，它已经在路上了，等详情页拼出同一个 URL 就能直接命中。
         ⚠️ 必须是**真实的 `<image>` 组件**：uni.getImageInfo / downloadFile 走的是 XHR 通道，
            与 `<image>` 用的客户端图片缓存不是同一套，预取了也命中不到。
         ⚠️ 不能用 `display:none`（部分基础库下不渲染的元素根本不发请求，预热会静默失效），
            也不能挪到屏幕外（视口外的元素可能被跳过）—— 视口内 1px + opacity:0 最稳。
         只在该页未跳转时按需挂载（v-if 跟着 preloadSrc），页面上没有多余请求。 -->
    <view v-if="preloadSrc" class="preload-layer"><image class="preload-img" :src="preloadSrc" :webp="true" /></view>
    <!-- 注：分类动图**没有预热层**（2026-09-22 复核后删掉）。原先这里用 `v-for` 把**所有**配了动图的
         分类一次性挂上预热，那是在只有 1 个动图（108KB）时定的做法；六个分类配满后这个量变成
         **773KB**，而用户可能一个分类都不点。现在改为"点哪个下哪个 + 静态图撑到动图加载完"，
         详见 script 里 iconLoaded 的注释。 -->
    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'
import { imgUrl, IMG_W } from '@/utils/image.js'
import { spicyMark } from '@/utils/spicy.js'
import { categoryArt, categoryArtActive } from '@/utils/category-art.js'
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
// 辣度的**值域与图案都来自 utils/spicy.js** —— 本页不要再维护一份映射：四档曾在
// 列表页与详情页各存一份，扩档时只改了一处，「特辣」就被这里的 `|| 默认值` 吃成了
// 「不辣」，而且页面毫无报错（2026-09-18 的实际事故）。
// 卡片上画的是**档位图案**（与编辑抽屉里那四格同一套素材），不再是单色辣椒循环 N 根：
// 同一档辣度在列表、详情、抽屉里必须长得一样。

const categories = ref([])
const dishes = ref([])
const loading = ref(false)
const loaded = ref(false)
const activeCategory = ref('all')

/**
 * 底部新建卡槽（菜品 / 咖啡两个入口）是否常驻
 *
 * 条件是「饲养员 + 家里已经有菜谱」：
 * - 干饭人不显示（云端 create 走 requireCook，点了必然 401）
 * - 一道菜都没有时也不显示 —— 那种情况由空态自己的「添第一道菜」承接，
 *   否则页面上会同时冒出两个新增入口
 * 其余时候常驻，且**不跟搜索/分类筛选联动**（否则筛到空结果时底栏一闪一闪的）。
 * 它常驻后，正文要按 .has-add-bar 多让出一段底部留白，见样式里的说明。
 *
 * ⚠️ 咖啡入口与菜品入口共用这一行，**开关也是同一个**：家里连一道菜谱都没有时，
 * 这一行整体不出现，也就顺手挡住了「新建第一杯咖啡」那条路（空态里只给了「添第一道菜」）。
 * 2026-09-22 起本页**同时加载美食与咖啡**（见 loadRecipes），所以「有咖啡、没菜谱」的账号
 * 也算 `dishes.length > 0`，这一行会出现 —— 原先那个取舍已经不存在了。
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
 * 取菜谱数据（**美食 + 咖啡** —— 2026-09-22 起本页同时管两种类型）
 *
 * 为什么本页要管咖啡：咖啡与美食**共用同一个编辑器**（同一页、`?type=` 区分），
 * 而它的入口就在本页底部卡槽。若本页只取 food，就成了「用菜谱页新建的咖啡，在菜谱页找不到」——
 * 建完即消失，只能去管理页看。所以列表与分类栏都必须把咖啡一起带上。
 *
 * **两次调用**（Promise.all 并发）而不是一次：`dishes-crud/list` 的 type 是
 * **必填且只认单一类型**（传别的值直接 400），接口不返回混合结果。并发而非串行 ——
 * 两者互不依赖，串行会白白多一个往返、把首屏拉长。
 * 每次调用都顺带返回**该类型自己的分类**（该接口内部本来就要查一次 categories 做
 * categoryName join，顺带返回零额外成本），两边一拼正好是完整分类栏。
 *
 * 顺序约定：**美食在前、咖啡在后**（菜品与分类都是）。两类的 sortOrder 是**各自独立编号**的
 * —— 分类查询先按 type 过滤再排序，所以咖啡可以是 1、2，而美食是 1~7；按 sortOrder 直接混排
 * 会交错。分组合并才稳定，也保证现有那 7 个分类 tab 的位置一个不动、新分类追加在右侧。
 *
 * 容错：**单边失败不阻断另一边** —— 咖啡挂了不该让美食列表空掉（反之亦然），只记一笔 warn，
 * 两边都拿不到才算真失败。分类整体缺失时（旧版云函数不返回 `categories` 字段）回退查
 * `categories-crud/list`（**不带 type = 全量**），再按类型分组，顺序与上面一致。
 *
 * ⚠️ 与详情页的口径联动：本页列表里既有美食又有咖啡，所以**点卡片时必须把 `type` 带过去**
 * （见 openRecipe）—— 详情页靠 `?type=coffee` 决定区数与字段（咖啡是「原料 + 步骤」两步、
 * 且没有辣度那一格）。不带的话咖啡会被当成美食渲染，页面不报错、只是结构错了。
 *
 * 云端字段 → 视图模型在这一层收敛，模板不直接碰原始文档，后续字段调整只改这里。
 */
const loadRecipes = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const queryList = (type) => uniCloud.callFunction({ name: 'app-service', data: { module: 'dishes-crud', action: 'list', type } })
    const [foodRes, coffeeRes] = await Promise.all([queryList('food'), queryList('coffee')])
    const foodResult = (foodRes && foodRes.result) || {}
    const coffeeResult = (coffeeRes && coffeeRes.result) || {}
    const foodOk = foodResult.code === 0
    const coffeeOk = coffeeResult.code === 0

    if (!foodOk && !coffeeOk) {
      uni.showToast({ title: foodResult.message || coffeeResult.message || '菜谱加载失败', icon: 'none' })
      return
    }
    if (!foodOk) console.warn('[recipe] 美食菜谱加载失败', foodResult.code, foodResult.message)
    if (!coffeeOk) console.warn('[recipe] 咖啡菜谱加载失败', coffeeResult.code, coffeeResult.message)

    /**
     * 云端文档 → 卡片视图模型
     *
     * `type` 必须带出来：点卡片进详情页要靠它拼 `?type=coffee`。
     */
    const toCard = (d, type) => ({
      id: d._id,
      name: d.name,
      image: d.image || '',
      type,
      // 辣度：直接带出**档位图案**（素材路径），不显示文字档位（角标那条已删，避免同卡说两遍）。
      // 用 spicyMark 而不是 spicyImage —— 卡片是「标记」语义，「不辣」与「未设置」都不挂图标
      // （斜线辣椒留给点单抽屉那种「字段」语义），模板一个 v-if 就收掉。
      // **咖啡恒为空串**：咖啡没有辣度这个概念（编辑页那一格也已收掉），历史脏数据里
      // 若带着 spicy，也不该在卡片上画出一枚辣椒 —— 与详情页 spicyArt 同一口径。
      spicyArt: type === 'coffee' ? '' : spicyMark(d.spicy),
      // 档位值本身也带出来：模板要靠它挂 `pull-*` 类抵掉素材自带的透明留白（见样式区注释）。
      // 非法值与未设置都拿不到对应类 → 不产生负外边距，图上也不会画（spicyArt 为空）。
      spicy: d.spicy || '',
      isSignature: !!d.isSignature,
      categoryId: d.categoryId || '',
      // 卡片副行不再显示它，但**搜索要用**（「找道菜，或搜搜备注…」按 name + tip 匹配），
      // 所以这个字段继续留在视图模型里，别顺手删
      tip: d.note || d.description || ''
    })

    dishes.value = [
      ...(foodOk ? (foodResult.list || []).map((d) => toCard(d, 'food')) : []),
      ...(coffeeOk ? (coffeeResult.list || []).map((d) => toCard(d, 'coffee')) : [])
    ]

    // 分类：两次调用各带本类型的，合并即可（顺序天然是美食在前、咖啡在后）
    let catList = [
      ...(foodOk && Array.isArray(foodResult.categories) ? foodResult.categories : []),
      ...(coffeeOk && Array.isArray(coffeeResult.categories) ? coffeeResult.categories : [])
    ]
    if (!catList.length) {
      // 旧版云函数不返回 categories 字段 → 回退查全量，再按类型分组（顺序与上面一致）。
      // 无 type 的旧记录按美食处理，「咖啡」只认显式写了 coffee 的。
      const catRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list' } })
      const catResult = catRes.result || {}
      const all = catResult.code === 0 ? catResult.list || [] : []
      catList = [
        ...all.filter((c) => !c.type || c.type === 'food'),
        ...all.filter((c) => c.type === 'coffee')
      ]
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
// 图标只由分类名映射（utils/category-art.js），后端仍可继续返回动态分类 ——
// 命中不了的分类不显示图标（文字 tab 仍成立），不会因为多了个分类就报错。
// 这份映射与菜谱详情页编辑态的「菜品分类」**共用同一个文件**：两处曾各存一份，
// 列表页是彩色素材、编辑页是单色线稿，同一批分类在两个页面长得不一样。
// 「全部」的图标也走同一张表（2026-09-21 补）—— 它虽然不是菜系，但同样占着第一格，
// 此前写死 icon:'' 让它在图标行里是空的；现在只是映射表里多一个键，没有特例分支。
//
// `iconActive`（2026-09-22 加）是**选中态的动图**，来自 category-art.js 的 categoryArtActive()。
// 两者是两张独立的表：绝大多数分类只有静态图 → iconActive 为空串 → 模板不渲染第二层，
// 「全部」也没有（它是虚拟 tab，不在 categories 集合里，自然没有选中态可配）。
const categoryTabs = computed(() => [
  { id: 'all', name: '全部', icon: categoryArt('全部') },
  ...categories.value.map(item => ({ ...item, icon: categoryArt(item.name), iconActive: categoryArtActive(item.name) }))
])

/**
 * 卡片信息行**不再画分类图标**（2026-09-20 按主人要求撤掉）
 *
 * 原先是「分类图标 + 辣度」并排。撤掉分类的理由：分类在页面顶部已有筛选栏，
 * 卡片上重复一遍是冗余；而辣度只有卡片能表达（筛选栏里没有）。
 * 2026-09-21 起辣度与菜名并成一行（见模板里的 .card-meta），这一行就只剩辣度一项了。
 */

const filtered = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return dishes.value.filter((dish) => (activeCategory.value === 'all' || dish.categoryId === activeCategory.value)
    && (!keyword || [dish.name, dish.tip].some((value) => String(value).toLocaleLowerCase().includes(keyword))))
})
/** 预热用的封面地址（详情页那一档）；为空时不挂载预热层 */
const preloadSrc = ref('')

/**
 * 分类动图的加载状态 —— **决定静态图什么时候让位**
 *
 * 动图 2026-09-22 起在**云存储**上，所以"什么时候下、什么时候切"必须自己管。
 * 曾经的做法是**进页面就把所有分类的动图挂一遍预热**（`v-for` 挂 6 个 `<image>`）——
 * 那是在只有 1 个动图（108KB）时定的；六个分类配满后这个量变成 **773KB**
 * （实测：107.8+51.9+177.2+117.7+140.6+178.2），而用户可能一个分类都不点。
 * **2026-09-22 复核后改掉**，现在是：
 *
 *   ① **不预热**：点哪个分类才下哪个（动图层仍然只在选中时挂载）；
 *   ② **静态图一直露着，直到动图的 `load` 事件到达才压掉**；
 *   ③ 换分类时清空标记。
 *
 * ② 不只是为了配合"不预热"，它还修掉一个隐患：原先静态图的显隐绑在"已选中"上，
 * **动图一旦加载失败（403 / 断网），静态被压掉、动图又没出来，图标就变成空白**；
 * 现在最坏也只是维持静态图（`markIconFailed` 什么都不做）。
 *
 * ③ 是因为动图层是 `v-if` 挂卸的 —— 重新选中会**重新挂载**，标记若留着，静态图会在
 * 动图还没画出来之前就先被压掉（闪一下空白）。清掉后，重新选中时静态图会撑到新的 `load` 到达
 * （命中缓存时只有一两帧，看不见）。
 *
 * 代价（已知并接受）：**首次**点选某分类时，动效要等它下载完（约 200~600ms）才出现，
 * 这期间显示静态图。换来的是首访少下 773KB。
 * ⚠️ 之所以能这么做，是因为**GIF 首帧与静态图是逐像素对齐的** —— 静态图 → 动图这一次切换
 *    看不见。**对齐规则不是可有可无的形式要求，这里就是它的回报。**
 */
const iconLoaded = ref({})
const markIconLoaded = (id) => { iconLoaded.value = { ...iconLoaded.value, [id]: true } }
/** 动图加载失败：**什么都不做**，静态图继续露着（见上面 ②）；留条日志便于排查 */
const markIconFailed = (id) => { console.warn('[recipe] 分类动图加载失败，保持静态图', id) }
const iconDimmed = (category) => Boolean(category.iconActive && activeCategory.value === category.id && iconLoaded.value[category.id])
watch(activeCategory, () => { iconLoaded.value = {} })
/**
 * 打开菜谱详情
 *
 * 跳转前先把**详情页封面那一档**预取上（隐藏 `<image>`）：详情页要等 onLoad 里的接口返回
 * `dish.image` 才知道地址，而列表页**现在就有**（同一个字段）—— 这是唯一能提前的时机。
 * 两处都取 `IMG_W.dishCover`，所以拼出来是逐字符相同的 URL，详情页能直接命中缓存。
 * 卡片图本身是 576 档、与 960 档不共享缓存，所以这一步不是"重复下载"而是"提前下载"。
 */
const openRecipe = (recipe) => {
  preloadSrc.value = recipe.image ? imgUrl(recipe.image, { w: IMG_W.dishCover }) : ''
  // ⚠️ **必须带上 `type`**：本页列表里美食与咖啡混排，详情页靠 `?type=coffee` 决定
  // 区数与字段（咖啡是「原料 + 步骤」两步、且没有辣度那一格）。
  // 不带的话咖啡会被当成美食渲染 —— 页面不报错，只是结构错了（这种错最难发现）。
  uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?id=' + recipe.id + '&type=' + (recipe.type || 'food'), animationType: 'slide-in-right', animationDuration: 260 })
}
/**
 * 新建菜谱：进详情页的**新建态**（`mode=create`）
 *
 * 详情页是「编辑菜谱」的唯一表单（名称 / 封面 / 分类 / 辣度 / 配料 / 步骤都在那儿），
 * 所以新增不再另做一个表单页 —— 同一份编辑器、同一套校验，差别只在起点数据与保存时
 * 调的是 create 而不是 update（见 recipe-detail 的 creating）。
 * 返回本页时 onShow(loadRecipes) 会静默刷新，新菜谱立刻出现在列表里。
 */
const createRecipe = () => uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?mode=create', animationType: 'slide-in-right', animationDuration: 260 })
/**
 * 新建咖啡：**同一个详情页、同一份编辑器**，只多带一个 `type=coffee`
 *
 * 没有另开一个咖啡编辑页，理由有两条，都要紧：
 *   ① 表单、校验、抽屉、封面上传、保存链路全部同源，将来改一处不会漏另一处 ——
 *      复制一份 1100 行的页面，等于把「两页口径必须一致」这件事交给记性去守；
 *   ② 小程序主包体积敏感（当前收在 1.59MB），新增一个页面会同时多出一份 wxss + js，
 *      而 `type` 参数是零成本的 —— 这一页按类型切掉的只是「几块区的标题与数量」。
 * 差异收敛在 recipe-detail 的 `isCoffee` 上：美食是「食材 + 调料 + 步骤」三步，
 * 咖啡是「原料 + 步骤」两步（原料复用 `ingredients` 字段与 `ingredient` 物料分组，
 * 咖啡的原料在数据模型里就是食材，不另立分组）。
 *
 * ✅ 咖啡新建完**会**出现在本页列表里（2026-09-22 起本页同时加载两类，见 loadRecipes），
 * 卡片点进去带着 `?type=coffee`，编辑 / 保存 / 发布链路与美食完全一样。
 * 唯一差别是它**默认不发布**（`isOnSale: false`），要进点单页菜单得先在详情页点一次「发布咖啡」。
 */
const createCoffee = () => uni.navigateTo({ url: '/pages/recipe-detail/recipe-detail?mode=create&type=coffee', animationType: 'slide-in-right', animationDuration: 260 })
const resetFilters = () => { search.value = ''; activeCategory.value = 'all' }
</script>

<style lang="scss" scoped>
// 菜谱页标题的手绘字体（RecipeMaoken）。@font-face 已统一在 App.vue 里引一次、编进 app.wxss
// 全局生效 —— **页面侧不要再 @import scss/font-*.scss**，否则 base64 会被重复打进本页 wxss。
.recipe-page { min-height: 100vh; padding: 0 32rpx calc(160rpx + env(safe-area-inset-bottom)); background: $p2-paper; color: $p2-ink; }
button { padding: 0; margin: 0; background: none; color: inherit; font: inherit; line-height: inherit; border-radius: 0; &::after { border: 0; } }
// 背景须铺满整屏宽：页面容器带 32rpx 左右 padding，吸顶块作为子元素若只铺内容盒，
// 左右各 32rpx 就成了它永远盖不到的 gutter —— 列表滚动时下层卡片溢出的
// box-shadow（3rpx 4rpx 0）与吸顶块自身边缘缝隙会在那里露出竖直细线。
// 负 margin + 等量 padding 把背景扩到 750rpx，内容盒仍是 686rpx，内层排版零位移。
.recipe-sticky { position: sticky; top: 0; z-index: 20; background: $p2-paper; margin: 0 -32rpx; padding: 0 32rpx; }
.recipe-header { padding-bottom: 10rpx; }
.heading-row { display: flex; align-items: center; }
.page-title { display: block; font-family: $p2-font-hand, $p2-font-fallback; font-size: $p2-fs-display; line-height: 1.2; letter-spacing: 2rpx; }
// 新建入口 = 常驻底栏之上的固定卡槽（v2）。
// 语汇沿用网格里那一版（虚线 + 手绘不规则圆角 + 手绘贴纸圆 + 手写体），但版式改成
// **横向单行窄条**：固定元素要长期占着视口，不能像原位版那样占两行。
// 位置贴着底栏上沿，外层 .add-bar 铺不透明纸色底 —— 滚上来的卡片会被它挡住，
// 不会从虚线框里透出来；纸色底与底栏（.tabbar-footer 同为 $p2-paper）连成一片，
// 阅读上是一整块底部区域，而不是"浮着一张条"。
// 与底栏的接缝：底栏上沿在 `safe-area + 118rpx`（6rpx 内边距 + 112rpx 栏高），
// 这里取 124rpx 故意**压过去 4rpx**，避免四舍五入后露出一条透出内容的发丝缝。
.add-bar { position: fixed; left: 0; right: 0; bottom: calc(124rpx + env(safe-area-inset-bottom)); z-index: 190; padding: 14rpx 32rpx 12rpx; background: $p2-paper; }
// 两个入口等宽平分整行：内容宽 686rpx − 16rpx(gap) = 670rpx → **各 335rpx**（见模板里的宽度账）。
// 用 flex:1 而不是各写 50%：gap 会被算进 50%+50% 之外的额外宽度，写死百分比必然溢出。
.add-slots { display: flex; gap: 16rpx; }
// flex:1 + min-width:0 的组合是必须的：flex 子项的 min-width 默认是 auto，
// 文字一旦比可用宽还长就不会收缩、会把另一个槽位挤出去（同行 `.dish-name` 踩过同一个坑）。
.add-slot { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 14rpx; height: 96rpx; border: 2rpx dashed #a8b68b; border-radius: 22rpx 18rpx 24rpx 17rpx; color: #63784f; animation: card-arrive 300ms $p2-ease backwards; transition: transform $p2-dur-tap $p2-ease; &:active { transform: scale(.98); } }
// 手绘贴纸圆：与空态的书本圈（.empty-book）同一手法 —— 不规则圆 + 轻微旋转 + 纸片色，
// 也就是 custom-tabbar 里那块「菜谱」选中贴纸的语汇。图标走 Icon.vue，颜色单独压深一档，
// 否则绿色加号落在绿贴上会糊成一片。
.add-slot-art { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; flex-shrink: 0; border-radius: 47% 53% 46% 54%; background: $p2-leaf-soft; color: $p2-ink; transform: rotate(-6deg); }
// 标题用手写体 —— 与卡片上的菜名同源，读起来是「同一本本子上的字」，不是界面文案
.add-slot-title { font-family: $p2-font-hand, $p2-font-fallback; font-size: $p2-fs-control; line-height: 1.3; }
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
// 高度 72rpx（36pt，iOS 搜索栏标准高度）。
// （原先此处写「与本页 chip 行同高」，分类行加入图标后早已不成立，2026-09-21 一并订正。）
.search-box { display: flex; align-items: center; gap: 14rpx; height: 72rpx; padding: 0 24rpx; color: $p2-ink-soft; background: $p2-surface; border: 2rpx solid $p2-line; border-radius: 20rpx 24rpx 19rpx 23rpx; transition: border-color $p2-dur-fast $p2-ease; &.is-focused { border-color: $p2-coral; } }
.search-input { flex: 1; min-width: 0; height: 64rpx; font-size: $p2-fs-control; color: $p2-ink; }
.icon-button { display: flex; align-items: center; justify-content: center; width: 60rpx; height: 60rpx; color: $p2-ink-soft; }
// 分类行：文字 tab + **选中贴纸底** + 手绘标记线。
// 2026-09-21 改版两处：
//   ① **整体缩小一号** —— 图标 52→44rpx、分类名 $p2-fs-body(28)→$p2-fs-caption(24)、
//      上下内边距各收 1~4rpx，整行由约 135rpx 收到约 121rpx（内容本身小了一档多）。
//   ② **选中时给选中区域加浅绿贴纸底**（原先只有「文字转主色 + 叶片色标记线」两个信号）。
// 贴纸的语汇与 custom-tabbar 的选中贴纸、.add-slot-art 同源：浅绿底 + **无描边** + 手绘不规则圆角
// （不规则圆角的数值都是四角各不相同的写法，与 .search-box / .primary-button 同一族）。
// ⚠️ 三处刻意的取舍，改这里前先读：
//   · 贴纸只画在 .category-body（图标 + 分类名）这一层，**不含 .category 下方那 12rpx** ——
//     底画在 .category 上的话会把 .category-mark 一起盖进去，变成「浅绿底上再压一条绿线」；
//   · **不给贴纸加旋转**：这行是 7 块并排，各自歪一点会读成「没对齐」；tabbar 那枚 wash 敢转，
//     是因为它后面只有一张图标、没有文字跟着歪；
//   · 标记线**保留**（不是被贴纸取代）—— 它是菜谱页的强调线语汇，与贴纸一上一下、不重叠。
.category-scroll { width: 100%; white-space: nowrap; }
// 与详情页食材行同一处理：横向滚动列表必须用 inline-flex —— 容器宽度由内容决定，
// 分类一多必然溢出容器、必然可滚。块级 flex 的宽度恒等于父容器宽，靠子项溢出不可靠。
// vertical-align:top 消除 inline 元素固有的基线间隙（本行已有 white-space:nowrap，
// 分类名短、不涉及长文本折行问题，故保留）。
.categories { display: inline-flex; vertical-align: top; gap: 16rpx; padding: 8rpx 0 12rpx; }
// .category 只负责「一列 = 贴纸 + 标记线让位」：下方 12rpx 是留给 .category-mark 的
// （标记线 bottom:3rpx + 高 6rpx，与贴纸底边之间留 3rpx）。横向内边距移到 .category-body。
.category { position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 0 0 12rpx; font-size: $p2-fs-caption; line-height: 1.4; color: $p2-ink-soft; transition: color $p2-dur-fast $p2-ease; &:active { opacity: .55; } &.selected { color: $p2-ink; .category-body { background: $p2-leaf-soft; } .category-mark { opacity: 1; transform: rotate(-2deg) scaleX(1); } } }
// 贴纸承载体：图标槽 + 分类名包在这层，底色只画它。
// 左右 12rpx 是贴纸的内边距 —— 分类名短（两字），靠它把色块撑出可读的形状，
// 也让相邻两块贴纸之间留出 16(gap) + 24 = 40rpx 的呼吸，不至于连成一条色带。
// 未选中时背景是 transparent：这一层始终存在、只换底色，**不靠 v-if 增删节点**，
// 否则选中时节点进出会让整行重排、位置跳一下。
.category-body { display: flex; flex-direction: column; align-items: center; gap: 2rpx; padding: 4rpx 12rpx 5rpx; border-radius: 15rpx 19rpx 14rpx 18rpx; background: transparent; transition: background $p2-dur-fast $p2-ease; }
// 图标槽：**没有图标时也要占住这 44rpx**（云端自定义分类、或映射表命中不了的名字会走到这里）。
// 少了这一格它的文字就会顶到行首 —— .categories 是 flex 行、子项被拉伸到同一高度后
// 内容默认从顶排起，于是这类分类的名字会比右侧同排的分类名高出一个图标的高度，整行读起来是歪的。
// 槽固定高度 + 居中，所有分类的文字基线就永远在同一行。尺寸与 .category-icon 一致。
// 注：「全部」2026-09-21 起也有图标了（见 utils/category-art.js），但这一格不能删 ——
// 它的存在是为了「没有图标」这种情形，而不是为了「全部」。
// 图标槽：承载**两层**图（静态图 + 选中态动图），故需要定位上下文。
// ⚠️ 动图层**只在选中时挂载** —— 动图 2026-09-22 起放在云存储，挂载即发请求，不能常驻。
//    **静态图一直露着，直到动图 `load` 到达才压掉**（见 script 里 iconLoaded 的注释）：
//    既省掉了 773KB 的无差别预热，也顺手修掉"动图加载失败 → 图标变空白"的隐患。
//    ⚠️ 这两层能这样接力，前提是**GIF 首帧与静态图逐像素对齐** —— 切换才看不见。
//    其余分类没有 iconActive → 动图层根本不渲染，行为与从前逐字一致。
.category-icon-slot { position: relative; display: flex; align-items: center; justify-content: center; height: 44rpx; }
// 44rpx：与菜谱详情编辑态那枚 .picker-field-art 同档。素材内容占画布约 62% → 视觉高约 27rpx，
// 与下方 24rpx 的分类名同一量级而略大，读起来仍是「图标在上、名字在下」的从属关系。
.category-icon { width: 44rpx; height: 44rpx; display: block; transition: opacity $p2-dur-fast $p2-ease; }
// 选中时把静态图让位给动图。**只在「该分类确实配了动图」时才让位**（条件写在模板里）——
// 否则普通分类一选中就会变成空白格。
.category-icon.is-dim { opacity: 0; }
// 动图层：绝对定位压在静态图之上，用 50% + 负半个边长（22rpx）居中。
// 图标恒为 44rpx 方块，所以这组数值不会随分类变化。
// 用**入场动画**而不是 opacity 过渡：这一层是选中时才新挂载的元素，没有"过渡的起点"可插值。
// ⚠️ 不写 fill-mode（默认 none）—— `forwards` / `both` 会锁死终态，把全局 button:active 的缩放压掉。
.category-icon-moving { position: absolute; left: 50%; top: 50%; margin: -22rpx 0 0 -22rpx; animation: icon-swap-in $p2-dur-fast $p2-ease; }
@keyframes icon-swap-in { from { opacity: 0; } to { opacity: 1; } }
// 分类名（.category-label）**没有自己的样式规则**：字号、颜色、行高全部从 .category 继承。
// 模板里保留这个类名，只是为了把「图标槽 / 分类名」两块分开、将来要单独微调有个钩子。
.category-mark { position: absolute; left: 10rpx; right: 10rpx; bottom: 3rpx; height: 6rpx; border-radius: 55% 45% 60% 40%; background: $p2-leaf; opacity: 0; transform: rotate(-2deg) scaleX(.5); transition: opacity $p2-dur-fast $p2-ease, transform $p2-dur-settle $p2-ease; }
.section-title { font-family: $p2-font-hand, $p2-font-fallback; font-size: $p2-fs-title; }
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
// 角标现在只有「家的拿手菜」一种（辣度已交给信息行的辣椒），配色即原来的 signature 变体
.card-label { position: absolute; bottom: 12rpx; left: 18rpx; font-size: 18rpx; padding: 5rpx 12rpx; background: $p2-butter-soft; border-radius: 7rpx 10rpx 7rpx 9rpx; color: $p2-ink; }
.card-copy { padding: 19rpx 18rpx 20rpx; }
// 菜名与辣度**同一行**：菜名吃满左侧、辣椒贴右端。
// 2026-09-21 按主人要求改版（原先菜名独占一行，下面再走一行「辣度 + 时长」）。
// 字号由 $p2-fs-title(36rpx) 降一档到 $p2-fs-control(32rpx) —— 与辣椒同处一行后，
// 36rpx 的手写体会把 46rpx 的辣椒衬得很小，降一档两者才是「名字为主、辣度为辅」。
// ⚠️ **必须 flex:1 + min-width:0**：flex 子项的 min-width 默认是 auto，不写 min-width:0
//    长菜名不会收缩、会把辣椒顶出卡片（.recipe-card 是 overflow:hidden，辣椒会直接看不见）。
//    未加 nowrap/ellipsis —— 长菜名照旧折行，这是本卡一直以来的行为，本次不动它。
.dish-name { display: block; flex: 1; min-width: 0; font-family: $p2-font-hand, $p2-font-fallback; font-size: $p2-fs-control; line-height: 1.3; }
// 菜名行：space-between 把辣椒顶到右端（菜名自身 flex:1 已吃满左侧，两者等效、留个双保险）。
// ⚠️ 原先这里挂着一个**空的** `.card-facts` 左组容器，靠它把右侧的「时长」顶到右端；
//    时长删掉后它没有存在意义，已一并移除 —— 现在左组就是菜名本身。
//    另：这一行不再需要 margin-top（上面已经没有独立的一行菜名了）。
// **min-height 取辣度的 46rpx**：没有辣度的菜（不辣 / 未设置 → 空串，卡片上不画）行高只有
// 菜名的 41.6rpx，会让「同一行有辣度、另一行没有」的两排卡片差 4rpx、网格行高不齐。
// 占住 46rpx 后每排高度完全一致（与分类行图标槽「没有图标也要占住高度」同一个道理）。
.card-meta { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; min-height: 46rpx; }
// 辣度图案：与详情页、点单抽屉**同一套素材**（`static/images/recipes/spicy/*-v2.svg`），
// 由 utils/spicy.js 的 spicyMark() 给出；「不辣」与未设置都拿到空串 → 模板 v-if 收掉。
//
// 尺寸：46rpx 是**三处展示位统一的值**。实测辣椒视觉高 25.4rpx（内容高恒为画布 55.2%）。
// 换算过程、四档的实测内容边界、以及「别拿旧 Icon 的 size 直接当目标高」这条坑，
// 都写在 utils/spicy.js 的注释里 —— **改素材或改这个边长前必须先读那一节**。
// **必须是正方形**：给长方形时 aspectFit 按短边铺满，辣椒反而更小。
.card-spicy { width: 46rpx; height: 46rpx; flex-shrink: 0; display: block; }
// 【右端贴边】素材是方形画布，辣椒只占中间一块，**左右留白还随档位剧烈变化**：
// 微辣内容仅占画布 26% 宽（左右各留 35/96），特辣占 91%（左右只留 3~6/96）。
// 不抵掉的话，卡片右侧的视觉间距会随辣度在 19~35rpx 之间跳 —— 而左侧「文字到边框」恒定 18rpx，
// 于是「微辣」那道菜的辣椒看着就是往里缩了一大截（主人 2026-09-21 就是这么发现的）。
//
// 做法：**逐档**给左右各一份负外边距，让「图标可视框 = 图标布局框」。这样同一个 flex 间隙
// （14rpx）与同一个右端内边距（18rpx）对每一档都成立，卡片右列才真正对齐。
// 数值 = 左右留白均值 ÷ 96 × 46rpx（原始边界见 utils/spicy.js 的实测表）：
//   微辣 (35.8+35.0)/2 = 35.4 → 17.0rpx ｜ 中辣 (20.8+19.0)/2 = 19.9 → 9.5rpx ｜
//   特辣 (5.8+3.0)/2 = 4.4 → 2.1rpx
// ⚠️ 「不辣」没有对应的类 —— 卡片用 spicyMark 语义，不辣与未设置根本不画这个图标。
// ⚠️ 两侧都拉而不是只拉右侧：只拉右侧的话，菜名与辣椒之间的空隙会随档位变化（微辣那 35 单位
//    的左侧留白会挤进间隙里），同一屏里读起来仍然是不齐的。
.card-spicy.pull-mild { margin-right: -17rpx; margin-left: -17rpx; }
.card-spicy.pull-medium { margin-right: -9.5rpx; margin-left: -9.5rpx; }
.card-spicy.pull-hot { margin-right: -2rpx; margin-left: -2rpx; }
// 【2026-09-21 已删除】「所需时间」整行的样式（.card-time / .card-time-num / .card-time-unit）。
// 它对应的假数据链路（CATEGORY_MINUTES / FALLBACK_MINUTES / stableHash / fakeMinutes
// 与视图模型里的 `minutes` 字段）也一并删了 —— 云端 dishes 至今没有 minutes 字段，
// 留着就是永远渲染不出来的死代码。
// ⚠️ 若将来要重新显示时长，先记住它当年踩过的两点：
//   ① 层级只能靠字号比与颜色深浅差（$p2-ink → $p2-ink-soft），**别加容器**（试过纸底 + 图标 + 旋转，被否）；
//   ② **数字可以用手写体了（2026-09-21 起）** —— 原先子集不含 0-9，手写体的阿拉伯数字
//      会静默回退成系统字体（「单位手写、数字不是」）。子集已补入 0-9，且手绘数字与中文
//      笔触同族，实测「共 3 道菜 · 45 分钟 · ¥28」整句笔触统一，可以放心用。
.page-footnote { display: flex; align-items: center; justify-content: center; gap: 13rpx; color: $p2-ink-soft; font-size: 21rpx; margin: 46rpx 0 22rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 94rpx 16rpx 70rpx; }
.empty-book { display: flex; align-items: center; justify-content: center; width: 140rpx; height: 140rpx; border-radius: 50%; background: $p2-butter-soft; margin-bottom: 28rpx; transform: rotate(-8deg); }
// 空态按钮：页面里两处空态共用同一形态（$p2-leaf-soft 底 + 实棕描边）——
// 筛选无结果时是「看看全部菜谱」，**还没有任何菜谱时是「添第一道菜」**（只对饲养员渲染）。
// 空态文案本来就写着「饲养员添几道拿手菜，就会出现在这里」，这里把这句话接到一个动作上，
// 否则新用户读完提示却无处可点。display:flex 是给带前导加号的后者排版用。
.reset-button { display: flex; align-items: center; gap: 10rpx; background: $p2-leaf-soft; border: 2rpx solid $p2-line; padding: 20rpx 32rpx; margin-top: 30rpx; border-radius: 18rpx; font-size: $p2-fs-body; transition: transform $p2-dur-tap $p2-ease; &:active { transform: scale(.96); } }
@keyframes card-arrive { from { opacity: 0; transform: translateY(12rpx); } to { opacity: 1; transform: translateY(0); } }
// ⚠️ 这里只能关掉**过渡**：GIF 自身的播放不受 CSS 控制，系统「减弱动态效果」也停不下它。
//    若这个分类动图将来要长期保留，真机上开了减少动态效果的用户仍会看到它在动 —— 目前按实验性改动接受。
@media (prefers-reduced-motion: reduce) { .recipe-card, .add-slot, .category-icon-moving { animation: none; } .recipe-card, .category, .category-body, .card-photo, .add-slot, .reset-button, .category-icon { transition: none; } }
// 窄屏（≤360px）的字号下调：比例沿用各元素原本的收缩幅度，**改基准字号时要回头重算这里**
// （2026-09-21 菜名基准 36→32rpx，此处同步 33→29rpx，保持同一收缩比 0.917）。
@media screen and (max-width: 360px) { .page-title { font-size: 49rpx; } .section-title { font-size: 32rpx; } .dish-name { font-size: 29rpx; } }
// === 进详情页前的封面预热层（模板里有完整说明） ===
// 1px + opacity:0 **留在视口内**：`display:none` 或挪到屏幕外都可能让基础库跳过这次请求，
// 预热就静默失效了。pointer-events:none 保证它不会挡住任何点击。
.preload-layer { position:fixed; top:0; left:0; width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none; }
.preload-img { width:1px; height:1px; display:block; }
</style>
