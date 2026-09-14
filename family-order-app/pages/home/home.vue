<template>
  <view class="page-home page-enter">
    <view class="paper-dot dot-a"></view>
    <view class="paper-dot dot-b"></view>
    <view class="paper-dot dot-c"></view>

    <view class="home-header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <view class="family-chip">
        <view class="house-mark">
          <view class="house-roof"></view>
          <view class="house-body"></view>
        </view>
        <text>{{ familyName }}</text>
      </view>

      <view class="greeting-row">
        <view>
          <text class="greeting">{{ greeting }}</text>
          <text class="greeting-sub">{{ greetingSub }}</text>
        </view>
        <view class="sun-doodle">
          <view class="sun-face">
            <view class="sun-eye eye-left"></view>
            <view class="sun-eye eye-right"></view>
            <view class="sun-smile"></view>
          </view>
          <view class="sun-ray ray-a"></view>
          <view class="sun-ray ray-b"></view>
          <view class="sun-ray ray-c"></view>
        </view>
      </view>

      <view class="header-scribble"></view>
    </view>

    <view class="entry-section">
      <view class="entry-card entry-food" @tap="goOrder('food')">
        <view class="entry-copy">
          <view class="entry-kicker">
            <view class="kicker-dot"></view>
            <text>今天吃什么</text>
          </view>
          <text class="entry-title">干饭</text>
          <text class="entry-desc">挑一道家里会做的菜</text>
          <view class="entry-link">
            <text>去点菜</text>
            <Icon name="chevron-right" :size="15" :stroke-width="2.4" />
          </view>
        </view>

        <view class="entry-art food-art">
          <view class="food-steam steam-a"></view>
          <view class="food-steam steam-b"></view>
          <view class="food-bowl-top">
            <view class="food-dot food-dot-a"></view>
            <view class="food-dot food-dot-b"></view>
            <view class="food-leaf"></view>
          </view>
          <view class="food-bowl">
            <view class="face-eye face-eye-left"></view>
            <view class="face-eye face-eye-right"></view>
            <view class="face-smile"></view>
          </view>
          <view class="art-spark spark-a">✦</view>
          <view class="art-spark spark-b">·</view>
        </view>
      </view>

      <view class="entry-card entry-coffee" @tap="goOrder('coffee')">
        <view class="entry-copy">
          <view class="entry-kicker coffee-kicker">
            <view class="kicker-dot"></view>
            <text>来点小幸福</text>
          </view>
          <text class="entry-title">咖啡</text>
          <text class="entry-desc">给今天加一点香气</text>
          <view class="entry-link">
            <text>去点咖啡</text>
            <Icon name="chevron-right" :size="15" :stroke-width="2.4" />
          </view>
        </view>

        <view class="entry-art coffee-art">
          <view class="coffee-steam steam-a"></view>
          <view class="coffee-steam steam-b"></view>
          <view class="coffee-cup">
            <view class="coffee-mouth"></view>
            <view class="coffee-eye eye-left"></view>
            <view class="coffee-eye eye-right"></view>
            <view class="coffee-smile"></view>
          </view>
          <view class="coffee-handle"></view>
          <view class="coffee-saucer"></view>
          <view class="art-spark spark-a">✦</view>
          <view class="art-spark spark-b">·</view>
        </view>
      </view>
    </view>

    <view class="recent-section">
      <view class="section-head">
        <view class="section-title-wrap">
          <text class="section-title">最近点单</text>
          <view class="title-scribble"></view>
        </view>
        <view class="section-action" @tap="goMy">
          <text>全部记录</text>
          <Icon name="chevron-right" :size="14" :stroke-width="2.3" />
        </view>
      </view>

      <view v-if="loading && orders.length === 0" class="loading-list">
        <view v-for="n in 2" :key="n" class="loading-card">
          <view class="loading-thumb shimmer-line"></view>
          <view class="loading-copy">
            <view class="loading-line line-long shimmer-line"></view>
            <view class="loading-line line-short shimmer-line"></view>
          </view>
        </view>
      </view>

      <view v-else-if="displayOrders.length === 0" class="empty-card">
        <view class="empty-art">
          <view class="empty-plate">
            <view class="empty-eye eye-left"></view>
            <view class="empty-eye eye-right"></view>
            <view class="empty-mouth"></view>
          </view>
          <view class="empty-spoon"></view>
          <view class="empty-spark">✦</view>
        </view>
        <view class="empty-copy">
          <text class="empty-title">还没有最近点单</text>
          <text class="empty-desc">从上面的入口挑点喜欢的吧</text>
        </view>
      </view>

      <view v-else class="recent-list">
        <view
          v-for="(order, index) in displayOrders"
          :key="order._id"
          class="recent-card"
          :style="{ animationDelay: `${index * 70}ms` }"
          @tap="goOrderDetail(order)"
        >
          <view class="recent-icon" :class="orderKind(order)">
            <text>{{ orderEmoji(order) }}</text>
          </view>
          <view class="recent-main">
            <text class="recent-summary">{{ orderSummary(order) }}</text>
            <view class="recent-meta">
              <text>{{ order.userName || '家庭成员' }}</text>
              <view class="meta-dot"></view>
              <text>{{ formatOrderTime(order.createTime) }}</text>
            </view>
          </view>
          <view class="recent-side">
            <view class="status-pill" :class="`status-${order.status || 'pending'}`">
              {{ statusLabel(order.status) }}
            </view>
            <Icon name="chevron-right" :size="14" :stroke-width="2.4" />
          </view>
        </view>
      </view>
    </view>

    <view class="page-bottom-space"></view>
    <custom-tabbar />
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/store/cart.js'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()
const cartStore = useCartStore()

const orders = ref([])
const loading = ref(false)

const familyName = computed(() => userStore.userInfo?.familyName || '我的家庭')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return '早安，开饭啦'
  if (hour >= 11 && hour < 14) return '午饭时间到'
  if (hour >= 14 && hour < 18) return '下午好呀'
  if (hour >= 18 && hour < 22) return '晚饭吃什么'
  return '夜宵也可以'
})

const greetingSub = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return '新的一天，从喜欢的味道开始'
  if (hour >= 11 && hour < 14) return '看看家里今天能做点什么'
  if (hour >= 14 && hour < 18) return '想喝咖啡，还是提前点个菜？'
  if (hour >= 18 && hour < 22) return '家里的饭，总有一点不一样'
  return '小声点单，别把做饭人吵醒啦'
})

const displayOrders = computed(() => orders.value.slice(0, 3))

const loadOrders = async () => {
  if (loading.value || !userStore.token) return
  loading.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'home-data',
        token: userStore.token,
        role: userStore.role
      }
    })
    if (res.result?.code === 0) orders.value = res.result.list || []
  } catch (e) {
    console.warn('[home] recent orders unavailable during phase2 shell preview', e)
  } finally {
    loading.value = false
  }
}

const goOrder = (type) => {
  cartStore.setPendingType(type)
  uni.switchTab({ url: '/pages/order/order' })
}

const goMy = () => {
  uni.switchTab({ url: '/pages/my/my' })
}

const goOrderDetail = (order) => {
  if (!order?._id) return
  uni.navigateTo({ url: `/pages/order-detail/order-detail?id=${order._id}` })
}

const orderItems = (order) => (Array.isArray(order?.items) ? order.items : [])

const orderSummary = (order) => {
  if (order?.summary) return order.summary
  const items = orderItems(order)
  if (!items.length) return '一份家庭点单'
  return items.map((item) => `${item.name} ×${item.quantity || 1}`).join('、')
}

const orderKind = (order) => {
  const type = order?.orderType || orderItems(order)[0]?.type
  return type === 'coffee' ? 'kind-coffee' : 'kind-food'
}

const orderEmoji = (order) => (orderKind(order) === 'kind-coffee' ? '☕' : '🍚')

const formatOrderTime = (timestamp) => {
  if (!timestamp) return '刚刚'
  const date = new Date(timestamp)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  if (sameDay) return `今天 ${hour}:${minute}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const statusLabel = (status) => ({
  pending: '等开饭',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消'
}[status] || '等开饭')

watch(
  () => userStore.token,
  (token) => {
    if (token && !orders.value.length) loadOrders()
  }
)

onShow(loadOrders)

onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})
</script>

<style lang="scss" scoped>
.page-home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 9% 15%, rgba(242, 198, 93, 0.12) 0 3rpx, transparent 4rpx),
    radial-gradient(circle at 86% 34%, rgba(133, 169, 111, 0.11) 0 2rpx, transparent 3rpx),
    $p2-paper;
  color: $p2-ink;
}

.paper-dot {
  position: absolute;
  z-index: 0;
  border: 3rpx solid rgba(98, 71, 53, 0.12);
  border-radius: 48% 52% 46% 54%;
  pointer-events: none;
}

.dot-a {
  top: 216rpx;
  left: -26rpx;
  width: 82rpx;
  height: 38rpx;
  transform: rotate(18deg);
}

.dot-b {
  top: 580rpx;
  right: -32rpx;
  width: 104rpx;
  height: 48rpx;
  transform: rotate(-22deg);
}

.dot-c {
  bottom: 240rpx;
  left: 42rpx;
  width: 28rpx;
  height: 28rpx;
  border-color: rgba(233, 122, 105, 0.18);
}

.home-header,
.entry-section,
.recent-section {
  position: relative;
  z-index: 1;
}

.home-header {
  padding: 38rpx 34rpx 22rpx;
}

.family-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 9rpx 16rpx 8rpx 12rpx;
  background: rgba(255, 254, 249, 0.82);
  border: 2rpx solid rgba(118, 85, 64, 0.45);
  border-radius: 16rpx 20rpx 17rpx 22rpx;
  box-shadow: 3rpx 4rpx 0 rgba(98, 71, 53, 0.08);
  color: $p2-ink-soft;
  font-size: 22rpx;
  font-weight: 600;
  transform: rotate(-1deg);
}

.house-mark {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.house-roof {
  position: absolute;
  top: 2rpx;
  left: 4rpx;
  width: 18rpx;
  height: 18rpx;
  border-left: 3rpx solid $p2-coral;
  border-top: 3rpx solid $p2-coral;
  transform: rotate(45deg);
  border-radius: 3rpx;
}

.house-body {
  position: absolute;
  left: 6rpx;
  bottom: 1rpx;
  width: 18rpx;
  height: 16rpx;
  border: 3rpx solid $p2-coral;
  border-top: 0;
  border-radius: 2rpx 2rpx 5rpx 5rpx;
}

.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 24rpx;
}

.greeting {
  display: block;
  font-size: 52rpx;
  line-height: 1.18;
  font-weight: 800;
  letter-spacing: 1rpx;
  color: $p2-ink;
}

.greeting-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $p2-ink-soft;
}

.sun-doodle {
  position: relative;
  flex: 0 0 auto;
  width: 100rpx;
  height: 100rpx;
  transform: rotate(5deg);
  animation: sunFloat 4s ease-in-out infinite;
}

.sun-face {
  position: absolute;
  top: 19rpx;
  left: 18rpx;
  width: 62rpx;
  height: 59rpx;
  background: $p2-butter;
  border: 3rpx solid $p2-line;
  border-radius: 48% 54% 46% 52%;
  box-shadow: 3rpx 4rpx 0 rgba(98, 71, 53, 0.1);
}

.sun-eye {
  position: absolute;
  top: 23rpx;
  width: 5rpx;
  height: 7rpx;
  background: $p2-ink;
  border-radius: 50%;
}

.sun-eye.eye-left { left: 17rpx; }
.sun-eye.eye-right { right: 17rpx; }

.sun-smile {
  position: absolute;
  left: 23rpx;
  bottom: 13rpx;
  width: 15rpx;
  height: 8rpx;
  border-bottom: 3rpx solid $p2-ink;
  border-radius: 50%;
}

.sun-ray {
  position: absolute;
  width: 18rpx;
  height: 4rpx;
  background: $p2-coral;
  border-radius: 999rpx;
}

.ray-a { top: 7rpx; left: 42rpx; transform: rotate(78deg); }
.ray-b { top: 50rpx; right: 1rpx; transform: rotate(6deg); }
.ray-c { bottom: 5rpx; left: 7rpx; transform: rotate(-43deg); }

.header-scribble {
  width: 130rpx;
  height: 10rpx;
  margin-top: 20rpx;
  border-top: 4rpx solid $p2-coral;
  border-radius: 50%;
  transform: rotate(-2deg);
  opacity: 0.78;
}

.entry-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  padding: 8rpx 28rpx 18rpx;
}

.entry-card {
  position: relative;
  min-height: 330rpx;
  overflow: hidden;
  padding: 26rpx 22rpx 22rpx;
  border: 3rpx solid $p2-line;
  box-shadow: $p2-shadow-md;
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;

  &:active {
    transform: translate(3rpx, 4rpx) rotate(0deg) scale(0.98);
    box-shadow: 2rpx 3rpx 0 rgba(98, 71, 53, 0.12);
  }
}

.entry-food {
  background: #fbe0d4;
  border-radius: 30rpx 38rpx 29rpx 42rpx;
  transform: rotate(-0.8deg);
}

.entry-coffee {
  background: #e1eef0;
  border-radius: 40rpx 30rpx 42rpx 28rpx;
  transform: rotate(0.7deg);
}

.entry-copy {
  position: relative;
  z-index: 2;
}

.entry-kicker {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #9c5f54;
  font-size: 20rpx;
  font-weight: 600;
}

.entry-kicker .kicker-dot {
  width: 9rpx;
  height: 9rpx;
  border-radius: 43% 57% 48% 52%;
  background: $p2-coral;
}

.coffee-kicker {
  color: #567c84;

  .kicker-dot { background: $p2-sky; }
}

.entry-title {
  display: block;
  margin-top: 8rpx;
  font-size: 46rpx;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 3rpx;
}

.entry-desc {
  display: block;
  margin-top: 8rpx;
  max-width: 190rpx;
  color: $p2-ink-soft;
  font-size: 21rpx;
  line-height: 1.5;
}

.entry-link {
  display: inline-flex;
  align-items: center;
  gap: 2rpx;
  margin-top: 18rpx;
  padding: 9rpx 12rpx 8rpx 14rpx;
  color: $p2-ink;
  font-size: 21rpx;
  font-weight: 700;
  background: rgba(255, 254, 249, 0.62);
  border: 2rpx solid rgba(98, 71, 53, 0.28);
  border-radius: 14rpx 18rpx 15rpx 20rpx;
}

.entry-art {
  position: absolute;
  right: 13rpx;
  bottom: 11rpx;
  width: 145rpx;
  height: 145rpx;
  z-index: 1;
}

.food-bowl-top {
  position: absolute;
  left: 23rpx;
  top: 41rpx;
  width: 100rpx;
  height: 42rpx;
  background: #fffdf4;
  border: 3rpx solid $p2-line;
  border-radius: 50%;
  transform: rotate(-2deg);
}

.food-bowl {
  position: absolute;
  left: 27rpx;
  top: 62rpx;
  width: 93rpx;
  height: 60rpx;
  background: #fff8e8;
  border: 3rpx solid $p2-line;
  border-top: 0;
  border-radius: 0 0 44rpx 48rpx;
  transform: rotate(-2deg);
}

.food-dot {
  position: absolute;
  border-radius: 50%;
}

.food-dot-a {
  left: 26rpx;
  top: 12rpx;
  width: 22rpx;
  height: 18rpx;
  background: $p2-coral;
}

.food-dot-b {
  right: 20rpx;
  top: 8rpx;
  width: 24rpx;
  height: 22rpx;
  background: $p2-butter;
}

.food-leaf {
  position: absolute;
  left: 46rpx;
  top: 2rpx;
  width: 18rpx;
  height: 29rpx;
  background: $p2-leaf;
  border-radius: 80% 20% 72% 28%;
  transform: rotate(38deg);
}

.food-steam,
.coffee-steam {
  position: absolute;
  width: 20rpx;
  height: 36rpx;
  border-left: 4rpx solid rgba(118, 85, 64, 0.55);
  border-radius: 50%;
}

.food-steam.steam-a { left: 55rpx; top: 5rpx; transform: rotate(8deg); }
.food-steam.steam-b { left: 86rpx; top: 10rpx; transform: rotate(-7deg); }

.face-eye,
.coffee-eye,
.empty-eye {
  position: absolute;
  width: 5rpx;
  height: 7rpx;
  background: $p2-ink;
  border-radius: 50%;
}

.food-bowl .face-eye-left { left: 25rpx; top: 19rpx; }
.food-bowl .face-eye-right { right: 25rpx; top: 19rpx; }

.face-smile,
.coffee-smile {
  position: absolute;
  border-bottom: 3rpx solid $p2-ink;
  border-radius: 50%;
}

.food-bowl .face-smile {
  left: 39rpx;
  top: 29rpx;
  width: 17rpx;
  height: 10rpx;
}

.art-spark {
  position: absolute;
  color: $p2-butter;
  font-size: 25rpx;
  font-weight: 700;
}

.food-art .spark-a { right: 2rpx; top: 21rpx; }
.food-art .spark-b { left: 7rpx; top: 58rpx; color: $p2-coral; font-size: 38rpx; }

.coffee-cup {
  position: absolute;
  left: 25rpx;
  top: 49rpx;
  width: 87rpx;
  height: 67rpx;
  background: #fff9ec;
  border: 3rpx solid $p2-line;
  border-radius: 13rpx 13rpx 31rpx 34rpx;
  transform: rotate(1deg);
}

.coffee-mouth {
  position: absolute;
  left: -3rpx;
  top: -8rpx;
  width: 88rpx;
  height: 20rpx;
  background: #9a6548;
  border: 3rpx solid $p2-line;
  border-radius: 50%;
}

.coffee-handle {
  position: absolute;
  left: 101rpx;
  top: 65rpx;
  width: 32rpx;
  height: 39rpx;
  border: 4rpx solid $p2-line;
  border-left: 0;
  border-radius: 0 22rpx 22rpx 0;
  transform: rotate(4deg);
}

.coffee-saucer {
  position: absolute;
  left: 18rpx;
  top: 113rpx;
  width: 108rpx;
  height: 17rpx;
  border-bottom: 4rpx solid $p2-line;
  border-radius: 50%;
  transform: rotate(-1deg);
}

.coffee-steam.steam-a { left: 57rpx; top: 4rpx; transform: rotate(9deg); }
.coffee-steam.steam-b { left: 83rpx; top: 10rpx; transform: rotate(-8deg); }
.coffee-cup .coffee-eye.eye-left { left: 24rpx; top: 31rpx; }
.coffee-cup .coffee-eye.eye-right { right: 24rpx; top: 31rpx; }
.coffee-cup .coffee-smile { left: 35rpx; top: 40rpx; width: 16rpx; height: 9rpx; }
.coffee-art .spark-a { right: 0; top: 15rpx; color: $p2-coral; }
.coffee-art .spark-b { left: 4rpx; top: 70rpx; color: $p2-sky; font-size: 36rpx; }

.recent-section {
  padding: 28rpx 28rpx 0;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}

.section-title-wrap {
  position: relative;
  padding-bottom: 7rpx;
}

.section-title {
  position: relative;
  z-index: 1;
  font-size: 34rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}

.title-scribble {
  position: absolute;
  left: -3rpx;
  right: -8rpx;
  bottom: 2rpx;
  height: 10rpx;
  background: rgba(242, 198, 93, 0.56);
  border-radius: 58% 42% 51% 49%;
  transform: rotate(-2deg);
}

.section-action {
  display: inline-flex;
  align-items: center;
  gap: 2rpx;
  padding: 8rpx 4rpx;
  color: $p2-ink-soft;
  font-size: 21rpx;
}

.loading-list,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.loading-card,
.recent-card,
.empty-card {
  background: rgba(255, 254, 249, 0.9);
  border: 3rpx solid rgba(118, 85, 64, 0.78);
  box-shadow: $p2-shadow-sm;
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 112rpx;
  padding: 18rpx;
  border-radius: 24rpx 29rpx 22rpx 30rpx;
}

.shimmer-line {
  background: linear-gradient(100deg, #f3ead8 25%, #fffaf0 42%, #f3ead8 58%);
  background-size: 200% 100%;
  animation: p2Shimmer 1.5s linear infinite;
}

.loading-thumb {
  width: 72rpx;
  height: 72rpx;
  border-radius: 23rpx 19rpx 25rpx 20rpx;
}

.loading-copy { flex: 1; }
.loading-line { height: 16rpx; border-radius: 999rpx; }
.line-long { width: 72%; }
.line-short { width: 42%; margin-top: 17rpx; }

.empty-card {
  display: flex;
  align-items: center;
  gap: 26rpx;
  min-height: 176rpx;
  padding: 26rpx 28rpx;
  border-radius: 29rpx 24rpx 34rpx 25rpx;
}

.empty-art {
  position: relative;
  flex: 0 0 auto;
  width: 126rpx;
  height: 112rpx;
}

.empty-plate {
  position: absolute;
  left: 11rpx;
  top: 25rpx;
  width: 86rpx;
  height: 58rpx;
  background: $p2-butter-soft;
  border: 3rpx solid $p2-line;
  border-radius: 50%;
  transform: rotate(-4deg);
}

.empty-plate::after {
  content: '';
  position: absolute;
  inset: 10rpx 12rpx;
  border: 2rpx dashed rgba(118, 85, 64, 0.45);
  border-radius: 50%;
}

.empty-plate .empty-eye { top: 21rpx; z-index: 1; }
.empty-plate .eye-left { left: 27rpx; }
.empty-plate .eye-right { right: 27rpx; }

.empty-mouth {
  position: absolute;
  left: 36rpx;
  top: 31rpx;
  width: 13rpx;
  height: 6rpx;
  border-top: 3rpx solid $p2-ink;
  border-radius: 50%;
  z-index: 1;
}

.empty-spoon {
  position: absolute;
  right: 8rpx;
  top: 24rpx;
  width: 14rpx;
  height: 79rpx;
  border: 3rpx solid $p2-line;
  border-radius: 50% 50% 9rpx 9rpx;
  transform: rotate(24deg);
}

.empty-spark {
  position: absolute;
  top: 0;
  left: 4rpx;
  color: $p2-coral;
  font-size: 27rpx;
}

.empty-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 750;
}

.empty-desc {
  color: $p2-ink-soft;
  font-size: 22rpx;
  line-height: 1.5;
}

.recent-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 118rpx;
  padding: 18rpx 17rpx;
  border-radius: 25rpx 31rpx 24rpx 29rpx;
  animation: cardIn 360ms $p2-ease backwards;
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;

  &:nth-child(even) {
    border-radius: 31rpx 23rpx 30rpx 24rpx;
  }

  &:active {
    transform: translate(2rpx, 3rpx) rotate(-0.4deg);
    box-shadow: 1rpx 2rpx 0 rgba(98, 71, 53, 0.1);
  }
}

.recent-icon {
  flex: 0 0 auto;
  width: 78rpx;
  height: 78rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid $p2-line;
  border-radius: 45% 55% 48% 52%;
  font-size: 37rpx;
  transform: rotate(-2deg);
}

.kind-food { background: $p2-coral-soft; }
.kind-coffee { background: $p2-sky-soft; transform: rotate(2deg); }

.recent-main {
  flex: 1;
  min-width: 0;
}

.recent-summary {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 26rpx;
  font-weight: 700;
  color: $p2-ink;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 9rpx;
  margin-top: 9rpx;
  color: $p2-ink-soft;
  font-size: 20rpx;
}

.meta-dot {
  width: 6rpx;
  height: 6rpx;
  background: $p2-butter;
  border-radius: 45% 55% 48% 52%;
}

.recent-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: $p2-ink-soft;
}

.status-pill {
  padding: 7rpx 12rpx;
  border: 2rpx solid rgba(118, 85, 64, 0.32);
  border-radius: 13rpx 16rpx 14rpx 18rpx;
  font-size: 19rpx;
  font-weight: 700;
}

.status-pending { background: $p2-butter-soft; color: #8a6a25; }
.status-preparing { background: $p2-sky-soft; color: #527984; }
.status-completed { background: $p2-leaf-soft; color: #5c784c; }
.status-cancelled { background: #eee7df; color: #8d7b6d; }

.page-bottom-space { height: 26rpx; }

@keyframes sunFloat {
  0%, 100% { transform: translateY(0) rotate(5deg); }
  50% { transform: translateY(-7rpx) rotate(1deg); }
}

@keyframes p2Shimmer {
  from { background-position: 160% 0; }
  to { background-position: -60% 0; }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(14rpx) rotate(0.5deg); }
  to { opacity: 1; transform: translateY(0) rotate(0); }
}
</style>
