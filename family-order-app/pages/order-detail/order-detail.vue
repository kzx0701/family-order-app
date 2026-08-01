<template>
  <view class="page-order-detail" :class="themeClass">
    <!-- 头部（sticky 固定） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 32 + 'px' }">
      <view class="back-btn" @tap="goBack">
        <Icon name="arrow-left" :size="20" />
      </view>
      <text class="title">订单详情</text>
      <view class="placeholder"></view>
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

    <!-- 详情内容 -->
    <template v-else>
      <!-- 状态 Hero 区：大徽章 + 进度条 -->
      <view class="status-hero animate-fade-in">
        <view class="status-badge-lg" :style="badgeStyle">
          <view class="status-dot-lg"></view>
          <text class="status-label-lg">{{ statusLabel }}</text>
        </view>

        <!-- 三段进度条：pending → preparing → completed -->
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: progressWidth }"></view>
        </view>
        <view class="progress-labels">
          <text class="prog-label" :class="{ active: order.status === 'pending' }">待制作</text>
          <text class="prog-label" :class="{ active: order.status === 'preparing' }">制作中</text>
          <text class="prog-label" :class="{ active: order.status === 'completed' }">已完成</text>
        </view>
      </view>

      <!-- 菜品列表卡片 -->
      <view class="card dish-card animate-slide-up">
        <view class="card-head">
          <text class="card-title">菜品 ({{ orderItems.length }})</text>
          <text class="card-sub">共 {{ totalQty }} 件</text>
        </view>
        <view class="dish-list">
          <view v-for="(item, idx) in orderItems" :key="idx" class="dish-item">
            <image v-if="item.image" class="dish-img" :src="item.image" mode="aspectFill" />
            <view v-else class="dish-img placeholder">{{ dishEmoji(item) }}</view>
            <view class="dish-info">
              <text class="dish-name">{{ item.name }}</text>
            </view>
            <text class="dish-qty">x{{ item.quantity }}</text>
          </view>
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="card info-card animate-slide-up" :style="{ animationDelay: '60ms' }">
        <view class="card-head">
          <text class="card-title">订单信息</text>
        </view>
        <!-- 预约时间 -->
        <view class="info-row">
          <view class="info-icon"><Icon name="clock" :size="16" /></view>
          <text class="info-label">预约时间</text>
          <text class="info-value">{{ reservationText }}</text>
        </view>
        <!-- 下单时间 -->
        <view class="info-row">
          <view class="info-icon"><Icon name="note" :size="16" /></view>
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ submitTimeText }}</text>
        </view>
        <!-- 点单人 -->
        <view class="info-row">
          <view class="info-icon"><Icon name="utensils-crossed" :size="16" /></view>
          <text class="info-label">点单人</text>
          <text class="info-value">{{ order.userName || '我' }}</text>
        </view>
        <!-- 备注 -->
        <view v-if="order.note" class="info-row">
          <view class="info-icon"><Icon name="note" :size="16" /></view>
          <text class="info-label">备注</text>
          <text class="info-value">{{ order.note }}</text>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacer"></view>
    </template>

    <!-- 底部操作栏（管理员：推进状态 / 提醒取餐） -->
    <view v-if="!loading && !loadError && bottomButton" class="bottom-bar">
      <view
        class="action-btn"
        :class="bottomButton.class"
        @tap="onBottomAction"
      >
        <view v-if="actionLoading" class="spinner"></view>
        <text class="action-text">{{ bottomButton.text }}</text>
      </view>
    </view>

    <!-- 已完成(非管理员)/已取消状态：底部显示状态提示 -->
    <view v-else-if="!loading && !loadError && (order.status === 'cancelled' || (order.status === 'completed' && !userStore.isAdmin))" class="bottom-bar">
      <view class="status-hint" :class="order.status">
        <text>{{ order.status === 'completed' ? '✓ 订单已完成' : '订单已取消' }}</text>
      </view>
    </view>

    <!-- 取餐提醒弹框 -->
    <view v-if="showPickupModal" class="pickup-modal-mask" @tap="closePickupModal">
      <view class="pickup-modal" @tap.stop>
        <text class="pickup-modal-title">提醒取餐</text>
        <text class="pickup-modal-desc">填写取餐方式与温馨提示，发送给下单人</text>

        <view class="pickup-field">
          <text class="pickup-label">取餐方式</text>
          <input
            class="pickup-input"
            type="text"
            :value="pickupMethod"
            placeholder="如：请到厨房取餐"
            placeholder-class="pickup-placeholder"
            maxlength="20"
            :focus="showPickupModal"
            @input="onPickupMethodInput"
          />
        </view>

        <view class="pickup-field">
          <text class="pickup-label">温馨提示</text>
          <input
            class="pickup-input"
            type="text"
            :value="pickupTip"
            placeholder="如：趁热吃哦~"
            placeholder-class="pickup-placeholder"
            maxlength="20"
            @input="onPickupTipInput"
          />
        </view>

        <view class="pickup-actions">
          <view class="pickup-btn pickup-btn-cancel" @tap="closePickupModal">
            <text>取消</text>
          </view>
          <view
            class="pickup-btn pickup-btn-confirm"
            :class="{ disabled: pickupSending }"
            @tap="onPickupConfirm"
          >
            <text>{{ pickupSending ? '发送中...' : '确认发送' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

/* === 订单数据 === */
const orderId = ref('')
const order = ref({})
const loading = ref(true)
const loadError = ref('')
const actionLoading = ref(false)

/* === 状态映射表：与 status-badge 保持一致 === */
const STATUS_MAP = {
  pending: { label: '待制作', bg: '#FFF7ED', fg: '#C2410C' },
  preparing: { label: '制作中', bg: '#EFF6FF', fg: '#1D4ED8' },
  completed: { label: '已完成', bg: '#F0FDF4', fg: '#15803D' },
  cancelled: { label: '已取消', bg: '#F9FAFB', fg: '#6B7280' }
}

const statusInfo = computed(() => STATUS_MAP[order.value.status] || STATUS_MAP.pending)
const statusLabel = computed(() => statusInfo.value.label)

const badgeStyle = computed(() => ({
  backgroundColor: statusInfo.value.bg,
  color: statusInfo.value.fg
}))

/* === 主题类：根据首道菜类型决定 === */
const themeClass = computed(() => {
  const firstType = order.value.items?.[0]?.type || 'coffee'
  return `theme-${firstType}`
})

/* === 进度条宽度：pending=0%, preparing=50%, completed=100%, cancelled=0% === */
const progressWidth = computed(() => {
  switch (order.value.status) {
    case 'pending': return '0%'
    case 'preparing': return '50%'
    case 'completed': return '100%'
    default: return '0%'
  }
})

/* === 菜品列表 === */
const orderItems = computed(() => order.value.items || [])
const totalQty = computed(() => {
  return orderItems.value.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
})

/* === 预约时间文案 === */
const reservationText = computed(() => {
  const o = order.value
  if (!o) return ''
  if (o.reservationType === 'asap' || !o.reservationTime) return '尽快'
  return formatReservation(o.reservationTime)
})

/* === 下单时间文案 === */
const submitTimeText = computed(() => {
  const ts = order.value.createTime
  if (!ts) return ''
  return formatDateTime(ts)
})

/* === 底部按钮：管理员显示状态推进 / 提醒取餐 === */
const bottomButton = computed(() => {
  if (actionLoading.value) return null
  const s = order.value.status

  if (userStore.isAdmin) {
    // 管理员：推进状态 + 完成后提醒取餐
    if (s === 'pending') {
      return { text: '开始制作', class: 'btn-prep', type: 'advance', target: 'preparing' }
    }
    if (s === 'preparing') {
      return { text: '标记完成', class: 'btn-done', type: 'advance', target: 'completed' }
    }
    if (s === 'completed') {
      return { text: '提醒取餐', class: 'btn-pickup', type: 'pickup' }
    }
  }
  // 下单人：无操作按钮
  return null
})

/* === 时间格式化：MM-DD HH:mm === */
const formatDateTime = (ts) => {
  const d = new Date(ts)
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${M}-${D} ${h}:${m}`
}

/* === 预约时间格式化：今天/明天/后天 HH:mm === */
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

/* === 菜品占位 emoji === */
const dishEmoji = (item) => {
  const name = item?.name || ''
  if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name)) return '☕'
  if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name)) return '🥐'
  if (/面|粉|粥|拉面|乌冬|noodle/i.test(name)) return '🍜'
  if (/饭|炒饭|盖饭|咖喱|便当/i.test(name)) return '🍚'
  if (/沙律|沙拉|salad/i.test(name)) return '🥗'
  if (/汤|羹/i.test(name)) return '🍲'
  return '🍽️'
}

/* === 加载订单详情 === */
const loadOrder = async (id) => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: { module: 'orders-crud', action: 'get', _id: id, token: userStore.token }
    })
    if (res.result.code !== 0) {
      throw new Error(res.result.message || '订单加载失败')
    }
    order.value = res.result.order || res.result.data || {}
  } catch (e) {
    console.error('[order-detail] loadOrder error', e)
    loadError.value = e.message || '订单加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

/* === 重试 === */
const retryLoad = () => {
  if (orderId.value) loadOrder(orderId.value)
}

/* === 底部按钮点击：管理员推进状态 / 提醒取餐 === */
const onBottomAction = async () => {
  const btn = bottomButton.value
  if (!btn || actionLoading.value) return

  // 提醒取餐：弹出填写框
  if (btn.type === 'pickup') {
    openPickupModal()
    return
  }

  // 管理员推进状态
  actionLoading.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'orders-crud',
        action: 'updateStatus',
        _id: orderId.value,
        status: btn.target,
        token: userStore.token
      }
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.message || '操作失败', icon: 'none' })
      return
    }
    // 乐观更新：立即切换本地状态，触发进度条与徽章丝滑过渡
    order.value = { ...order.value, status: btn.target }
    uni.showToast({
      title: btn.target === 'preparing' ? '已开始制作' : '已完成',
      icon: 'success'
    })
  } catch (e) {
    console.error('[order-detail] onAction error', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    actionLoading.value = false
  }
}

/* === 取餐提醒弹框 === */
const showPickupModal = ref(false)
const pickupMethod = ref('')
const pickupTip = ref('')
const pickupSending = ref(false)

const openPickupModal = () => {
  pickupMethod.value = ''
  pickupTip.value = ''
  showPickupModal.value = true
}

const closePickupModal = () => {
  if (pickupSending.value) return
  showPickupModal.value = false
}

const onPickupMethodInput = (e) => {
  pickupMethod.value = e.detail.value || ''
}

const onPickupTipInput = (e) => {
  pickupTip.value = e.detail.value || ''
}

/* === 确认发送取餐提醒 === */
const onPickupConfirm = async () => {
  if (pickupSending.value) return
  const method = pickupMethod.value.trim()
  const tip = pickupTip.value.trim()
  if (!method) {
    uni.showToast({ title: '请填写取餐方式', icon: 'none' })
    return
  }
  if (!tip) {
    uni.showToast({ title: '请填写温馨提示', icon: 'none' })
    return
  }

  pickupSending.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'orders-crud',
        action: 'pickup',
        _id: orderId.value,
        pickupMethod: method,
        pickupTip: tip,
        token: userStore.token
      }
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.message || '发送失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '已发送取餐提醒', icon: 'success' })
    showPickupModal.value = false
  } catch (e) {
    console.error('[order-detail] pickup error', e)
    uni.showToast({ title: '发送失败', icon: 'none' })
  } finally {
    pickupSending.value = false
  }
}

/* === 返回 === */
const goBack = () => {
  uni.navigateBack()
}

/* === 页面加载 === */
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
</script>

<style lang="scss" scoped>
.page-order-detail {
  min-height: 100vh;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  background-color: $color-bg;
}

/* === 头部（sticky） === */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  @include flex-between;
  padding: 40rpx 32rpx 24rpx;
  background-color: $color-bg;

  .back-btn {
    @include btn-icon;
  }

  .title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--theme-primary, $color-coffee-700);
  }

  .placeholder {
    width: 72rpx;
  }
}

/* === 加载 / 错误状态 === */
.state-block {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 120rpx 0;

  .loading-dots {
    display: flex;
    gap: 8rpx;

    .dot {
      font-size: $font-size-3xl;
      color: var(--theme-primary, $color-coffee-500);
      animation: dotBlink 1.2s $ease-smooth infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  .state-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* === 状态 Hero 区 === */
.status-hero {
  padding: 24rpx 40rpx 32rpx;
  @include flex-column;
  align-items: center;
  gap: 24rpx;

  .status-badge-lg {
    display: inline-flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 32rpx;
    border-radius: $radius-full;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    line-height: 1;
    transition: background-color $dur-base $ease-smooth, color $dur-base $ease-smooth;

    .status-dot-lg {
      width: 14rpx;
      height: 14rpx;
      border-radius: 50%;
      background-color: currentColor;
      animation: dotPulse 1.6s $ease-smooth infinite;
    }

    .status-label-lg {
      line-height: 1;
    }
  }
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* === 进度条 === */
.progress-track {
  width: 100%;
  height: 8rpx;
  border-radius: $radius-full;
  background-color: $color-neutral-100;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    border-radius: $radius-full;
    background: linear-gradient(90deg, #FFA726, #22C55E);
    // 状态变化时宽度丝滑过渡
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.progress-labels {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: -4rpx;

  .prog-label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
    transition: color $dur-base $ease-smooth, font-weight $dur-base $ease-smooth;

    &.active {
      color: $color-coffee-700;
      font-weight: $font-weight-bold;
    }
  }
}

/* === 通用卡片 === */
.card {
  margin: 0 32rpx 24rpx;
  padding: 32rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;

  .card-head {
    @include flex-between;
    margin-bottom: 24rpx;

    .card-title {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-text;
    }

    .card-sub {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }
}

/* === 菜品列表 === */
.dish-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .dish-item {
    display: flex;
    align-items: center;
    gap: 20rpx;

    .dish-img {
      width: 88rpx;
      height: 88rpx;
      border-radius: $radius-lg;
      background-color: var(--theme-secondary, $color-bg-soft);
      flex-shrink: 0;

      &.placeholder {
        @include flex-center;
        font-size: 44rpx;
      }
    }

    .dish-info {
      flex: 1;
      min-width: 0;

      .dish-name {
        font-size: $font-size-base;
        color: $color-text;
        font-weight: $font-weight-medium;
        line-height: $line-height-tight;
      }
    }

    .dish-qty {
      flex-shrink: 0;
      font-size: $font-size-sm;
      color: var(--theme-primary, $color-coffee-500);
      font-weight: $font-weight-semibold;
    }
  }
}

/* === 订单信息 === */
.info-card {
  .info-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 14rpx 0;

    .info-icon {
      width: 32rpx;
      height: 32rpx;
      flex-shrink: 0;
      @include flex-center;
      color: var(--theme-primary, $color-coffee-500);
    }

    .info-label {
      font-size: $font-size-sm;
      color: $color-text-muted;
      flex-shrink: 0;
      min-width: 120rpx;
    }

    .info-value {
      flex: 1;
      font-size: $font-size-sm;
      color: $color-text;
      text-align: right;
      line-height: $line-height-relaxed;
      word-break: break-all;
    }
  }
}

/* === 底部留白 === */
.bottom-spacer {
  height: 40rpx;
}

/* === 底部操作栏 === */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: rgba(255, 251, 245, 0.96);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);

  .action-btn {
    width: 100%;
    padding: 28rpx 0;
    border-radius: $radius-full;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    transition: transform $dur-fast $ease-bounce, opacity $dur-fast $ease-smooth,
      background $dur-base $ease-smooth;
    color: #fff;

    &:active {
      transform: scale(0.96);
      opacity: 0.9;
    }

    .action-text {
      color: inherit;
    }

    .spinner {
      width: 32rpx;
      height: 32rpx;
      border: 4rpx solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 800ms linear infinite;
    }

    /* 开始制作：暖橙系渐变 */
    &.btn-prep {
      background: linear-gradient(135deg, #FFA726, #FB8C00);
      box-shadow: 0 6rpx 20rpx rgba(251, 140, 0, 0.32);
    }

    /* 标记完成：绿色系渐变 */
    &.btn-done {
      background: linear-gradient(135deg, #22C55E, #16A34A);
      box-shadow: 0 6rpx 20rpx rgba(22, 163, 74, 0.32);
    }

    /* 提醒取餐：咖啡色系渐变，与品牌色呼应 */
    &.btn-pickup {
      background: linear-gradient(135deg, #A8826A, #6F4E37);
      box-shadow: 0 6rpx 20rpx rgba(111, 78, 55, 0.32);
    }
  }

  /* 已完成/已取消的状态提示 */
  .status-hint {
    width: 100%;
    padding: 28rpx 0;
    border-radius: $radius-full;
    text-align: center;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;

    &.completed {
      background-color: #DCFCE7;
      color: #16A34A;
    }

    &.cancelled {
      background-color: #F3F4F6;
      color: #6B7280;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* === 取餐提醒弹框 === */
.pickup-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.pickup-modal {
  width: 600rpx;
  background-color: #fff;
  border-radius: $radius-2xl;
  padding: 48rpx 40rpx 36rpx;
  animation: popIn 0.25s $ease-smooth;
}

@keyframes popIn {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.pickup-modal-title {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text;
  text-align: center;
  margin-bottom: 12rpx;
}

.pickup-modal-desc {
  display: block;
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-align: center;
  margin-bottom: 40rpx;
}

.pickup-field {
  margin-bottom: 28rpx;
}

.pickup-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text;
  margin-bottom: 12rpx;
}

.pickup-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: $radius-lg;
  background-color: $color-bg;
  border: 2rpx solid $color-border;
  font-size: $font-size-base;
  color: $color-text;
  box-sizing: border-box;
}

.pickup-placeholder {
  color: $color-text-disabled;
  font-size: $font-size-base;
}

.pickup-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
}

.pickup-btn {
  flex: 1;
  height: 80rpx;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;

  &.pickup-btn-cancel {
    background-color: $color-bg;
    color: $color-text-muted;
  }

  &.pickup-btn-confirm {
    background: linear-gradient(135deg, #A8826A, #6F4E37);
    color: #fff;
    box-shadow: 0 6rpx 20rpx rgba(111, 78, 55, 0.28);

    &.disabled {
      opacity: 0.6;
    }
  }
}
</style>
