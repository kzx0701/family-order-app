<template>
  <view class="default-avatar">
    <!-- 背景高光 -->
    <view class="bg-glow"></view>
    <!-- 卡通厨师角色 -->
    <view class="chef-char">
      <!-- 厨师帽 -->
      <view class="chef-hat">
        <view class="hat-puff p-center"></view>
        <view class="hat-puff p-left"></view>
        <view class="hat-puff p-right"></view>
        <view class="hat-band"></view>
      </view>
      <!-- 脸 -->
      <view class="face">
        <view class="eye eye-l"></view>
        <view class="eye eye-r"></view>
        <view class="blush blush-l"></view>
        <view class="blush blush-r"></view>
        <view class="smile"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 默认头像组件
 * 纯 CSS 绘制的卡通厨师头像，带眨眼和浮动动画
 * 尺寸由父容器决定（width/height: 100%）
 *
 * 用法：<default-avatar />  放在任意尺寸的圆形父容器中
 */
</script>

<style lang="scss" scoped>
.default-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #F0C896 0%, #6F4E37 100%);
}

/* 背景高光：左上角柔光，增加立体感 */
.bg-glow {
  position: absolute;
  top: 8%;
  left: 12%;
  width: 45%;
  height: 45%;
  background: radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* 厨师角色容器：整体上下浮动 */
.chef-char {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 帽子在顶部，视觉重心略偏上，padding-bottom 让角色整体上移一点更协调 */
  padding-bottom: 6%;
  animation: chefFloat 3s ease-in-out infinite;
}

/* 厨师帽 */
.chef-hat {
  position: relative;
  width: 58%;
  height: 30%;
  margin-bottom: -6%;
  z-index: 2;

  .hat-puff {
    position: absolute;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.08);
  }

  .p-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 55%;
    height: 75%;
  }
  .p-left {
    top: 18%;
    left: 0;
    width: 38%;
    height: 55%;
  }
  .p-right {
    top: 18%;
    right: 0;
    width: 38%;
    height: 55%;
  }

  .hat-band {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 88%;
    height: 28%;
    background: #fff;
    border-radius: 4rpx 4rpx 8rpx 8rpx;
  }
}

/* 脸 */
.face {
  position: relative;
  width: 48%;
  height: 48%;
  background: linear-gradient(180deg, #FFE0CC 0%, #FFD0B8 100%);
  border-radius: 50%;
  z-index: 1;
  box-shadow: inset 0 -8% 12% rgba(0,0,0,0.06);

  .eye {
    position: absolute;
    top: 32%;
    width: 11%;
    height: 11%;
    min-width: 5rpx;
    min-height: 5rpx;
    background: #3D2817;
    border-radius: 50%;
    animation: blink 4s ease-in-out infinite;

    &.eye-l { left: 28%; }
    &.eye-r { right: 28%; }
  }

  .blush {
    position: absolute;
    top: 55%;
    width: 15%;
    height: 10%;
    background: rgba(255, 120, 120, 0.35);
    border-radius: 50%;

    &.blush-l { left: 12%; }
    &.blush-r { right: 12%; }
  }

  .smile {
    position: absolute;
    bottom: 22%;
    left: 50%;
    transform: translateX(-50%);
    width: 22%;
    height: 10%;
    border: 2rpx solid #3D2817;
    border-top: none;
    border-radius: 0 0 100% 100%;
  }
}

@keyframes chefFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3%); }
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  94% { transform: scaleY(0.1); }
}
</style>
