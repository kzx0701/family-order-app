<template>
  <view class="page-login">
    <!-- 背景装饰：手绘风柔和色块 -->
    <view class="bg-decor">
      <view class="blob blob-coral"></view>
      <view class="blob blob-butter"></view>
    </view>

    <block v-if="ready">
      <!-- 引导页素材预加载：用户停留在本页的这段时间里先把 8 张图拉下来，
           进入引导页时图片已在缓存中，可直接渲染、不再有可见的等待。
           必须用真实的 <image> 组件 —— uni.getImageInfo / downloadFile 走的是 XHR 通道，
           与 image 组件的图片缓存不是同一套，预取了也命中不到。
           放在 v-if="ready" 内：已登录用户会被直接送去下一页、看不到本页，
           这时预热没有意义，不必发起。 -->
      <view class="preload-layer">
        <image
          v-for="src in ONBOARDING_IMAGE_LIST"
          :key="src"
          class="preload-img"
          :src="src"
          :webp="true"
        />
      </view>

      <view class="login-body">
        <!-- 登录页主视觉：男女一起做饭、吃饭的家庭场景 -->
        <view class="login-art">
          <image class="login-art-image" :src="LOGIN_HERO_ART" mode="aspectFit" :webp="true" />
        </view>

        <view class="brand-lockup">
          <text class="login-title">黑米咖啡</text>
          <view class="title-scribble" aria-hidden="true">
            <view class="scribble-main"></view>
            <view class="scribble-sub"></view>
          </view>
          <text class="login-sub">一起吃饭，好好生活</text>
        </view>
      </view>

      <view class="login-actions">
        <view class="btn-wechat" :class="{ submitting }" @tap="onLogin">
          <!-- 微信品牌图标：走项目统一的图标组件，用 simple-icons 官方剪影。
               早前是自己用 CSS 画双气泡，气泡的描边颜色与按钮底色相同、叠在一起糊成一团，
               品牌 logo 本就该用官方形态，不再手绘。 -->
          <Icon name="wechat" size="44rpx" color="#fffef9" />
          <text class="btn-text">{{ submitting ? '登录中…' : '微信一键登录' }}</text>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup>
/**
 * 登录页（三段入口的第一段）
 *
 * 职责：
 *   1. 作为小程序启动页：onLoad 时恢复本地登录态
 *      - 已登录 → 按引导状态直接跳到引导页或首页，不让已登录用户看到登录页
 *      - 未登录 → 展示登录界面
 *   2. 提供唯一的登录方式：微信一键登录（用户显式点击后调用 uni.login）
 *
 * 说明：
 *   - 不调用 getUserProfile，不申请昵称/头像授权，只完成 openid 识别
 *   - 登录成功后的去向由 onboardingCompleted 决定，与守卫规则一致
 */
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { ONBOARDING_PATH, HOME_PATH } from '@/utils/auth-guard.js'
import { ONBOARDING_IMAGE_LIST } from '@/utils/artwork.js'
import { imgUrl } from '@/utils/image.js'

const userStore = useUserStore()

/**
 * 主视觉插画：一家人围桌吃饭（含一只哈士奇与一只黑猫）
 *
 * 素材是**去背景版**：只有人物、餐桌与宠物，四周（上、左、右）透明、会露出页面底色 ——
 * 所以它不像上一版那样是一块「圆角卡片」，而是浮在奶油白底上的主体，
 * 观感更轻盈、人物也更聚焦。尺寸比例与上一版完全一致（1086×1448，0.75），容器无需调整。
 *
 * 输出宽度取到原图上限 —— 容器宽 660rpx，在 430pt / DPR3 下需约 1135 物理像素，
 * 而素材原图只有 1086px：OSS 的 resize **不会放大**（实测 w_1200 与 w_1280 输出完全相同，
 * 都是 1086），所以写 w_1200 让它取满原图即可 —— iPhone 14 Pro 及以下完全满足，
 * 15 Pro Max 仅欠约 4%（远优于早前的 960，那会欠 23%）。
 * 质量 80：w1086 下 q80 为 290KB、q85 为 329KB，取 q80
 * （去掉背景后体积比上一版省约 35%）。
 *
 * ⚠️ 透明区占比达 31.6%（四角 alpha=0，主体轮廓之外全是透明），**必须走 webp 保留透明通道**，
 *    不要为了省体积改成 JPEG —— 那会把透明区变成白块。
 */
const LOGIN_HERO_ART = imgUrl(
  'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-d335bb28-dba0-4127-a7a9-3c2c8ba609e1.png',
  { w: 1200, q: 80 }
)

// 是否已完成启动检查：检查期间不渲染内容，避免已登录用户看到登录界面一闪而过
const ready = ref(false)
// 防止重复点击
const submitting = ref(false)

onLoad(async () => {
  await userStore.restore()
  if (userStore.isLoggedIn) {
    console.log('[login] 已登录，跳过登录页')
    uni.reLaunch({ url: userStore.onboardingCompleted ? HOME_PATH : ONBOARDING_PATH })
    return
  }
  ready.value = true
})

/**
 * 微信一键登录
 */
const onLogin = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await userStore.login()
    console.log('[login] 登录成功', userStore.openid)
    uni.reLaunch({ url: userStore.onboardingCompleted ? HOME_PATH : ONBOARDING_PATH })
  } catch (e) {
    console.error('[login] login error', e)
    uni.showToast({ title: e.message || '登录失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 品牌区标题与副标题使用猫啃什锦黑（与首页、引导页同一只手绘体）。
 * 页面级引入：字体以 base64 内嵌，加进 uni.scss 会让它在每个页面 wxss 里重复一份。 */
@import '@/scss/font-maoken.scss';

.page-login {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $p2-paper;
  overflow: hidden;
}

/* === 背景装饰 === */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.42;

  &.blob-coral {
    top: -160rpx;
    right: -140rpx;
    width: 440rpx;
    height: 440rpx;
    background-color: $p2-coral-soft;
  }

  &.blob-butter {
    bottom: -120rpx;
    left: -130rpx;
    width: 380rpx;
    height: 380rpx;
    background-color: $p2-butter-soft;
  }
}

/* === 引导页素材预加载层 ===
 * 承担预热的 <image> 必须真实存在于渲染树中（不能用 getImageInfo 之类的 XHR 调用替代），
 * 所以让它们渲染出来、但完全不可见：1px 见方、全透明、不接收事件、不参与布局。
 * 不用 display: none —— 不渲染的元素在部分基础库下不会发起图片请求，预热会失效。 */
.preload-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.preload-img {
  width: 1px;
  height: 1px;
}

/* === 中部主体 === */
.login-body {
  position: relative;
  z-index: 1;
  flex: 1;
  @include flex-column;
  align-items: center;
  justify-content: center;
  padding: 34rpx 24rpx 18rpx;
  animation: slideUp 0.5s $p2-ease both;
}

/* 主视觉容器：尺寸必须与素材比例一致，否则 aspectFit 会在容器里留出大片空白。
 * 素材是 1086×1448（比例 0.75）的竖版，所以容器取 660×880rpx（同为 0.75）。
 *
 * 660rpx = 屏宽的 88%（左右各留 45rpx）。收窄的依据：当前素材是**去背景版**，
 * 主体几乎铺满画布（列范围 x=3~1084、行 y=15~1438），同容器下人物本就是
 * 上一版带背景素材的 1.3 倍以上，再维持 92% 会显得顶到屏幕、没有呼吸感。
 * 高度 880rpx 是比例锁定的结果（宽 ÷ 0.75），不能单独调 —— 要改就两个一起改。
 *
 * 小屏余量：固定内容合计约 398rpx（内边距 34 + 品牌区 150 + 按钮区 194 + 底部 18 + 间隔 2），
 * 加 880 共 1278rpx；SE（4.7"）可用约 1294rpx，余 16rpx —— 刚好放下，不再需要收缩。
 * flex 仍保留 0 1 auto（而非 0 0 auto）作为兜底：万一文案变长、或遇到更极端的小屏，
 * 插画会先收缩、由 image 按 aspectFit 等比缩小，而不是把品牌区与按钮挤出屏幕
 * （.page-login 有 overflow: hidden，溢出会被直接裁掉且无法滚动）。 */
.login-art {
  position: relative;
  width: 660rpx;
  height: 880rpx;
  margin-bottom: 2rpx;
  flex: 0 1 auto;
}

.login-art-image {
  display: block;
  width: 100%;
  height: 100%;
}

.brand-lockup {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
}

.login-title {
  /* 猫啃什锦黑：单字重手绘体（usWeightClass 500）。
   * font-weight 必须固定 normal —— 原先是系统字体下的 750 加粗，
   * 沿用到单字重字体会触发合成加粗，把马克笔笔触压糊（首页/引导页同样处理）。 */
  font-family: $p2-font-hand, $p2-font-fallback;
  /* 60rpx：比原 54rpx 上调一档，与放大后的主视觉比例协调 */
  font-size: 60rpx;
  font-weight: normal;
  /* 手绘体字形本身饱满，字距收到 3rpx（原系统字体用 6rpx 撑呼吸感） */
  letter-spacing: 3rpx;
  color: $p2-ink;
}

.title-scribble {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* 随标题变宽同步放大（原 190rpx 配 54rpx 标题），避免笔触相对变窄托不住标题 */
  width: 210rpx;
  margin-top: 8rpx;
}

.scribble-main,
.scribble-sub {
  height: 7rpx;
  border-top: 4rpx solid $p2-coral;
  border-radius: 50%;
}

.scribble-main {
  width: 100%;
  transform: rotate(-1.7deg);
  opacity: 0.76;
}

.scribble-sub {
  width: 56%;
  margin-top: 5rpx;
  border-top-width: 3rpx;
  transform: rotate(-0.4deg);
  opacity: 0.42;
}

.login-sub {
  margin-top: 11rpx;
  /* 与主标题统一为手绘体；同为单字重，固定 normal 避免合成加粗 */
  font-family: $p2-font-hand, $p2-font-fallback;
  font-size: 26rpx;
  font-weight: normal;
  color: $p2-ink-soft;
}

/* === 底部操作区 === */
.login-actions {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding: 0 60rpx 90rpx;
  animation: fadeIn 0.6s $p2-ease both;
  animation-delay: 0.15s;
}

.btn-wechat {
  width: 100%;
  height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background-color: $p2-coral;
  border: 6rpx solid $p2-line;
  /* 手绘不规则圆角：避免规整胶囊的机械感 */
  border-radius: 52rpx 48rpx 52rpx 50rpx;
  box-shadow: $p2-shadow-md;
  transition: transform $p2-dur-fast $p2-ease, opacity $p2-dur-fast $p2-ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.92;
  }

  &.submitting {
    opacity: 0.72;
  }
}

.btn-text {
  font-size: 32rpx;
  font-weight: 500;
  color: $p2-white;
  letter-spacing: 2rpx;
}

</style>
