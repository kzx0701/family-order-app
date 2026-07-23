<template>
  <view class="page-order page-enter" :class="themeClass">
    <!-- 页面头部 -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 32 + 'px' }">
      <view class="back-btn" @tap="goHome">
        <Icon name="arrow-left" :size="20" />
      </view>
      <text class="title">{{ pageTitle }}</text>
      <view class="cart-btn" :class="{ shake: cartShaking }" @tap="onCartClick">
        <Icon name="shopping-cart" :size="20" />
        <view v-if="cartTotal > 0" class="cart-badge">{{ cartTotal }}</view>
      </view>
    </view>

    <!-- 主体：左侧分类 + 右侧菜品 -->
    <view class="content">
      <!-- 左侧分类导航 -->
      <scroll-view
        class="sidebar"
        scroll-y
        :scroll-with-animation="true"
        :scroll-top="sidebarScrollTop"
      >
        <view
          v-for="cat in categories"
          :key="cat.id"
          :id="`cat-${cat.id}`"
          class="cat-item"
          :class="{ active: activeCategory === cat.id }"
          @tap="onCategoryTap(cat.id)"
        >
          <view class="cat-indicator" />
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧菜品列表 -->
      <scroll-view
        class="dish-list"
        scroll-y
        :scroll-top="dishScrollTop"
        :scroll-with-animation="true"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scroll="onScroll"
      >
        <!-- 加载中：骨架屏占位（替代三点动效，更直观的菜品卡片占位） -->
        <view v-if="loading && dishes.length === 0" class="dish-skeleton">
          <skeleton type="dish" :count="4" />
        </view>

        <!-- 空状态 -->
        <view v-else-if="dishes.length === 0" class="state-block animate-fade-in">
          <text class="state-emoji">{{ emptyEmoji }}</text>
          <text class="state-text">{{ emptyText }}</text>
          <view class="state-action" @tap="loadMenu">
            <text class="state-action-text">刷新看看</text>
          </view>
        </view>

        <!-- 菜品区段列表 -->
        <template v-else>
          <view
            v-for="cat in categories"
            :key="cat.id"
            :id="`section-${cat.id}`"
            class="dish-section"
          >
            <view class="section-header">
              <text class="section-title">{{ cat.name }}</text>
              <text v-if="cat.id === 'recommend'" class="section-deco">✨</text>
            </view>
            <view v-if="(dishesByCategory[cat.id] || []).length > 0" class="dish-grid">
              <dish-card
                v-for="(dish, idx) in dishesByCategory[cat.id] || []"
                :key="dish.dishId"
                :dish="dish"
                :index="idx"
                @add-to-cart="onAddToCart"
                @tap="onDishTap"
              />
            </view>
            <view v-else class="section-empty">
              <text class="section-empty-text">暂无菜品</text>
            </view>
          </view>
          <!-- 底部留白 -->
          <view class="list-bottom-spacer" />
        </template>
      </scroll-view>
    </view>

    <!-- 底部购物车条 -->
    <view class="cart-bar">
      <view class="cart-icon-wrap" @tap="onCartClick">
        <view class="cart-icon-circle" :class="{ active: cartTotal > 0 }">
          <Icon name="shopping-bag" :size="22" />
        </view>
      </view>
      <view
        class="submit-btn"
        :class="{ disabled: cartTotal === 0 }"
        @tap="goSubmit"
      >
        <text class="submit-text">{{ cartTotal === 0 ? '购物车是空的' : '去下单' }}</text>
      </view>
    </view>

    <!-- 飞入动效层 -->
    <view class="fly-layer">
      <view
        v-for="fly in flyingItems"
        :key="fly.id"
        class="fly-item"
        :style="fly.style"
        @animationend="onFlyEnd(fly.id)"
      >
        <image v-if="fly.image" :src="fly.image" class="fly-img" mode="aspectFill" />
        <view v-else class="fly-emoji">{{ fly.emoji }}</view>
      </view>
    </view>

    <!-- 购物车浮层 -->
    <cart-popup
      :visible="cartVisible"
      :theme="orderType"
      @close="onPopupClose"
      @submit="onPopupSubmit"
    />

    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/store/cart.js'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'

const { statusBarHeight } = useSafeArea()

const cartStore = useCartStore()
const userStore = useUserStore()
const instance = getCurrentInstance()

/* === 点单类型与主题 === */
const orderType = ref('coffee')
const themeClass = computed(() => `theme-${orderType.value}`)
const pageTitle = computed(() => (orderType.value === 'coffee' ? '咖啡点单' : '美食点单'))

/* === 菜单数据 === */
const categories = ref([])
const dishes = ref([])
const activeCategory = ref('recommend')
const loading = ref(false)
const refreshing = ref(false)
const loaded = ref(false)

/* === 滚动联动（测量偏移 + scroll-top 方案） === */
// 右侧列表滚动位置（px），绑定 scroll-view 的 scroll-top
const dishScrollTop = ref(0)
// 左侧分类栏滚动位置（px），激活项自动跟随到可视区
const sidebarScrollTop = ref(0)
// 各区段相对滚动内容顶部的偏移量（px），数据渲染后测量一次
const sectionTops = ref([])
// 滚动动画期间屏蔽 scroll 事件回写高亮，避免与点击目标打架
let suppressScrollSync = false
let suppressTimer = null
let scrollThrottleTimer = null
// 记录最近一次手动滚动位置与最新 scrollTop（供节流计算使用）
let lastDishScrollTop = -1
let lastSidebarScrollTop = -1
let latestScrollTop = 0

/* === 飞入动效 === */
const flyingItems = ref([])
const cartShaking = ref(false)
let shakeTimer = null

/* === 购物车 === */
const cartTotal = computed(() => cartStore.totalCount)

/* === 购物车浮层 === */
const cartVisible = ref(false)

/* === 按分类分组的菜品（computed 缓存，避免模板内重复 filter） === */
const dishesByCategory = computed(() => {
  const map = {}
  for (const cat of categories.value) {
    if (cat.id === 'recommend') {
      map[cat.id] = dishes.value.filter((d) => d.isRecommended)
    } else {
      map[cat.id] = dishes.value.filter((d) => d.categoryId === cat.id)
    }
  }
  return map
})

/* === 空状态文案 === */
const emptyEmoji = computed(() => (orderType.value === 'food' ? '🍽️' : '☕'))
const emptyText = computed(() =>
  orderType.value === 'food' ? '暂无美食菜品\n管理员赶紧上架吧~' : '暂无咖啡菜品\n管理员赶紧上架吧~'
)

/**
 * 加载菜单数据
 * 调用 menu-list 云函数，返回分类与菜品
 */
const loadMenu = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'menu-list',
      data: { type: orderType.value }
    })
    if (res.result.code === 0) {
      categories.value = res.result.categories || []
      dishes.value = res.result.dishes || []
      // 默认选中首项（推荐）
      if (categories.value.length > 0) {
        activeCategory.value = categories.value[0].id
      }
      // 内容整体替换：右侧列表先回顶（微扰法确保 scroll-view 响应），
      // 回顶动画结束后再测量各区段偏移量，保证位置基准准确
      suppressScrollSync = true
      clearTimeout(suppressTimer)
      dishScrollTop.value = lastDishScrollTop === 0 ? 0.1 : 0
      lastDishScrollTop = dishScrollTop.value
      nextTick(() => {
        setTimeout(() => {
          measureSections()
          suppressTimer = setTimeout(() => {
            suppressScrollSync = false
          }, 200)
        }, 350)
      })
    } else {
      uni.showToast({ title: res.result.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[order] loadMenu error', e)
    uni.showToast({ title: '加载失败，下拉刷新重试', icon: 'none' })
  } finally {
    loading.value = false
    loaded.value = true
  }
}

/* === 下拉刷新 === */
const onRefresh = async () => {
  refreshing.value = true
  await loadMenu()
  refreshing.value = false
}

/**
 * 测量各区段相对滚动内容顶部的偏移量
 * 公式：区段 viewport top - 滚动容器 viewport top + 当前 scrollTop
 * 数据加载/刷新后调用一次即可（卡片高度固定，布局稳定）
 * @param {Function} [onDone] - 测量完成回调（用于点击时偏移未就绪的延迟滚动）
 */
const measureSections = (onDone) => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.selectAll('.dish-section').boundingClientRect()
  query.select('.dish-list').boundingClientRect()
  query.select('.dish-list').scrollOffset()
  query.exec((res) => {
    const sections = res[0] || []
    const scrollView = res[1]
    const scrollOffset = res[2]
    if (!scrollView || sections.length === 0) return
    const currentTop = scrollOffset ? scrollOffset.scrollTop : 0
    sectionTops.value = sections.map((r) => r.top - scrollView.top + currentTop)
    if (typeof onDone === 'function') onDone()
  })
}

/**
 * 点击分类：立即高亮 + 右侧滚动到对应区段 + 左侧激活项跟随到可视区
 */
const onCategoryTap = (catId) => {
  if (activeCategory.value === catId) return
  activeCategory.value = catId
  scrollDishToCategory(catId)
  scrollSidebarToActive()
  // 滚动动画期间（约 500ms）屏蔽 scroll 事件回写高亮
  suppressScrollSync = true
  clearTimeout(suppressTimer)
  suppressTimer = setTimeout(() => {
    suppressScrollSync = false
  }, 600)
}

/**
 * 右侧列表滚动到指定分类区段
 */
const scrollDishToCategory = (catId) => {
  const idx = categories.value.findIndex((c) => c.id === catId)
  if (idx < 0) return
  // 偏移量未就绪（如加载后立刻点击）：先测量，完成后延迟执行滚动
  if (sectionTops.value.length === 0) {
    measureSections(() => scrollDishToCategory(catId))
    return
  }
  const top = sectionTops.value[idx]
  if (top == null) return
  // 顶部留 8px 呼吸位，避免区段标题紧贴滚动容器边缘
  const target = Math.max(top - 8, 0)
  // scroll-top 值不变时 scroll-view 不响应，微扰强制触发
  dishScrollTop.value = target === lastDishScrollTop ? target + 0.1 : target
  lastDishScrollTop = dishScrollTop.value
}

/**
 * 左侧分类栏：让激活项滚动到侧栏纵向约 1/3 处（成熟电商联动交互）
 */
const scrollSidebarToActive = () => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select(`#cat-${activeCategory.value}`).boundingClientRect()
  query.select('.sidebar').boundingClientRect()
  query.select('.sidebar').scrollOffset()
  query.exec((res) => {
    const item = res[0]
    const sidebar = res[1]
    const scrollOffset = res[2]
    if (!item || !sidebar) return
    const currentTop = scrollOffset ? scrollOffset.scrollTop : 0
    const itemTop = item.top - sidebar.top + currentTop
    const target = Math.max(itemTop - sidebar.height / 3, 0)
    sidebarScrollTop.value = target === lastSidebarScrollTop ? target + 0.1 : target
    lastSidebarScrollTop = sidebarScrollTop.value
  })
}

/**
 * 滚动监听：记录最新 scrollTop，节流更新左侧高亮分类
 */
const onScroll = (e) => {
  latestScrollTop = (e.detail && e.detail.scrollTop) || 0
  if (suppressScrollSync) return
  if (scrollThrottleTimer) return
  scrollThrottleTimer = setTimeout(() => {
    scrollThrottleTimer = null
    updateActiveFromScroll(latestScrollTop)
  }, 100)
}

/**
 * 根据 scrollTop 与预测量的区段偏移，计算当前高亮分类
 */
const updateActiveFromScroll = (scrollTop) => {
  const tops = sectionTops.value
  if (tops.length === 0) return
  // 阈值：略过区段 header 高度，滚动经过区段顶部即切换
  const threshold = scrollTop + 24
  let activeIdx = 0
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= threshold) activeIdx = i
  }
  const newActive = categories.value[activeIdx]?.id
  if (newActive && newActive !== activeCategory.value) {
    activeCategory.value = newActive
    scrollSidebarToActive()
  }
}

/**
 * 列表加购：dish-card 抛出 { dish, originX, originY }
 * 立即加入购物车 + 触发飞入动效
 */
const onAddToCart = ({ dish, originX, originY }) => {
  cartStore.addItem(dish)
  playFlyAnimation(originX, originY, dish)
}

// 飞行元素尺寸（px）
const flySize = 40

/**
 * 飞入动效：从 + 按钮位置抛物线飞向购物车图标
 * 1. 查询购物车图标位置
 * 2. 计算起点/峰值/终点坐标
 * 3. 创建飞行元素，CSS keyframe 动画自动播放
 * 4. animationend 或 setTimeout 兜底移除
 */
const playFlyAnimation = (originX, originY, dish) => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('.cart-btn').boundingClientRect((rect) => {
    if (!rect) {
      // 降级：仅触发购物车抖动
      triggerCartShake()
      return
    }
    const endX = rect.left + rect.width / 2
    const endY = rect.top + rect.height / 2
    const startLeft = originX - flySize / 2
    const startTop = originY - flySize / 2
    const endLeft = endX - flySize / 2
    const endTop = endY - flySize / 2
    // 抛物线峰值：X 取中点，Y 在直线上方 60px
    const peakLeft = (startLeft + endLeft) / 2
    const peakTop = Math.min(startTop, endTop) - 60

    const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const emoji = dish.type === 'food' ? '🍲' : '☕'

    flyingItems.value.push({
      id,
      image: dish.image || '',
      emoji,
      style: {
        '--sx': `${startLeft}px`,
        '--sy': `${startTop}px`,
        '--px': `${peakLeft}px`,
        '--py': `${peakTop}px`,
        '--ex': `${endLeft}px`,
        '--ey': `${endTop}px`
      }
    })

    // 兜底清理（防止 animationend 在小程序环境不触发）
    setTimeout(() => {
      onFlyEnd(id)
    }, 900)
  })
  query.exec()
}

/**
 * 飞行结束：移除元素 + 触发购物车抖动
 */
const onFlyEnd = (id) => {
  const idx = flyingItems.value.findIndex((f) => f.id === id)
  if (idx > -1) {
    flyingItems.value.splice(idx, 1)
  }
  triggerCartShake()
}

/**
 * 触发购物车图标抖动（重启 animation 的通用方案）
 */
const triggerCartShake = () => {
  if (cartShaking.value) {
    cartShaking.value = false
  }
  clearTimeout(shakeTimer)
  setTimeout(() => {
    cartShaking.value = true
    shakeTimer = setTimeout(() => {
      cartShaking.value = false
    }, 500)
  }, 20)
}

/**
 * 菜品卡片点击：跳详情页
 */
const onDishTap = (dish) => {
  if (!dish || !dish.dishId) {
    uni.showToast({ title: '菜品信息异常', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/dish-detail/dish-detail?dishId=${dish.dishId}&type=${dish.type}`
  })
}

/**
 * 购物车图标点击：有商品时展开浮层，空购物车提示
 */
const onCartClick = () => {
  if (cartTotal.value === 0) {
    uni.showToast({ title: '购物车是空的~', icon: 'none' })
    return
  }
  cartVisible.value = true
}

/* === 浮层关闭 === */
const onPopupClose = () => {
  cartVisible.value = false
}

/* === 浮层内"去下单"：关闭浮层后跳转提交页 === */
const onPopupSubmit = () => {
  cartVisible.value = false
  goSubmit()
}

/* === 跳转提交页 === */
const goSubmit = () => {
  if (cartTotal.value === 0) return
  uni.navigateTo({ url: '/pages/submit/submit' })
}

/* === 返回首页 === */
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

/* === 生命周期 === */
// onLoad：支持 navigateTo 直接进入时从 options 获取 type（tabBar 页面通常走 switchTab + pendingType）
onLoad((options) => {
  if (options.type && ['coffee', 'food'].includes(options.type)) {
    orderType.value = options.type
  }
  // 同步购物车激活类型
  cartStore.setActiveType(orderType.value)
})

// onShow：消费首页入口卡片设置的 pendingType，类型变化时重新加载菜单
onShow(() => {
  const pendingType = cartStore.consumePendingType()
  let needReload = false
  if (
    pendingType &&
    ['coffee', 'food'].includes(pendingType) &&
    pendingType !== orderType.value
  ) {
    orderType.value = pendingType
    needReload = true
  }
  // 同步购物车激活类型，使咖啡/美食购物车各自独立
  cartStore.setActiveType(orderType.value)
  // 首次加载 或 类型切换 → 拉取菜单
  if (!loaded.value || needReload) {
    loadMenu()
  }
})
</script>

<style lang="scss" scoped>
.page-order {
  // 应用外壳页标准：视口锁定，页面本身不滚动（详见 mixins page-shell 注释）
  @include page-shell;
  background-color: $color-bg;
  transition: background-color $dur-base $ease-smooth;
}

/* === 顶部 header === */
.header {
  @include flex-between;
  padding: 40rpx 32rpx 24rpx;
  position: relative;
  z-index: 10;

  .back-btn,
  .cart-btn {
    @include btn-icon;
    transition: transform $dur-fast $ease-bounce,
      background-color $dur-base $ease-smooth;
  }

  .title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--theme-primary);
    transition: color $dur-base $ease-smooth;
  }

  .cart-btn {
    position: relative;

    .cart-badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      border-radius: $radius-full;
      background-color: var(--theme-primary);
      color: #fff;
      font-size: $font-size-xs;
      font-weight: $font-weight-bold;
      @include flex-center;
      transition: background-color $dur-base $ease-smooth;
      animation: popIn 0.3s $ease-bounce;
    }

    &.shake {
      animation: cartShake 0.5s $ease-bounce;
    }
  }
}

@keyframes cartShake {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  20% {
    transform: scale(1.25) rotate(-12deg);
  }
  50% {
    transform: scale(0.9) rotate(8deg);
  }
  80% {
    transform: scale(1.08) rotate(-3deg);
  }
}

/* === 主体内容 === */
.content {
  // 外壳页滚动区：min-height:0 允许收缩，内部 scroll-view 才有界可滚
  @include page-shell-body;
  display: flex;
}

/* === 左侧分类导航 === */
.sidebar {
  width: 160rpx;
  background-color: var(--theme-secondary);
  flex-shrink: 0;
  height: 100%;
  transition: background-color $dur-base $ease-smooth;

  .cat-item {
    position: relative;
    padding: 32rpx 0;
    text-align: center;
    transition: background-color $dur-base $ease-smooth;

    .cat-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 6rpx;
      height: 48rpx;
      border-radius: $radius-full;
      background-color: var(--theme-primary);
      transition: transform $dur-base $ease-bounce,
        background-color $dur-base $ease-smooth;
    }

    .cat-name {
      font-size: $font-size-sm;
      color: $color-text-muted;
      transition: color $dur-base $ease-smooth;
    }

    &.active {
      background-color: $color-card;

      .cat-indicator {
        transform: translateY(-50%) scaleY(1);
      }

      .cat-name {
        color: var(--theme-primary);
        font-weight: $font-weight-semibold;
      }
    }
  }
}

/* === 右侧菜品列表 === */
.dish-list {
  flex: 1;
  height: 100%;
  padding: 0 24rpx;

  /* 骨架屏容器：与菜品区段一致的纵向内边距 */
  .dish-skeleton {
    padding: 16rpx 0;
  }

  .dish-section {
    padding: 16rpx 0;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 16rpx 8rpx 20rpx;

      .section-title {
        font-size: $font-size-base;
        font-weight: $font-weight-bold;
        color: var(--theme-text);
        transition: color $dur-base $ease-smooth;
      }

      .section-deco {
        font-size: $font-size-sm;
      }
    }

    .dish-grid {
      display: flex;
      flex-direction: column;
      gap: 20rpx;
    }

    .section-empty {
      padding: 40rpx 0;
      text-align: center;

      .section-empty-text {
        font-size: $font-size-xs;
        color: $color-text-muted;
      }
    }
  }

  .list-bottom-spacer {
    height: 40rpx;
  }
}

/* === 加载与空状态 === */
.state-block {
  @include flex-column;
  align-items: center;
  gap: 16rpx;
  padding: 120rpx 0;

  .loading-dots {
    display: flex;
    gap: 8rpx;

    .dot {
      font-size: $font-size-2xl;
      color: var(--theme-primary);
      animation: dotBlink 1.2s $ease-smooth infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  .state-emoji {
    font-size: 96rpx;
    line-height: 1;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  .state-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
    line-height: $line-height-relaxed;
    white-space: pre-line;
  }

  .state-action {
    margin-top: 8rpx;
    padding: 12rpx 32rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);
    transition: transform $dur-fast $ease-bounce;

    &:active {
      transform: scale(0.96);
    }

    .state-action-text {
      color: var(--theme-primary);
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }
  }
}

@keyframes dotBlink {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* === 底部购物车条 === */
.cart-bar {
  @include flex-between;
  padding: 20rpx 32rpx;
  background-color: $color-card;
  @include hairline-bottom;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom) + 80rpx);
  gap: 24rpx;

  .cart-icon-wrap {
    position: relative;
    @include flex-center;

    .cart-icon-circle {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background-color: $color-neutral-200;
      color: $color-neutral-400;
      @include flex-center;
      transition: background-color $dur-base $ease-smooth,
        color $dur-base $ease-smooth, transform $dur-base $ease-bounce;

      &.active {
        background-color: var(--theme-primary);
        color: #fff;
        transform: scale(1.05);
      }
    }
  }

  .submit-btn {
    @include btn-primary;
    padding: 20rpx 56rpx;
    transition: background-color $dur-base $ease-smooth,
      transform $dur-fast $ease-bounce;

    .submit-text {
      color: inherit;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
    }

    &.disabled {
      @include btn-disabled;

      /* 置灰时移除点击反馈，视觉上明确不可点击 */
      &:active {
        transform: none;
        opacity: 1;
      }
    }
  }
}

/* === 飞入动效层 === */
.fly-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.fly-item {
  position: fixed;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  pointer-events: none;
  animation: flyArc 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;

  .fly-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2rpx solid #fff;
    box-shadow: $shadow-md;
  }

  .fly-emoji {
    width: 100%;
    height: 100%;
    @include flex-center;
    font-size: 32rpx;
    background-color: var(--theme-secondary);
    border-radius: 50%;
    border: 2rpx solid #fff;
    box-shadow: $shadow-md;
  }
}

@keyframes flyArc {
  0% {
    transform: translate(var(--sx, 0), var(--sy, 0)) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(var(--px, 0), var(--py, 0)) scale(0.6);
    opacity: 1;
  }
  100% {
    transform: translate(var(--ex, 0), var(--ey, 0)) scale(0.2);
    opacity: 0;
  }
}
</style>
