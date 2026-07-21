<script>
import { useUserStore } from '@/store/user.js'

export default {
  onLaunch(options) {
    // 应用启动逻辑：恢复登录态 -> 微信登录 -> 角色未选则跳角色选择页
    console.log('[App] onLaunch', options)

    // 注：pages.json 已设置 tabBar.custom = true，原生 tabBar 不渲染，
    // custom-tabbar 组件按角色差异化展示，无需调用 uni.hideTabBar（自定义模式下会报错）

    // 隐私合规：监听隐私接口首次调用，弹出授权确认（chooseMedia 等需要）
    // manifest.json 已开启 __usePrivacyCheck__: true
    this.setupPrivacyHandler()

    this.bootstrap()
  },
  onShow() {
    console.log('[App] onShow')
  },
  onHide() {
    console.log('[App] onHide')
  },
  methods: {
    // 隐私授权处理：当用户首次使用相册/摄像头等隐私接口时弹窗确认
    setupPrivacyHandler() {
      // #ifdef MP-WEIXIN
      if (wx.onNeedPrivacyAuthorization) {
        wx.onNeedPrivacyAuthorization((resolve) => {
          wx.showModal({
            title: '隐私保护提示',
            content: '为了上传菜品图片，需要使用您的相册和摄像头权限，是否同意？',
            confirmText: '同意',
            cancelText: '拒绝',
            success: (res) => {
              if (res.confirm) {
                resolve({ event: 'agree', buttonId: 'agree' })
              } else {
                resolve({ event: 'disagree' })
              }
            }
          })
        })
      }
      // #endif
    },
    async bootstrap() {
      // 启动引导：恢复登录态 -> 未登录则微信登录 -> 无角色则跳角色选择页
      try {
        const userStore = useUserStore()

        // 1. 从本地存储恢复登录态
        await userStore.restore()

        // 2. 未登录（无 token）则执行微信一键登录
        if (!userStore.isLoggedIn) {
          await userStore.login()
        }

        // 3. 登录后检查角色：为空表示首次登录，跳转角色选择页（reLaunch 防止返回）
        if (!userStore.role) {
          uni.reLaunch({ url: '/pages/role-select/role-select' })
          return
        }

        // 4. 已有角色：正常进入首页（custom-tabbar 组件自动响应 role 变化）
        // 注：自定义 tabBar 模式下，原生 hideTabBar/showTabBar 不可用，组件内部响应式渲染
      } catch (e) {
        console.error('[App] bootstrap error', e)
        // 登录失败：提示用户重启重试，避免卡在空白首页
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    },
    // applyTabBarByRole 已移除：自定义 tabBar 模式下原生 API 不可用，
    // 由 custom-tabbar 组件根据 userStore.role 响应式渲染 tab 数量
  }
}
</script>

<style lang="scss">
/* 每个页面公共样式 - 引入全局设计 token */
@import '@/scss/tokens.scss';
@import '@/scss/themes.scss';
@import '@/scss/animations.scss';

page {
  background-color: $color-bg;
  color: $color-text;
  font-family: $font-sans;
  font-size: $font-size-base;
  line-height: $line-height-normal;
  -webkit-font-smoothing: antialiased;
}

/* 全局视图容器：暖奶油底色，铺满整屏 */
view, text {
  box-sizing: border-box;
}

/* 隐藏滚动条（小程序专用） */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}

/* === 页面入场动效：onShow 时为根容器淡入 === */
/* 用法：在页面根 view 上加 class="page-enter" */
.page-enter {
  animation: pageEnter $dur-base $ease-smooth both;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(8rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === 通用 shimmer 占位（骨架屏基础类） === */
.shimmer-bg {
  background-color: $color-neutral-100;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.65) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s $ease-smooth infinite;
}

/* === 通用点击反馈增强：按钮按下时轻微缩放 + 阴影收敛 === */
/* 用于希望加强按下反馈但未使用 mixin 的元素 */
.tap-scale {
  transition: transform $dur-fast $ease-smooth;
  &:active {
    transform: scale(0.96);
  }
}

/* === 全局 image 默认行为：防止图片下方基线间隙 === */
image {
  display: block;
}

/* === 文字层级工具类 === */
.text-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
}
.text-body {
  font-size: $font-size-base;
  color: $color-text;
}
.text-muted {
  font-size: $font-size-sm;
  color: $color-text-muted;
}
</style>
