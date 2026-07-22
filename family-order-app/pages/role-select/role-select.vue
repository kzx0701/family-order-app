<template>
  <view class="page-role page-enter">
    <!-- 背景装饰：浮动彩色光晕 -->
    <view class="bg-decor">
      <view class="blob blob-1"></view>
      <view class="blob blob-2"></view>
      <view class="blob blob-3"></view>
      <view class="bg-dot bg-dot-1">·</view>
      <view class="bg-dot bg-dot-2">·</view>
      <view class="bg-dot bg-dot-3">·</view>
    </view>

    <!-- 顶部问候 -->
    <view class="hero" :style="{ paddingTop: statusBarHeight + 76 + 'px' }">
      <view class="hero-emoji-row">
        <text class="hero-emoji">👀</text>
      </view>
      <text class="hero-title">你是谁呀~</text>
      <text class="hero-sub">选个角色，开启点餐之旅</text>
    </view>

    <!-- 角色卡片 -->
    <view class="role-cards">
      <!-- 下单人（老婆） -->
      <view class="role-card card-orderer" @tap="onSelect('orderer')">
        <view class="card-shine"></view>
        <view class="card-illustration">
          <text class="card-emoji">👩</text>
          <view class="card-icon-badge badge-coffee">
            <Icon name="coffee" :size="18" color="#fff" />
          </view>
        </view>
        <view class="card-body">
          <view class="card-role-tag tag-orderer">下单人</view>
          <text class="card-role-name">老婆大人</text>
          <text class="card-desc">我来点单，等吃等喝</text>
        </view>
        <view class="card-cta">
          <text class="cta-text">选这个</text>
          <Icon name="chevron-right" :size="14" color="#6F4E37" />
        </view>
      </view>

      <!-- 管理员（老公） -->
      <view class="role-card card-admin" @tap="onSelect('admin')">
        <view class="card-shine"></view>
        <view class="card-illustration">
          <text class="card-emoji">👨‍🍳</text>
          <view class="card-icon-badge badge-food">
            <Icon name="settings" :size="18" color="#fff" />
          </view>
        </view>
        <view class="card-body">
          <view class="card-role-tag tag-admin">管理员</view>
          <text class="card-role-name">老公大厨</text>
          <text class="card-desc">我来做饭，管理菜单</text>
        </view>
        <view class="card-cta">
          <text class="cta-text">选这个</text>
          <Icon name="chevron-right" :size="14" color="#15803D" />
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer-hint">
      <text class="hint-text">角色选择后不可更改，请慎重选择</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'

const { statusBarHeight } = useSafeArea()

const userStore = useUserStore()
// 防止重复点击提交
const submitting = ref(false)

/**
 * 选择角色：调用 store.setRole 持久化后跳转首页
 * @param {string} role - 'orderer' | 'admin'
 */
const onSelect = async (role) => {
  if (submitting.value) return
  submitting.value = true
  try {
    await userStore.setRole(role)
    uni.showToast({
      title: role === 'admin' ? '欢迎，大厨！' : '点单吧~',
      icon: 'none'
    })
    // 延迟跳转，让 toast 与点击反馈动效完整呈现
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/home/home' })
    }, 600)
  } catch (e) {
    uni.showToast({ title: e.message || '设置失败', icon: 'none' })
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-role {
  position: relative;
  min-height: 100vh;
  background-color: $color-bg;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

/* === 背景装饰 === */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(48rpx);
  opacity: 0.55;
  animation: floatBlob 9s ease-in-out infinite;

  &.blob-1 {
    top: -140rpx;
    right: -120rpx;
    width: 420rpx;
    height: 420rpx;
    background: radial-gradient(circle, #FFCC80 0%, rgba(255, 204, 128, 0) 70%);
  }

  &.blob-2 {
    top: 38%;
    left: -160rpx;
    width: 380rpx;
    height: 380rpx;
    background: radial-gradient(circle, #BBF7D0 0%, rgba(187, 247, 208, 0) 70%);
    animation-delay: -3s;
  }

  &.blob-3 {
    bottom: -120rpx;
    right: -100rpx;
    width: 340rpx;
    height: 340rpx;
    background: radial-gradient(circle, #FFE0B2 0%, rgba(255, 224, 178, 0) 70%);
    animation-delay: -6s;
  }
}

@keyframes floatBlob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(24rpx, -32rpx) scale(1.1);
  }
}

/* 散落的小圆点装饰 */
.bg-dot {
  position: absolute;
  font-size: 60rpx;
  font-weight: $font-weight-bold;
  color: $color-coffee-200;
  opacity: 0.6;
  animation: floatDot 5s ease-in-out infinite;

  &.bg-dot-1 {
    top: 18%;
    right: 60rpx;
    color: $color-primary-300;
    animation-delay: -1s;
  }

  &.bg-dot-2 {
    top: 62%;
    right: 40rpx;
    color: $color-food-300;
    animation-delay: -2.5s;
  }

  &.bg-dot-3 {
    top: 30%;
    left: 50rpx;
    color: $color-coffee-200;
    animation-delay: -4s;
  }
}

@keyframes floatDot {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-18rpx);
    opacity: 0.9;
  }
}

/* === 顶部问候 === */
.hero {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding: 140rpx 0 56rpx;
  animation: slideDown 0.6s $ease-smooth both;

  .hero-emoji-row {
    margin-bottom: 20rpx;
    animation: pulse 2.4s ease-in-out infinite;
  }

  .hero-emoji {
    font-size: 88rpx;
    line-height: 1;
  }

  .hero-title {
    font-size: 60rpx;
    font-weight: $font-weight-bold;
    color: $color-coffee-800;
    letter-spacing: 2rpx;
  }

  .hero-sub {
    margin-top: 16rpx;
    font-size: $font-size-base;
    color: $color-text-muted;
  }
}

/* === 角色卡片容器 === */
.role-cards {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 36rpx;
  padding: 0 48rpx;
}

/* === 单个卡片 === */
.role-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 40rpx 36rpx;
  border-radius: $radius-2xl;
  box-shadow: 0 8rpx 24rpx rgba(44, 27, 20, 0.12), 0 2rpx 8rpx rgba(44, 27, 20, 0.06);
  overflow: hidden;
  transition: transform $dur-base $ease-bounce, box-shadow $dur-base $ease-smooth;
  animation: slideUp 0.6s $ease-smooth both;

  /* 卡片右上角高光 */
  .card-shine {
    position: absolute;
    top: -50rpx;
    right: -50rpx;
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }

  &.card-orderer {
    background: linear-gradient(135deg, #FFD4C1 0%, #FFB088 100%);
    animation-delay: 0.15s;
  }

  &.card-admin {
    background: linear-gradient(135deg, #C7E8D4 0%, #8FD4A8 100%);
    animation-delay: 0.3s;
  }

  /* 丝滑点击反馈：缩小 + 阴影收紧 */
  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba(44, 27, 20, 0.1), 0 1rpx 3rpx rgba(44, 27, 20, 0.06);
  }
}

/* 卡片插画区 */
.card-illustration {
  position: relative;
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  @include flex-center;

  .card-emoji {
    font-size: 80rpx;
    line-height: 1;
    /* 轻微浮动让插画有呼吸感 */
    animation: pulse 3s ease-in-out infinite;
  }

  .card-icon-badge {
    position: absolute;
    bottom: -2rpx;
    right: -2rpx;
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    @include flex-center;
    box-shadow: $shadow-sm;
    border: 2rpx solid rgba(255, 255, 255, 0.8);

    &.badge-coffee {
      background-color: $color-coffee-600;
    }

    &.badge-food {
      background-color: $color-food-600;
    }
  }
}

/* 卡片文字区 */
.card-body {
  flex: 1;
  @include flex-column;
  gap: 6rpx;

  .card-role-tag {
    align-self: flex-start;
    padding: 4rpx 16rpx;
    border-radius: $radius-full;
    background-color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    line-height: 1.5;

    &.tag-orderer {
      color: #B45309;
    }

    &.tag-admin {
      color: #15803D;
    }
  }

  .card-role-name {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: #fff;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
  }

  .card-desc {
    font-size: $font-size-sm;
    color: rgba(255, 255, 255, 0.94);
  }
}

/* 卡片 CTA 按钮 */
.card-cta {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  padding: 14rpx 24rpx;
  border-radius: $radius-full;
  background-color: rgba(255, 255, 255, 0.96);
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  box-shadow: $shadow-sm;
}

/* === 底部提示 === */
.footer-hint {
  position: relative;
  z-index: 1;
  @include flex-center;
  padding: 56rpx 0 80rpx;
  animation: fadeIn 0.8s $ease-smooth both;
  animation-delay: 0.5s;

  .hint-text {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
