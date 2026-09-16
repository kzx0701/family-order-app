import { useUserStore } from '@/store/user.js'

/**
 * 登录与引导守卫
 *
 * 三段入口：登录页 → 信息配置引导（可跳过）→ 首页
 *
 * 守卫规则：
 *   1. 未登录（无 token）           → 回登录页
 *   2. 已登录但引导未处理完毕        → 回引导页
 *   3. 两者均满足                   → 放行
 *
 * 触发点：
 *   - main.js 注册的全局导航拦截（页面跳转 / tab 切换）
 *   - App.vue onShow 前台守卫（从后台切回时状态可能已变化）
 *   - 登录页 onLoad 的首次路由决策
 *
 * 注意：登录页与引导页自身必须在放行名单内，否则守卫会把它们自己拦截，形成死循环。
 */

export const LOGIN_PATH = '/pages/login/login'
export const ONBOARDING_PATH = '/pages/onboarding/onboarding'
export const HOME_PATH = '/pages/home/home'

// 守卫放行名单：这两个页面是守卫的落点，不能再被拦截
const GUARD_FREE = [LOGIN_PATH, ONBOARDING_PATH]

// 需要拦截的导航 API
const NAV_APIS = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

/**
 * 规范化 url：去掉查询串，统一前导斜杠
 * @param {string} url
 * @returns {string}
 */
export const normalizeUrl = (url) => {
  const path = String(url || '').split('?')[0]
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * 当前栈顶页面路径
 * @returns {string}
 */
const currentRoute = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    return current ? normalizeUrl(current.route) : ''
  } catch (e) {
    return ''
  }
}

/**
 * 计算当前应停留的页面
 * @returns {string} '' 表示登录态与引导状态均已满足，可正常放行
 */
export const resolveGuardTarget = () => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) return LOGIN_PATH
  if (!userStore.onboardingCompleted) return ONBOARDING_PATH
  return ''
}

/**
 * 检查登录与引导状态，必要时重定向到对应页面
 * @param {Object} [options]
 * @param {boolean} [options.silent] - 为 true 时不弹提示（onShow 等被动触发场景）
 * @returns {boolean} true 表示状态未满足（已重定向或已在目标页）
 */
export const ensureAuth = ({ silent = false } = {}) => {
  const target = resolveGuardTarget()

  // 状态已满足，放行
  if (!target) return false

  // 已在目标页，无需重复 reLaunch（避免闪烁）
  if (currentRoute() !== target) {
    if (!silent) {
      uni.showToast({
        title: target === LOGIN_PATH ? '请先登录' : '请先完成信息配置',
        icon: 'none'
      })
    }
    uni.reLaunch({ url: target })
  }
  return true
}

/**
 * 注册全局导航拦截器（main.js 中调用一次）
 * 登录或引导状态未满足时，取消本次跳转并改跳对应页面
 */
export const setupAuthGuard = () => {
  NAV_APIS.forEach((api) => {
    uni.addInterceptor(api, {
      invoke(args) {
        const target = normalizeUrl(args && args.url)

        // 目标本身就是登录页 / 引导页：放行（守卫自身的 reLaunch 也走这里）
        if (GUARD_FREE.includes(target)) return true

        // 状态未满足：取消本次跳转，由 ensureAuth 改跳对应页面
        if (ensureAuth()) return false
        return true
      }
    })
  })
}
