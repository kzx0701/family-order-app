<template>
  <view class="page-onboarding">
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="blob blob-coral"></view>
      <view class="blob blob-leaf"></view>
    </view>

    <!-- 顶部：步骤指示 + 标题 -->
    <view class="hero" :style="{ paddingTop: headerTop + 'px' }">
      <view class="step-dots">
        <view class="dot" :class="{ active: step === 1, done: step > 1 }"></view>
        <view class="dot" :class="{ active: step === 2 }"></view>
      </view>
      <text class="hero-title">{{ step === 1 ? '你是男生还是女生' : '平时谁做饭呢' }}</text>
      <text class="hero-sub">
        {{ step === 1 ? '用来给你配一张默认头像' : '选好身份，就能开始了' }}
      </text>
    </view>

    <!-- 第一步：选择性别 -->
    <view v-if="step === 1" class="pick-list">
      <view
        class="pick-card card-female"
        :class="{ selected: pickedGender === 'female' }"
        @tap="pickedGender = 'female'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="genderArt.female" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <text class="pick-tag tag-female">女生</text>
          <text class="pick-name">女生</text>
          <text class="pick-desc">默认头像用女生款</text>
        </view>
        <view class="pick-flag" v-if="pickedGender === 'female'"></view>
      </view>

      <view
        class="pick-card card-male"
        :class="{ selected: pickedGender === 'male' }"
        @tap="pickedGender = 'male'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="genderArt.male" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <text class="pick-tag tag-male">男生</text>
          <text class="pick-name">男生</text>
          <text class="pick-desc">默认头像用男生款</text>
        </view>
        <view class="pick-flag" v-if="pickedGender === 'male'"></view>
      </view>
    </view>

    <!-- 第二步：选择身份 -->
    <view v-else class="pick-list">
      <view
        class="pick-card card-diner"
        :class="{ selected: pickedMode === 'diner' }"
        @tap="pickedMode = 'diner'"
      >
        <view class="mascot-frame">
          <view class="mascot mascot-girl" :class="{ cheer: pickedMode === 'diner' }">
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
          <text class="floatie floatie-heart">♡</text>
          <text class="floatie floatie-star">✦</text>
        </view>
        <view class="pick-body">
          <text class="pick-tag tag-diner">点单</text>
          <text class="pick-name">干饭人</text>
          <text class="pick-desc">我来点单，等吃等喝</text>
        </view>
        <view class="pick-flag" v-if="pickedMode === 'diner'"></view>
      </view>

      <view
        class="pick-card card-cook"
        :class="{ selected: pickedMode === 'cook' }"
        @tap="pickedMode = 'cook'"
      >
        <view class="mascot-frame">
          <view class="mascot mascot-chef" :class="{ cheer: pickedMode === 'cook' }">
            <view class="face">
              <view class="sidehair sidehair-l"></view>
              <view class="sidehair sidehair-r"></view>
              <view class="eye eye-l"><view class="spark"></view></view>
              <view class="eye eye-r"><view class="spark"></view></view>
              <view class="blush blush-l"></view>
              <view class="blush blush-r"></view>
              <view class="mouth"></view>
            </view>
            <view class="chef-hat">
              <view class="hat-puff puff-l"></view>
              <view class="hat-puff puff-m"></view>
              <view class="hat-puff puff-r"></view>
              <view class="hat-band"></view>
            </view>
          </view>
          <text class="floatie floatie-star">✦</text>
          <text class="floatie floatie-leaf">❀</text>
        </view>
        <view class="pick-body">
          <text class="pick-tag tag-cook">做饭</text>
          <text class="pick-name">饲养员</text>
          <text class="pick-desc">我来做饭，管理菜单</text>
        </view>
        <view class="pick-flag" v-if="pickedMode === 'cook'"></view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="footer-actions">
      <view class="action-row">
        <view v-if="step === 2" class="btn-ghost" :class="{ disabled: submitting }" @tap="goStep(1)">
          <text>上一步</text>
        </view>
        <view class="btn-primary" :class="{ disabled: !canGoNext || submitting }" @tap="onPrimary">
          <text>{{ submitting ? '保存中…' : step === 1 ? '下一步' : '进入小程序' }}</text>
        </view>
      </view>

      <view class="skip-link" @tap="onSkip">
        <text>跳过，稍后在「我的」页面设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 信息配置引导页（三段入口的第二段）
 *
 * 两步在同一页面内通过步骤状态切换：
 *   第一步 选择性别（男 / 女）—— 决定默认头像
 *   第二步 选择身份（干饭人 / 饲养员）—— 决定工作模式
 *
 * 整页可跳过：跳过时性别与身份都落为默认值（男 + 干饭人），
 * 并且 onboardingCompleted 置为 true，跳过后不再重复弹出。
 * 性别与身份后续都能在「我的」页面修改、切换。
 */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { imgUrl } from '@/utils/image.js'
import { AVATAR_ART, AVATAR_ART_WIDTH } from '@/utils/artwork.js'
import { HOME_PATH } from '@/utils/auth-guard.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

// 顶部起始位置：本页顶部没有右侧元素，不与微信胶囊争位，留出状态栏 + 48px 即可
const headerTop = computed(() => statusBarHeight.value + 48)

const step = ref(1)
const pickedGender = ref('')
const pickedMode = ref('')
const submitting = ref(false)

// 性别卡片复用默认头像素材
const genderArt = {
  male: imgUrl(AVATAR_ART.male, { w: AVATAR_ART_WIDTH }),
  female: imgUrl(AVATAR_ART.female, { w: AVATAR_ART_WIDTH })
}

const canGoNext = computed(() => (step.value === 1 ? !!pickedGender.value : !!pickedMode.value))

onLoad(() => {
  // 已处理过引导的用户不应再看到本页
  if (userStore.onboardingCompleted) {
    uni.reLaunch({ url: HOME_PATH })
  }
})

/** 步骤切换 */
const goStep = (target) => {
  if (submitting.value) return
  step.value = target
}

/**
 * 主按钮：第一步进入下一步，第二步提交并进入首页
 */
const onPrimary = () => {
  if (submitting.value || !canGoNext.value) return
  if (step.value === 1) {
    goStep(2)
    return
  }
  submit({ gender: pickedGender.value, mode: pickedMode.value })
}

/** 跳过整页引导：由云端落为默认值（男 + 干饭人） */
const onSkip = () => {
  if (submitting.value) return
  submit({})
}

/**
 * 提交引导结果
 * @param {Object} payload
 * @param {string} [payload.gender] - 'male' | 'female'
 * @param {string} [payload.mode] - 'diner' | 'cook'
 */
const submit = async (payload) => {
  submitting.value = true
  try {
    await userStore.completeOnboarding(payload)
    uni.showToast({ title: '设置好啦', icon: 'none' })
    // 延迟跳转，让 toast 完整呈现
    setTimeout(() => {
      uni.reLaunch({ url: HOME_PATH })
    }, 500)
  } catch (e) {
    console.error('[onboarding] submit error', e)
    uni.showToast({ title: e.message || '保存失败，请重试', icon: 'none' })
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-onboarding {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $p2-paper;
  overflow: hidden;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
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
  opacity: 0.4;

  &.blob-coral {
    top: -150rpx;
    right: -130rpx;
    width: 420rpx;
    height: 420rpx;
    background-color: $p2-coral-soft;
  }

  &.blob-leaf {
    bottom: -140rpx;
    left: -140rpx;
    width: 400rpx;
    height: 400rpx;
    background-color: $p2-leaf-soft;
  }
}

/* === 顶部 === */
.hero {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding-left: 60rpx;
  padding-right: 60rpx;
  padding-bottom: 48rpx;

  .step-dots {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 28rpx;

    .dot {
      width: 46rpx;
      height: 10rpx;
      border-radius: 999rpx;
      background-color: rgba(118, 85, 64, 0.2);
      transition: background-color $p2-dur-base $p2-ease, width $p2-dur-base $p2-ease;

      &.active {
        width: 68rpx;
        background-color: $p2-coral;
      }

      &.done {
        background-color: rgba(118, 85, 64, 0.42);
      }
    }
  }

  .hero-title {
    font-size: 52rpx;
    font-weight: 500;
    letter-spacing: 2rpx;
    color: $p2-ink;
  }

  .hero-sub {
    margin-top: 14rpx;
    font-size: 24rpx;
    color: $p2-ink-soft;
  }
}

/* === 选择卡片列表 === */
.pick-list {
  position: relative;
  z-index: 1;
  flex: 1;
  @include flex-column;
  gap: 40rpx;
  padding: 0 48rpx;
}

/* 卡片基础：与首页入口卡同一套手绘语言（深棕描边 + 硬投影 + 不规则圆角 + 轻微旋转） */
.pick-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 36rpx 32rpx;
  border: 4rpx solid $p2-line;
  box-shadow: 9rpx 11rpx 0 rgba(98, 71, 53, 0.16);
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;
  animation: slideUp 0.5s $p2-ease both;

  &:active {
    transform: translate(3rpx, 4rpx) scale(0.98);
    box-shadow: 2rpx 3rpx 0 rgba(98, 71, 53, 0.12);
  }

  &.selected {
    box-shadow: 9rpx 11rpx 0 rgba(98, 71, 53, 0.16), 0 0 0 6rpx rgba(233, 122, 105, 0.3);
  }

  &.card-female {
    background-color: #f6c7b8;
    border-radius: 32rpx 44rpx 29rpx 46rpx;
    transform: rotate(-1deg);
    animation-delay: 0.05s;
  }

  &.card-male {
    background-color: #c9e3e7;
    border-radius: 44rpx 31rpx 47rpx 28rpx;
    transform: rotate(1deg);
    animation-delay: 0.15s;
  }

  &.card-diner {
    background-color: $p2-butter-soft;
    border-radius: 32rpx 44rpx 29rpx 46rpx;
    transform: rotate(-1deg);
    animation-delay: 0.05s;
  }

  &.card-cook {
    background-color: $p2-leaf-soft;
    border-radius: 44rpx 31rpx 47rpx 28rpx;
    transform: rotate(1deg);
    animation-delay: 0.15s;
  }
}

/* 选中标记：手绘勾选圆点 */
.pick-flag {
  position: absolute;
  top: 22rpx;
  right: 26rpx;
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background-color: $p2-coral;
  border: 4rpx solid $p2-white;
}

/* === 性别卡：头像素材圆框 === */
.pick-frame {
  position: relative;
  flex-shrink: 0;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background-color: $p2-white;
  border: 4rpx solid $p2-line;
  overflow: hidden;
  @include flex-center;
}

.pick-art {
  width: 100%;
  height: 100%;
}

/* === 身份卡：CSS 手绘人物相框（与首页/旧角色页同一套画法） === */
.mascot-frame {
  position: relative;
  flex-shrink: 0;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background-color: $p2-white;
  border: 4rpx solid $p2-line;
  @include flex-center;
  overflow: hidden;
}

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
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}

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

/* 通用五官 */
.face {
  position: absolute;
  left: 50%;
  bottom: 4rpx;
  transform: translateX(-50%);
  width: 92rpx;
  height: 84rpx;
  border-radius: 48% 48% 50% 50%;
  background-color: #ffe3c2;
}

.eye {
  position: absolute;
  top: 40rpx;
  width: 12rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #4a2c1a;
  animation: blink 4.2s ease-in-out infinite;

  &.eye-l {
    left: 22rpx;
  }

  &.eye-r {
    right: 22rpx;
  }

  .spark {
    position: absolute;
    top: 2rpx;
    left: 2rpx;
    width: 4rpx;
    height: 4rpx;
    border-radius: 50%;
    background-color: $p2-white;
  }
}

@keyframes blink {
  0%,
  91%,
  100% {
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

.mouth {
  position: absolute;
  left: 50%;
  top: 52rpx;
  transform: translateX(-50%);
  width: 18rpx;
  height: 12rpx;
  border: 3rpx solid transparent;
  border-bottom-color: #c9553e;
  border-radius: 50%;
}

/* 女孩：咖啡棕双丸子头 + 蝴蝶结 */
.mascot-girl {
  .hair-back {
    position: absolute;
    left: 50%;
    bottom: 14rpx;
    transform: translateX(-50%);
    width: 106rpx;
    height: 96rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7b5638;
  }

  .bangs {
    position: absolute;
    top: -8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 84rpx;
    height: 34rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7b5638;
  }

  .bun {
    position: absolute;
    top: 6rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background-color: #7b5638;
    box-shadow: inset -4rpx -4rpx 0 rgba(0, 0, 0, 0.08);

    &.bun-l {
      left: 2rpx;
    }

    &.bun-r {
      right: 2rpx;
    }
  }

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
      background-color: #ff8fab;
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
      background-color: #f7608a;
      z-index: 1;
    }
  }
}

/* 男孩：白色厨师帽 + 两侧头发 */
.mascot-chef {
  .sidehair {
    position: absolute;
    top: 26rpx;
    width: 14rpx;
    height: 26rpx;
    background-color: #5c4033;

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

    .hat-band {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 88rpx;
      height: 22rpx;
      border-radius: 12rpx;
      background-color: #ffffff;
      box-shadow: 0 3rpx 6rpx rgba(44, 27, 20, 0.12);
    }

    .hat-puff {
      position: absolute;
      border-radius: 50%;
      background-color: #ffffff;
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

/* 相框周围的漂浮小装饰 */
.floatie {
  position: absolute;
  font-size: 22rpx;
  line-height: 1;
  z-index: 3;
  animation: floatieDrift 3.6s ease-in-out infinite;

  &.floatie-heart {
    top: 12rpx;
    left: 14rpx;
    color: #f7608a;
  }

  &.floatie-star {
    bottom: 16rpx;
    right: 12rpx;
    color: #ffb020;
    animation-delay: -1.8s;
  }

  &.floatie-leaf {
    top: 14rpx;
    right: 16rpx;
    color: #4a9e5c;
    animation-delay: -0.9s;
  }
}

@keyframes floatieDrift {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-8rpx) scale(1.15);
    opacity: 1;
  }
}

/* === 卡片文字区 === */
.pick-body {
  flex: 1;
  @include flex-column;
  align-items: flex-start;
  gap: 8rpx;

  .pick-tag {
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    background-color: rgba(255, 255, 255, 0.72);
    font-size: 22rpx;
    line-height: 1.5;

    &.tag-female {
      color: #b45309;
    }

    &.tag-male {
      color: #2f6b80;
    }

    &.tag-diner {
      color: #a86612;
    }

    &.tag-cook {
      color: #3f6b2c;
    }
  }

  .pick-name {
    font-size: 40rpx;
    font-weight: 500;
    color: $p2-ink;
  }

  .pick-desc {
    font-size: 24rpx;
    color: rgba(98, 71, 53, 0.78);
  }
}

/* === 底部操作 === */
.footer-actions {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding: 56rpx 48rpx 0;

  .action-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    width: 100%;
  }

  .btn-ghost {
    flex: 0 0 auto;
    padding: 0 36rpx;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid rgba(118, 85, 64, 0.35);
    border-radius: 48rpx 44rpx 48rpx 46rpx;
    font-size: 28rpx;
    color: $p2-ink-soft;
    transition: transform $p2-dur-fast $p2-ease;

    &:active {
      transform: scale(0.97);
    }

    &.disabled {
      opacity: 0.5;
    }
  }

  .btn-primary {
    flex: 1;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $p2-coral;
    border: 4rpx solid $p2-line;
    border-radius: 48rpx 44rpx 48rpx 46rpx;
    box-shadow: $p2-shadow-md;
    font-size: 30rpx;
    color: $p2-white;
    transition: transform $p2-dur-fast $p2-ease, opacity $p2-dur-fast $p2-ease;

    &:active {
      transform: scale(0.97);
    }

    &.disabled {
      opacity: 0.45;
    }
  }

  .skip-link {
    margin-top: 28rpx;
    font-size: 24rpx;
    color: $p2-ink-soft;
    text-decoration: underline;

    &:active {
      opacity: 0.7;
    }
  }
}
</style>
