<template>
  <view class="page-home page-enter">
    <view class="paper-dot dot-a"></view>
    <view class="paper-dot dot-b"></view>
    <view class="paper-dot dot-c"></view>

    <view class="home-header" :style="{ paddingTop: headerTop + 'px' }">
      <view class="greeting-row">
        <view>
          <text class="greeting">{{ sceneTitle }}</text>
          <text class="greeting-sub">{{ sceneSub }}</text>
        </view>

        <!-- 场景插画位：素材未到位时回退为内置的 CSS 太阳涂鸦 -->
        <view class="scene-art">
          <image
            v-if="sceneArtSrc"
            class="scene-art-image"
            :src="sceneArtSrc"
            mode="aspectFit"
            :webp="true"
          />
          <view v-else class="sun-doodle">
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
      </view>

      <view class="header-scribble"></view>
    </view>

    <view class="entry-section">
      <view class="entry-card entry-food" @tap="goOrder('food')">
        <view class="entry-copy">
          <image class="entry-title-image" :src="entryTitleArt.food" mode="aspectFit" :webp="true" />
        </view>

        <view class="entry-art food-art">
          <view class="entry-art-spot"></view>
          <image class="entry-art-image" :src="entryArt.food" mode="aspectFill" :webp="true" />
        </view>
      </view>

      <view class="entry-card entry-coffee" @tap="goOrder('coffee')">
        <view class="entry-copy">
          <image class="entry-title-image" :src="entryTitleArt.coffee" mode="aspectFit" :webp="true" />
        </view>

        <view class="entry-art coffee-art">
          <view class="entry-art-spot"></view>
          <image class="entry-art-image" :src="entryArt.coffee" mode="aspectFill" :webp="true" />
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
import { imgUrl } from '@/utils/image.js'

const { statusBarHeight, menuButton } = useSafeArea()
const userStore = useUserStore()
const cartStore = useCartStore()

const orders = ref([])
const loading = ref(false)

/* === 顶部内容起始位置 ===
 * 自定义导航栏下微信胶囊按钮固定悬浮在右上角，内容若从状态栏下方紧接开始会与它重叠
 * （首页右侧的插画就在胶囊水平范围内），故按胶囊底边下移
 * 取不到胶囊信息（非微信端）时退回状态栏 + 42px
 */
const headerTop = computed(() => {
  const bottom = menuButton.value?.bottom
  return bottom ? Math.round(bottom + 6) : statusBarHeight.value + 42
})

/* === 入口素材 ===
 * 云存储原图合计约 5.4MB，经 imgUrl 按 960px + WebP 输出后约 0.43MB
 * 960px 对最大机型（430pt 屏、DPR 3，约需 516 物理像素）仍有约 1.9 倍余量
 * 原始素材未做改动，调整尺寸或回退只需改此参数
 */
const ENTRY_ART_WIDTH = 960

const entryArt = {
  food: imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-6356c060-78ee-47d4-a481-a3b61fdf2c3e.png', { w: ENTRY_ART_WIDTH }),
  coffee: imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-a8278d19-e4a0-4e8d-9a1c-83483951710b.png', { w: ENTRY_ART_WIDTH })
}

const entryTitleArt = {
  food: imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%88%91%E8%A6%81%E5%B9%B2%E9%A5%AD-standardized.png', { w: ENTRY_ART_WIDTH }),
  coffee: imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%9D%A5%E6%9D%AF%E5%92%96%E5%95%A1-standardized.png', { w: ENTRY_ART_WIDTH })
}

/* === 顶部时段场景 ===
 * 按设备本地时间落在哪个区间决定文案与插画，共 5 档
 * 文案口吻统一为「短句 + 轻语气」：主文案 4–6 字，副文案 10–12 字
 * 22:00–05:00 跨夜，靠 find 未命中时兜底到最后一档
 */
const SCENES = [
  { key: 'morning', from: 5, to: 11, title: '早呀，饿了吗', sub: '今天第一口，想吃点什么' },
  { key: 'noon', from: 11, to: 14, title: '到饭点啦', sub: '看看家里能做点什么' },
  { key: 'afternoon', from: 14, to: 18, title: '下午茶时间', sub: '来杯咖啡，还是先点个菜' },
  { key: 'evening', from: 18, to: 22, title: '今晚吃什么', sub: '家里的饭，总有点不一样' },
  { key: 'night', from: 22, to: 24, title: '还没睡呀', sub: '小声点单，别吵醒饲养员' }
]

// 当前小时，onShow 时刷新一次，避免页面停留跨时段后文案仍是旧的
const currentHour = ref(new Date().getHours())

const currentScene = computed(
  () =>
    SCENES.find((s) => currentHour.value >= s.from && currentHour.value < s.to) ||
    SCENES[SCENES.length - 1]
)

const sceneTitle = computed(() => currentScene.value.title)
const sceneSub = computed(() => currentScene.value.sub)

/* === 顶部场景插画（5 个时段各一张）===
 * 留空时回退到内置的 CSS 太阳涂鸦；填入地址后自动走 imgUrl 的 480px + WebP 处理
 * 素材对应：morning 太阳 / noon 米饭 / afternoon 咖啡 / evening 落日小屋 / night 月牙
 * 素材命名建议：scene-<时段区间>-<主题>-v<版本>-<尺寸>.png
 */

/* 场景插画显示尺寸仅 132rpx（最大机型约需 227 物理像素），480px 已有约 2.1 倍余量，
 * 无需与入口图同为 960px */
const SCENE_ART_WIDTH = 480

const SCENE_ART_SOURCE = {
  morning: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-51031047-c358-406f-8339-f837b96e9c7b.png',
  noon: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-7b6620ff-7380-4c40-8933-c2fc7ca33375.png',
  afternoon: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-a653e17c-4186-4c05-b069-07d47e146b62.png',
  evening: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/scene-18-22-%E6%99%9A%E4%B8%8A-v2-512.png',
  night: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-a9988768-ab65-498e-b4dc-770b1d9ef4dc.png'
}

const sceneArt = Object.fromEntries(
  Object.entries(SCENE_ART_SOURCE).map(([key, url]) => [
    key,
    url ? imgUrl(url, { w: SCENE_ART_WIDTH }) : ''
  ])
)

const sceneArtSrc = computed(() => sceneArt[currentScene.value.key] || '')

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

onShow(() => {
  // 刷新当前小时：页面停留跨时段后重新进入时，场景文案需要跟着变
  currentHour.value = new Date().getHours()
  loadOrders()
})

onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})
</script>

<style lang="scss" scoped>
/* 顶部主标题的手绘字体（含 base64 数据，按需引入；不可放进 uni.scss，否则会被重复打进每个页面的 wxss） */
@import '@/scss/font-maoken.scss';

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

.greeting-row {
  display: flex;
  /* 顶部对齐：插画从行顶部起向下延伸。垂直居中会让变大的插画向上顶到微信胶囊 */
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 0;
}

.greeting {
  display: block;
  /* 猫啃什锦黑：单字重手绘体，固定 normal 以避免合成加粗破坏手绘笔触 */
  font-family: $p2-font-hand, $p2-font-fallback;
  font-size: 52rpx;
  line-height: 1.18;
  font-weight: normal;
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

/* 场景插画位：顶部与标题齐平，底部向下延伸（吃掉头部下方空白，不撑高头部也不碰入口卡）
 * 素材未到位时内部是回退的太阳涂鸦 */
.scene-art {
  flex: 0 0 auto;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: -30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scene-art-image {
  width: 100%;
  height: 100%;
  /* 延续原先 CSS 太阳涂鸦的浮动动效，避免换成静态图后丢掉这层节奏 */
  animation: sunFloat 4s ease-in-out infinite;
}

.sun-doodle {
  position: relative;
  flex: 0 0 auto;
  width: 108rpx;
  height: 104rpx;
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
  gap: 12rpx;
  padding: 8rpx 28rpx 12rpx;
}

.entry-card {
  position: relative;
  min-height: 334rpx;
  overflow: hidden;
  padding: 14rpx 18rpx 10rpx;
  border: 4rpx solid $p2-line;
  box-shadow: 9rpx 11rpx 0 rgba(98, 71, 53, 0.16);
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;

  &:active {
    transform: translate(3rpx, 4rpx) rotate(0deg) scale(0.98);
    box-shadow: 2rpx 3rpx 0 rgba(98, 71, 53, 0.12);
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    right: -72rpx;
    bottom: -116rpx;
    width: 264rpx;
    height: 264rpx;
    border: 4rpx solid rgba(118, 85, 64, 0.16);
    border-radius: 48% 52% 42% 58%;
    transform: rotate(-17deg);
  }

  &::after {
    top: 22rpx;
    right: 24rpx;
    width: 42rpx;
    height: 12rpx;
    border-top: 4rpx solid rgba(118, 85, 64, 0.26);
    border-bottom: 3rpx solid rgba(118, 85, 64, 0.14);
    transform: rotate(11deg);
  }
}

.entry-food {
  background: #f6c7b8;
  border-radius: 32rpx 44rpx 29rpx 46rpx;
  transform: rotate(-1.1deg);

  &::before { border-color: rgba(233, 122, 105, 0.28); }
}

.entry-coffee {
  background: #c9e3e7;
  border-radius: 44rpx 31rpx 47rpx 28rpx;
  transform: rotate(1.1deg);

  &::before {
    border-color: rgba(84, 137, 147, 0.24);
    transform: rotate(15deg);
  }
}

.entry-copy {
  position: relative;
  z-index: 3;
  width: 60%;
}

.entry-title-image {
  display: block;
  width: 300rpx;
  height: 112rpx;
  margin-left: -33rpx;
  transform: translateY(14rpx) rotate(-1.8deg);
  pointer-events: none;
}

/* 云端人物插画：卡片右下角主视觉，保留手绘贴纸感 */
.entry-art {
  right: -54rpx;
  bottom: -26rpx;
  width: 300rpx;
  height: 322rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.entry-art-spot {
  position: absolute;
  right: 38rpx;
  bottom: 40rpx;
  width: 230rpx;
  height: 204rpx;
  border: 4rpx solid rgba(118, 85, 64, 0.18);
  border-radius: 54% 46% 48% 52%;
  transform: rotate(-11deg);
}

.entry-art-image {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  filter: drop-shadow(5rpx 7rpx 0 rgba(98, 71, 53, 0.16));
}

.entry-food .entry-art-spot {
  background: rgba(255, 249, 235, 0.82);
  transform: rotate(-11deg) scale(0.98);
}

.entry-food .entry-art-image {
  transform: translateY(22rpx) rotate(-4deg);
}

.entry-coffee .entry-art {
  right: -60rpx;
  bottom: -22rpx;
  width: 314rpx;
  height: 336rpx;
}

.entry-coffee .entry-art-spot {
  right: 42rpx;
  bottom: 42rpx;
  width: 238rpx;
  height: 214rpx;
  background: rgba(255, 254, 249, 0.84);
  transform: rotate(8deg) scale(1.02);
}

.entry-coffee .entry-title-image {
  transform: translateY(14rpx) rotate(1.8deg);
}

.entry-coffee .entry-art-image {
  transform: translateY(22rpx) rotate(3deg);
}

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
