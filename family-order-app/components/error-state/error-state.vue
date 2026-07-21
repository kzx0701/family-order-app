<template>
  <view class="error-state animate-fade-in">
    <view class="error-emoji">{{ emoji }}</view>
    <view class="error-title">{{ title }}</view>
    <view v-if="desc" class="error-desc">{{ desc }}</view>
    <view v-if="showRetry" class="error-action" @tap="onRetry">
      <view class="retry-icon" :class="{ spinning: retrying }">
        <Icon name="refresh-cw" :size="14" />
      </view>
      <text>{{ retryText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

/**
 * 错误状态组件
 * 用于网络错误、数据加载失败等场景
 *
 * 用法：
 *   <error-state title="加载失败" desc="请检查网络后重试" @retry="loadData" />
 */
const props = defineProps({
  // emoji 图标
  emoji: { type: String, default: '😵' },
  // 错误标题
  title: { type: String, default: '加载失败' },
  // 错误描述（可选）
  desc: { type: String, default: '' },
  // 是否显示重试按钮
  showRetry: { type: Boolean, default: true },
  // 重试按钮文案
  retryText: { type: String, default: '重试' }
})

const emit = defineEmits(['retry'])

// 重试中状态（按钮转圈）
const retrying = ref(false)

const onRetry = async () => {
  if (retrying.value) return
  retrying.value = true
  // 触发 retry 事件，让父组件执行重试
  emit('retry')
  // 最长转圈 3 秒后恢复（父组件不一定通知完成，这里兜底）
  setTimeout(() => {
    retrying.value = false
  }, 3000)
}
</script>

<style lang="scss" scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  gap: 16rpx;

  .error-emoji {
    font-size: 96rpx;
    line-height: 1;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  .error-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-text;
  }

  .error-desc {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
    line-height: $line-height-relaxed;
  }

  .error-action {
    margin-top: 16rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 36rpx;
    border-radius: $radius-full;
    background-color: $color-coffee-100;
    color: $color-coffee-700;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include tap-feedback(0.96);
    transition: transform $dur-fast $ease-smooth;

    .retry-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &.spinning {
        animation: spin 800ms linear infinite;
      }
    }
  }
}
</style>
