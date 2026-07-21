<template>
  <view class="page-record page-enter">
    <!-- 顶部 header：标题 + 副标题（fixed 固定，滚动时常驻顶部） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <text class="title">点单记录</text>
      <text class="subtitle">看看大家的点单吧</text>
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
            class="order-card animate-fade-in"
            :class="{ 'is-flashing': flashMap[order._id] }"
            :style="{ animationDelay: cardDelay(gIdx, oIdx) }"
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

            <!-- 中部：菜品摘要 + 点单人/时间 -->
            <view class="card-body">
              <text class="card-summary">{{ buildSummary(order.items) }}</text>
              <view class="card-meta">
                <text class="meta-user">{{ order.userName || '神秘食客' }}</text>
                <text class="meta-dot">·</text>
                <text class="meta-time">{{ formatTime(order.createTime) }}</text>
              </view>
            </view>

            <!-- 右侧：状态徽章（垂直居中） + 管理员操作按钮 -->
            <view class="card-right">
              <status-badge :status="order.status" />
              <!-- 管理员操作区：仅 admin 可见，按状态切换按钮 -->
              <view v-if="userStore.isAdmin" class="meta-actions">
                <!-- pending：可取消 + 开始制作 -->
                <template v-if="order.status === 'pending'">
                  <view class="action-btn btn-cancel" @tap.stop="onCancel(order)">取消</view>
                  <view class="action-btn btn-prep" @tap.stop="onAdvance(order, 'preparing')">开始制作</view>
                </template>
                <!-- preparing：完成 -->
                <template v-else-if="order.status === 'preparing'">
                  <view class="action-btn btn-done" @tap.stop="onAdvance(order, 'completed')">完成</view>
                </template>
                <!-- completed / cancelled：终态，无操作 -->
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
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${order._id}`
  })
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

/* === 管理员：推进订单状态（pending → preparing → completed） === */
const onAdvance = async (order, target) => {
  const oldStatus = order.status
  // 1. 乐观更新：状态徽章颜色丝滑过渡
  order.status = target
  triggerFlash(order._id)
  try {
    const res = await uniCloud.callFunction({
      name: 'orders-crud',
      data: {
        action: 'updateStatus',
        _id: order._id,
        status: target,
        token: userStore.token
      }
    })
    if (res.result.code !== 0) {
      // 2. 失败回滚
      order.status = oldStatus
      uni.showToast({ title: res.result.message || '操作失败', icon: 'none' })
      return
    }
    uni.showToast({
      title: target === 'preparing' ? '已开始制作' : '已完成',
      icon: 'success'
    })
  } catch (e) {
    console.error('[record] onAdvance error', e)
    order.status = oldStatus
    uni.showToast({ title: '操作失败', icon: 'none' })
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

/* === 订单卡片 === */
.order-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: box-shadow $dur-base $ease-smooth, transform $dur-fast $ease-bounce;

  &:active {
    transform: scale(0.98);
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

      .meta-user {
        font-size: $font-size-xs;
        color: $color-coffee-500;
        font-weight: $font-weight-medium;
        @include ellipsis(1);
      }

      .meta-dot {
        font-size: $font-size-xs;
        color: $color-text-disabled;
      }

      .meta-time {
        font-size: $font-size-xs;
        color: $color-text-disabled;
      }
    }
  }

  /* 右侧：状态徽章 + 操作按钮（垂直居中） */
  .card-right {
    flex-shrink: 0;
    @include flex-column;
    align-items: flex-end;
    justify-content: center;
    gap: 12rpx;

    .meta-actions {
      display: flex;
      align-items: center;
      gap: 12rpx;
    }
  }
}

/* === 操作按钮 === */
.action-btn {
  padding: 10rpx 24rpx;
  border-radius: $radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  transition: transform $dur-fast $ease-smooth, opacity $dur-fast $ease-smooth;

  &:active {
    transform: scale(0.92);
    opacity: 0.85;
  }

  /* 取消：灰色轻量按钮，不喧宾夺主 */
  &.btn-cancel {
    background-color: $color-neutral-100;
    color: $color-text-muted;
  }

  /* 开始制作：暖橙渐变 */
  &.btn-prep {
    background: linear-gradient(135deg, #FFA726, #FB8C00);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(251, 140, 0, 0.28);
  }

  /* 完成：绿色渐变 */
  &.btn-done {
    background: linear-gradient(135deg, #22C55E, #16A34A);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(22, 163, 74, 0.28);
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
