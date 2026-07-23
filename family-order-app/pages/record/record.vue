<template>
  <view class="page-record page-enter" @tap="onPageTap">
    <!-- 顶部 header：标题 + 副标题（fixed 固定，滚动时常驻顶部） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 40 + 'px' }">
      <text class="title">点单记录</text>
      <text class="subtitle">查看我的点单历史</text>
    </view>
    <!-- header 固定后的占位 view -->
    <view class="header-spacer" :style="{ height: headerHeight + 'px' }"></view>

    <!-- 加载状态：骨架屏占位（首次加载时展示） -->
    <view v-if="loading && orders.length === 0" class="skeleton-wrap-record">
      <skeleton type="card" :count="4" />
    </view>

    <!-- 空状态 -->
    <fo-empty v-else-if="orders.length === 0" text="还没有点单记录哦~" icon="☕" />

    <!-- 按日期分组列表 -->
    <view v-else class="group-list">
      <view
        v-for="(group, gIdx) in groupedOrders"
        :key="group.key"
        class="group animate-slide-up"
        :style="{ animationDelay: groupDelay(gIdx) }"
      >
        <!-- 日期标题 -->
        <view class="group-header">
          <text class="group-date">{{ group.label }}</text>
          <text class="group-count">{{ group.orders.length }} 单</text>
        </view>

        <!-- 该日期下的订单卡片 -->
        <view class="order-list">
          <view
            v-for="(order, oIdx) in group.orders"
            :key="order._id"
            class="swipe-item animate-fade-in"
            :style="{ animationDelay: cardDelay(gIdx, oIdx) }"
          >
            <!-- 滑动露出的操作区 -->
            <view class="swipe-actions" @tap.stop>
              <view
                v-if="order.status === 'pending'"
                class="swipe-btn swipe-cancel"
                @tap.stop="onSwipeCancel(order)"
              >取消</view>
              <view
                class="swipe-btn swipe-delete"
                @tap.stop="onSwipeDelete(order)"
              >删除</view>
            </view>
            <!-- 卡片主体：可滑动 -->
            <view
              class="order-card"
              :class="{ 'is-flashing': flashMap[order._id], 'swipe-animating': swipeAnimating[order._id] }"
              :style="{ transform: `translateX(${swipeOffset[order._id] || 0}px)` }"
              @touchstart="onTouchStart($event, order._id)"
              @touchmove="onTouchMove($event, order._id)"
              @touchend="onTouchEnd($event, order._id)"
              @tap="onCardTap(order)"
            >
              <!-- 左侧：首道菜图片（或 emoji 占位） -->
              <view class="card-thumb">
                <image
                  v-if="firstItemImage(order)"
                  class="thumb-img"
                  :src="firstItemImage(order)"
                  mode="aspectFill"
                />
                <view v-else class="thumb-placeholder">{{ firstItemEmoji(order) }}</view>
                <!-- 多菜品角标 -->
                <view v-if="order.items.length > 1" class="thumb-badge">
                  +{{ order.items.length - 1 }}
                </view>
              </view>

              <!-- 中部：菜品摘要 + 时间 -->
              <view class="card-body">
                <text class="card-summary">{{ buildSummary(order.items) }}</text>
                <view class="card-meta">
                  <text class="meta-time">{{ formatTime(order.createTime) }}</text>
                </view>
              </view>

              <!-- 右侧：仅状态徽章 -->
              <view class="card-right">
                <status-badge :status="order.status" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 / 全部加载完 -->
      <view v-if="loadingMore" class="load-more">加载中...</view>
      <view v-else-if="!hasMore && orders.length > 0" class="load-more">没有更多了~</view>
    </view>

    <!-- 自定义 tabBar -->
    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useHeaderFixed } from '@/composables/useHeaderFixed.js'

const { statusBarHeight } = useSafeArea()
const { headerHeight } = useHeaderFixed('.header')

const userStore = useUserStore()

/* === 订单列表与分页状态 === */
const orders = ref([]) // 当前已加载订单（按 createTime 倒序）
const loading = ref(false) // 首次/下拉刷新加载中
const loadingMore = ref(false) // 加载更多中
const page = ref(1)
const pageSize = 20
const total = ref(0)
const hasMore = computed(() => orders.value.length < total.value)

/* === 卡片状态变化时的闪光动效（按订单 _id 索引） === */
const flashMap = reactive({})
const triggerFlash = (id) => {
  flashMap[id] = true
  setTimeout(() => {
    flashMap[id] = false
  }, 600)
}

/* === 左滑显示取消/删除按钮（仅管理员） === */
// 右侧操作区：取消 160rpx + 删除 160rpx，按屏幕宽度换算成 px
const SWIPE_ACTION_WIDTH_FULL = Math.round((320 / 750) * uni.getSystemInfoSync().windowWidth)
const SWIPE_ACTION_WIDTH_DELETE_ONLY = Math.round((160 / 750) * uni.getSystemInfoSync().windowWidth)
const swipeOffset = reactive({})     // 各卡片当前 x 偏移
const swipeAnimating = reactive({})  // 各卡片是否处于动画态（吸附/回弹时启用 transition）
const touchStartX = reactive({})     // 触摸起点
const touchStartOffset = reactive({})// 触摸时已有偏移
const touchMoved = reactive({})      // 是否发生水平移动（用于区分点击）
const activeSwipeId = ref('')        // 当前展开的卡片 _id

// 根据订单状态决定可滑出的最大宽度（已取消只有删除按钮）
const getSwipeWidth = (order) => {
  if (order.status === 'pending') return SWIPE_ACTION_WIDTH_FULL
  return SWIPE_ACTION_WIDTH_DELETE_ONLY
}

const onTouchStart = (e, id) => {
  const touch = e.touches[0]
  touchStartX[id] = touch.clientX
  touchStartOffset[id] = swipeOffset[id] || 0
  touchMoved[id] = false
  swipeAnimating[id] = false
  // 点击新卡片时，收起其他展开的卡片
  if (activeSwipeId.value && activeSwipeId.value !== id) {
    swipeAnimating[activeSwipeId.value] = true
    swipeOffset[activeSwipeId.value] = 0
    activeSwipeId.value = ''
  }
}

const onTouchMove = (e, id) => {
  const touch = e.touches[0]
  const dx = touch.clientX - touchStartX[id]
  if (Math.abs(dx) > 5) touchMoved[id] = true
  let next = touchStartOffset[id] + dx
  // 限制范围：[-SWIPE_ACTION_WIDTH_FULL, 0]，向右不超过 0
  if (next > 0) next = 0
  if (next < -SWIPE_ACTION_WIDTH_FULL) next = -SWIPE_ACTION_WIDTH_FULL
  swipeOffset[id] = next
}

const onTouchEnd = (e, id) => {
  // 读取绑定的 order 状态来决定吸附宽度
  const order = orders.value.find((o) => o._id === id)
  const maxW = order ? getSwipeWidth(order) : SWIPE_ACTION_WIDTH_FULL
  const offset = swipeOffset[id] || 0
  swipeAnimating[id] = true
  if (offset < -maxW / 2) {
    swipeOffset[id] = -maxW
    activeSwipeId.value = id
  } else {
    swipeOffset[id] = 0
    if (activeSwipeId.value === id) activeSwipeId.value = ''
  }
  // 动画结束后关闭 transition 标志，避免拖拽时不跟手
  setTimeout(() => {
    swipeAnimating[id] = false
  }, 300)
  // touchMoved 延迟清零，确保 tap 事件能正确判断是否发生过滑动
  setTimeout(() => {
    touchMoved[id] = false
  }, 0)
}

/* === 入场动效延迟（封顶 500ms，避免长列表等待过久） === */
const groupDelay = (gIdx) => `${Math.min(gIdx * 60, 300)}ms`
const cardDelay = (gIdx, oIdx) => `${Math.min(gIdx * 60 + oIdx * 40 + 80, 500)}ms`

/* === 日期分组（按 Asia/Shanghai +8 时区） === */
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 将时间戳按 +8 时区拆解为年月日时分
const toShanghaiParts = (ts) => {
  // 把 +8 时区的本地时间"伪装"成 UTC，再用 getUTC* 读取
  const d = new Date(ts + 8 * 3600 * 1000)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-11
    date: d.getUTCDate(),
    day: d.getUTCDay(), // 0=周日
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes()
  }
}

// 取 +8 时区下的日期 key（YYYY-MM-DD），用于分组与"今天/昨天"对比
const dayKey = (ts) => {
  const p = toShanghaiParts(ts)
  return `${p.year}-${p.month + 1}-${p.date}`
}

// 格式化日期标签：今天 / 昨天 / 前天 / 2025年1月15日 周三
const formatDateLabel = (ts) => {
  const todayKey = dayKey(Date.now())
  const yesterdayKey = dayKey(Date.now() - 24 * 3600 * 1000)
  const beforeYesterdayKey = dayKey(Date.now() - 2 * 24 * 3600 * 1000)
  const key = dayKey(ts)
  if (key === todayKey) return '今天'
  if (key === yesterdayKey) return '昨天'
  if (key === beforeYesterdayKey) return '前天'
  const p = toShanghaiParts(ts)
  return `${p.year}年${p.month + 1}月${p.date}日 ${WEEKDAYS[p.day]}`
}

// 分组订单：按日期 key 聚合，列表已倒序故分组自然按日期倒序
const groupedOrders = computed(() => {
  const groups = []
  const map = new Map()
  for (const order of orders.value) {
    if (!order.createTime) continue
    const key = dayKey(order.createTime)
    if (!map.has(key)) {
      const g = { key, label: formatDateLabel(order.createTime), orders: [] }
      map.set(key, g)
      groups.push(g)
    }
    map.get(key).orders.push(order)
  }
  return groups
})

// 菜品摘要："焦糖拿铁 x1, 冰美式 x1"
const buildSummary = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '订单详情'
  return items.map((it) => `${it.name} x${it.quantity}`).join(', ')
}

// 首道菜图片
const firstItemImage = (order) => order?.items?.[0]?.image || ''

// 首道菜 emoji 占位
const firstItemEmoji = (order) => {
  const name = order?.items?.[0]?.name || ''
  if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name)) return '☕'
  if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name)) return '🥐'
  if (/面|粉|粥|拉面|乌冬|noodle/i.test(name)) return '🍜'
  if (/饭|炒饭|盖饭|咖喱|便当/i.test(name)) return '🍚'
  if (/沙律|沙拉|salad/i.test(name)) return '🥗'
  if (/汤|羹/i.test(name)) return '🍲'
  return '🍽️'
}

// 点击订单卡片：跳转订单详情页
const onCardTap = (order) => {
  // 若发生过滑动，不触发点击
  if (touchMoved[order._id]) return
  // 若当前卡片展开，先收起不跳转
  if (swipeOffset[order._id] < 0) {
    swipeAnimating[order._id] = true
    swipeOffset[order._id] = 0
    activeSwipeId.value = ''
    setTimeout(() => { swipeAnimating[order._id] = false }, 300)
    return
  }
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${order._id}`
  })
}

// 滑动取消：调用原有 onCancel，完成后收起
const onSwipeCancel = (order) => {
  swipeAnimating[order._id] = true
  swipeOffset[order._id] = 0
  activeSwipeId.value = ''
  setTimeout(() => { swipeAnimating[order._id] = false }, 300)
  onCancel(order)
}

// 删除：直接调用 onDelete（弹出确认框，确认后从列表移除）
const onSwipeDelete = (order) => {
  onDelete(order)
}

// 点击页面空白区域：收起当前展开的卡片
const onPageTap = () => {
  if (activeSwipeId.value) {
    swipeAnimating[activeSwipeId.value] = true
    swipeOffset[activeSwipeId.value] = 0
    const id = activeSwipeId.value
    activeSwipeId.value = ''
    setTimeout(() => { swipeAnimating[id] = false }, 300)
  }
}

// 提交时间格式化：HH:mm（+8 时区）
const formatTime = (ts) => {
  if (!ts) return ''
  const p = toShanghaiParts(ts)
  return `${String(p.hours).padStart(2, '0')}:${String(p.minutes).padStart(2, '0')}`
}

/* === 加载订单列表 === */
// reset=true 重置为第一页（首次/下拉刷新）；reset=false 加载下一页
const loadOrders = async (reset = true) => {
  // token 未就绪时跳过（App.vue bootstrap 异步恢复登录态）
  if (!userStore.token) return
  if (reset) {
    if (loading.value) return
    loading.value = true
    page.value = 1
  } else {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    page.value += 1
  }
  try {
    const res = await uniCloud.callFunction({
      name: 'orders-crud',
      data: {
        action: 'list',
        page: page.value,
        pageSize,
        scope: 'mine',
        token: userStore.token
      }
    })
    if (res.result.code === 0) {
      const list = res.result.list || []
      total.value = res.result.total || 0
      if (reset) {
        orders.value = list
      } else {
        orders.value = orders.value.concat(list)
      }
    } else if (res.result.code === 401) {
      // 登录态未就绪或失效：静默不提示
      console.warn('[record] orders-crud 401', res.result.message)
    } else {
      uni.showToast({ title: res.result.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[record] loadOrders error', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

/* === 管理员：取消订单（仅 pending 可取消，二次确认） === */
const onCancel = (order) => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消这个订单吗？',
    confirmColor: '#EF4444',
    success: async (r) => {
      if (!r.confirm) return
      const oldStatus = order.status
      // 乐观更新
      order.status = 'cancelled'
      triggerFlash(order._id)
      try {
        const res = await uniCloud.callFunction({
          name: 'orders-crud',
          data: {
            action: 'cancel',
            _id: order._id,
            token: userStore.token
          }
        })
        if (res.result.code !== 0) {
          order.status = oldStatus
          uni.showToast({ title: res.result.message || '取消失败', icon: 'none' })
          return
        }
        uni.showToast({ title: '已取消', icon: 'success' })
      } catch (e) {
        console.error('[record] onCancel error', e)
        order.status = oldStatus
        uni.showToast({ title: '取消失败', icon: 'none' })
      }
    }
  })
}

/* === 管理员：删除订单记录（任意状态，二次确认，物理删除） === */
const onDelete = (order) => {
  uni.showModal({
    title: '删除订单',
    content: '确定要删除这条订单记录吗？删除后不可恢复。',
    confirmText: '删除',
    confirmColor: '#EF4444',
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await uniCloud.callFunction({
          name: 'orders-crud',
          data: {
            action: 'delete',
            _id: order._id,
            token: userStore.token
          }
        })
        if (res.result.code !== 0) {
          uni.showToast({ title: res.result.message || '删除失败', icon: 'none' })
          return
        }
        // 从本地列表移除
        orders.value = orders.value.filter((o) => o._id !== order._id)
        total.value = Math.max(0, total.value - 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        console.error('[record] onDelete error', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

/* === 生命周期 === */
// onShow：每次进入页面都刷新（下单后切回记录页能看到新订单）
onShow(() => {
  loadOrders(true)
})

// 下拉刷新
onPullDownRefresh(async () => {
  await loadOrders(true)
  uni.stopPullDownRefresh()
})

// 滚动到底部加载更多
onReachBottom(() => {
  loadOrders(false)
})
</script>

<style lang="scss" scoped>
.page-record {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
  background-color: $color-bg;
}

/* === 顶部 header（fixed 固定，滚动时常驻顶部） === */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 56rpx 40rpx 24rpx;
  background-color: $color-bg;

  .title {
    display: block;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-coffee-700;
    line-height: $line-height-tight;
  }

  .subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

/* === 加载状态 === */
.skeleton-wrap-record {
  padding: 0 32rpx;
}

.loading-state {
  @include flex-center;
  gap: 8rpx;
  padding: 120rpx 0;

  .loading-dot {
    font-size: $font-size-2xl;
    color: $color-coffee-400;
    animation: dotBlink 1.2s $ease-smooth infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* === 分组列表 === */
.group-list {
  padding: 0 32rpx;

  .group {
    margin-bottom: 32rpx;

    .group-header {
      @include flex-between;
      padding: 0 8rpx;
      margin-bottom: 16rpx;

      .group-date {
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        color: $color-coffee-500;
      }

      .group-count {
        font-size: $font-size-xs;
        color: $color-text-disabled;
      }
    }

    .order-list {
      @include flex-column;
      gap: 16rpx;
    }
  }
}

/* === 滑动卡片容器 === */
.swipe-item {
  position: relative;
  overflow: hidden;
  border-radius: $radius-xl;
}

/* 右侧滑动操作区：圆角块状按钮 */
.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 16rpx;
  padding: 16rpx 16rpx 16rpx 0;
  z-index: 1;

  .swipe-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 144rpx;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: #fff;
    border-radius: $radius-xl;
    box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.12);

    &:active {
      opacity: 0.92;
      transform: scale(0.96);
    }
  }

  .swipe-cancel {
    background: linear-gradient(135deg, #9CA3AF, #6B7280);
  }

  .swipe-delete {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }
}

/* === 订单卡片 === */
.order-card {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: box-shadow $dur-base $ease-smooth;

  /* 吸附/回弹时的丝滑过渡 */
  &.swipe-animating {
    transition: transform 0.3s $ease-smooth;
  }

  /* 状态变化时整体闪光，强化动效反馈 */
  &.is-flashing {
    box-shadow: 0 0 0 4rpx rgba(255, 167, 38, 0.22), $shadow-md;
  }

  /* 左侧缩略图 */
  .card-thumb {
    position: relative;
    flex-shrink: 0;
    width: 112rpx;
    height: 112rpx;
    border-radius: $radius-lg;
    overflow: hidden;
    background-color: $color-bg-soft;

    .thumb-img {
      width: 100%;
      height: 100%;
    }

    .thumb-placeholder {
      width: 100%;
      height: 100%;
      @include flex-center;
      font-size: 56rpx;
    }

    /* 多菜品角标 */
    .thumb-badge {
      position: absolute;
      right: 0;
      bottom: 0;
      padding: 2rpx 10rpx;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: #fff;
      background-color: rgba(0, 0, 0, 0.55);
      border-top-left-radius: $radius-sm;
      line-height: 1.4;
    }
  }

  /* 中部内容 */
  .card-body {
    flex: 1;
    min-width: 0;
    @include flex-column;
    gap: 8rpx;

    .card-summary {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-text-strong;
      line-height: $line-height-tight;
      @include ellipsis(2);
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .meta-time {
        font-size: $font-size-xs;
        color: $color-text-disabled;
      }
    }
  }

  /* 右侧：状态徽章（垂直居中） */
  .card-right {
    flex-shrink: 0;
    @include flex-column;
    align-items: flex-end;
    justify-content: center;
  }
}

/* === 加载更多 / 全部加载完 === */
.load-more {
  @include flex-center;
  padding: 24rpx 0;
  font-size: $font-size-xs;
  color: $color-text-disabled;
}
</style>
