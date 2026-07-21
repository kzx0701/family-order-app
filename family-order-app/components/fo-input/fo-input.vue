<template>
  <view class="fo-input" :class="{ 'has-error': !!error }">
    <view class="fo-label" v-if="label">
      <text class="label-text">{{ label }}</text>
      <text class="label-required" v-if="required">*</text>
    </view>
    <textarea
      v-if="type === 'textarea'"
      class="fo-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :placeholder-style="placeholderStyle"
      auto-height
      @input="onInput"
    />
    <input
      v-else
      class="fo-text"
      :value="modelValue"
      :placeholder="placeholder"
      :placeholder-style="placeholderStyle"
      @input="onInput"
    />
    <view class="fo-error" v-if="error">{{ error }}</view>
  </view>
</template>

<script setup>
/**
 * 表单输入框组件（带 label）
 * 支持 text 与 textarea 两种类型
 *
 * 用法：<fo-input v-model="name" label="名称" required placeholder="请输入" />
 *      <fo-input v-model="desc" type="textarea" label="描述" />
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' }, // text | textarea
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  maxlength: { type: [Number, String], default: -1 }
})

const emit = defineEmits(['update:modelValue'])

const placeholderStyle = computed(() =>
  'color: ' + '#A8A29E'
)

const onInput = (e) => {
  emit('update:modelValue', e.detail.value)
}
</script>

<style lang="scss" scoped>
.fo-input {
  margin-bottom: 24rpx;
}

.fo-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;

  .label-text {
    font-size: $font-size-sm;
    color: $color-text-strong;
    font-weight: $font-weight-medium;
  }

  .label-required {
    margin-left: 4rpx;
    color: $color-state-error;
    font-size: $font-size-sm;
  }
}

.fo-text,
.fo-textarea {
  width: 100%;
  box-sizing: border-box;
  padding-left: 24rpx;
  padding-right: 24rpx;
  background-color: $color-bg-soft;
  border: 2rpx solid transparent;
  border-radius: $radius-md;
  font-size: $font-size-base;
  color: $color-text;
  transition: border-color $dur-fast $ease-smooth, background-color $dur-fast $ease-smooth;
}

.fo-text {
  height: 80rpx;
  line-height: 80rpx;
}

.fo-textarea {
  padding-top: 20rpx;
  padding-bottom: 20rpx;
  min-height: 120rpx;
  line-height: $line-height-normal;
}

.has-error {
  .fo-text,
  .fo-textarea {
    border-color: $color-state-error;
    background-color: #FEF2F2;
  }
}

.fo-error {
  margin-top: 8rpx;
  font-size: $font-size-xs;
  color: $color-state-error;
}
</style>
