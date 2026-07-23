<template>
  <view v-if="visible" class="fo-sheet-root">
    <!-- 遮罩层 -->
    <view class="fo-mask" @tap="onClose"></view>
    <!-- 底部 sheet -->
    <view class="fo-sheet" :class="{ 'fo-sheet--open': show }">
      <!-- 顶部抓手 -->
      <view class="fo-handle"></view>
      <!-- 标题栏 -->
      <view class="fo-header">
        <text class="fo-title">{{ title }}</text>
        <view class="fo-close" @tap="onClose">
          <Icon name="close" :size="20" />
        </view>
      </view>
      <!-- 内容区 -->
      <scroll-view scroll-y class="fo-content" :style="contentStyle">
        <slot />
      </scroll-view>
      <!-- 底部固定操作区（可选）：不随内容滚动 -->
      <view v-if="hasFooter" class="fo-footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 底部弹出 sheet 组件
 * 用于菜品表单、分类管理等场景，减少页面跳转
 *
 * 用法：
 *   <fo-sheet :visible="visible" title="标题" @close="visible = false">
 *     ...内容（滚动区）...
 *     <template #footer>...固定在底部的操作区（可选）...</template>
 *   </fo-sheet>
 */
import { computed, watch, ref, nextTick, useSlots } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // 整个 sheet 的最大高度（含标题栏与底部操作区，如 76vh）
  maxHeight: { type: String, default: '76vh' }
})

const emit = defineEmits(['close'])

const slots = useSlots()
// 是否传入 footer 插槽（有则内容区需为其预留高度）
const hasFooter = computed(() => !!slots.footer)

// 控制 sheet 的滑入动画：visible 变 true 时下一帧再切换到 open 状态
const show = ref(false)
watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        show.value = true
      })
    } else {
      show.value = false
    }
  },
  { immediate: true }
)

/**
 * 内容滚动区最大高度：sheet 总高 - 固定区域高度
 * 无 footer：减去抓手+标题栏约 132rpx（留 8rpx 余量取 140rpx）
 * 有 footer：再减去底部操作区约 124rpx（合计 264rpx）
 * 保证 sheet 整体不超过 maxHeight，底部按钮永远不会被顶出屏幕
 */
const contentStyle = computed(() => ({
  maxHeight: `calc(${props.maxHeight} - ${hasFooter.value ? '264rpx' : '140rpx'})`
}))

const onClose = () => {
  show.value = false
  // 等待下滑动画结束后再触发关闭，避免内容瞬移
  setTimeout(() => {
    emit('close')
  }, 320)
}
</script>

<style lang="scss" scoped>
.fo-sheet-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
}

.fo-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(44, 27, 20, 0.45);
  animation: fadeIn $dur-base $ease-smooth both;
}

.fo-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $color-card;
  border-radius: $radius-2xl $radius-2xl 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -8rpx 32rpx rgba(44, 27, 20, 0.12);
  transform: translateY(100%);
  transition: transform $dur-base $ease-smooth;

  &--open {
    transform: translateY(0);
  }
}

.fo-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: $radius-full;
  background-color: $color-neutral-200;
  margin: 16rpx auto 0;
}

.fo-header {
  @include flex-between;
  padding: 20rpx 40rpx 16rpx;

  .fo-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-coffee-700;
  }

  .fo-close {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background-color: $color-neutral-100;
    color: $color-neutral-500;
    @include flex-center;
    @include tap-feedback(0.9);
  }
}

.fo-content {
  padding: 8rpx 40rpx 40rpx;
  box-sizing: border-box;
}

/* 底部固定操作区：不随内容滚动，顶部细分隔线 */
.fo-footer {
  flex-shrink: 0;
  padding: 20rpx 40rpx 16rpx;
  border-top: 2rpx solid $color-neutral-100;
  background-color: $color-card;
}
</style>
