import { ref } from 'vue'

/**
 * 小程序安全区域 composable
 *
 * 微信小程序中 env(safe-area-inset-top) 不生效（返回 0），
 * 必须通过 uni.getSystemInfoSync().statusBarHeight 动态获取状态栏高度。
 * 本 composable 在首次调用时初始化，后续共享同一份状态。
 */
const statusBarHeight = ref(0)
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
  }
  return { statusBarHeight }
}
