import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setupRoleGuard } from '@/utils/role-guard.js'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 注册身份守卫：身份为空时拦截所有页面跳转，改跳身份选择页
  setupRoleGuard()
  return {
    app,
    pinia
  }
}
