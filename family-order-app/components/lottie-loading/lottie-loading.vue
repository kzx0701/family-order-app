<template>
  <view class="lottie-loading" :style="{ width: width, height: height }">
    <!-- Canvas 容器：Lottie 加载成功后渲染 -->
    <canvas
      v-if="!fallback"
      type="2d"
      :id="canvasId"
      class="lottie-canvas"
      :style="{ width: width, height: height }"
    />
    <!-- 降级：CSS spinner（Lottie 库不可用 / 加载失败时） -->
    <view v-else class="spinner-wrap" :style="{ width: width, height: height }">
      <view class="spinner" :style="{ borderColor: spinnerColor }"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { loadLottieOnReady, destroyLottie } from '@/utils/lottie.js'

/**
 * Lottie 加载状态组件
 * 优先使用 Lottie 动画作为 loading，加载失败时降级为 CSS spinner
 *
 * 用法：
 *   <lottie-loading :src="animPath" width="120rpx" height="120rpx" />
 *   <lottie-loading :animation-data="animObj" />
 */
const props = defineProps({
  // Lottie JSON 文件路径（与 animation-data 二选一）
  src: { type: String, default: '' },
  // 直接传入 Lottie JSON 对象（与 src 二选一）
  animationData: { type: Object, default: null },
  width: { type: String, default: '120rpx' },
  height: { type: String, default: '120rpx' },
  // 是否循环
  loop: { type: Boolean, default: true },
  // 是否自动播放
  autoplay: { type: Boolean, default: true },
  // 降级 spinner 颜色
  spinnerColor: { type: String, default: '#C4956A' }
})

// 唯一 canvas id（同一页面挂载多个 lottie-loading 时互不干扰）
const canvasId = `lottie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const fallback = ref(false)
const instance = getCurrentInstance()

/**
 * 加载 Lottie 动画
 * 1. 取得 animationData（直接传入 或 通过 src 拉取）
 * 2. 调用 loadLottieOnReady 在 canvas 上初始化
 * 3. 失败时降级到 CSS spinner
 */
const loadAnimation = async () => {
  let animData = props.animationData

  // 没有直接传入 animationData 时，按 src 拉取
  if (!animData && props.src) {
    try {
      const res = await new Promise((resolve, reject) => {
        uni.request({
          url: props.src,
          success: resolve,
          fail: reject
        })
      })
      animData = res.data
    } catch (e) {
      console.error('[lottie-loading] 加载 JSON 失败，降级到 spinner', e)
      fallback.value = true
      return
    }
  }

  if (!animData) {
    fallback.value = true
    return
  }

  // 等待 canvas 节点就绪（mp-weixin 渲染稍慢，加一帧延迟确保节点已挂载）
  await new Promise((r) => setTimeout(r, 50))

  const anim = await loadLottieOnReady(
    canvasId,
    animData,
    { loop: props.loop, autoplay: props.autoplay },
    instance?.proxy || null
  )

  if (!anim) {
    fallback.value = true
  }
}

onMounted(() => {
  loadAnimation()
})

onUnmounted(() => {
  destroyLottie(canvasId)
})
</script>

<style lang="scss" scoped>
.lottie-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lottie-canvas {
  display: block;
}

/* 降级 spinner：CSS 双圈旋转 */
.spinner-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 60%;
  height: 60%;
  border-radius: 50%;
  border: 6rpx solid rgba(196, 149, 106, 0.2);
  border-top-color: rgba(196, 149, 106, 0.9);
  animation: spin 800ms linear infinite;
}
</style>
