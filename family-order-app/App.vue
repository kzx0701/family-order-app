<script>
import { useUserStore } from '@/store/user.js'
import { ensureAuth } from '@/utils/auth-guard.js'
import { loadHandFont } from '@/utils/hand-font.js'

// 启动恢复是否已完成
// App.onShow 早于 bootstrap 里的 restore() 完成，此时 state.token 仍为空，
// 若立即执行守卫会把已登录用户误判为未登录，因此首帧 onShow 跳过守卫
let bootstrapped = false

/**
 * 应用启动逻辑
 *
 * 登录不再自动发起：改由登录页的「微信一键登录」按钮触发（用户显式操作）。
 * 启动阶段只恢复本地登录态，并按守卫规则把用户送到该去的页面。
 *
 * 三段入口：登录页 → 信息配置引导（可跳过）→ 首页
 */
export default {
  onLaunch(options) {
    console.log('[App] onLaunch', options)

    // 注：pages.json 已设置 tabBar.custom = true，原生 tabBar 不渲染，
    // 无需调用 uni.hideTabBar（自定义模式下会报错）

    // 隐私合规：manifest.json 已开启 __usePrivacyCheck__: true
    // 不监听 onNeedPrivacyAuthorization，让微信自动弹出内置隐私授权弹窗
    // 内置弹窗的"同意"按钮即为 <button open-type="agreePrivacyAuthorization">，可直接授权

    this.bootstrap()

    // 手绘字体的网络大子集（菜名等长尾字符靠它，见 utils/hand-font.js）。
    // **刻意不 await**：字体是异步加载的，不该阻塞启动；加载完成时字体栈自然接管，
    // 首屏由包内那份子集兜住，不会先闪系统字体。
    loadHandFont()
  },
  onShow() {
    console.log('[App] onShow')
    // 启动尚未完成，交给 bootstrap 统一处理
    if (!bootstrapped) return
    // 前台守卫：从后台切回时登录态可能已失效（如数据库被重置），或引导尚未完成
    // 登录页 / 引导页自身在守卫放行名单内，不会重复跳转
    ensureAuth({ silent: true })
  },
  onHide() {
    console.log('[App] onHide')
  },
  methods: {
    async bootstrap() {
      try {
        const userStore = useUserStore()
        // 恢复本地登录态
        await userStore.restore()
        console.log(
          userStore.isLoggedIn
            ? `[App] 已恢复本地登录态 ${userStore.openid}`
            : '[App] 未检测到登录态，待用户手动登录'
        )
      } catch (e) {
        console.error('[App] bootstrap error', e)
      } finally {
        bootstrapped = true
        // 按守卫规则决定去处（未登录 → 登录页；引导未完成 → 引导页）
        ensureAuth({ silent: true })
      }
    }
  }
}
</script>

<style lang="scss">
/* 每个页面公共样式 - 引入全局设计 token */
@import '@/scss/tokens.scss';
@import '@/scss/themes.scss';
@import '@/scss/animations.scss';

// 手绘字体：本地兜底子集，@font-face 统一在这里引一次（编进 app.wxss，全局生效）
//
// 原先由用到字体的页面各自 @import，同一份 base64 被重复打进多个页面的 wxss
// （font-recipe 119.6KB × 2 页 + font-maoken 25.5KB × 3 页 + font-menu 18.2KB × 1 页 = 333.9KB），
// 已收到这里。**页面侧只写 font-family，不要再 @import 字体文件。**
//
// 2026-09-21 又合并了一次：原先三份子集（RecipeMaoken / MenuHand / MaokenAssortedSans）本是
// **同一款字体的三个切片**，现并成一份 `MaokenHand` —— 628 字符（含 0-9 与全部会渲染的
// 文案用字），三份 122.4KB → 一份 123KB，字符更多而体积持平，维护只剩一处。
// 长尾字符（菜名 / 食材名等用户自由输入）由 utils/hand-font.js 网络加载的大子集接管。
//
// ⚠️ 字体栈是 MaokenWeb → MaokenHand → 系统字体，定义在 scss/phase2-tokens.scss 的 $p2-font-hand。
// ⚠️ 这段注释用 // 而不是 /* */：本文件属于全局样式，块注释会被原样编进 app.wxss。
@import '@/scss/font-hand.scss';

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
/* 注意：fill-mode 必须是 backwards 而非 both —— both 会在动画结束后保留 */
/* transform: translateY(0)，使根容器成为 fixed 后代的包含块，导致固定 */
/* 标题栏/底部 tabbar 随页面滚动而失效 */
.page-enter {
  animation: pageEnter $dur-base $ease-smooth backwards;
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
