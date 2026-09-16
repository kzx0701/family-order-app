import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setupAuthGuard } from '@/utils/auth-guard.js'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 注册登录与引导守卫：未登录跳登录页，引导未完成跳引导页
  setupAuthGuard()
  return {
    app,
    pinia
  }
}
