<template>
  <view class="order-page" :class="'mode-' + mode">
    <view class="top-area" :style="{ paddingTop: headerTop + 'px' }">
      <view class="heading">
        <view><text class="page-title">{{ mode === 'food' ? '今天，想吃点什么？' : '给今天，加点咖啡香' }}</text><text class="subtitle">{{ mode === 'food' ? '你负责好好吃，我负责用心做。' : '忙里偷个闲，喝杯喜欢的。' }}</text></view>
        <image class="heading-art" :src="mode === 'food' ? bowlArt : coffeeArt" mode="aspectFit" />
      </view>
      <view class="mode-tabs" role="tablist" aria-label="点单类型">
        <view class="mode-slider" :class="{ coffee: mode === 'coffee' }" />
        <button v-for="type in types" :key="type.id" role="tab" :aria-selected="mode === type.id" :aria-label="type.label" class="mode-tab" :class="{ active: mode === type.id }" @tap="switchMode(type.id)">
          <Icon :name="type.icon" :size="20" :stroke-width="1.6" /><text>{{ type.label }}</text><text v-if="countFor(type.id)" class="tab-count">{{ countFor(type.id) }}</text>
        </button>
      </view>
      <view class="filter-row">
        <scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
          <view class="category-list"><button v-for="category in categoryTabs" :key="category.id" class="category" :class="{ selected: categories[mode] === category.id }" :aria-pressed="categories[mode] === category.id" @tap="categories[mode] = category.id"><text>{{ category.name }}</text><view class="category-underline" /></button></view>
        </scroll-view>
        <button class="search-toggle" :class="{ active: searchOpen }" aria-label="搜索菜单" :aria-expanded="searchOpen" @tap="toggleSearch"><view class="search-glass" /></button>
      </view>
      <view v-if="searchOpen" class="search-box"><view class="search-glass" /><input v-model="queries[mode]" placeholder="找找今天想吃的…" maxlength="40" confirm-type="search" aria-label="搜索菜品或咖啡" /><button v-if="queries[mode]" class="round-button" aria-label="清空搜索" @tap="queries[mode] = ''"><Icon name="close" :size="17" /></button></view>
    </view>

    <scroll-view :key="mode + categories[mode]" scroll-y class="menu-scroll" :show-scrollbar="false">
      <view class="list-inner">
        <view :key="mode + categories[mode]" class="menu-list">
          <view v-for="item in visibleItems" :key="item.id" class="dish-row" :class="{ chosen: inCart(item.id) }">
            <button class="art-button" :aria-label="'查看' + item.name" @tap="openDish(item)"><view class="art-wash" :class="item.tone" /><image class="dish-image" :src="item.image" mode="aspectFit" /></button>
            <view class="dish-copy">
              <button class="dish-title-button" :aria-label="'选择' + item.name + '口味'" @tap="openDish(item)"><text class="dish-name">{{ item.name }}</text></button>
              <text class="dish-description">{{ item.description }}</text>
              <view class="dish-meta">
                <!-- 分类图标：这道菜在**菜谱里的做法分类**（炒菜 / 烧菜 / 汤类…），素材来自 utils/category-art.js，
                     与菜谱列表页、编辑抽屉里的分类选择是同一套图。
                     ⚠️ 别与顶部筛选栏的「家常菜 / 清爽蔬菜」混淆：那是点单页自己的菜单分类（item.category），
                     这里是菜谱的做法分类（item.recipeCategory），两个维度并存、数据不要合并。
                     咖啡类菜品没有做法分类，字段为空 → categoryArt 返回空串 → 不渲染。 -->
                <image v-if="categoryArt(item.recipeCategory)" class="dish-cat-art" :src="categoryArt(item.recipeCategory)" mode="aspectFit" />
                <!-- 辣度：与菜谱列表卡片、菜谱详情、点单抽屉**同一套素材**（utils/spicy.js）。
                     用 spicyMark（标记语义）—— 不辣与未设置都不挂图标，「不辣」是默认状态，
                     每道不辣的菜都来一枚斜线辣椒只是噪音。咖啡类菜品没有这个字段，自然不显示。 -->
                <image v-if="spicyMark(item.spicy)" class="dish-spicy-art" :src="spicyMark(item.spicy)" mode="aspectFit" />
              </view>
              <!-- 卡片上只留这一个操作：**点它打开「选口味」抽屉，在抽屉里点按钮才算加入**。
                   原先卡片里还有一枚「选口味」文字按钮、一个直接加购的「+」、以及数量与减号：
                   同一个菜品能被加成好几份，不同口味还会各占一行。现在一个菜品只占一条。 -->
              <view class="dish-bottom">
                <button class="dish-add" :class="{ added: inCart(item.id) }" :aria-label="inCart(item.id) ? '调整' + item.name + '的口味' : '选口味并添加' + item.name" @tap="openDish(item)">
                  <Icon :name="inCart(item.id) ? 'check' : 'plus'" :size="inCart(item.id) ? 15 : 17" />
                </button>
              </view>
            </view>
          </view>
        </view>
        <!-- 「列表是空的」有三种原因，必须分开说：加载中 / 加载失败 / 真没内容。
             混成一句「还没找到」会让用户误以为是自己的筛选条件有问题 ——
             尤其失败时，他无从知道该重试还是该去别的页面加数据。 -->
        <view v-if="menu.loading && !menu.loaded" class="list-state"><text>菜单正在端上来…</text></view>
        <view v-else-if="menu.error" class="list-state"><text>{{ menu.error }}</text><button class="light-button" @tap="loadMenu(mode)">再试一次</button></view>
        <view v-else-if="!visibleItems.length" class="empty-list"><image :src="bowlArt" mode="aspectFit" /><text class="empty-title">{{ menu.dishes.length ? '这口快乐，还没找到' : '菜单还空着' }}</text><text>{{ menu.dishes.length ? '换个关键词或分类试试看吧。' : '在菜谱里点「发布菜品」，它就会出现在这里。' }}</text><button v-if="menu.dishes.length" class="light-button" @tap="resetFilters">看看全部</button></view>
        <view v-if="visibleItems.length" class="list-end"><text>—</text><text>{{ mode === 'food' ? '好好吃饭，是今天的小正事' : '日子慢慢过，咖啡慢慢喝' }}</text><text>—</text></view>
      </view>
    </scroll-view>

    <view class="cart-dock">
      <view class="cart-bar" :class="{ filled: total > 0 }">
        <button class="cart-summary" aria-label="查看已选清单" @tap="openCart">
          <view class="basket-icon"><Icon :name="mode === 'food' ? 'shopping-bag' : 'coffee'" :size="24" :stroke-width="1.6" /><text v-if="total" :key="total" class="basket-count">{{ total }}</text></view>
          <view><text class="cart-title">{{ total ? '已选 ' + total + (mode === 'food' ? ' 道好味道' : ' 杯小快乐') : '今天的快乐，还差一口' }}</text><text class="cart-subtitle">{{ total ? '点这里，看看你的小清单' : mode === 'food' ? '挑几道喜欢的，开饭啦' : '选一杯喜欢的，歇一歇' }}</text></view>
          <Icon v-if="total" name="chevron-up" :size="14" />
        </button>
        <button class="checkout-button" :disabled="!total" @tap="openReview"><text>去点单</text><Icon name="chevron-right" :size="16" /></button>
      </view>
    </view>
    <custom-tabbar />

    <view v-if="panel" class="sheet-layer">
      <view class="sheet-mask" :class="{ closing }" @tap="closePanel" @touchmove.stop.prevent />
      <view class="sheet" :class="{ closing, 'success-sheet': panel === 'success' }" role="dialog" aria-modal="true" :aria-label="panelTitle">
        <view class="sheet-handle" />
        <view class="sheet-heading"><view><text class="sheet-title">{{ panelTitle }}</text><text v-if="panelSubtitle" class="sheet-subtitle">{{ panelSubtitle }}</text></view><button class="close-button" aria-label="关闭弹层" @tap="closePanel"><Icon name="close" :size="20" /></button></view>
        <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="false">
          <view v-if="panel === 'dish' && selected" class="dish-detail">
            <image class="detail-image" :src="selected.image" mode="aspectFit" />
            <text class="detail-description">{{ selected.description }}</text>
            <!-- 辣度**只读**：它由菜谱里配好，点单的人只能知道、不能改。
                 这里刻意不做成按钮组 —— 一旦长得像按钮，用户就会以为能点。
                 **没有「口味选择」**：用户可选的口味（咖啡的温度甜度、青菜的蒜香清淡）
                 云端 dishes 还没有对应字段，2026-09-20 与主人确认「先不做」；
                 菜品**固有**的属性（辣度、冷热）照常只读展示。
                 2026-09-21 改版：标题改用与下方「备注」**同一个 .field-label**（两个字段标题
                 必须长得一样），值只留档位图案、不再写文字 —— 原先「辣度 微辣」把同一件事
                 说了两遍，而素材本身就用辣椒根数表达档位（斜线=不辣 / 1=微辣 / 2=中辣 /
                 3=特辣），**图标即值**；文字退到 aria-label，读屏仍拿得到。 -->
            <view v-if="spicyArt" class="dish-spicy">
              <text class="field-label">辣度</text>
              <image class="spicy-art" :src="spicyArt" :aria-label="'辣度 ' + spicyText" mode="aspectFit" />
            </view>
            <!-- 单品备注：跟着这一道菜走（整单的「小纸条」在确认页，两者不冲突） -->
            <view class="dish-note-box">
              <text class="field-label">备注 <text>选填</text></text>
              <textarea v-model="selectedNote" class="note-input" placeholder="这道菜想怎么吃？比如少放一点辣…" maxlength="60" :show-confirm-bar="false" />
            </view>
          </view>
          <template v-else-if="panel === 'cart' || panel === 'review'">
            <view v-if="total" class="cart-content">
              <view v-if="panel === 'cart'" class="cart-toolbar"><text>{{ cart.length }} 种{{ mode === 'food' ? '好味道' : '小快乐' }}</text><button class="clear-cart" @tap="confirmClear = true"><Icon name="trash" :size="14" />清空清单</button></view>
              <view v-for="line in cart" :key="line.key" class="cart-line"><image :src="line.image" mode="aspectFit" /><view class="line-copy"><text class="line-title">{{ line.name }}</text><text v-if="line.note" class="line-note">备注：{{ line.note }}</text></view>
                <button v-if="panel === 'cart'" class="line-remove" :aria-label="'把' + line.name + '从清单里去掉'" @tap="removeFromCart(line)"><Icon name="trash" :size="16" /></button>
              </view>
              <view v-if="panel === 'review'" class="order-notes"><text class="field-label">给{{ mode === 'food' ? '做饭人' : '咖啡师' }}的小纸条 <text>选填</text></text><textarea v-model="notes[mode]" class="note-input" placeholder="比如少一点葱，或者想晚一点吃…" maxlength="120" :show-confirm-bar="false" /><text class="note-counter">{{ notes[mode].length }}/120</text><view class="demo-notice"><Icon name="note" :size="14" /><text>这是模拟点单，不会发送给家人。</text></view></view>
            </view>
            <view v-else class="empty-cart"><image :src="bowlArt" mode="aspectFit" /><text class="empty-title">清单还空着呢</text><text>先挑一点喜欢的吧。</text></view>
          </template>
          <view v-else-if="panel === 'success'" class="success-content"><view class="success-stamp"><Icon name="check" :size="35" :stroke-width="1.7" /></view><text class="success-title">小纸条，写好啦！</text><text class="success-caption">好味道，值得慢慢等。</text><view class="receipt"><text class="receipt-label">本次模拟点单 · {{ submitted.type === 'food' ? '菜品' : '咖啡' }}</text><view v-for="line in submitted.lines" :key="line.key" class="receipt-line"><view><text>{{ line.name }}</text><text v-if="line.note" class="receipt-options">备注：{{ line.note }}</text></view></view><text v-if="submitted.note" class="receipt-note">小纸条：{{ submitted.note }}</text><text class="receipt-total">一共 {{ submitted.count }} {{ submitted.type === 'food' ? '道' : '杯' }} · 满满心意</text></view><text class="demo-notice">仅完成本地演示，没有创建真实订单。</text></view>
        </scroll-view>
        <view class="sheet-footer">
          <button v-if="panel === 'dish'" class="primary-button" @tap="addSelected"><Icon :name="selectedInCart ? 'check' : 'plus'" :size="18" />{{ selectedInCart ? '更新备注' : '加入清单' }}</button>
          <button v-else-if="panel === 'cart'" class="primary-button" @tap="total ? openReview() : closePanel()">{{ total ? '选好了，去点单 · ' + total + (mode === 'food' ? ' 道' : ' 杯') : '去挑点好吃的' }}<Icon name="chevron-right" :size="17" /></button>
          <template v-else-if="panel === 'review'"><button class="back-to-cart" @tap="panel = 'cart'">再看看</button><button class="primary-button" :disabled="!total || submitting" @tap="submitMock">{{ submitting ? '正在写小纸条…' : '确认点单' }}<Icon name="check" :size="17" /></button></template>
          <button v-else class="primary-button" @tap="closePanel">收好，继续逛逛<Icon name="check" :size="17" /></button>
        </view>
      </view>
    </view>
    <fo-dialog :visible="confirmClear" title="清空这份小清单？" subtitle="只清空当前分类的已选内容。" cancel-text="再想想" confirm-text="清空" @close="confirmClear = false" @confirm="clearCart" />
    <view v-if="feedback" class="feedback" role="status"><Icon name="check" :size="15" /><text>{{ feedback }}</text></view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { onLoad, onShow, onHide, onBackPress } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useCartStore } from '@/store/cart.js'
// 装饰插画（头部 + 空态）与购物车行逻辑。**菜单数据本身已不再来自 mock** ——
// 改为云端 menu-list 聚合接口，见下方 loadMenu。
import { bowlArt, coffeeArt } from '@/utils/menu-art.js'
import { addToCart, removeLine } from '@/mock/order-menu.js'
// 辣度文案取全局唯一那份（菜谱页 / 详情页同源）—— 点单这里虽然是只读，也得用同一套词
import { SPICY_TEXT, spicyImage, spicyMark } from '@/utils/spicy.js'
// 卡片上那枚**做法分类图标**的素材映射（与菜谱列表页、编辑抽屉同一份）
import { categoryArt } from '@/utils/category-art.js'
// 菜品图来自云存储，必须过 imgUrl 才能拿到按需尺寸的 WebP
import { imgUrl } from '@/utils/image.js'
const { statusBarHeight, menuButton } = useSafeArea()
const headerTop = computed(() => menuButton.value?.bottom ? menuButton.value.bottom + 12 : statusBarHeight.value + 16)
const types = [{id:'food',label:'吃点好的',icon:'food'},{id:'coffee',label:'喝杯咖啡',icon:'coffee'}]
const mode = ref('food'), categories = reactive({food:'all',coffee:'all'}), queries = reactive({food:'',coffee:''})
const carts = reactive({food:[],coffee:[]}), notes = reactive({food:'',coffee:''})
const cart = computed(() => carts[mode.value])
// 一个菜品在清单里只占一条，所以「数量」就等于「条数」——这一页没有份数这个概念了
const countFor = type => carts[type].length
const total = computed(() => countFor(mode.value))
const inCart = id => cart.value.some(line => line.id === id)

/**
 * 两个模式的菜单数据
 *
 * 云端 `menu-list` 按 type 分开返回，所以按 mode 各存一份。
 * 为什么不每次切 tab 都重新请求：food/coffee 之间来回切很频繁，每次都请求会闪一下加载态；
 * 这里有缓存、切回来是瞬时的，新鲜度交给 onShow（见下）。
 * loaded 与 loading 分开：前者是「拉成功过」、后者是「正在拉」，空态与骨架的显示条件不同。
 */
const menus = reactive({
  food: { dishes: [], categories: [], loading: false, loaded: false, error: '' },
  coffee: { dishes: [], categories: [], loading: false, loaded: false, error: '' }
})
const menu = computed(() => menus[mode.value])

/**
 * 卡片色块（图片背后那层）的配色
 *
 * 云端 dishes **没有** tone 字段 —— 它是展示层装饰、不属于业务数据，所以由 dishId 稳定派生：
 * 同一道菜每次进来颜色一致，不会跳。用 FNV-1a 而不是 `h*31+code` —— 后者雪崩性太差，
 * 相邻 id 会算出连续值，整屏卡片呈现规律色带（菜谱页的假时长踩过同一个坑）。
 */
const TONES = ['yellow', 'green', 'blue', 'coral']
const toneFor = (seed) => {
  const s = String(seed || '')
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return TONES[Math.abs(h) % TONES.length]
}

/**
 * 拉取某个模式的菜单（数据源：app-service 的 `menu-list` 聚合接口）
 *
 * 云端已按 `isOnSale: true` 过滤 —— 也就是说**只有菜谱里点过「发布菜品」的才会出现在这里**，
 * 本页不需要再判一次发布状态。分类栏直接用云端返回的 categories ——
 * 2026-09-21 起接口**不再构造**虚拟的「推荐」分类，所以这里的顺序与云端完全一致。
 */
const loadMenu = async (type) => {
  const target = menus[type]
  if (!target || target.loading) return
  target.loading = true
  target.error = ''
  try {
    const res = await uniCloud.callFunction({ name: 'app-service', data: { module: 'menu-list', type } })
    const result = res.result || {}
    if (result.code !== 0) {
      target.error = result.message || '菜单加载失败'
      return
    }
    target.categories = result.categories || []
    target.dishes = (result.dishes || []).map(d => ({
      id: d.dishId,
      name: d.name,
      // 云端存的是静态托管域名，过 imgUrl 拿按需尺寸 + WebP
      // （卡片图约 200rpx 宽、取 480 覆盖 2x/3x 屏）
      image: imgUrl(d.image, { w: 480 }),
      description: d.description || '',
      spicy: d.spicy || 'none',
      // 做法分类名（炒菜 / 汤类…）→ 卡片上那枚图标的素材，categoryArt 按名匹配
      recipeCategory: d.categoryName || '',
      // 菜单分类 id（云端 categories 的 _id），顶部筛选栏按它过滤
      category: d.categoryId || '',
      signature: !!d.isSignature,
      tone: toneFor(d.dishId)
    }))
    target.loaded = true
  } catch (e) {
    console.error('[order] 菜单加载异常', e)
    target.error = '网络不太顺，稍后再试'
  } finally {
    target.loading = false
  }
}

/**
 * 顶部筛选栏的分类
 *
 * =「全部」（前端概念、不过滤）+「拿手菜」+ 云端返回的分类。
 * 两个虚拟项固定在前，其余按云端 categories 的 sortOrder 排（接口已按 sortOrder asc 查好）。
 * 「拿手菜」是前端补的：云端 menu-list 不返回它，但 `isSignature`（家的拿手菜）是个有意义的
 * 筛选维度、改造前也有这个 tab，所以按 `signature` 字段在本地筛（见 visibleItems）。
 *
 * ⚠️ 2026-09-21 起没有「推荐」这一项了：云端 menu-list 原先会**凭空构造**一个 recommend 分类
 * 置于首位，而 categories 集合里从来没有叫「推荐」的记录 —— 那个分类、配套的 isRecommended
 * 字段、以及管理端的「是否推荐」开关已整套删除（详见 menu-list.js 顶部的说明）。
 */
const categoryTabs = computed(() => {
  const cloud = (menu.value.categories || []).map(c => ({ id: c.id, name: c.name }))
  return [{ id: 'all', name: '全部' }, { id: 'signature', name: '拿手菜' }, ...cloud]
})

/**
 * 列表里实际渲染的菜品：先按分类筛、再按关键词搜（名称 + 描述）
 *
 * 两个虚拟分类的判定不同：`all` 不过滤、`signature` 看 isSignature，
 * 其余一律按 categoryId 匹配云端分类（分类栏里已不存在其它虚拟项）。
 */
const visibleItems = computed(() => {
  const key = categories[mode.value]
  const keyword = queries[mode.value].trim().toLocaleLowerCase()
  return menu.value.dishes.filter((item) => {
    const hitCategory = key === 'all' || (key === 'signature' ? item.signature : item.category === key)
    if (!hitCategory) return false
    if (!keyword) return true
    return (item.name + ' ' + item.description).toLocaleLowerCase().includes(keyword)
  })
})
const searchOpen = ref(false), panel = ref(''), closing = ref(false), confirmClear = ref(false), feedback = ref('')
const selected = ref(null), selectedNote = ref(''), submitting = ref(false), submitted = ref(null)
let closeTimer, feedbackTimer, submitTimer
onLoad(options => { if (['food','coffee'].includes(options?.type)) mode.value = options.type })
/**
 * 每次进页面都重新拉当前模式的菜单
 *
 * 这是「在菜谱里点了发布 → 回到点单页就能看到」的**唯一**保证：发布发生在另一个页面，
 * 本页拿不到跨页通知，只能靠 onShow 重拉。同时把另一个模式标记为「已过期」，
 * 切过去时再拉 —— 发布的菜品可能属于另一个 type。
 * （loadMenu 自带 loading 守卫，onLoad 后的首次 onShow 不会发两次请求。）
 */
onShow(() => {
  const pending = useCartStore().consumePendingType()
  if (['food','coffee'].includes(pending)) mode.value = pending
  menus[mode.value === 'food' ? 'coffee' : 'food'].loaded = false
  loadMenu(mode.value)
})
const switchMode = type => {
  if (panel.value || mode.value === type) return
  mode.value = type
  feedback.value = ''
  if (!menus[type].loaded) loadMenu(type)
}
const resetFilters = () => { queries[mode.value] = ''; categories[mode.value] = 'all' }
const toggleSearch = () => { searchOpen.value = !searchOpen.value; if (!searchOpen.value) queries[mode.value] = '' }
const showFeedback = text => { clearTimeout(feedbackTimer); feedback.value = text; feedbackTimer = setTimeout(() => { feedback.value = '' }, 1400) }
/**
 * 打开菜品抽屉
 *
 * 卡片上那颗按钮**不直接加购** —— 加入动作统一收在抽屉底部那颗按钮上，避免"手一滑就加了一份"。
 * 若这道菜已在清单里，备注回填成**上次填的那份**（否则点「更新备注」看到空白会以为备注丢了），
 * 底部按钮随之变成「更新备注」，所以点它既能改备注、也不会重复添加。
 *
 * 抽屉里**没有可选项**：辣度由菜谱决定、只读展示（见 spicyArt）；
 * 用户可选的口味（咖啡温度甜度、青菜蒜香清淡）云端还没有字段，2026-09-20 与主人确认「先不做」。
 */
const openDish = item => {
  const line = cart.value.find(value => value.id === item.id)
  selected.value = item
  selectedNote.value = line ? line.note : ''
  closing.value = false
  panel.value = 'dish'
}
/**
 * 抽屉里只读展示的辣度文案
 *
 * 2026-09-21 起这一行**只画图标、不写文字**（档位图案本身就用辣椒根数表达档位），
 * 文案退居 `aria-label`：屏幕上不再出现它，但读屏仍拿得到「辣度 微辣」。
 */
const spicyText = computed(() => (selected.value && SPICY_TEXT[selected.value.spicy]) || '')
/**
 * 辣度图案：与菜谱列表、菜谱详情**同一套素材**（由 utils/spicy.js 给出）。
 *
 * 这里用 spicyImage 而不是 spicyMark —— 这一行是「字段」语义，而且改版后
 * **图标就是这一行的值**：不辣也要画出那枚斜线辣椒（「不辣」是一个要读出来的值）；
 * 未设置 / 脏值一律得到空串 → 模板用 v-if 把整块（连标题一起）收掉。
 * 「标记」语义的列表 / 详情才是不辣就不显示。
 */
const spicyArt = computed(() => (selected.value ? spicyImage(selected.value.spicy) : ''))
const selectedInCart = computed(() => !!selected.value && inCart(selected.value.id))
const removeFromCart = line => { removeLine(cart.value, line.key); showFeedback('已把 ' + line.name + ' 从清单里去掉') }
const openCart = () => { closing.value = false; panel.value = 'cart' }
const openReview = () => { if (!total.value || closing.value) return; panel.value = 'review' }
const closePanel = () => { if (closing.value || submitting.value) return; closing.value = true; closeTimer = setTimeout(() => { panel.value = ''; closing.value = false; selected.value = null }, 220) }
const addSelected = () => {
  if (closing.value || !selected.value) return
  // 已在清单里就是「更新那一条」，不会再添一条新的
  const existed = inCart(selected.value.id)
  addToCart(cart.value, selected.value, selectedNote.value)
  showFeedback(existed ? selected.value.name + '已更新' : selected.value.name + '已加入清单')
  closePanel()
}
const clearCart = () => { carts[mode.value] = []; confirmClear.value = false }
const submitMock = () => {
  if (submitting.value || !total.value) return
  submitting.value = true
  const type = mode.value
  const snapshot = {type,lines:JSON.parse(JSON.stringify(cart.value)),note:notes[type].trim(),count:total.value}
  submitTimer = setTimeout(() => {
    submitted.value = snapshot; carts[type] = []; notes[type] = ''; submitting.value = false; panel.value = 'success'
  }, 350)
}
const cleanup = () => { clearTimeout(closeTimer); clearTimeout(feedbackTimer); clearTimeout(submitTimer); panel.value = ''; closing.value = false; confirmClear.value = false; submitting.value = false; feedback.value = '' }
onHide(cleanup)
onUnmounted(cleanup)
onBackPress(() => { if (confirmClear.value) { confirmClear.value = false; return true } if (panel.value) { closePanel(); return true } return false })
const panelTitle = computed(() => panel.value === 'dish' ? selected.value?.name : panel.value === 'cart' ? '今天的快乐清单' : panel.value === 'review' ? '把想吃的，写成小纸条' : '点单小回执')
/**
 * 抽屉副标题
 *
 * **选口味抽屉不设副标题**（2026-09-20 按主人要求删掉）：这道菜的描述就在正下方的正文里，
 * 标题旁边再挂一句 slogan，等于同屏说两遍，还会把注意力从「这道菜是什么」引开。
 * 其余三个抽屉（清单 / 确认 / 回执）的副标题是那一层自己的说明，保留。
 * 模板据此用 `v-if` 收掉整行 —— 空串若照样渲染，`<text>` 自带行高会留出一条空行。
 */
const panelSubtitle = computed(() => panel.value === 'dish' ? '' : panel.value === 'cart' ? mode.value === 'food' ? '每一道，都是你喜欢的味道' : '一杯一杯，装进今天的小快乐' : panel.value === 'review' ? '确认一下，就准备开饭的心情' : '这是一张本地演示回执')
</script>

<style lang="scss" scoped>
// 点单页标题的手绘字体（MenuHand）。@font-face 已统一在 App.vue 里引一次、编进 app.wxss
// 全局生效 —— **页面侧不要再 @import scss/font-*.scss**，否则 base64 会被重复打进本页 wxss。
.order-page { height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; background:$p2-paper; color:$p2-ink; padding-bottom:calc(132rpx + env(safe-area-inset-bottom)); box-sizing:border-box; }
button { background:none; border-radius:0; margin:0; padding:0; line-height:inherit; font:inherit; color:inherit; &::after { border:0; } &:active:not([disabled]) { transform:scale(.95); } transition:transform 110ms $p2-ease; &[disabled] { opacity:.45; } }
.top-area { padding:0 32rpx; flex-shrink:0; }
.heading { display:flex; align-items:center; justify-content:space-between; gap:8rpx; padding-bottom:24rpx; }
.page-title { display:block; font-family:$p2-font-hand, $p2-font-fallback; font-size:46rpx; line-height:1.5; }
.subtitle { display:block; margin-top:7rpx; color:$p2-ink-soft; font-size:23rpx; }
.heading-art { width:112rpx; height:112rpx; flex-shrink:0; transform:rotate(6deg); }
.mode-tabs { position:relative; display:flex; border:2rpx solid $p2-line; border-radius:22rpx 26rpx 19rpx 23rpx; background:$p2-surface; padding:7rpx; height:96rpx; }
.mode-slider { position:absolute; top:7rpx; bottom:7rpx; left:7rpx; width:calc(50% - 7rpx); background:$p2-leaf-soft; border-radius:16rpx 20rpx 15rpx 19rpx; transform:translateX(0); transition:transform 240ms $p2-ease,background 240ms ease; &.coffee { transform:translateX(100%); background:$p2-butter-soft; } }
.mode-tab { position:relative; z-index:1; flex:1; display:flex; justify-content:center; align-items:center; gap:12rpx; font-size:29rpx; color:$p2-ink-soft; &.active { color:$p2-ink; font-weight:600; } }
.tab-count { font-size:18rpx; line-height:30rpx; min-width:30rpx; border-radius:50%; background:$p2-coral; color:$p2-white; padding:0 5rpx; }
.filter-row { display:flex; align-items:center; gap:12rpx; padding-top:10rpx; }
.category-scroll { flex:1; width:0; min-width:0; }
.category-list { display:flex; align-items:center; gap:24rpx; padding:12rpx 0 16rpx; }
.category { position:relative; flex-shrink:0; font-size:25rpx; padding:14rpx 3rpx; color:$p2-ink-soft; &.selected { color:$p2-ink; font-weight:600; .category-underline { opacity:1; transform:rotate(-3deg) scaleX(1); } } }
.category-underline { position:absolute; bottom:3rpx; left:0; right:0; height:5rpx; background:$p2-leaf; border-radius:60% 40%; opacity:0; transform:scaleX(.4); transition:transform 180ms $p2-ease,opacity 180ms ease; }
.search-toggle { width:68rpx; height:62rpx; display:flex; justify-content:center; align-items:center; border-left:2rpx solid #e6dac5; &.active { background:$p2-paper-deep; border-radius:15rpx; } }
.search-glass { width:24rpx; height:24rpx; border:3rpx solid $p2-ink-soft; border-radius:50%; position:relative; flex-shrink:0; &::after { content:''; position:absolute; width:10rpx; height:3rpx; background:$p2-ink-soft; right:-8rpx; bottom:-4rpx; transform:rotate(45deg); } }
.search-box { display:flex; align-items:center; gap:20rpx; padding:0 22rpx; background:$p2-surface; border:2rpx solid #cdbba4; border-radius:18rpx; margin-bottom:15rpx; input { flex:1; min-width:0; height:74rpx; font-size:26rpx; } }
.round-button { display:flex; align-items:center; justify-content:center; width:50rpx; height:60rpx; }
.menu-scroll { flex:1; min-height:0; height:0; width:100%; }
// 顶部留 20rpx：这里原来是那条浅黄色的提示条 .little-note（2026-09-20 按主人要求删掉）。
// 它自带的高度与 22rpx 下间距一起没了，留一点间隔，免得首张卡片贴住上面的分类筛选栏。
.list-inner { padding:20rpx 32rpx 22rpx; }
.menu-list { animation:list-in 240ms $p2-ease backwards; }
// 卡片高度账（2026-09-20 收紧，目标是「一屏能多看见一道菜」）：
//   改前 —— 图片区 244×232 撑着，加 16rpx 上下内边距与 22rpx 下间距，每张实占约 286rpx，一屏只排得下 3 张多一点。
//   改后 —— 图 200×180、内边距 12rpx、下间距 16rpx，每张约 228rpx（−20%），一屏多出近一张。
// 左内边距刻意只留 6rpx（比其它三边小）：图片背后有那枚旋转色块，贴边太紧会顶到卡片描边。
.dish-row { display:flex; align-items:center; gap:14rpx; background:$p2-surface; border:2rpx solid #b6a18a; border-radius:25rpx 21rpx 29rpx 19rpx; margin-bottom:16rpx; padding:12rpx 18rpx 12rpx 6rpx; box-shadow:3rpx 4rpx 0 #6247350d; &.chosen { border-color:#91a177; } &:nth-child(even) { border-radius:19rpx 27rpx 20rpx 25rpx; } }
// 1:1 素材走 aspectFit，尺寸由**短边**决定，所以这里的高度就是菜品的实际显示尺寸：180rpx = 90px
.art-button { position:relative; flex-shrink:0; width:200rpx; height:180rpx; display:flex; align-items:center; justify-content:center; }
// 背后色块同比缩小（190×148 → 156×122），保持它与图片原有的比例关系
.art-wash { position:absolute; width:156rpx; height:122rpx; border-radius:48% 52% 47% 53%; background:#f4ebce; transform:rotate(-8deg); opacity:.65; &.green { background:#e1eacb; } &.blue { background:#e1edef; } &.coral { background:#f7e0d5; } }
.dish-image { position:relative; width:100%; height:100%; }
.dish-copy { flex:1; min-width:0; }
// 菜名整行都是「打开选口味抽屉」的热区（底部那颗 ＋ 也是同一个去处），
// 所以不放右箭头：整卡可点已经说清了，密集列表里每行再挂一枚箭头只是噪音。
// 去掉箭头后 justify-content 也不必再 space-between。
.dish-title-button { display:flex; align-items:center; width:100%; text-align:left; padding:4rpx 0; }
// 菜名 36 → 32rpx（仍是手写体、仍比正文大一档）。描述**保持 21rpx 不动** ——
// 收紧是为了让列表更密，不该拿可读性去换，19rpx 在真机上已经开始费眼。
.dish-name { font-family:$p2-font-hand, $p2-font-fallback; font-size:32rpx; line-height:1.4; }
// 卡片副行改显示**描述**（以前是那句短 slogan）。描述是长文本（30~40 字），
// 所以必须单行截断：卡片高度是收紧过的，让它换行会把整列撑开、一屏又少一道菜。
// 完整描述在抽屉里看（点卡片打开）。
.dish-description { display:block; margin-top:2rpx; font-size:21rpx; color:$p2-ink-soft; line-height:1.6; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
// 信息行：左「做法分类图标」+「辣度图案」并排。2026-09-20 撤掉了原来那枚营销标签
// （「下饭担当」这类 pill）—— 它与描述、菜品名表达的是同一件事，占着最有价值的一行。
// 做成一行而不是两行的理由：卡片高度是刚收紧过的（每张 228rpx），再起一行要多花约 28rpx。
.dish-meta { display:flex; align-items:center; gap:8rpx; margin-top:8rpx; }
// 分类图标（做法分类）与辣度图案：两个 36rpx 方框并排。
//   · 辣度素材内容占画布约 53%、分类素材约 62% → 同尺寸方框下两者视觉高度相当（19 / 22rpx）；
//   · 这一页字号体系比菜谱页小，方框取 36rpx 而不是菜谱那几处的 46rpx，正好与副行文字视觉等高，
//     也不撑高这张已经收紧过的卡片；
//   · 分类素材是彩色 SVG，直接 <image> 加载 —— 不要塞进 Icon.vue（mask 会抹掉颜色信息）。
.dish-cat-art { width:36rpx; height:36rpx; flex-shrink:0; display:block; }
.dish-spicy-art { width:36rpx; height:36rpx; flex-shrink:0; display:block; }
// 卡片操作区现在只有一颗按钮，所以右对齐即可（原先左侧还有一枚「选口味」文字按钮）
.dish-bottom { display:flex; justify-content:flex-end; align-items:center; gap:6rpx; margin-top:8rpx; min-height:54rpx; }
// 卡片上唯一的操作按钮：点它打开「选口味」抽屉。未加入 = ＋、已加入 = ✓（再点是回去改口味）。
// 58 → 52rpx：卡片整体收紧后，原尺寸的按钮会显得比它所在的卡片还「重」。
.dish-add { width:52rpx; height:52rpx; border:2rpx solid $p2-line; border-radius:17rpx 15rpx 18rpx 14rpx; display:flex; justify-content:center; align-items:center; flex-shrink:0; background:$p2-leaf-soft; box-shadow:2rpx 3rpx 0 #62473512; &.added { background:$p2-white; border-color:#91a177; color:#6d8355; } }
.list-end { display:flex; justify-content:center; gap:14rpx; color:$p2-ink-soft; font-size:21rpx; margin:30rpx 0 15rpx; }
// 列表的「加载中 / 加载失败」态。与空态分开：空态给的是「换个筛选」这类引导，
// 加载中给引导是错的（还没加载完呢），失败时该给的是「再试一次」。
.list-state { display:flex; flex-direction:column; align-items:center; gap:18rpx; padding:72rpx 20rpx; text-align:center; color:$p2-ink-soft; font-size:25rpx; }
.cart-dock { flex-shrink:0; padding:16rpx 25rpx 8rpx; }
.cart-bar { display:flex; align-items:center; justify-content:space-between; gap:8rpx; padding:14rpx 13rpx; border:2rpx solid $p2-line; border-radius:25rpx 22rpx 20rpx 24rpx; background:$p2-surface; box-shadow:3rpx 4rpx 0 #62473510; &.filled { background:#f3f4e8; } }
.cart-summary { flex:1; min-width:0; display:flex; align-items:center; gap:16rpx; text-align:left; }
.basket-icon { position:relative; width:68rpx; height:72rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.basket-count { position:absolute; top:-4rpx; right:-3rpx; min-width:30rpx; line-height:30rpx; font-size:19rpx; text-align:center; padding:0 5rpx; border-radius:50%; background:$p2-coral; color:white; animation:count-pop 200ms $p2-ease; }
.cart-title { display:block; font-size:25rpx; font-weight:600; }.cart-subtitle { display:block; font-size:18rpx; color:$p2-ink-soft; margin-top:6rpx; }
.checkout-button { display:flex; align-items:center; justify-content:center; gap:6rpx; background:$p2-coral-soft; border:2rpx solid $p2-line; padding:18rpx 20rpx; height:76rpx; border-radius:17rpx 21rpx 16rpx 19rpx; font-size:27rpx; flex-shrink:0; }
.mode-coffee { .dish-add:not(.added) { background:$p2-butter-soft; }.category-underline { background:$p2-butter; }.cart-bar.filled { background:#faf0d7; } }
.empty-list,.empty-cart { display:flex; flex-direction:column; align-items:center; gap:16rpx; text-align:center; color:$p2-ink-soft; font-size:25rpx; padding:40rpx 10rpx; image { width:150rpx; height:150rpx; } }
.empty-title { font-family:$p2-font-hand, $p2-font-fallback; font-size:34rpx; color:$p2-ink; }
.light-button { border:2rpx solid #b9c39f; border-radius:15rpx; padding:17rpx 25rpx; background:$p2-leaf-soft; margin-top:12rpx; }
.sheet-layer { position:fixed; inset:0; z-index:300; }
.sheet-mask { position:absolute; inset:0; background:#3c2a2059; animation:mask-in 180ms ease; transition:opacity 220ms ease; &.closing { opacity:0; } }
.sheet { position:absolute; bottom:0; left:0; right:0; background:$p2-paper; border-radius:34rpx 39rpx 0 0; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; padding:18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom)); box-sizing:border-box; animation:sheet-in 260ms $p2-ease; transition:transform 220ms $p2-ease; &.closing { transform:translateY(100%); } }
.sheet-handle { flex-shrink:0; width:64rpx; height:7rpx; background:#d9cbb4; border-radius:9rpx; margin:0 auto 24rpx; }
.sheet-heading { display:flex; justify-content:space-between; align-items:center; gap:12rpx; flex-shrink:0; margin-bottom:20rpx; }
.sheet-title { display:block; font-family:$p2-font-hand, $p2-font-fallback; font-size:39rpx; line-height:1.5; }.sheet-subtitle { display:block; color:$p2-ink-soft; font-size:22rpx; margin-top:5rpx; }
.close-button { width:65rpx; height:65rpx; display:flex; align-items:center; justify-content:center; background:$p2-paper-deep; border-radius:50%; flex-shrink:0; }
.sheet-scroll { flex:1; min-height:0; max-height:calc(88vh - 280rpx - env(safe-area-inset-bottom)); }
.sheet-footer { display:flex; align-items:center; gap:14rpx; padding-top:22rpx; flex-shrink:0; }
.primary-button { flex:1; display:flex; align-items:center; justify-content:center; gap:12rpx; padding:24rpx 18rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:20rpx 24rpx 18rpx 22rpx; box-shadow:3rpx 4rpx 0 #62473515; font-size:29rpx; min-height:88rpx; }
.dish-detail { padding-bottom:4rpx; }.detail-image { display:block; width:350rpx; height:260rpx; margin:0 auto 12rpx; }
.detail-description { display:block; font-size:25rpx; line-height:1.85; color:$p2-ink-soft; margin:6rpx 0 24rpx; }
// 辣度只读行 —— 2026-09-21 改版：**标题与下方「备注」共用同一个 .field-label**，
// 值不再是文字、只画档位图案。**刻意不做成按钮组**：辣度由菜谱配好、点单的人不能改，
// 一旦长得像按钮，用户就会以为能点。
// 容器只留上下边距：上 4rpx 与 .dish-detail 的收尾对齐、下 8rpx 叠上 .dish-note-box 的
// 4rpx → 「辣度」「备注」之间 12rpx，读成一组；与上方描述那 24rpx 的间距拉开层次。
.dish-spicy { padding-top:4rpx; margin-bottom:8rpx; }
// 档位图案：与菜谱列表、菜谱详情**同一套素材**，由 utils/spicy.js 的 spicyImage() 给出
// （「字段」语义，不辣时是那枚斜线辣椒）。
//
// 尺寸 56rpx：改版后**图标就是这一行的值**（原先旁边还有 23rpx 的「微辣」文字，46rpx 是
// 与那行文字配着定的），文字撤掉后按 46rpx 会显得孤零零，故放大一档 —— 56rpx 方框下辣椒
// 视觉高约 30rpx，与上方 26rpx 的字段标题同一量级；菜谱详情编辑态那个「图标即值」的格子
// 也是 ~34rpx 的辣椒高，两者量级一致。
//
// `margin-top:-13rpx`：素材是方形画布、内容只占中间约 53% 高，于是图标自带
// `(56 - 56×0.531) ÷ 2 ≈ 13rpx` 的**透明上留白**。不抵掉它，标题到内容的**光学**间距会是
// 17 + 13 ≈ 30rpx，比「备注」那 17rpx 松近一倍 —— 而这次改版要的正是两个字段读起来一样。
// 抵掉后光学间距回到 17rpx，与 .field-label 的下边距一致（无论外层是否发生外边距折叠，
// 算式都是 17 - 13 = 4rpx，结果相同）。
// 方框**必须正方形**、内容只占画布 53% 这条换算规则见 utils/spicy.js 的注释。
.spicy-art { width:56rpx; height:56rpx; display:block; margin-top:-13rpx; }
// 单品备注框：外观复用确认页那张「小纸条」的 .note-input（同一套输入语言），
// 只把高度收窄一档 —— 单品备注比整单小纸条短，而抽屉里上方已经有一张 260rpx 的大图。
.dish-note-box { padding-top:4rpx; .note-input { height:112rpx; } }
// 字段标签（单品备注 / 整单小纸条的行首）。名字原来叫 option-label ——
// 2026-09-20 起抽屉里不再有「可选项」，它只服务普通表单字段，故改名为 field-label。
.field-label { display:block; font-size:26rpx; font-weight:600; margin-bottom:17rpx; text { font-size:21rpx; color:$p2-ink-soft; font-weight:400; } }
.cart-toolbar { display:flex; align-items:center; justify-content:space-between; color:$p2-ink-soft; font-size:23rpx; padding:4rpx 0 18rpx; }.clear-cart { display:flex; align-items:center; gap:7rpx; min-height:52rpx; }
.cart-line { display:flex; align-items:center; gap:16rpx; padding:20rpx 0; border-top:2rpx dashed #dfd2bd; image { width:100rpx; height:100rpx; flex-shrink:0; } }
.line-copy { flex:1; min-width:0; }.line-title { display:block; font-size:28rpx; font-weight:600; }.line-note { display:block; font-size:21rpx; color:$p2-ink-soft; margin-top:6rpx; }
// 清单里每条的份数恒为 1，所以这里不是「减一份」而是「整条移除」—— 用垃圾桶图标把语义说清，
// 免得用户以为点一下只是少一份。改口味走卡片上的 ✓（打开抽屉）。
.line-remove { width:52rpx; height:52rpx; display:flex; justify-content:center; align-items:center; border:2rpx solid #d5c7b3; border-radius:16rpx 14rpx 17rpx 13rpx; background:$p2-white; color:$p2-ink-soft; flex-shrink:0; }
.order-notes { padding:28rpx 0 12rpx; border-top:2rpx dashed #dfd2bd; }.note-input { width:100%; height:145rpx; padding:18rpx 22rpx; border:2rpx solid #d9c9b2; border-radius:17rpx 21rpx 16rpx 20rpx; background:$p2-surface; font-size:25rpx; line-height:1.7; box-sizing:border-box; }.note-counter { display:block; text-align:right; font-size:20rpx; color:$p2-ink-soft; margin-top:8rpx; }
.demo-notice { display:flex; align-items:center; justify-content:center; gap:8rpx; font-size:21rpx; color:$p2-ink-soft; padding:20rpx 0 8rpx; }
.back-to-cart { padding:24rpx; font-size:26rpx; }
.success-content { text-align:center; }.success-stamp { display:flex; align-items:center; justify-content:center; width:112rpx; height:112rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:48% 52% 44% 56%; margin:10rpx auto 22rpx; transform:rotate(-7deg); }.success-title { display:block; font-family:$p2-font-hand, $p2-font-fallback; font-size:44rpx; }.success-caption { display:block; margin-top:10rpx; color:$p2-ink-soft; font-size:25rpx; }
.receipt { background:$p2-surface; border:2rpx solid #e0d5c1; border-radius:8rpx; padding:24rpx; margin-top:25rpx; text-align:left; }.receipt-label { display:block; font-size:21rpx; color:$p2-ink-soft; padding-bottom:15rpx; border-bottom:2rpx dashed #e0d5c1; }.receipt-line { display:flex; justify-content:space-between; gap:18rpx; padding:18rpx 0; font-size:26rpx; }.receipt-options { display:block; font-size:21rpx; color:$p2-ink-soft; margin-top:5rpx; }.receipt-note { display:block; font-size:23rpx; color:$p2-ink-soft; margin:10rpx 0; white-space:pre-wrap; overflow-wrap:anywhere; }.receipt-total { display:block; text-align:center; border-top:2rpx dashed #e0d5c1; padding-top:17rpx; font-size:24rpx; }
.feedback { position:fixed; z-index:1100; bottom:calc(285rpx + env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:10rpx; white-space:nowrap; padding:16rpx 22rpx; border-radius:18rpx; background:#624735ee; color:$p2-white; font-size:23rpx; pointer-events:none; animation:mask-in 130ms ease; }
@keyframes list-in { from { opacity:0; transform:translateY(8rpx); } to { opacity:1; transform:translateY(0); } }
@keyframes count-pop { from { transform:scale(.75); } to { transform:scale(1); } }
@keyframes mask-in { from { opacity:0; } to { opacity:1; } }
@keyframes sheet-in { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (prefers-reduced-motion:reduce) { button,.mode-slider,.category-underline,.sheet,.sheet-mask { transition:none; }.menu-list,.basket-count,.sheet,.sheet-mask,.feedback { animation:none; } }
// 窄屏（≤360px）再收一档。
// ⚠️ 这里覆盖的值必须**跟着上面的基准值一起改**：基准从 244/36 收到 200/32 之后，
//    原来那组 220/34 就比基准还大了 —— 窄屏会比大屏更宽松，正好反了。
@media screen and (max-width:360px) { .art-button { width:180rpx; }.page-title { font-size:43rpx; }.dish-name { font-size:30rpx; }.dish-description { font-size:20rpx; }.dish-row { gap:12rpx; }.cart-title { font-size:23rpx; } }
</style>
