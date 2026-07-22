import { useUserStore } from '@/store/user.js'

/**
 * 身份守卫
 * 规则：当前用户身份（role）为空时，任何页面跳转都拦截并重定向到身份选择页
 *
 * 覆盖场景：
 * 1. App.vue bootstrap 启动时检查（已有）——冷启动
 * 2. 本守卫的运行时拦截——小程序被后台唤醒、页面间跳转、tab 切换时身份为空
 * 3. App.vue onShow 前台守卫——从后台回到前台时身份为空
 *
 * 注意：
 * - 身份选择页自身不在拦截范围内，避免死循环
 * - setRole 内部已处理 token 失效（404 自动重新登录后重试），
 *   因此即使登录态异常，身份选择页也能自愈
 */

// 身份选择页路径（无查询参数）
const ROLE_SELECT_PATH = '/pages/role-select/role-select'

// 需要拦截的导航 API
const NAV_APIS = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

/**
 * 规范化 url：去掉查询串，统一前导斜杠
 * @param {string} url
 * @returns {string}
 */
const normalizeUrl = (url) => {
  const path = String(url || '').split('?')[0]
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * 当前页面是否已是身份选择页
 * @returns {boolean}
 */
const isOnRoleSelect = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    if (!current) return false
    return normalizeUrl(current.route) === ROLE_SELECT_PATH
  } catch (e) {
    return false
  }
}

/**
 * 核心判定：身份为空 → 重定向到身份选择页
 * @param {object} [options]
 * @param {boolean} [options.silent] - 为 true 时不弹提示（App onShow 等被动触发场景）
 * @returns {boolean} true 表示已触发重定向
 */
export const ensureRoleSelected = ({ silent = false } = {}) => {
  const userStore = useUserStore()

  // 已有身份，放行
  if (userStore.role) return false

  // 已在身份选择页，避免重复 reLaunch 造成闪烁
  if (isOnRoleSelect()) return true

  if (!silent) {
    uni.showToast({ title: '请先选择身份', icon: 'none' })
  }
  uni.reLaunch({ url: ROLE_SELECT_PATH })
  return true
}

/**
 * 注册全局导航拦截器（main.js 中调用一次）
 * 身份为空时拦截所有页面跳转，改跳身份选择页
 */
export const setupRoleGuard = () => {
  NAV_APIS.forEach((api) => {
    uni.addInterceptor(api, {
      invoke(args) {
        // 目标本身就是身份选择页：放行（守卫自身的 reLaunch 也走这里）
        if (normalizeUrl(args && args.url) === ROLE_SELECT_PATH) {
          return true
        }
        // 身份为空：取消本次跳转，改跳身份选择页
        if (ensureRoleSelected()) {
          return false
        }
        return true
      }
    })
  })
}
