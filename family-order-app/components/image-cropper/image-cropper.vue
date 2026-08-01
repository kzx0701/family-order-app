<template>
  <view v-if="visible" class="cropper-root">
    <!-- 遮罩 -->
    <view
      class="cropper-mask"
      :class="{ 'is-show': show }"
      @tap="onCancel"
      @touchmove.stop.prevent="noop"
    />

    <!-- 面板 -->
    <view class="cropper-panel" :class="{ 'is-show': show }">
      <!-- 顶部栏 -->
      <view class="cropper-header">
        <text class="header-btn cancel" @tap="onCancel">取消</text>
        <text class="header-title">裁剪图片</text>
        <text class="header-btn confirm" @tap="onConfirm">完成</text>
      </view>

      <!-- 裁剪区 -->
      <view class="cropper-body">
        <!-- 裁剪视口：图片在框内拖动/缩放，框外区域压暗 -->
        <view
          class="crop-viewport"
          :style="{ width: viewportW + 'px', height: viewportH + 'px' }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
        >
          <image
            v-if="displaySrc"
            class="crop-image"
            :src="displaySrc"
            mode="scaleToFill"
            :style="imageStyle"
          />
          <!-- 三分构图网格 -->
          <view class="grid-line g-h1" />
          <view class="grid-line g-h2" />
          <view class="grid-line g-v1" />
          <view class="grid-line g-v2" />
        </view>

        <!-- 比例切换 -->
        <view class="ratio-row">
          <view class="ratio-chip" :class="{ active: ratio === 1 }" @tap="setRatio(1)">
            <text>方形 1:1</text>
          </view>
          <view class="ratio-chip" :class="{ active: ratio === RATIO_43 }" @tap="setRatio(RATIO_43)">
            <text>横版 4:3</text>
          </view>
        </view>

        <!-- 缩放控制 -->
        <view class="zoom-row">
          <view class="zoom-btn" @tap="zoomStep(-1)">
            <Icon name="minus" :size="14" />
          </view>
          <slider
            class="zoom-slider"
            :value="zoomPercent"
            min="0"
            max="100"
            activeColor="#F59E0B"
            backgroundColor="rgba(255,255,255,0.18)"
            block-size="18"
            block-color="#fff"
            @changing="onSliderChanging"
            @change="onSliderChange"
          />
          <view class="zoom-btn" @tap="zoomStep(1)">
            <Icon name="plus" :size="14" />
          </view>
        </view>
        <text class="cropper-hint">拖动图片调整位置，双指或滑块缩放</text>
      </view>

      <!-- 导出用 canvas（离屏隐藏，仅确认时绘制） -->
      <canvas type="2d" id="crop-export-canvas" class="export-canvas" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'

const props = defineProps({
  // 是否显示
  visible: { type: Boolean, default: false },
  // 待裁剪图片（本地临时路径或远程 URL；远程 URL 需先下载为本地文件）
  imageSrc: { type: String, default: '' },
  // 裁剪框宽高比（宽/高）：1 = 方形，4/3 = 横版
  ratio: { type: Number, default: 1 },
  // 导出图片最长边（px）
  outputSize: { type: Number, default: 800 }
})

const emit = defineEmits(['confirm', 'cancel'])
const instance = getCurrentInstance()

const RATIO_43 = 4 / 3
const MIN_SCALE = 1
const MAX_SCALE = 4

const noop = () => {}
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* === 面板动画 === */
const show = ref(false)

/* === 图片与视口 === */
const displaySrc = ref('')
const imgW = ref(0)
const imgH = ref(0)
const viewportW = ref(300)
const viewportH = ref(300)
// 视口在屏幕中的位置（供双指缩放锚点换算）
const viewportRect = { left: 0, top: 0 }

/* === 变换状态 === */
const ratio = ref(props.ratio)
const baseScale = ref(1) // 图片铺满视口的基准缩放（显示 px / 源图 px）
const scale = ref(1)     // 相对基准的倍数（1~4）
const offsetX = ref(0)
const offsetY = ref(0)
const exporting = ref(false)

/* === 计算显示尺寸 === */
const dispW = computed(() => imgW.value * baseScale.value * scale.value)
const dispH = computed(() => imgH.value * baseScale.value * scale.value)

const imageStyle = computed(() => ({
  width: dispW.value + 'px',
  height: dispH.value + 'px',
  transform: `translate(${offsetX.value}px, ${offsetY.value}px)`
}))

/* === 缩放滑块百分比 === */
const zoomPercent = computed(() =>
  Math.round(((scale.value - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100)
)

/* === 打开/关闭 === */
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      ratio.value = props.ratio
      displaySrc.value = props.imageSrc || ''
      exporting.value = false
      await nextTick()
      measureViewport()
      show.value = true
      // 面板滑入动画结束后重新测量视口屏幕位置（双指缩放锚点需准确）
      setTimeout(() => measureViewport(), 350)
      if (displaySrc.value) loadImage()
    } else {
      show.value = false
    }
  },
  { immediate: true }
)

/* 初始视口尺寸：适配屏幕宽度 */
const sys = uni.getSystemInfoSync()
const initViewportW = Math.min(320, (sys.windowWidth || 375) - 40)
viewportW.value = initViewportW
viewportH.value = initViewportW / ratio.value

/* 测量视口实际位置（供双指缩放锚点） */
const measureViewport = () => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select('.crop-viewport')
    .boundingClientRect((rect) => {
      if (rect) {
        viewportW.value = rect.width
        viewportH.value = rect.height
        viewportRect.left = rect.left
        viewportRect.top = rect.top
      }
    })
    .exec()
}

/* 加载图片并重置变换 */
const loadImage = () => {
  uni.getImageInfo({
    src: displaySrc.value,
    success: (res) => {
      imgW.value = res.width || 1
      imgH.value = res.height || 1
      resetTransform()
    },
    fail: () => {
      uni.showToast({ title: '图片加载失败', icon: 'none' })
    }
  })
}

/* 重置：图片铺满视口并居中 */
const resetTransform = () => {
  if (!imgW.value || !imgH.value) return
  const w = viewportW.value
  const h = viewportH.value
  baseScale.value = Math.max(w / imgW.value, h / imgH.value)
  scale.value = MIN_SCALE
  offsetX.value = (w - imgW.value * baseScale.value) / 2
  offsetY.value = (h - imgH.value * baseScale.value) / 2
}

/* 偏移量钳制：图片必须始终盖住视口 */
const clampOffsets = () => {
  const w = viewportW.value
  const h = viewportH.value
  const dw = dispW.value
  const dh = dispH.value
  offsetX.value = Math.min(0, Math.max(w - dw, offsetX.value))
  offsetY.value = Math.min(0, Math.max(h - dh, offsetY.value))
}

/* 以视口内锚点缩放 */
const applyZoom = (nextScale, anchorX, anchorY) => {
  const k = nextScale / scale.value
  offsetX.value = anchorX - (anchorX - offsetX.value) * k
  offsetY.value = anchorY - (anchorY - offsetY.value) * k
  scale.value = nextScale
  clampOffsets()
}

/* === 触摸：单指拖动 / 双指缩放 === */
const touches = new Map()
let lastPoint = { x: 0, y: 0 }
let pinchStartDist = 0
let pinchStartScale = 1

const onTouchStart = (e) => {
  const list = e.touches || []
  touches.clear()
  list.forEach((t) => touches.set(t.identifier, t))
  if (touches.size === 1) {
    const p = touches.values().next().value
    lastPoint = { x: p.clientX, y: p.clientY }
  } else if (touches.size >= 2) {
    const pts = [...touches.values()].slice(0, 2)
    pinchStartDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY)
    pinchStartScale = scale.value
  }
}

const onTouchMove = (e) => {
  const list = e.touches || []
  touches.clear()
  list.forEach((t) => touches.set(t.identifier, t))
  if (touches.size === 1) {
    const p = touches.values().next().value
    offsetX.value += p.clientX - lastPoint.x
    offsetY.value += p.clientY - lastPoint.y
    lastPoint = { x: p.clientX, y: p.clientY }
    clampOffsets()
  } else if (touches.size >= 2) {
    const pts = [...touches.values()].slice(0, 2)
    const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY)
    const mid = {
      x: (pts[0].clientX + pts[1].clientX) / 2,
      y: (pts[0].clientY + pts[1].clientY) / 2
    }
    if (pinchStartDist > 0) {
      const nextScale = clamp(
        pinchStartScale * (dist / pinchStartDist),
        MIN_SCALE,
        MAX_SCALE
      )
      applyZoom(nextScale, mid.x - viewportRect.left, mid.y - viewportRect.top)
    }
  }
}

const onTouchEnd = () => {
  touches.clear()
}

/* === 按钮/滑块缩放 === */
const zoomStep = (dir) => {
  const next = clamp(scale.value * (dir > 0 ? 1.2 : 1 / 1.2), MIN_SCALE, MAX_SCALE)
  applyZoom(next, viewportW.value / 2, viewportH.value / 2)
}

const setZoomFromPercent = (p) => {
  const next = MIN_SCALE + ((MAX_SCALE - MIN_SCALE) * p) / 100
  applyZoom(next, viewportW.value / 2, viewportH.value / 2)
}

const onSliderChanging = (e) => setZoomFromPercent(e.detail.value)
const onSliderChange = (e) => setZoomFromPercent(e.detail.value)

/* === 比例切换 === */
const setRatio = (r) => {
  if (ratio.value === r) return
  ratio.value = r
  viewportH.value = viewportW.value / r
  measureViewport()
  resetTransform()
}

/* === 取消 === */
const onCancel = () => {
  if (exporting.value) return
  emit('cancel')
}

/* === 确认：绘制到离屏 canvas 并导出临时文件 === */
const onConfirm = () => {
  if (exporting.value || !displaySrc.value) return
  exporting.value = true
  uni.showLoading({ title: '生成中...', mask: true })
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select('#crop-export-canvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      const canvas = res && res[0] && res[0].node
      if (!canvas || !canvas.getContext) {
        uni.hideLoading()
        exporting.value = false
        uni.showToast({ title: '裁剪导出失败，请重试', icon: 'none' })
        return
      }
      const outW = Math.round(props.outputSize)
      const outH = Math.max(1, Math.round(props.outputSize / ratio.value))
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')

      const img = canvas.createImage()
      img.onload = () => {
        const bs = baseScale.value * scale.value
        const srcX = -offsetX.value / bs
        const srcY = -offsetY.value / bs
        const srcW = viewportW.value / bs
        const srcH = viewportH.value / bs
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
        uni.canvasToTempFilePath({
          canvas,
          fileType: 'jpg',
          quality: 0.9,
          success: (r) => {
            uni.hideLoading()
            exporting.value = false
            emit('confirm', r.tempFilePath)
          },
          fail: () => {
            uni.hideLoading()
            exporting.value = false
            uni.showToast({ title: '导出失败，请重试', icon: 'none' })
          }
        })
      }
      img.onerror = () => {
        uni.hideLoading()
        exporting.value = false
        uni.showToast({ title: '图片处理失败，请重试', icon: 'none' })
      }
      img.src = displaySrc.value
    })
}
</script>

<style lang="scss" scoped>
.cropper-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

/* === 遮罩 === */
.cropper-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  opacity: 0;
  transition: opacity 250ms $ease-smooth;

  &.is-show {
    opacity: 1;
  }
}

/* === 面板：深色底，突出裁剪区 === */
.cropper-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #1c1917;
  border-radius: $radius-2xl $radius-2xl 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.35);

  &.is-show {
    transform: translateY(0);
  }
}

/* === 顶部栏 === */
.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx 16rpx;

  .header-btn {
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.85);
    padding: 8rpx 12rpx;
    @include tap-feedback(0.92);

    &.confirm {
      color: #fff;
      background-color: var(--theme-primary);
      border-radius: $radius-full;
      padding: 10rpx 30rpx;
      font-weight: $font-weight-semibold;
    }
  }

  .header-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: #fff;
  }
}

/* === 裁剪区 === */
.cropper-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx 32rpx 40rpx;
}

.crop-viewport {
  position: relative;
  overflow: hidden;
  border-radius: $radius-lg;
  background-color: #000;
  box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.1);
  touch-action: none;

  .crop-image {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
  }

  /* 三分构图网格 */
  .grid-line {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.16);
    pointer-events: none;
  }

  .g-h1 {
    left: 0;
    right: 0;
    top: 33.33%;
    height: 1px;
  }

  .g-h2 {
    left: 0;
    right: 0;
    top: 66.66%;
    height: 1px;
  }

  .g-v1 {
    top: 0;
    bottom: 0;
    left: 33.33%;
    width: 1px;
  }

  .g-v2 {
    top: 0;
    bottom: 0;
    left: 66.66%;
    width: 1px;
  }
}

/* === 比例切换 === */
.ratio-row {
  display: flex;
  gap: 16rpx;

  .ratio-chip {
    padding: 10rpx 28rpx;
    border-radius: $radius-full;
    border: 1rpx solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.75);
    font-size: $font-size-sm;
    @include tap-feedback(0.94);

    &.active {
      background-color: var(--theme-primary);
      border-color: var(--theme-primary);
      color: #fff;
      font-weight: $font-weight-semibold;
    }
  }
}

/* === 缩放控制 === */
.zoom-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;

  .zoom-btn {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.12);
    color: #fff;
    @include flex-center;
    @include tap-feedback(0.9);
  }

  .zoom-slider {
    flex: 1;
    margin: 0;
  }
}

.cropper-hint {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.45);
}

/* === 离屏导出 canvas === */
.export-canvas {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 2px;
  height: 2px;
  opacity: 0;
  pointer-events: none;
}
</style>