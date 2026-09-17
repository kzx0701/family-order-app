<template>
  <view v-if="visible" class="fo-dialog-root" :class="{ 'fo-dialog-root--closing': closing }">
    <!-- 遮罩：点击关闭。遮罩色与 fo-sheet 保持一致（全站统一的遮罩语义色） -->
    <view class="fo-dialog-mask" @tap="onCancel"></view>

    <view class="fo-dialog-layer">
      <view class="fo-dialog-card">
        <text class="fo-dialog-title">{{ title }}</text>
        <text v-if="subtitle" class="fo-dialog-subtitle">{{ subtitle }}</text>

        <view class="fo-dialog-body">
          <slot>
            <!-- 输入模式：不传默认插槽时渲染内置输入框（单字段编辑场景） -->
            <view v-if="input" class="fo-dialog-field" :class="{ 'is-focused': focused }">
              <input
                class="fo-dialog-input"
                :value="modelValue"
                :placeholder="placeholder"
                :maxlength="maxlength"
                :focus="autoFocus"
                :placeholder-style="placeholderStyle"
                confirm-type="done"
                @input="onInput"
                @focus="focused = true"
                @blur="focused = false"
                @confirm="onConfirm"
              />
            </view>
          </slot>
        </view>

        <view class="fo-dialog-actions">
          <view class="fo-dialog-btn fo-dialog-btn--cancel" @tap="onCancel">
            <text>{{ cancelText }}</text>
          </view>
          <view
            class="fo-dialog-btn fo-dialog-btn--confirm"
            :class="{ 'is-disabled': confirmDisabled }"
            @tap="onConfirm"
          >
            <text>{{ confirmText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 通用弹窗组件（第二个视觉阶段）
 *
 * 与一期的 `fo-sheet` 不是同一套视觉：本组件使用二期的奶油白手绘卡语言
 * （不规则圆角 + 深棕描边 + 硬投影 + 手绘体标题），新页面（home / my / recipe /
 * onboarding / login）应优先使用本组件；`fo-sheet` 保留给尚未迁移的一期页面。
 *
 * 用法（输入型）：
 *   <fo-dialog v-model="draft" :visible="show" title="修改昵称" input
 *     :placeholder="当前值" :maxlength="20" @close="show = false" @confirm="submit" />
 *
 * 用法（自定义内容）：传入默认插槽即可，内置输入框自动让位。
 *
 * 关闭时序：与 fo-sheet 一致 —— 先播完出场动效，再向外抛 close，由父组件置 visible=false。
 */
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // 标题下方的小字说明（可选）
  subtitle: { type: String, default: '' },
  // 输入模式：渲染内置输入框
  input: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  maxlength: { type: [Number, String], default: 20 },
  // 打开时是否自动聚焦并唤起键盘。默认开启；纯提示类弹窗可关掉
  autoFocus: { type: Boolean, default: true },
  cancelText: { type: String, default: '取消' },
  confirmText: { type: String, default: '确定' },
  // 主按钮禁用（如输入为空时）
  confirmDisabled: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm', 'update:modelValue'])

const focused = ref(false)
const closing = ref(false)

// 复位：每次打开前清掉上一次的关闭态，避免第二次打开只剩半透明
watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        closing.value = false
      })
    }
  },
  { immediate: true }
)

/**
 * 关闭：先置 closing 触发出场过渡，等动画走完再通知父组件销毁。
 * 时长与 $p2-dur-fast(140ms) 对齐，留一点余量取 180ms。
 */
const requestClose = () => {
  if (closing.value) return
  closing.value = true
  setTimeout(() => {
    emit('close')
  }, 180)
}

const onCancel = () => requestClose()

const onConfirm = () => {
  if (props.confirmDisabled) return
  emit('confirm')
}

const onInput = (e) => {
  emit('update:modelValue', e.detail.value)
}

/**
 * placeholder 走内联样式而非 placeholder-class：
 * scoped 样式不会作用到小程序内部渲染的 placeholder 元素上，class 方案会静默失效。
 * 颜色取 $p2-ink-soft (#8c725e) 的淡化版。
 */
const placeholderStyle = 'color: rgba(140, 114, 94, 0.55)'
</script>

<style lang="scss" scoped>
.fo-dialog-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  /* 需盖住 fixed 的自定义 tabbar（其层级低于此） */
  z-index: 1200;
}

.fo-dialog-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(44, 27, 20, 0.45);
  /* fill-mode 用 backwards 而不是 both：both 会在动画结束后保留终态，
   * 后续的出场过渡（改 opacity）就会被 animation 的填充值压住、播不出来 */
  animation: fadeIn $p2-dur-base $p2-ease backwards;
  transition: opacity $p2-dur-fast $p2-ease;
}

/* 承载层：左右各留 90rpx，卡片宽因此为 570rpx（屏宽的 76%，
 * 与系统弹窗的观感比例接近，不至于铺得太满）。
 * 底部留约 12vh：卡片整体略偏上，输入框聚焦唤起键盘时不会被下半屏压住。 */
.fo-dialog-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  @include flex-center;
  padding: 0 90rpx 12vh;
}

/* 二期手绘卡：奶油白底 + 深棕描边 + 不规则圆角 + 硬投影 */
.fo-dialog-card {
  width: 100%;
  /* 上下左右统一 40rpx：原先上方 44rpx 与下方 40rpx 不对称，也没有存在理由 */
  padding: 40rpx;
  background-color: $p2-white;
  border: 4rpx solid $p2-line;
  border-radius: 34rpx 42rpx 30rpx 40rpx;
  box-shadow: $p2-shadow-md;
  animation: slideUp $p2-dur-base $p2-ease backwards;
  transition: opacity $p2-dur-fast $p2-ease, transform $p2-dur-fast $p2-ease;
}

/* 出场：整体淡出并轻微下沉，与入场的上浮方向相反但不回弹 */
.fo-dialog-root--closing {
  .fo-dialog-mask {
    opacity: 0;
  }

  .fo-dialog-card {
    opacity: 0;
    transform: translateY(18rpx);
  }
}

.fo-dialog-title {
  display: block;
  text-align: center;
  /* 手绘体：单字重，固定 normal 避免合成加粗糊掉笔触（首页 / 引导页 / 登录页同样处理） */
  font-family: $p2-font-hand, $p2-font-fallback;
  /* $p2-fs-title（36rpx）。依据不是「看上去该多大」，而是三条：
   * ① 项目一期 fo-sheet 的弹窗标题 = $font-size-lg(32rpx)，二期对齐并上浮一档；
   * ② iOS HIG 的 Alert 标题 17pt ≈ 34rpx（Material 3 的 24sp ≈ 48rpx 属另一套更重的语言，
   *    本项目是 iOS 风格的暖色手绘风，取 iOS 那一档）；
   * ③ 与控件文字（$p2-fs-control 32rpx）差一档，层级比 1.125 —— 与一期 fo-sheet 的
   *    标题/正文比（32/28 ≈ 1.14）同量级。手绘体不能加字重（会合成加粗糊掉笔触），
   *    层级只能靠这一档字号差表达。 */
  font-size: $p2-fs-title;
  font-weight: normal;
  line-height: 1.3;
  color: $p2-ink;
}

.fo-dialog-subtitle {
  display: block;
  margin-top: 10rpx;
  text-align: center;
  font-size: $p2-fs-caption;
  line-height: 1.5;
  color: $p2-ink-soft;
}

.fo-dialog-body {
  margin-top: 36rpx;
}

/* 输入框：内嵌奶油底 + 描边，聚焦时描边转珊瑚色 */
.fo-dialog-field {
  height: 96rpx;
  padding: 0 28rpx;
  background-color: $p2-paper;
  border: 3rpx solid $p2-line;
  border-radius: 20rpx 26rpx 18rpx 24rpx;
  transition: border-color $p2-dur-fast $p2-ease;

  &.is-focused {
    border-color: $p2-coral;
  }
}

.fo-dialog-input {
  width: 100%;
  height: 100%;
  /* 控件文字统一此档（输入框与按钮同号）。32rpx 同时是小程序 input 的默认字号 */
  font-size: $p2-fs-control;
  color: $p2-ink;
}

.fo-dialog-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 36rpx;
}

.fo-dialog-btn {
  /* 与输入框等高同字号：96rpx 高 + $p2-fs-control。原先 92rpx / 30rpx 与输入框各差一档，
   * 弹窗里这三块控件本就该是同一套尺寸 */
  height: 96rpx;
  font-size: $p2-fs-control;
  flex: 1;
  letter-spacing: 1rpx;
  border: 3rpx solid $p2-line;
  @include flex-center;
  transition: transform $p2-dur-tap $p2-ease;

  &:active {
    transform: scale(0.97);
  }

  /* 两个按钮等宽（各占一半）：主次已由「描边 vs 实心珊瑚」承担，
 * 再靠宽度拉开就会显得两边不齐 —— 系统弹窗也是等宽的 */
  &--cancel {
    background-color: $p2-paper;
    color: $p2-ink;
    border-radius: 44rpx 40rpx 46rpx 42rpx;
  }

  /* 主操作：珊瑚底 + 硬投影，与登录按钮同一套语言 */
  &--confirm {
    background-color: $p2-coral;
    color: $p2-white;
    border-radius: 40rpx 46rpx 42rpx 44rpx;
    box-shadow: $p2-shadow-sm;

    &.is-disabled {
      opacity: 0.45;
    }
  }
}
</style>
