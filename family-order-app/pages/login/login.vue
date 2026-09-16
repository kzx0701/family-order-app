<template>
  <view class="page-login">
    <!-- 背景装饰：手绘风柔和色块 -->
    <view class="bg-decor">
      <view class="blob blob-coral"></view>
      <view class="blob blob-butter"></view>
    </view>

    <block v-if="ready">
      <view class="login-body">
        <!-- 插画位：CSS 手绘占位（冒热气的小碗），后续替换为手绘插画素材 -->
        <view class="login-art">
          <view class="steam steam-a"></view>
          <view class="steam steam-b"></view>
          <view class="bowl-rim"></view>
          <view class="bowl"></view>
        </view>

        <text class="login-title">黑米咖啡</text>
        <text class="login-sub">一起吃饭，好好生活</text>
      </view>

      <view class="login-actions">
        <view class="btn-wechat" :class="{ submitting }" @tap="onLogin">
          <view class="wechat-icon">
            <view class="bubble bubble-big"></view>
            <view class="bubble bubble-small"></view>
          </view>
          <text class="btn-text">{{ submitting ? '登录中…' : '微信一键登录' }}</text>
        </view>
        <text class="login-hint">仅用于识别家庭成员身份，不会获取你的昵称与头像</text>
      </view>
    </block>
  </view>
</template>

<script setup>
/**
 * 登录页（三段入口的第一段）
 *
 * 职责：
 *   1. 作为小程序启动页：onLoad 时恢复本地登录态
 *      - 已登录 → 按引导状态直接跳到引导页或首页，不让已登录用户看到登录页
 *      - 未登录 → 展示登录界面
 *   2. 提供唯一的登录方式：微信一键登录（用户显式点击后调用 uni.login）
 *
 * 说明：
 *   - 不调用 getUserProfile，不申请昵称/头像授权，只完成 openid 识别
 *   - 登录成功后的去向由 onboardingCompleted 决定，与守卫规则一致
 */
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { ONBOARDING_PATH, HOME_PATH } from '@/utils/auth-guard.js'

const userStore = useUserStore()

// 是否已完成启动检查：检查期间不渲染内容，避免已登录用户看到登录界面一闪而过
const ready = ref(false)
// 防止重复点击
const submitting = ref(false)

onLoad(async () => {
  await userStore.restore()
  if (userStore.isLoggedIn) {
    console.log('[login] 已登录，跳过登录页')
    uni.reLaunch({ url: userStore.onboardingCompleted ? HOME_PATH : ONBOARDING_PATH })
    return
  }
  ready.value = true
})

/**
 * 微信一键登录
 */
const onLogin = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await userStore.login()
    console.log('[login] 登录成功', userStore.openid)
    uni.reLaunch({ url: userStore.onboardingCompleted ? HOME_PATH : ONBOARDING_PATH })
  } catch (e) {
    console.error('[login] login error', e)
    uni.showToast({ title: e.message || '登录失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-login {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $p2-paper;
  overflow: hidden;
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
  opacity: 0.42;

  &.blob-coral {
    top: -160rpx;
    right: -140rpx;
    width: 440rpx;
    height: 440rpx;
    background-color: $p2-coral-soft;
  }

  &.blob-butter {
    bottom: -120rpx;
    left: -130rpx;
    width: 380rpx;
    height: 380rpx;
    background-color: $p2-butter-soft;
  }
}

/* === 中部主体 === */
.login-body {
  position: relative;
  z-index: 1;
  flex: 1;
  @include flex-column;
  align-items: center;
  justify-content: center;
  padding: 0 60rpx;
  animation: slideUp 0.5s $p2-ease both;
}

/* 插画位：CSS 占位，尺寸 300×260rpx 见方 */
.login-art {
  position: relative;
  width: 300rpx;
  height: 260rpx;
  margin-bottom: 40rpx;
}

.bowl {
  position: absolute;
  left: 50%;
  bottom: 60rpx;
  transform: translateX(-50%);
  width: 190rpx;
  height: 96rpx;
  background-color: $p2-butter-soft;
  border: 7rpx solid $p2-line;
  border-radius: 0 0 95rpx 95rpx / 0 0 130rpx 130rpx;
}

.bowl-rim {
  position: absolute;
  left: 50%;
  bottom: 150rpx;
  transform: translateX(-50%);
  width: 214rpx;
  height: 26rpx;
  background-color: $p2-white;
  border: 7rpx solid $p2-line;
  border-radius: 999rpx;
}

.steam {
  position: absolute;
  width: 8rpx;
  border-radius: 999rpx;
  background-color: rgba(118, 85, 64, 0.32);
  animation: steamRise 2.8s ease-in-out infinite;

  &.steam-a {
    left: 46%;
    bottom: 196rpx;
    height: 40rpx;
  }

  &.steam-b {
    left: 55%;
    bottom: 208rpx;
    height: 52rpx;
    animation-delay: -1.4s;
  }
}

@keyframes steamRise {
  0%,
  100% {
    transform: translate(-50%, 0);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -16rpx);
    opacity: 0.65;
  }
}

.login-title {
  font-size: 56rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
  color: $p2-ink;
}

.login-sub {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: $p2-ink-soft;
}

/* === 底部操作区 === */
.login-actions {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding: 0 60rpx 90rpx;
  animation: fadeIn 0.6s $p2-ease both;
  animation-delay: 0.15s;
}

.btn-wechat {
  width: 100%;
  height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background-color: $p2-coral;
  border: 6rpx solid $p2-line;
  /* 手绘不规则圆角：避免规整胶囊的机械感 */
  border-radius: 52rpx 48rpx 52rpx 50rpx;
  box-shadow: $p2-shadow-md;
  transition: transform $p2-dur-fast $p2-ease, opacity $p2-dur-fast $p2-ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.92;
  }

  &.submitting {
    opacity: 0.72;
  }
}

.btn-text {
  font-size: 32rpx;
  font-weight: 500;
  color: $p2-white;
  letter-spacing: 2rpx;
}

/* 微信气泡图标：纯 CSS 手绘风，不依赖图片素材 */
.wechat-icon {
  position: relative;
  width: 44rpx;
  height: 40rpx;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background-color: $p2-white;

  &.bubble-big {
    left: 0;
    top: 2rpx;
    width: 32rpx;
    height: 26rpx;
  }

  &.bubble-small {
    right: 0;
    bottom: 2rpx;
    width: 24rpx;
    height: 20rpx;
    border: 3rpx solid $p2-coral;
  }
}

.login-hint {
  margin-top: 26rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: $p2-ink-soft;
  text-align: center;
  opacity: 0.85;
}
</style>
