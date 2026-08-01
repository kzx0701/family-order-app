<template>
  <view class="page-submit page-enter" :class="themeClass">
    <!-- 头部（sticky 固定，滚动时常驻顶部，无需 JS 测量） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 32 + 'px' }">
      <view class="back-btn" @tap="goBack">
        <Icon name="arrow-left" :size="20" />
      </view>
      <text class="title">确认点单</text>
      <view class="placeholder"></view>
    </view>

    <!-- 已选菜品只读列表 -->
    <view class="section dish-section">
      <view class="section-head">
        <text class="section-title">已选 {{ totalCount }} 件</text>
        <text class="section-sub">共 {{ cartItems.length }} 种</text>
      </view>
      <view class="dish-list">
        <view
          v-for="(item, idx) in cartItems"
          :key="item.dishId"
          class="dish-item animate-item-enter"
          :style="{ animationDelay: idx * 60 + 'ms' }"
        >
          <image v-if="item.image" class="dish-img" :src="item.image" mode="aspectFill" />
          <view v-else class="dish-img placeholder">{{ dishEmoji(item.type) }}</view>
          <view class="dish-info">
            <text class="dish-name">{{ item.name }}</text>
            <text v-if="item.description" class="dish-desc">{{ item.description }}</text>
          </view>
          <view class="dish-qty">x{{ item.quantity }}</view>
        </view>
      </view>
    </view>

    <!-- 预约时间 -->
    <view class="section">
      <view class="section-head">
        <Icon name="clock" :size="16" />
        <text class="section-title">预约时间</text>
      </view>
      <view class="time-options">
        <view
          class="time-option"
          :class="{ active: reservationType === 'asap' }"
          @tap="setReservation('asap')"
        >
          <text>尽快</text>
        </view>
        <view
          class="time-option"
          :class="{ active: reservationType === 'scheduled' }"
          @tap="setReservation('scheduled')"
        >
          <text>指定时间</text>
        </view>
      </view>
      <!-- 指定时间展开：日期 pill + 时间选择器 -->
      <view v-if="reservationType === 'scheduled'" class="schedule-panel animate-slide-down">
        <view class="schedule-row">
          <text class="schedule-label">日期</text>
          <view class="date-pills">
            <view
              v-for="opt in dateOptions"
              :key="opt.value"
              class="date-pill"
              :class="{ active: scheduledDate === opt.value }"
              @tap="scheduledDate = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>
        <view class="schedule-row">
          <text class="schedule-label">时间</text>
          <picker mode="time" :value="scheduledTime" @change="onTimeChange">
            <view class="time-picker">
              <text class="time-value">{{ scheduledTime }}</text>
              <Icon name="chevron-down" :size="16" />
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="section">
      <view class="section-head">
        <Icon name="note" :size="16" />
        <text class="section-title">备注</text>
      </view>
      <textarea
        class="note-input"
        v-model="note"
        placeholder="有什么特别要求吗？"
        placeholder-class="note-placeholder"
        :maxlength="200"
        :cursor-spacing="20"
      />
      <text class="note-count">{{ note.length }}/200</text>
    </view>

    <!-- 点单人信息 -->
    <view class="section user-row">
      <text class="section-title">点单人</text>
      <view class="user-info">
        <image v-if="userAvatar" class="user-avatar" :src="userAvatar" mode="aspectFill" />
        <view v-else class="user-avatar placeholder">👤</view>
        <text class="user-name">{{ userName }}</text>
      </view>
    </view>

    <!-- 底部提交 -->
    <view class="bottom-bar">
      <view
        class="submit-btn"
        :class="{ loading: submitting }"
        @tap="onSubmit"
      >
        <view v-if="submitting" class="spinner"></view>
        <text class="submit-text">{{ submitting ? '提交中...' : '提交点单' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/store/cart.js'
import { useUserStore } from '@/store/user.js'
import { WX_CONFIG } from '@/utils/wx-config.js'
import { useSafeArea } from '@/composables/useSafeArea.js'

const { statusBarHeight } = useSafeArea()

const cartStore = useCartStore()
const userStore = useUserStore()

/* === 购物车数据 === */
const cartItems = computed(() => cartStore.activeItems)
const totalCount = computed(() => cartStore.totalCount)

/* === 用户信息 === */
const userName = computed(() => userStore.nickname || '我')
const userAvatar = computed(() => userStore.avatar)

/* === 主题类：根据购物车首项类型决定，默认咖啡 === */
const themeClass = computed(() => {
  const firstType = cartItems.value[0]?.type || 'coffee'
  return `theme-${firstType}`
})

/* === 预约类型与时间 === */
const reservationType = ref('asap') // 'asap' | 'scheduled'
const scheduledDate = ref(0) // 0=今天 1=明天 2=后天
const scheduledTime = ref(getDefaultTime()) // "HH:MM"
const note = ref('')

/* === 日期选项 === */
const dateOptions = [
  { value: 0, label: '今天' },
  { value: 1, label: '明天' },
  { value: 2, label: '后天' }
]

/* === 提交状态 === */
const submitting = ref(false)
const leaving = ref(false) // 提交成功后标记，避免 onShow 空车判断误触发返回

/* === 订阅消息模板 ID（从 utils/wx-config.js 读取，部署时在微信公众平台申请后填入） === */
const COMPLETE_NOTIFY_TPL = WX_CONFIG.subscribeTemplates.completeNotify
const PICKUP_NOTIFY_TPL = WX_CONFIG.subscribeTemplates.pickupNotify

/* === 菜品占位 emoji === */
const dishEmoji = (type) => (type === 'food' ? '🍲' : '☕')

/**
 * 默认时间：当前时间向上取整到下一个半点
 * 避免默认值已过时
 */
function getDefaultTime() {
  const now = new Date()
  let h = now.getHours()
  let m = now.getMinutes()
  if (m > 30) {
    h += 1
    m = 0
  } else if (m > 0) {
    m = 30
  }
  if (h >= 24) h = 23
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/* === 切换预约类型 === */
const setReservation = (type) => {
  reservationType.value = type
}

/* === 时间选择器变更 === */
const onTimeChange = (e) => {
  scheduledTime.value = e.detail.value
}

/* === 计算预约时间戳（scheduled 时使用） === */
const computeReservationTimestamp = () => {
  const now = new Date()
  const target = new Date(now)
  target.setDate(target.getDate() + scheduledDate.value)
  const [h, m] = scheduledTime.value.split(':').map(Number)
  target.setHours(h, m, 0, 0)
  return target.getTime()
}

/**
 * 请求订阅消息授权
 * 两个模板：下单通知、完成通知
 * 模板 ID 未配置时跳过（开发环境兼容）
 * 授权失败也继续（不阻断下单流程）
 */
const requestSubscribe = () => {
  return new Promise((resolve) => {
    // 过滤掉未配置的模板 ID（空字符串），避免 wx.requestSubscribeMessage 报错
    const tmplIds = [COMPLETE_NOTIFY_TPL, PICKUP_NOTIFY_TPL].filter((id) => !!id)
    if (tmplIds.length === 0) {
      console.warn('[submit] 订阅消息模板 ID 未配置，跳过授权')
      resolve(null)
      return
    }

    // #ifdef MP-WEIXIN
    uni.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        console.log('[submit] 订阅消息授权结果', res)
        resolve(res)
      },
      fail: (err) => {
        console.warn('[submit] 订阅消息授权失败', err)
        resolve(null)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    // 非微信小程序环境直接跳过
    resolve(null)
    // #endif
  })
}

/**
 * 提交点单
 * 1. 请求订阅消息授权（失败也继续）
 * 2. 调用 orders-crud 云函数创建订单
 * 3. 成功后清空购物车
 * 4. redirectTo 跳转下单成功页（避免返回键回到提交页）
 */
const onSubmit = async () => {
  if (submitting.value) return
  if (cartItems.value.length === 0) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    return
  }
  // 校验：指定时间需晚于当前时间
  if (reservationType.value === 'scheduled') {
    const ts = computeReservationTimestamp()
    if (ts < Date.now()) {
      uni.showToast({ title: '指定时间需晚于当前时间', icon: 'none' })
      return
    }
  }

  submitting.value = true
  try {
    // 1. 订阅消息授权（失败也继续）
    await requestSubscribe()

    // 2. 调用云函数创建订单（必须传 token，否则 orders-crud 鉴权失败返回 401）
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'orders-crud',
        action: 'create',
        token: userStore.token,
        items: cartStore.activeItems.map((i) => ({
          dishId: i.dishId,
          name: i.name,
          image: i.image,
          quantity: i.quantity,
          type: i.type
        })),
        reservationType: reservationType.value,
        reservationTime:
          reservationType.value === 'scheduled' ? computeReservationTimestamp() : null,
        note: note.value
      }
    })

    if (res.result.code !== 0) {
      throw new Error(res.result.message || '下单失败')
    }

    const orderId = res.result.orderId || res.result.data?._id || res.result.data?.orderId

    // 3. 标记离开并清空购物车
    leaving.value = true
    cartStore.clearCart()

    // 4. 跳转成功页（redirectTo 销毁当前页，避免返回键回到提交页）
    uni.redirectTo({
      url: `/pages/order-success/order-success?id=${orderId}`
    })
  } catch (e) {
    console.error('[submit] 下单失败', e)
    const msg = e?.message || ''
    // 401 未授权：token 失效或未登录，清除本地态并提示用户重启重试
    if (msg.indexOf('未授权') > -1 || msg.indexOf('登录') > -1) {
      userStore.logout()
      uni.showModal({
        title: '登录已失效',
        content: '登录状态已过期，请重启小程序后重试',
        showCancel: false,
        confirmText: '我知道了'
      })
    } else {
      uni.showToast({ title: msg || '下单失败，请重试', icon: 'none' })
    }
  } finally {
    submitting.value = false
  }
}

/* === 返回上一页 === */
const goBack = () => {
  uni.navigateBack()
}

/* === onShow：购物车为空则提示并返回（提交成功离开时跳过） === */
onShow(() => {
  if (leaving.value) return
  if (cartStore.activeItems.length === 0) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 500)
  }
})
</script>

<style lang="scss" scoped>
.page-submit {
  min-height: 100vh;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  background-color: $color-bg;
}

/* === 头部（sticky 固定，滚动时常驻顶部） === */
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
    color: var(--theme-primary);
    transition: color $dur-base $ease-smooth;
  }

  .placeholder {
    width: 72rpx;
  }
}

/* === 通用 section === */
.section {
  margin: 24rpx 32rpx;
  padding: 32rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 24rpx;
  color: var(--theme-primary); // 图标继承此色

  .section-title {
    margin-bottom: 0;
  }

  .section-sub {
    margin-left: auto;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: $font-weight-normal;
  }
}

.section-title {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-text;
  margin-bottom: 24rpx;
}

/* === 菜品列表 === */
.dish-list {
  .dish-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;

    .dish-img {
      width: 88rpx;
      height: 88rpx;
      border-radius: $radius-md;
      background-color: var(--theme-secondary);
      flex-shrink: 0;

      &.placeholder {
        @include flex-center;
        font-size: 44rpx;
      }
    }

    .dish-info {
      flex: 1;
      min-width: 0;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .dish-name {
        font-size: $font-size-base;
        color: $color-text;
        font-weight: $font-weight-medium;
      }

      .dish-desc {
        font-size: $font-size-xs;
        color: $color-text-muted;
        @include ellipsis;
      }
    }

    .dish-qty {
      margin-left: 16rpx;
      flex-shrink: 0;
      font-size: $font-size-sm;
      color: var(--theme-primary);
      font-weight: $font-weight-semibold;
    }
  }
}

/* === 预约时间 === */
.time-options {
  display: flex;
  gap: 24rpx;

  .time-option {
    flex: 1;
    padding: 22rpx 0;
    text-align: center;
    border-radius: $radius-full;
    background-color: $color-muted;
    color: $color-text-muted;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    @include tap-feedback;
    transition: background-color $dur-base $ease-smooth, color $dur-base $ease-smooth;

    &.active {
      background-color: var(--theme-primary);
      color: var(--theme-primary-foreground);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    }
  }
}

/* === 指定时间展开面板 === */
.schedule-panel {
  margin-top: 24rpx;
  padding-top: 28rpx;
  border-top: 2rpx dashed $color-neutral-200;
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .schedule-row {
    @include flex-between;

    .schedule-label {
      font-size: $font-size-sm;
      color: $color-text-muted;
      flex-shrink: 0;
    }
  }

  .date-pills {
    display: flex;
    gap: 12rpx;

    .date-pill {
      padding: 12rpx 24rpx;
      border-radius: $radius-full;
      background-color: $color-muted;
      color: $color-text-muted;
      font-size: $font-size-sm;
      @include tap-feedback;
      transition: background-color $dur-base $ease-smooth, color $dur-base $ease-smooth;

      &.active {
        background-color: var(--theme-primary);
        color: var(--theme-primary-foreground);
      }
    }
  }

  .time-picker {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    border-radius: $radius-full;
    background-color: $color-muted;
    color: var(--theme-primary);
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    @include tap-feedback;

    .time-value {
      color: var(--theme-primary);
    }
  }
}

/* === 备注 === */
.note-input {
  width: 100%;
  min-height: 140rpx;
  padding: 20rpx;
  border-radius: $radius-md;
  background-color: $color-muted;
  font-size: $font-size-base;
  color: $color-text;
  box-sizing: border-box;
  line-height: $line-height-relaxed;
}

.note-placeholder {
  color: $color-text-disabled;
}

.note-count {
  display: block;
  text-align: right;
  margin-top: 10rpx;
  font-size: $font-size-xs;
  color: $color-text-muted;
}

/* === 点单人 === */
.user-row {
  @include flex-between;

  .section-title {
    margin-bottom: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .user-avatar {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background-color: var(--theme-secondary);

      &.placeholder {
        @include flex-center;
        font-size: 28rpx;
      }
    }

    .user-name {
      font-size: $font-size-base;
      color: $color-text;
      font-weight: $font-weight-medium;
    }
  }
}

/* === 底部提交栏 === */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: rgba(255, 251, 245, 0.96);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  @include hairline-bottom(rgba(231, 229, 228, 0.8));

  .submit-btn {
    @include btn-primary;
    width: 100%;
    padding: 28rpx 0;
    border-radius: $radius-full;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
    transition: transform $dur-fast $ease-bounce, opacity $dur-fast $ease-smooth;

    .submit-text {
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

    &.loading {
      opacity: 0.85;
    }
  }
}
</style>
