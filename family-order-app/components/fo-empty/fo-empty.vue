<template>
  <view class="fo-empty">
    <view class="fo-empty-icon">{{ icon }}</view>
    <view class="fo-empty-text">{{ text }}</view>
  </view>
</template>

<script setup>
/**
 * 空状态组件
 * 用于列表无数据时展示
 *
 * 用法：<fo-empty text="还没有菜品" />
 *      <fo-empty text="暂无分类" icon="📝" />
 */
defineProps({
  text: { type: String, default: '暂无数据' },
  // emoji 图标
  icon: { type: String, default: '🍳' }
})
</script>

<style lang="scss" scoped>
.fo-empty {
  @include flex-center;
  @include flex-column;
  padding: 120rpx 40rpx;
  animation: fadeIn $dur-slow $ease-smooth both;

  .fo-empty-icon {
    font-size: 96rpx;
    margin-bottom: 24rpx;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  .fo-empty-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
    line-height: $line-height-relaxed;
  }
}
</style>
