<template>
  <view class="status-badge" :style="badgeStyle">
    <view class="status-dot" :style="dotStyle"></view>
    <text class="status-label">{{ label }}</text>
  </view>
</template>

<script setup>
/**
 * 状态徽章组件
 * 用于订单/菜品等状态展示，颜色随状态丝滑过渡
 *
 * 用法：<status-badge status="pending" />
 *      <status-badge :status="order.status" />
 *
 * 颜色规范（Task 4 约定）：
 *   pending    暖橙
 *   preparing  蓝色
 *   completed  绿色
 *   cancelled  灰色
 */
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

// 状态映射表：label 文案 + 背景色 + 前景色 + 点颜色
const STATUS_MAP = {
  pending: { label: '待制作', bg: '#FFF7ED', fg: '#C2410C', dot: '#FB923C' }, // 暖橙
  preparing: { label: '制作中', bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6' }, // 蓝色
  completed: { label: '已完成', bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' }, // 绿色
  cancelled: { label: '已取消', bg: '#F9FAFB', fg: '#6B7280', dot: '#9CA3AF' } // 灰色
}

const info = computed(() => STATUS_MAP[props.status] || STATUS_MAP.pending)

const label = computed(() => info.value.label)

const badgeStyle = computed(() => ({
  backgroundColor: info.value.bg,
  color: info.value.fg
}))

const dotStyle = computed(() => ({
  backgroundColor: info.value.dot
}))
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  /* 颜色变化时丝滑过渡 */
  transition: background-color $dur-base $ease-smooth, color $dur-base $ease-smooth;

  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.6);
    /* pending 状态加呼吸动效，吸引管理员注意 */
    animation: dotPulse 1.6s $ease-smooth infinite;
    transition: background-color $dur-base $ease-smooth;
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.85);
  }
}
</style>
