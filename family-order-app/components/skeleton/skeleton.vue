<template>
  <view class="skeleton-wrap">
    <!-- 卡片骨架：用于订单卡片等 -->
    <template v-if="type === 'card'">
      <view
        v-for="i in count"
        :key="i"
        class="sk-card"
        :class="{ 'is-first': i === 1 }"
      >
        <view class="sk-line sk-line-title"></view>
        <view class="sk-line sk-line-sub"></view>
        <view class="sk-row">
          <view class="sk-line sk-line-meta"></view>
          <view class="sk-line sk-line-meta sk-line-short"></view>
        </view>
      </view>
    </template>

    <!-- 菜品骨架：用于点单页菜品列表 -->
    <template v-else-if="type === 'dish'">
      <view
        v-for="i in count"
        :key="i"
        class="sk-dish"
      >
        <view class="sk-dish-img"></view>
        <view class="sk-dish-info">
          <view class="sk-line sk-line-title"></view>
          <view class="sk-line sk-line-sub"></view>
          <view class="sk-line sk-line-meta"></view>
        </view>
        <view class="sk-dish-action"></view>
      </view>
    </template>

    <!-- 列表骨架：通用列表项 -->
    <template v-else-if="type === 'list'">
      <view
        v-for="i in count"
        :key="i"
        class="sk-list-item"
      >
        <view class="sk-line sk-line-title"></view>
        <view class="sk-line sk-line-sub"></view>
      </view>
    </template>

    <!-- 默认：单行骨架 -->
    <template v-else>
      <view
        v-for="i in count"
        :key="i"
        class="sk-line sk-line-title"
      ></view>
    </template>
  </view>
</template>

<script setup>
/**
 * 骨架屏组件
 * 用于数据加载期间的占位，shimmer 闪光动效让等待更柔和
 *
 * 用法：
 *   <skeleton type="card" :count="3" />      订单卡片占位
 *   <skeleton type="dish" :count="4" />      菜品卡片占位
 *   <skeleton type="list" :count="5" />      通用列表占位
 */
defineProps({
  // 骨架类型：card / dish / list / line
  type: { type: String, default: 'card' },
  // 占位数量
  count: { type: Number, default: 3 }
})
</script>

<style lang="scss" scoped>
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 0;
}

/* 通用骨架块：灰色底 + shimmer 流光 */
.sk-line {
  height: 24rpx;
  border-radius: $radius-sm;
  background-color: $color-neutral-100;
  position: relative;
  overflow: hidden;

  /* shimmer 流光：渐变背景水平移动 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.65) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s $ease-smooth infinite;
  }
}

.sk-line-title {
  width: 60%;
  height: 28rpx;
}

.sk-line-sub {
  width: 40%;
  margin-top: 12rpx;
}

.sk-line-meta {
  width: 30%;
  height: 20rpx;
}

.sk-line-short {
  width: 20%;
}

.sk-row {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

/* === 卡片骨架 === */
.sk-card {
  padding: 24rpx;
  background-color: $color-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &.is-first {
    /* 首卡片更醒目一点，模拟数据焦点 */
  }
}

/* === 菜品骨架 === */
.sk-dish {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;

  .sk-dish-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-lg;
    background-color: $color-neutral-100;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.65) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s $ease-smooth infinite;
    }
  }

  .sk-dish-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .sk-dish-action {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background-color: $color-neutral-100;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.65) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s $ease-smooth infinite;
    }
  }
}

/* === 列表骨架 === */
.sk-list-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid $color-neutral-100;
}

@keyframes shimmer {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
</style>
