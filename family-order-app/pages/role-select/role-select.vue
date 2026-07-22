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
      <view
        class="role-card card-orderer"
        :class="{ selected: selectingRole === 'orderer' }"
        @tap="onSelect('orderer')"
      >
        <view class="card-shine"></view>

        <!-- Q 版女孩：咖啡棕双丸子头 + 蝴蝶结，眼睛会眨 -->
        <view class="mascot-frame frame-orderer">
          <view class="mascot mascot-girl" :class="{ cheer: selectingRole === 'orderer' }">
            <view class="hair-back"></view>
            <view class="bun bun-l"></view>
            <view class="bun bun-r"></view>
            <view class="face">
              <view class="bangs"></view>
              <view class="eye eye-l"><view class="spark"></view></view>
              <view class="eye eye-r"><view class="spark"></view></view>
              <view class="blush blush-l"></view>
              <view class="blush blush-r"></view>
              <view class="mouth"></view>
            </view>
            <view class="bow"><view class="bow-knot"></view></view>
          </view>
          <!-- 漂浮小装饰 -->
          <text class="floatie floatie-heart">♡</text>
          <text class="floatie floatie-star">✦</text>
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
      <view
        class="role-card card-admin"
        :class="{ selected: selectingRole === 'admin' }"
        @tap="onSelect('admin')"
      >
        <view class="card-shine"></view>

        <!-- Q 版厨师男孩：白色蓬松厨师帽，眼睛会眨 -->
        <view class="mascot-frame frame-admin">
          <view class="mascot mascot-chef" :class="{ cheer: selectingRole === 'admin' }">
            <view class="face">
              <view class="sidehair sidehair-l"></view>
              <view class="sidehair sidehair-r"></view>
              <view class="eye eye-l"><view class="spark"></view></view>
              <view class="eye eye-r"><view class="spark"></view></view>
              <view class="blush blush-l"></view>
              <view class="blush blush-r"></view>
              <view class="mouth"></view>
            </view>
            <!-- 厨师帽：帽檐 + 三团蓬松帽顶 -->
            <view class="chef-hat">
              <view class="hat-puff puff-l"></view>
              <view class="hat-puff puff-m"></view>
              <view class="hat-puff puff-r"></view>
              <view class="hat-band"></view>
            </view>
          </view>
          <!-- 漂浮小装饰 -->
          <text class="floatie floatie-star">✦</text>
          <text class="floatie floatie-leaf">❀</text>
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
// 正在选中的角色：触发人物 cheer 弹跳与卡片发光
const selectingRole = ref('')

/**
 * 选择角色：调用 store.setRole 持久化后跳转首页
 * @param {string} role - 'orderer' | 'admin'
 */
const onSelect = async (role) => {
  if (submitting.value) return
  submitting.value = true
  selectingRole.value = role
  try {
    await userStore.setRole(role)
    uni.showToast({
      title: role === 'admin' ? '欢迎，大厨！' : '点单吧~',
      icon: 'none'
    })
    // 延迟跳转，让 toast 与人物 cheer 动效完整呈现
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/home/home' })
    }, 600)
  } catch (e) {
    uni.showToast({ title: e.message || '设置失败', icon: 'none' })
    submitting.value = false
    selectingRole.value = ''
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

  /* 选中瞬间：卡片发光提亮，配合人物 cheer 弹跳 */
  &.selected {
    box-shadow: 0 12rpx 36rpx rgba(255, 255, 255, 0.45),
      0 8rpx 24rpx rgba(44, 27, 20, 0.14);
  }
}

/* ============================================================
 * Q 版人物（纯 CSS 手绘，小程序零素材依赖）
 * 结构：白色天鹅绒相框 > mascot 头部组合
 * ============================================================ */
.mascot-frame {
  position: relative;
  flex-shrink: 0;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background: linear-gradient(160deg, #FFFDF9 0%, #FFF3E4 100%);
  border: 4rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 6rpx 16rpx rgba(44, 27, 20, 0.14),
    inset 0 -6rpx 12rpx rgba(44, 27, 20, 0.05);
  @include flex-center;
  overflow: hidden;
}

/* 人物整体：轻微上下浮动，有生命力 */
.mascot {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  animation: mascotBob 3.2s ease-in-out infinite;

  &.cheer {
    animation: cheerJump 0.6s $ease-bounce;
  }
}

@keyframes mascotBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}

/* 选中时的开心跳：上跃 + 微倾斜回弹 */
@keyframes cheerJump {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
  40% {
    transform: translateY(-18rpx) scale(1.1) rotate(-4deg);
  }
  70% {
    transform: translateY(2rpx) scale(0.97) rotate(2deg);
  }
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
}

/* --- 通用五官 --- */
.face {
  position: absolute;
  left: 50%;
  bottom: 4rpx;
  transform: translateX(-50%);
  width: 92rpx;
  height: 84rpx;
  border-radius: 48% 48% 50% 50%;
  background-color: #FFE3C2;
}

.eye {
  position: absolute;
  top: 40rpx;
  width: 12rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #4A2C1A;
  animation: blink 4.2s ease-in-out infinite;

  &.eye-l {
    left: 22rpx;
  }

  &.eye-r {
    right: 22rpx;
  }

  /* 眼睛高光点 */
  .spark {
    position: absolute;
    top: 2rpx;
    left: 2rpx;
    width: 4rpx;
    height: 4rpx;
    border-radius: 50%;
    background-color: #fff;
  }
}

/* 眨眼：周期内快速压扁一次 */
@keyframes blink {
  0%, 91%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.08);
  }
}

.blush {
  position: absolute;
  top: 56rpx;
  width: 16rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: rgba(255, 139, 139, 0.65);

  &.blush-l {
    left: 12rpx;
  }

  &.blush-r {
    right: 12rpx;
  }
}

/* 微笑：下弯弧线 */
.mouth {
  position: absolute;
  left: 50%;
  top: 52rpx;
  transform: translateX(-50%);
  width: 18rpx;
  height: 12rpx;
  border: 3rpx solid transparent;
  border-bottom-color: #C9553E;
  border-radius: 50%;
}

/* --- 女孩专属：咖啡棕双丸子头 --- */
.mascot-girl {
  .hair-back {
    position: absolute;
    left: 50%;
    bottom: 14rpx;
    transform: translateX(-50%);
    width: 106rpx;
    height: 96rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7B5638;
  }

  /* 刘海：盖在额头上的半圆 */
  .bangs {
    position: absolute;
    top: -8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 84rpx;
    height: 34rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7B5638;
  }

  /* 双丸子 */
  .bun {
    position: absolute;
    top: 6rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background-color: #7B5638;
    box-shadow: inset -4rpx -4rpx 0 rgba(0, 0, 0, 0.08);

    &.bun-l {
      left: 2rpx;
    }

    &.bun-r {
      right: 2rpx;
    }
  }

  /* 粉色蝴蝶结（右丸子旁） */
  .bow {
    position: absolute;
    top: 4rpx;
    right: -2rpx;
    width: 26rpx;
    height: 16rpx;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      width: 12rpx;
      height: 16rpx;
      background-color: #FF8FAB;
    }

    &::before {
      left: 0;
      border-radius: 8rpx 2rpx 2rpx 8rpx;
      transform: rotate(-14deg);
    }

    &::after {
      right: 0;
      border-radius: 2rpx 8rpx 8rpx 2rpx;
      transform: rotate(14deg);
    }

    .bow-knot {
      position: absolute;
      left: 50%;
      top: 4rpx;
      transform: translateX(-50%);
      width: 8rpx;
      height: 8rpx;
      border-radius: 50%;
      background-color: #F7608A;
      z-index: 1;
    }
  }
}

/* --- 厨师男孩专属：白色厨师帽 --- */
.mascot-chef {
  /* 脸两侧露出的头发 */
  .sidehair {
    position: absolute;
    top: 26rpx;
    width: 14rpx;
    height: 26rpx;
    background-color: #5C4033;

    &.sidehair-l {
      left: -4rpx;
      border-radius: 8rpx 0 0 8rpx;
    }

    &.sidehair-r {
      right: -4rpx;
      border-radius: 0 8rpx 8rpx 0;
    }
  }

  .chef-hat {
    position: absolute;
    left: 50%;
    bottom: 66rpx;
    transform: translateX(-50%);
    width: 96rpx;
    height: 56rpx;
    z-index: 2;

    /* 帽檐 */
    .hat-band {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 88rpx;
      height: 22rpx;
      border-radius: 12rpx;
      background-color: #FFFFFF;
      box-shadow: 0 3rpx 6rpx rgba(44, 27, 20, 0.12);
    }

    /* 三团蓬松帽顶 */
    .hat-puff {
      position: absolute;
      border-radius: 50%;
      background-color: #FFFFFF;
      box-shadow: inset -4rpx -4rpx 0 rgba(44, 27, 20, 0.05);

      &.puff-l {
        left: 8rpx;
        bottom: 12rpx;
        width: 34rpx;
        height: 34rpx;
      }

      &.puff-m {
        left: 50%;
        bottom: 18rpx;
        transform: translateX(-50%);
        width: 40rpx;
        height: 40rpx;
      }

      &.puff-r {
        right: 8rpx;
        bottom: 12rpx;
        width: 34rpx;
        height: 34rpx;
      }
    }
  }
}

/* --- 相框周围的漂浮小装饰 --- */
.floatie {
  position: absolute;
  font-size: 22rpx;
  line-height: 1;
  animation: floatieDrift 3.6s ease-in-out infinite;
  z-index: 3;

  &.floatie-heart {
    top: 12rpx;
    left: 14rpx;
    color: #F7608A;
  }

  &.floatie-star {
    bottom: 16rpx;
    right: 12rpx;
    color: #FFB020;
    animation-delay: -1.8s;
  }

  &.floatie-leaf {
    top: 14rpx;
    right: 16rpx;
    color: #4A9E5C;
    animation-delay: -0.9s;
  }
}

@keyframes floatieDrift {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-8rpx) scale(1.15);
    opacity: 1;
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
