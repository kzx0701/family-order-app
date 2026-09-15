import { ref } from 'vue'

/**
 * 小程序安全区域 composable
 *
 * 微信小程序中 env(safe-area-inset-top) 不生效（返回 0），
 * 必须通过 uni.getSystemInfoSync().statusBarHeight 动态获取状态栏高度。
 * 本 composable 在首次调用时初始化，后续共享同一份状态。
 */
const statusBarHeight = ref(0)
// 微信胶囊按钮位置（··· 与 ⊙）：自定义导航栏下它固定悬浮在右上角，
// 页面内容需要避让，否则右侧元素会与胶囊重叠
const menuButton = ref(null)
let initialized = false

export function useSafeArea() {
  if (!initialized) {
    initialized = true
    try {
      const info = uni.getSystemInfoSync()
      // statusBarHeight 单位为 px，iPhone 有灵动岛时约 59px，普通约 44px，Android 约 24px
      statusBarHeight.value = info.statusBarHeight || 20
    } catch (e) {
      statusBarHeight.value = 20
    }
    try {
      // 微信小程序专有 API，其他平台不存在时保持 null，由调用方兜底
      menuButton.value = uni.getMenuButtonBoundingClientRect?.() || null
    } catch (e) {
      menuButton.value = null
    }
  }
  return { statusBarHeight, menuButton }
}
