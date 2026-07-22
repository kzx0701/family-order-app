<template>
  <view class="page-success page-enter" :class="themeClass">
    <!-- 成功动效区 -->
    <view class="hero" :style="{ paddingTop: statusBarHeight + 56 + 'px' }">
      <!-- 成功圆圈容器：CSS 对勾 + Lottie canvas + 光环 + 彩屑层 全部基于此容器居中定位 -->
      <view class="circle-wrap">
        <!-- 扩散光环（持续脉动，相对 circle-wrap 居中） -->
        <view class="ring ring-1"></view>
        <view class="ring ring-2"></view>
        <!-- 彩带/纸屑爆开动效层（相对 circle-wrap 中心爆开） -->
        <view class="confetti-layer">
          <view
            v-for="c in confettiPieces"
            :key="c.id"
            class="confetti"
            :style="confettiStyle(c)"
          ></view>
        </view>
        <!-- CSS 对勾圆圈：Lottie 加载成功时被 canvas 覆盖；失败时作为降级 -->
        <view class="success-circle">
          <Icon name="check" :size="56" color="#fff" :stroke-width="3" />
        </view>
        <!-- Lottie canvas：与 success-circle 同尺寸，绝对定位覆盖在上层 -->
        <canvas
          type="2d"
          id="success-lottie"
          class="success-lottie-canvas"
        ></canvas>
      </view>
      <!-- 趣味文案 -->
      <text class="success-title animate-fade-in">下单成功啦~</text>
      <text class="success-sub animate-fade-in">厨房已经收到你的点单啦~</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="state-block">
      <view class="loading-dots">
        <text class="dot">·</text>
        <text class="dot">·</text>
        <text class="dot">·</text>
      </view>
      <text class="state-text">正在加载订单...</text>
    </view>

    <!-- 加载失败 -->
    <error-state
      v-else-if="loadError"
      emoji="😵"
      title="订单加载失败"
      :desc="loadError"
      retry-text="重新加载"
      @retry="retryLoad"
    />

    <!-- 订单详情卡片 -->
    <view v-else class="order-card animate-slide-up">
      <view class="card-header">
        <text class="card-title">点单详情</text>
        <status-badge v-if="order" :status="order.status || 'pending'" />
      </view>
      <!-- 菜品列表 -->
      <view class="dish-list">
        <view v-for="item in orderItems" :key="item.dishId" class="dish-row">
          <text class="dish-name">{{ item.name }}</text>
          <text class="dish-qty">x{{ item.quantity }}</text>
        </view>
      </view>
      <!-- 分隔线 -->
      <view class="divider"></view>
      <!-- 订单元信息 -->
      <view class="meta-row">
        <text class="meta-label">预约时间</text>
        <text class="meta-value">{{ reservationText }}</text>
      </view>
      <view v-if="orderNote" class="meta-row">
        <text class="meta-label">备注</text>
        <text class="meta-value note-value">{{ orderNote }}</text>
      </view>
      <view class="meta-row">
        <text class="meta-label">点单人</text>
        <text class="meta-value">{{ orderUserName }}</text>
      </view>
      <view class="meta-row">
        <text class="meta-label">提交时间</text>
        <text class="meta-value">{{ submitTimeText }}</text>
      </view>
    </view>

    <!-- 操作按钮（不显示 custom-tabbar，这是详情页） -->
    <view v-if="!loading" class="actions">
      <view class="btn-primary" @tap="goHome">
        <text>返回首页</text>
      </view>
      <view class="btn-secondary" @tap="goRecord">
        <text>查看记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { loadLottieOnReady, destroyLottie } from '@/utils/lottie.js'
// 引入 Lottie 动画 JSON（webpack json-loader 自动解析为对象）
import successAnim from '@/static/lottie/success.json'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

/* === 订单数据 === */
const orderId = ref('')
const order = ref(null)
const loading = ref(true)
const loadError = ref('')

/* === 主题类：默认咖啡，订单加载后根据首项 type 切换 === */
const themeClass = computed(() => {
  const t = order.value?.items?.[0]?.type || order.value?.type || 'coffee'
  return `theme-${t}`
})

/* === Lottie 集成 === */
const LOTTIE_CANVAS_ID = 'success-lottie'
const lottieInstance = getCurrentInstance()

/**
 * 加载 Lottie 成功动画
 * - 在 success-lottie canvas 上初始化 Lottie
 * - loop: false（成功动画只播放一次，停留末帧）
 * - 失败时不影响 CSS 对勾圆圈（CSS 动画自然作为降级）
 */
const loadSuccessLottie = async () => {
  // 等待 canvas 节点渲染就绪
  await nextTick()
  await new Promise((r) => setTimeout(r, 100))
  const anim = await loadLottieOnReady(
    LOTTIE_CANVAS_ID,
    successAnim,
    { loop: false, autoplay: true },
    lottieInstance?.proxy || null
  )
  if (anim) {
    console.log('[order-success] Lottie 加载成功')
  } else {
    console.warn('[order-success] Lottie 加载失败，使用 CSS 降级动效')
  }
}

/* === 彩带/纸屑动效 === */
const burstConfetti = ref(false)
const confettiColors = [
  '#FFA726',
  '#22C55E',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899'
]
// 预生成 14 片彩屑：均匀向外爆开，各自带随机距离/旋转/延迟
const confettiPieces = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2) * 0.25
  const distance = 140 + (i % 4) * 30
  return {
    id: i,
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance,
    color: confettiColors[i % confettiColors.length],
    delay: i * 0.04,
    rotate: 360 + (i % 5) * 120,
    size: 14 + (i % 3) * 6
  }
})

/**
 * 单片彩屑样式：根据 burstConfetti 切换起始/终止状态
 * transition 写在 CSS 类中，此处仅切换 transform/opacity 触发过渡
 */
const confettiStyle = (c) => {
  const base = {
    backgroundColor: c.color,
    width: c.size + 'rpx',
    height: c.size + 'rpx',
    marginTop: -c.size / 2 + 'rpx',
    marginLeft: -c.size / 2 + 'rpx',
    transitionDelay: c.delay + 's'
  }
  if (burstConfetti.value) {
    return {
      ...base,
      transform: `translate(${c.tx}rpx, ${c.ty}rpx) rotate(${c.rotate}deg) scale(0.3)`,
      opacity: 0
    }
  }
  return {
    ...base,
    transform: 'translate(0, 0) rotate(0deg) scale(1)',
    opacity: 1
  }
}

/* === 计算属性 === */
const orderItems = computed(() => order.value?.items || [])
const orderNote = computed(() => order.value?.note || '')
const orderUserName = computed(() => order.value?.userName || '我')

const reservationText = computed(() => {
  const o = order.value
  if (!o) return '尽快'
  if (o.reservationType === 'asap' || !o.reservationTime) return '尽快'
  return formatReservation(o.reservationTime)
})

const submitTimeText = computed(() => {
  const ts = order.value?.createdAt || order.value?.submitTime
  return ts ? formatDateTime(ts) : ''
})

/**
 * 格式化提交时间：MM-DD HH:mm
 */
const formatDateTime = (ts) => {
  const d = new Date(ts)
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${M}-${D} ${h}:${m}`
}

/**
 * 格式化预约时间：今天/明天/后天 + HH:mm
 * 超出 3 天则显示具体月日
 */
const formatReservation = (ts) => {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((target - today) / 86400000)
  let dayLabel
  if (diffDays === 0) dayLabel = '今天'
  else if (diffDays === 1) dayLabel = '明天'
  else if (diffDays === 2) dayLabel = '后天'
  else dayLabel = `${d.getMonth() + 1}月${d.getDate()}日`
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${dayLabel} ${h}:${m}`
}

/**
 * 加载订单详情
 * 调用 orders-crud 云函数 action: 'get'
 */
const loadOrder = async (id) => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await uniCloud.callFunction({
      name: 'orders-crud',
      data: { action: 'get', _id: id, token: userStore.token }
    })
    if (res.result.code !== 0) {
      throw new Error(res.result.message || '订单加载失败')
    }
    order.value = res.result.data || res.result.order
  } catch (e) {
    console.error('[order-success] loadOrder error', e)
    loadError.value = '订单加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

/* === 返回首页 === */
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

/* === 查看记录 === */
const goRecord = () => {
  uni.switchTab({ url: '/pages/record/record' })
}

/* === 重试加载订单 === */
const retryLoad = () => {
  if (orderId.value) {
    loadOrder(orderId.value)
  }
}

/* === 生命周期 === */
onLoad((options) => {
  const id = options?.id || ''
  orderId.value = id
  if (id) {
    loadOrder(id)
  } else {
    loading.value = false
    loadError.value = '订单参数缺失'
  }
})

/* === 挂载后触发彩屑爆开动效 + 加载 Lottie 成功动画 === */
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      burstConfetti.value = true
    }, 250)
  })
  // 异步加载 Lottie，不阻塞页面入场
  loadSuccessLottie()
})

/* === 卸载时销毁 Lottie 实例，避免内存泄漏 === */
onUnmounted(() => {
  destroyLottie(LOTTIE_CANVAS_ID)
})
</script>

<style lang="scss" scoped>
.page-success {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

/* === 成功动效区 === */
.hero {
  position: relative;
  @include flex-column;
  align-items: center;
  padding: 96rpx 0 56rpx;

  /* 圆圈容器：所有动效元素（光环/彩屑/对勾/Lottie）的定位基准 */
  .circle-wrap {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    z-index: 2;
  }

  /* 扩散光环：相对 circle-wrap 居中，不再依赖 hero 的 padding */
  .ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(34, 197, 94, 0.35);
    pointer-events: none;
    z-index: 0;
  }

  .ring-1 {
    animation: ringExpand 2s $ease-smooth 0.3s infinite;
  }

  .ring-2 {
    animation: ringExpand 2s $ease-smooth 0.9s infinite;
  }

  /* 彩屑层：相对 circle-wrap 中心爆开 */
  .confetti-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 1;
  }

  .confetti {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 4rpx;
    transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, opacity;
  }

  /* 绿色对勾圆圈：先弹入入场（popIn），完成后持续呼吸（circleBreathe） */
  .success-circle {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #22C55E, #16A34A);
    @include flex-center;
    box-shadow: 0 12rpx 40rpx rgba(34, 197, 94, 0.4);
    animation: popIn $dur-base $ease-bounce both,
      circleBreathe 2.4s $ease-smooth 0.6s infinite;
    z-index: 2;
  }

  /* Lottie canvas：覆盖在 success-circle 上层，同尺寸 */
  .success-lottie-canvas {
    position: absolute;
    inset: 0;
    width: 160rpx;
    height: 160rpx;
    z-index: 3;
  }

  .success-title {
    margin-top: 36rpx;
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $color-coffee-700;
    animation-delay: 0.2s;
  }

  .success-sub {
    margin-top: 12rpx;
    font-size: $font-size-base;
    color: $color-text-muted;
    animation-delay: 0.35s;
  }
}

@keyframes ringExpand {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

@keyframes circleBreathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* === 加载 / 错误状态 === */
.state-block {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 60rpx 0;

  .loading-dots {
    display: flex;
    gap: 8rpx;

    .dot {
      font-size: $font-size-3xl;
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
    font-size: 80rpx;
    line-height: 1;
  }

  .state-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
  }

  .state-action {
    margin-top: 8rpx;
    padding: 14rpx 40rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);
    @include tap-feedback(0.96);

    .state-action-text {
      color: var(--theme-primary);
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }
  }
}

@keyframes dotBlink {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* === 订单详情卡片 === */
.order-card {
  margin: 0 32rpx;
  padding: 32rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-md;

  .card-header {
    @include flex-between;
    margin-bottom: 24rpx;

    .card-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $color-text;
    }
  }

  .dish-list {
    padding-bottom: 24rpx;

    .dish-row {
      @include flex-between;
      padding: 12rpx 0;

      .dish-name {
        font-size: $font-size-base;
        color: $color-text;
      }

      .dish-qty {
        font-size: $font-size-sm;
        color: var(--theme-primary);
        font-weight: $font-weight-semibold;
      }
    }
  }

  .divider {
    height: 2rpx;
    background-color: $color-neutral-100;
    margin-bottom: 16rpx;
  }

  .meta-row {
    @include flex-between;
    padding: 14rpx 0;

    .meta-label {
      font-size: $font-size-sm;
      color: $color-text-muted;
      flex-shrink: 0;
    }

    .meta-value {
      font-size: $font-size-sm;
      color: $color-text;
      max-width: 60%;
      text-align: right;

      &.note-value {
        word-break: break-all;
        line-height: $line-height-normal;
      }
    }
  }
}

/* === 操作按钮 === */
.actions {
  display: flex;
  gap: 24rpx;
  padding: 48rpx 32rpx 0;

  .btn-primary {
    flex: 1;
    @include btn-primary;
    padding: 26rpx 0;
    border-radius: $radius-full;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
  }

  .btn-secondary {
    flex: 1;
    @include btn-base;
    padding: 26rpx 0;
    border-radius: $radius-full;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    background-color: transparent;
    color: var(--theme-primary);
    border: 2rpx solid var(--theme-primary);
  }
}
</style>
