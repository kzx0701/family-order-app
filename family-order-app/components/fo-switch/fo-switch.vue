<template>
  <view
    class="fo-switch"
    :class="{ on: modelValue, disabled }"
    @tap="onToggle"
  >
    <view class="thumb"></view>
  </view>
</template>

<script setup>
/**
 * 自定义开关组件
 * 用于菜品上下架切换等场景
 * 用法：<fo-switch v-model="on" />
 */
const props = defineProps({
  // 开关状态
  modelValue: { type: Boolean, default: false },
  // 禁用
  disabled: { type: Boolean, default: false },
  // 开启时主色（默认咖啡棕）
  activeColor: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const onToggle = () => {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<style lang="scss" scoped>
.fo-switch {
  position: relative;
  width: 88rpx;
  height: 48rpx;
  border-radius: $radius-full;
  background-color: $color-neutral-300;
  transition: background-color $dur-base $ease-smooth;
  flex-shrink: 0;

  .thumb {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 2rpx 6rpx rgba(44, 27, 20, 0.15);
    transition: transform $dur-base $ease-bounce;
  }

  &.on {
    background-color: $color-coffee-600;

    .thumb {
      transform: translateX(40rpx);
    }
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>
