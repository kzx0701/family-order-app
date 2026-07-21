/**
 * Lottie 动画辅助函数
 * 封装 lottie-miniprogram 的初始化与使用，屏蔽多平台差异
 *
 * 主要支持微信小程序（mp-weixin）的 Canvas 2D 接口
 * H5 端可直接使用 lottie-web（按需引入）
 */

// 缓存已加载的动画实例，便于销毁与复用
const animationMap = new Map()

// 静态引入（lottie-miniprogram 不是 ES Module，不能用动态 import）
// 微信小程序环境直接 require，失败时降级到 CSS 动效
let lottieLib = null
// #ifdef MP-WEIXIN
try {
  lottieLib = require('lottie-miniprogram')
} catch (e) {
  console.warn('[lottie] lottie-miniprogram 加载失败，将降级到 CSS 动效', e)
  lottieLib = null
}
// #endif

/**
 * 获取 lottie 库实例
 * @returns {object|null}
 */
const getLottie = () => {
  return lottieLib
}

/**
 * 获取 Canvas 2D 节点（mp-weixin 专用）
 * @param {string} canvasId - canvas 元素的 id
 * @param {object} [instance] - 组件实例（组件内调用时传入，确保选择器作用域正确）
 * @returns {Promise<{canvas: object, width: number, height: number}>}
 */
const getCanvasNode = (canvasId, instance = null) => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const query = instance
      ? uni.createSelectorQuery().in(instance)
      : uni.createSelectorQuery()
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error(`[lottie] canvas #${canvasId} 未找到`))
          return
        }
        resolve({
          canvas: res[0].node,
          width: res[0].width,
          height: res[0].height
        })
      })
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('[lottie] getCanvasNode 仅支持 mp-weixin'))
    // #endif
  })
}

/**
 * 在指定 canvas 上加载 Lottie 动画
 * @param {string} canvasId - canvas 元素 id（需设置 type="2d"）
 * @param {object} animationData - Lottie JSON 数据
 * @param {object} options - { loop, autoplay, renderer }
 * @param {object} [instance] - 组件实例（组件内调用时传入，确保 canvas 选择器作用域正确）
 * @returns {Promise<object|null>} - lottie 动画实例，失败返回 null（调用方可据此降级）
 */
export const loadLottieOnReady = async (canvasId, animationData, options = {}, instance = null) => {
  const lottie = await getLottie()
  if (!lottie) return null

  // #ifdef MP-WEIXIN
  try {
    const { canvas, width, height } = await getCanvasNode(canvasId, instance)
    const dpr = uni.getSystemInfoSync().pixelRatio || 2
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 兼容 lottie-miniprogram 的 setup（部分版本需要）
    if (typeof lottie.setup === 'function') {
      lottie.setup({ adapter: canvas })
    }

    const anim = lottie.loadAnimation({
      canvas,
      renderer: 'canvas',
      loop: options.loop !== false,
      autoplay: options.autoplay !== false,
      animationData
    })

    animationMap.set(canvasId, anim)
    return anim
  } catch (e) {
    console.error('[lottie] loadLottieOnReady error', e)
    return null
  }
  // #endif

  // #ifdef H5
  const el = document.getElementById(canvasId)
  if (!el) {
    console.error(`[lottie] canvas #${canvasId} 未找到`)
    return null
  }
  const anim = lottie.loadAnimation({
    container: el,
    renderer: 'svg',
    loop: options.loop !== false,
    autoplay: options.autoplay !== false,
    animationData
  })
  animationMap.set(canvasId, anim)
  return anim
  // #endif
}

/**
 * 播放指定动画
 */
export const playLottie = (canvasId) => {
  const anim = animationMap.get(canvasId)
  if (anim && typeof anim.play === 'function') {
    anim.play()
  }
}

/**
 * 暂停指定动画
 */
export const pauseLottie = (canvasId) => {
  const anim = animationMap.get(canvasId)
  if (anim && typeof anim.pause === 'function') {
    anim.pause()
  }
}

/**
 * 停止指定动画（回到第 0 帧）
 */
export const stopLottie = (canvasId) => {
  const anim = animationMap.get(canvasId)
  if (anim && typeof anim.stop === 'function') {
    anim.stop()
  }
}

/**
 * 销毁指定动画（页面卸载时调用，避免内存泄漏）
 */
export const destroyLottie = (canvasId) => {
  const anim = animationMap.get(canvasId)
  if (anim && typeof anim.destroy === 'function') {
    anim.destroy()
  }
  animationMap.delete(canvasId)
}

/**
 * 销毁所有动画（App.vue onHide 时可调用）
 */
export const destroyAllLottie = () => {
  animationMap.forEach((anim) => {
    if (anim && typeof anim.destroy === 'function') {
      anim.destroy()
    }
  })
  animationMap.clear()
}

export default {
  loadLottieOnReady,
  playLottie,
  pauseLottie,
  stopLottie,
  destroyLottie,
  destroyAllLottie
}
