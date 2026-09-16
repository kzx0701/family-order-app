<template>
  <view class="page-onboarding">
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="blob blob-coral"></view>
      <view class="blob blob-leaf"></view>
    </view>

    <!-- 顶部：步骤指示 + 标题 -->
    <view class="hero" :style="{ paddingTop: headerTop + 'px' }">
      <view class="step-dots">
        <view class="dot" :class="{ active: step === 1, done: step > 1 }"></view>
        <view class="dot" :class="{ active: step === 2 }"></view>
      </view>
      <text class="hero-title">{{ step === 1 ? '你是男生还是女生' : '平时谁做饭呢' }}</text>
    </view>

    <!-- 第一步：选择性别 -->
    <view v-if="step === 1" class="pick-list">
      <!-- 上下两个弹性留白按 25:75 分配多余高度，让标题与卡片靠近、
           多余空间落到按钮上方。没用 justify-content:center 是因为它会上下均分，
           而上半是纯空白、下半有按钮作视觉锚点，同样距离在大片空白里会显得更远 -->
      <view class="spacer spacer-top"></view>

      <view
        class="pick-card card-female"
        :class="{ selected: pickedGender === 'female', dimmed: isDimmed(pickedGender, 'female') }"
        :style="{ backgroundImage: CARD_BG.female }"
        @tap="pickedGender = 'female'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="genderArt.female" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <text class="pick-name">女生</text>
        </view>
      </view>

      <view
        class="pick-card card-male"
        :class="{ selected: pickedGender === 'male', dimmed: isDimmed(pickedGender, 'male') }"
        :style="{ backgroundImage: CARD_BG.male }"
        @tap="pickedGender = 'male'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="genderArt.male" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <text class="pick-name">男生</text>
        </view>
      </view>

      <view class="spacer spacer-bottom"></view>
    </view>

    <!-- 第二步：选择身份 -->
    <view v-else class="pick-list">
      <view class="spacer spacer-top"></view>

      <view
        class="pick-card card-diner"
        :class="{ selected: pickedMode === 'diner', dimmed: isDimmed(pickedMode, 'diner') }"
        @tap="pickedMode = 'diner'"
      >
        <view class="mascot-frame">
          <view class="mascot mascot-girl" :class="{ cheer: pickedMode === 'diner' }">
            <view class="hair-back"></view>
            <view class="bun bun-l"></view>
            <view class="bun bun-r"></view>
            <view class="face">
              <view class="bangs"></view>
              <view class="eye eye-l"><view class="spark"></view></view>
              <view class="eye eye-r"><view class="spark"></view></view>
              <view class="blush blush-l"></view>
              <view class="blush blush-r"></view>
              <view class="mouth"></view>
            </view>
            <view class="bow"><view class="bow-knot"></view></view>
          </view>
          <text class="floatie floatie-heart">♡</text>
          <text class="floatie floatie-star">✦</text>
        </view>
        <view class="pick-body">
          <text class="pick-name">干饭人</text>
        </view>
      </view>

      <view
        class="pick-card card-cook"
        :class="{ selected: pickedMode === 'cook', dimmed: isDimmed(pickedMode, 'cook') }"
        @tap="pickedMode = 'cook'"
      >
        <view class="mascot-frame">
          <view class="mascot mascot-chef" :class="{ cheer: pickedMode === 'cook' }">
            <view class="face">
              <view class="sidehair sidehair-l"></view>
              <view class="sidehair sidehair-r"></view>
              <view class="eye eye-l"><view class="spark"></view></view>
              <view class="eye eye-r"><view class="spark"></view></view>
              <view class="blush blush-l"></view>
              <view class="blush blush-r"></view>
              <view class="mouth"></view>
            </view>
            <view class="chef-hat">
              <view class="hat-puff puff-l"></view>
              <view class="hat-puff puff-m"></view>
              <view class="hat-puff puff-r"></view>
              <view class="hat-band"></view>
            </view>
          </view>
          <text class="floatie floatie-star">✦</text>
          <text class="floatie floatie-leaf">❀</text>
        </view>
        <view class="pick-body">
          <text class="pick-name">饲养员</text>
        </view>
      </view>

      <view class="spacer spacer-bottom"></view>
    </view>

    <!-- 底部操作 -->
    <view class="footer-actions">
      <view class="action-row">
        <view v-if="step === 2" class="btn-ghost" :class="{ disabled: submitting }" @tap="goStep(1)">
          <text>上一步</text>
        </view>
        <view class="btn-primary" :class="{ disabled: !canGoNext || submitting }" @tap="onPrimary">
          <text>{{ submitting ? '保存中…' : step === 1 ? '下一步' : '进入小程序' }}</text>
        </view>
      </view>

      <view class="skip-link" @tap="onSkip">
        <text>暂不设置，随时可改</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 信息配置引导页（三段入口的第二段）
 *
 * 两步在同一页面内通过步骤状态切换：
 *   第一步 选择性别（男 / 女）—— 决定默认头像
 *   第二步 选择身份（干饭人 / 饲养员）—— 决定工作模式
 *
 * 整页可跳过：跳过时性别与身份都落为默认值（男 + 干饭人），
 * 并且 onboardingCompleted 置为 true，跳过后不再重复弹出。
 * 性别与身份后续都能在「我的」页面修改、切换。
 */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { imgUrl } from '@/utils/image.js'
import { AVATAR_ART, AVATAR_ART_WIDTH } from '@/utils/artwork.js'
import { HOME_PATH } from '@/utils/auth-guard.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

// 顶部起始位置：本页顶部没有右侧元素，不与微信胶囊争位，留出状态栏 + 48px 即可
const headerTop = computed(() => statusBarHeight.value + 48)

const step = ref(1)
const pickedGender = ref('')
const pickedMode = ref('')
const submitting = ref(false)

// 性别卡片复用默认头像素材
const genderArt = {
  male: imgUrl(AVATAR_ART.male, { w: AVATAR_ART_WIDTH }),
  female: imgUrl(AVATAR_ART.female, { w: AVATAR_ART_WIDTH })
}

/**
 * 性别卡的蜡笔涂鸦背景图
 *
 * 涂鸦元素分布在画面四周、中间留大片留白，正好给头像与文案让位。
 * 卡片显示比例 3.554（654:184）与原图 2.98（2164:727）不同：
 * 用 100% 100% 拉伸而不是 cover 裁切 —— 涂鸦都在边缘，裁切会切掉一部分图案，
 * 而 19% 的横向形变落在手绘涂鸦上几乎看不出来。
 */
const CARD_BG = {
  female: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-79fd56c8-73b1-4f33-8fb9-6224f06d3e48.png', { w: 1080 })})`,
  male: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-0ef5a4be-7dd3-46e6-a638-8d939f9c8aba.png', { w: 1080 })})`
}

const canGoNext = computed(() => (step.value === 1 ? !!pickedGender.value : !!pickedMode.value))

/**
 * 退后态判定：本列表里已经有选择、但选的是另一张时，未选中的卡转入退后态
 * （降低饱和与投影、略微缩小，把视觉权重让给选中卡）
 * @param {string} picked - 当前已选值
 * @param {string} key - 本卡对应的值
 */
const isDimmed = (picked, key) => !!picked && picked !== key

onLoad(() => {
  // 已处理过引导的用户不应再看到本页
  if (userStore.onboardingCompleted) {
    uni.reLaunch({ url: HOME_PATH })
  }
})

/** 步骤切换 */
const goStep = (target) => {
  if (submitting.value) return
  step.value = target
}

/**
 * 主按钮：第一步进入下一步，第二步提交并进入首页
 */
const onPrimary = () => {
  if (submitting.value || !canGoNext.value) return
  if (step.value === 1) {
    goStep(2)
    return
  }
  submit({ gender: pickedGender.value, mode: pickedMode.value })
}

/** 跳过整页引导：由云端落为默认值（男 + 干饭人） */
const onSkip = () => {
  if (submitting.value) return
  submit({})
}

/**
 * 提交引导结果
 * @param {Object} payload
 * @param {string} [payload.gender] - 'male' | 'female'
 * @param {string} [payload.mode] - 'diner' | 'cook'
 */
const submit = async (payload) => {
  submitting.value = true
  try {
    await userStore.completeOnboarding(payload)
    uni.showToast({ title: '设置好啦', icon: 'none' })
    // 延迟跳转，让 toast 完整呈现
    setTimeout(() => {
      uni.reLaunch({ url: HOME_PATH })
    }, 500)
  } catch (e) {
    console.error('[onboarding] submit error', e)
    uni.showToast({ title: e.message || '保存失败，请重试', icon: 'none' })
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-onboarding {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $p2-paper;
  /* 这里刻意不设 overflow: hidden —— 卡片垂直居中后，极小屏上内容若超出容器，
     顶部卡片会被裁掉且无法滚动。裁剪交给下面的 .bg-decor 自己做 */
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

/* === 背景装饰 === */
.bg-decor {
  position: absolute;
  /* 用四向声明而非 inset 简写：inset 属较新的逻辑属性，
   * 老版本小程序 WebView 上可能不生效，会导致装饰块掉进文档流 */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  /* 装饰色块超出页面边界时在此裁掉，替代页面级 overflow: hidden */
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;

  &.blob-coral {
    top: -150rpx;
    right: -130rpx;
    width: 420rpx;
    height: 420rpx;
    background-color: $p2-coral-soft;
  }

  &.blob-leaf {
    bottom: -140rpx;
    left: -140rpx;
    width: 400rpx;
    height: 400rpx;
    background-color: $p2-leaf-soft;
  }
}

/* === 顶部 === */
.hero {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding-left: 60rpx;
  padding-right: 60rpx;
  padding-bottom: 32rpx;

  .step-dots {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 28rpx;

    .dot {
      width: 46rpx;
      height: 10rpx;
      border-radius: 999rpx;
      background-color: rgba(118, 85, 64, 0.2);
      transition: background-color $p2-dur-base $p2-ease, width $p2-dur-base $p2-ease;

      &.active {
        width: 68rpx;
        background-color: $p2-coral;
      }

      &.done {
        background-color: rgba(118, 85, 64, 0.42);
      }
    }
  }

  .hero-title {
    font-size: 52rpx;
    font-weight: 500;
    letter-spacing: 2rpx;
    color: $p2-ink;
  }
}

/* === 选择卡片列表 === */
.pick-list {
  position: relative;
  z-index: 1;
  flex: 1;
  @include flex-column;
  /* 多余高度不在这里分配，交给首尾两个 .spacer；
   * 不用 justify-content: center 的原因见模板注释 */
  justify-content: flex-start;
  padding: 0 48rpx;
}

/* 弹性留白：按 flex-grow 比例吸收剩余高度。
 * 用比例而非固定 padding 的好处是屏幕变矮时留白自动收窄，不会把卡片挤出屏幕 */
.spacer {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 0;

  &.spacer-top {
    flex-grow: 25;
  }

  &.spacer-bottom {
    flex-grow: 75;
  }
}

/* 两张卡片之间的间距（改用 margin 是因为 gap 会在 spacer 与卡片之间也产生间距） */
.pick-card + .pick-card {
  margin-top: 40rpx;
}

/* 卡片基础：与首页入口卡同一套手绘语言（深棕描边 + 硬投影 + 不规则圆角 + 轻微旋转） */
/* === 选择卡片 ===
 * 外观全部由 CSS 变量描述，「中性 / 选中 / 退后」三态只改变量值。
 * 这样写是为了避免用选择器互相覆盖：早前版本把 transform 写在 .selected 与 .card-xxx 上，
 * 两者特异性相同、靠源码顺序决胜，结果卡片的按下反馈被静默覆盖。
 */
.pick-card {
  position: relative;
  flex: 0 0 auto; /* 不参与压缩，避免小屏上卡片被挤扁 */
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 36rpx 32rpx;

  --tilt: 0deg;
  --scale: 1;
  --shift: 0rpx;
  --bg: #f2e9df;
  --bd: #{$p2-line};
  --lift: 9rpx 11rpx 0 rgba(98, 71, 53, 0.16);
  --ring: 0 0 0 0 rgba(98, 71, 53, 0);

  /* 性别卡用云存储背景图，身份卡暂无图、沿用底色：
   * 底色保留在图片之下，图片加载期间先显示底色，不会白屏。 */
  background-color: var(--bg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: 4rpx solid var(--bd);
  box-shadow: var(--lift), var(--ring);
  transform: translateY(var(--shift)) rotate(var(--tilt)) scale(var(--scale));

  /* === 点击动效：全程单一方向的「浮起」 ===
   *
   * 早前是「按下压扁 → 抬起弹回」的两段式。那个机制注定有顿挫感 —— 运动的
   * **方向在抬起的那一刻反转了**，而这个转折点无论把时长缩短到多少、幅度压到多小，
   * 用户都能感知到「顿一下」。所以继续在原设计上调参数（140→110ms、3rpx→2rpx……）
   * 走不通，必须换机制。
   *
   * 现在只保留一段单向运动：手指抬起、选中态生效的那一刻，卡片沿**同一个方向**
   * 完成「位移 + 放大 + 描边加深 + 投影加长」，四者共用同一条曲线与时长，
   * 整体像被「抬起来」的一次动作，中途没有任何反向。
   *
   * 另一张卡同步单向落下（浮起 → 中性 → 退后），方向同样单调，不产生往复。
   */
  transition: transform 220ms $p2-ease,
    box-shadow 220ms $p2-ease,
    background-color 220ms $p2-ease,
    border-color 220ms $p2-ease;
  /* 入场改为纯淡入（原 slideUp 带位移动画）：除观感更安静外，关键是
   * animation 播放期间会接管 transform，若用户入场后立刻点卡片，
   * 浮起动效会被入场动画压住而「没反应」。淡入不碰 transform，冲突消失。 */
  animation: fadeIn 0.45s $p2-ease both;

  /* 按下时的唯一反馈：一层极淡的遮罩，**纯色彩、零位移**。
   * 留它是为了按下到抬起之间不至于完全没有响应；
   * 因为它不产生任何位移，也就不会带来「压扁再弹回」的往复感。
   * 放在 ::before 而非 ::after：伪元素是卡片的第一个子元素，位于背景之上、
   * 内容之下，遮罩不会压住头像与文字。 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: inherit;
    background-color: rgba(98, 71, 53, 0.12);
    opacity: 0;
    transition: opacity $p2-dur-tap ease-out;
    pointer-events: none;
  }

  &:active::before {
    opacity: 1;
  }

  /* === 退后态的淡化遮罩 ===
   * 底色时代靠改 --bg 变淡，现在下层是固定图片，改用「叠加一层页面底色」来淡化：
   * 用 $p2-paper 而不是灰色 —— 让未选中的卡「褪向背景」，而不是「落到阴影里」。
   * 放在 ::after 上，并把四个内容容器抬到 z-index: 1，遮罩就不会压住头像与文字。
   */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: inherit;
    background-color: $p2-paper;
    opacity: 0;
    pointer-events: none;
    transition: opacity 220ms $p2-ease;
  }

  &.dimmed::after {
    opacity: 0.55;
  }


}

/* === 选中态：底色转饱和 + 描边加深 + 双层投影浮起 ===
 * 用三个维度同时表达，而不是只靠一个小标记：
 *   底色饱和 —— 直觉上最直观的「亮起来」
 *   描边加深 —— 由浅棕转深棕，边界更肯定
 *   投影加远 —— 本项目的手绘语言里卡片本就是「贴在纸面上的贴纸」，加深投影等于浮起半寸
 * 不只用颜色表达，是因为粉与蓝的「更鲜艳」在感知上强度并不一致，且需要考虑色觉差异，
 * 所以同时给出形状信号（上浮 8rpx + 放大 1.5%）。
 */
.pick-card.selected {
  --bd: #{$p2-ink};
  --lift: 11rpx 16rpx 0 rgba(98, 71, 53, 0.26);
  --ring: 0 0 0 7rpx rgba(98, 71, 53, 0.18);
  --shift: -8rpx;
  --scale: 1.015;
}

/* === 退后态：本列表已有选择时，未选中的卡降低饱和、贴平、略缩 ===
 * 刻意不用整体 opacity —— 那会连文字一起变淡，白底上的对比度会掉到 3:1 以下不可读。
 * 这里只降底色与描边，文字保持原色。
 */
.pick-card.dimmed {
  --bd: rgba(118, 85, 64, 0.26);
  --lift: 4rpx 5rpx 0 rgba(98, 71, 53, 0.09);
  --scale: 0.985;
}

/* === 卡片各自的底色与倾斜（分别为 0,1,0 特异性）=== */
.card-female {
  --bg: #f6c7b8;
  --tilt: -1deg;
  border-radius: 32rpx 44rpx 29rpx 46rpx;
  animation-delay: 0.05s;
}

.card-male {
  --bg: #c9e3e7;
  --tilt: 1deg;
  border-radius: 44rpx 31rpx 47rpx 28rpx;
  animation-delay: 0.15s;
}

.card-diner {
  --bg: #{$p2-butter-soft};
  --tilt: -1deg;
  border-radius: 32rpx 44rpx 29rpx 46rpx;
  animation-delay: 0.05s;
}

.card-cook {
  --bg: #{$p2-leaf-soft};
  --tilt: 1deg;
  border-radius: 44rpx 31rpx 47rpx 28rpx;
  animation-delay: 0.15s;
}

/* === 底色按状态取值（组合选择器为 0,2,0，特异性天然高于上面的类型规则，与顺序无关）=== */

/* 选中：转饱和版 */
.selected.card-female {
  --bg: #f2ab92;
}

.selected.card-male {
  --bg: #a3d3da;
}

.selected.card-diner {
  --bg: #f5d274;
}

.selected.card-cook {
  --bg: #bfd8a2;
}

/* 退后：转褪淡版（保留色相，仍认得出是哪个选项，只是让位给选中卡） */
.dimmed.card-female {
  --bg: #f5d5c9;
}

.dimmed.card-male {
  --bg: #d8eaed;
}

.dimmed.card-diner {
  --bg: #faefc6;
}

.dimmed.card-cook {
  --bg: #e7f0da;
}

/* === 性别卡：头像素材圆框 === */
.pick-frame {
  position: relative;
  z-index: 1; /* 抬到按下/退后遮罩之上 */
  position: relative;
  flex-shrink: 0;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background-color: $p2-white;
  border: 4rpx solid $p2-line;
  overflow: hidden;
  @include flex-center;
}

.pick-art {
  width: 100%;
  height: 100%;
}

/* === 身份卡：CSS 手绘人物相框（与首页/旧角色页同一套画法） === */
.mascot-frame {
  position: relative;
  z-index: 1; /* 抬到按下/退后遮罩之上 */
  position: relative;
  flex-shrink: 0;
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background-color: $p2-white;
  border: 4rpx solid $p2-line;
  @include flex-center;
  overflow: hidden;
}

.mascot {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  animation: mascotBob 3.2s ease-in-out infinite;

  &.cheer {
    animation: cheerJump 0.6s $ease-bounce;
  }
}

@keyframes mascotBob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}

@keyframes cheerJump {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
  40% {
    transform: translateY(-18rpx) scale(1.1) rotate(-4deg);
  }
  70% {
    transform: translateY(2rpx) scale(0.97) rotate(2deg);
  }
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
}

/* 通用五官 */
.face {
  position: absolute;
  left: 50%;
  bottom: 4rpx;
  transform: translateX(-50%);
  width: 92rpx;
  height: 84rpx;
  border-radius: 48% 48% 50% 50%;
  background-color: #ffe3c2;
}

.eye {
  position: absolute;
  top: 40rpx;
  width: 12rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #4a2c1a;
  animation: blink 4.2s ease-in-out infinite;

  &.eye-l {
    left: 22rpx;
  }

  &.eye-r {
    right: 22rpx;
  }

  .spark {
    position: absolute;
    top: 2rpx;
    left: 2rpx;
    width: 4rpx;
    height: 4rpx;
    border-radius: 50%;
    background-color: $p2-white;
  }
}

@keyframes blink {
  0%,
  91%,
  100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.08);
  }
}

.blush {
  position: absolute;
  top: 56rpx;
  width: 16rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: rgba(255, 139, 139, 0.65);

  &.blush-l {
    left: 12rpx;
  }

  &.blush-r {
    right: 12rpx;
  }
}

.mouth {
  position: absolute;
  left: 50%;
  top: 52rpx;
  transform: translateX(-50%);
  width: 18rpx;
  height: 12rpx;
  border: 3rpx solid transparent;
  border-bottom-color: #c9553e;
  border-radius: 50%;
}

/* 女孩：咖啡棕双丸子头 + 蝴蝶结 */
.mascot-girl {
  .hair-back {
    position: absolute;
    left: 50%;
    bottom: 14rpx;
    transform: translateX(-50%);
    width: 106rpx;
    height: 96rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7b5638;
  }

  .bangs {
    position: absolute;
    top: -8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 84rpx;
    height: 34rpx;
    border-radius: 50% 50% 46% 46%;
    background-color: #7b5638;
  }

  .bun {
    position: absolute;
    top: 6rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background-color: #7b5638;
    box-shadow: inset -4rpx -4rpx 0 rgba(0, 0, 0, 0.08);

    &.bun-l {
      left: 2rpx;
    }

    &.bun-r {
      right: 2rpx;
    }
  }

  .bow {
    position: absolute;
    top: 4rpx;
    right: -2rpx;
    width: 26rpx;
    height: 16rpx;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      width: 12rpx;
      height: 16rpx;
      background-color: #ff8fab;
    }

    &::before {
      left: 0;
      border-radius: 8rpx 2rpx 2rpx 8rpx;
      transform: rotate(-14deg);
    }

    &::after {
      right: 0;
      border-radius: 2rpx 8rpx 8rpx 2rpx;
      transform: rotate(14deg);
    }

    .bow-knot {
      position: absolute;
      left: 50%;
      top: 4rpx;
      transform: translateX(-50%);
      width: 8rpx;
      height: 8rpx;
      border-radius: 50%;
      background-color: #f7608a;
      z-index: 1;
    }
  }
}

/* 男孩：白色厨师帽 + 两侧头发 */
.mascot-chef {
  .sidehair {
    position: absolute;
    top: 26rpx;
    width: 14rpx;
    height: 26rpx;
    background-color: #5c4033;

    &.sidehair-l {
      left: -4rpx;
      border-radius: 8rpx 0 0 8rpx;
    }

    &.sidehair-r {
      right: -4rpx;
      border-radius: 0 8rpx 8rpx 0;
    }
  }

  .chef-hat {
    position: absolute;
    left: 50%;
    bottom: 66rpx;
    transform: translateX(-50%);
    width: 96rpx;
    height: 56rpx;
    z-index: 2;

    .hat-band {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 88rpx;
      height: 22rpx;
      border-radius: 12rpx;
      background-color: #ffffff;
      box-shadow: 0 3rpx 6rpx rgba(44, 27, 20, 0.12);
    }

    .hat-puff {
      position: absolute;
      border-radius: 50%;
      background-color: #ffffff;
      box-shadow: inset -4rpx -4rpx 0 rgba(44, 27, 20, 0.05);

      &.puff-l {
        left: 8rpx;
        bottom: 12rpx;
        width: 34rpx;
        height: 34rpx;
      }

      &.puff-m {
        left: 50%;
        bottom: 18rpx;
        transform: translateX(-50%);
        width: 40rpx;
        height: 40rpx;
      }

      &.puff-r {
        right: 8rpx;
        bottom: 12rpx;
        width: 34rpx;
        height: 34rpx;
      }
    }
  }
}

/* 相框周围的漂浮小装饰 */
.floatie {
  position: absolute;
  font-size: 22rpx;
  line-height: 1;
  z-index: 3;
  animation: floatieDrift 3.6s ease-in-out infinite;

  &.floatie-heart {
    top: 12rpx;
    left: 14rpx;
    color: #f7608a;
  }

  &.floatie-star {
    bottom: 16rpx;
    right: 12rpx;
    color: #ffb020;
    animation-delay: -1.8s;
  }

  &.floatie-leaf {
    top: 14rpx;
    right: 16rpx;
    color: #4a9e5c;
    animation-delay: -0.9s;
  }
}

@keyframes floatieDrift {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-8rpx) scale(1.15);
    opacity: 1;
  }
}

/* === 卡片文字区 === */
.pick-body {
  position: relative;
  z-index: 1; /* 抬到按下/退后遮罩之上 */
  flex: 1;
  @include flex-column;
  align-items: flex-start;
  gap: 8rpx;

  .pick-name {
    font-size: 40rpx;
    font-weight: 500;
    color: $p2-ink;
  }
}

/* === 底部操作 === */
.footer-actions {
  position: relative;
  z-index: 1;
  @include flex-column;
  align-items: center;
  padding: 56rpx 48rpx 0;

  .action-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    width: 100%;
  }

  .btn-ghost {
    flex: 0 0 auto;
    padding: 0 36rpx;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid rgba(118, 85, 64, 0.35);
    border-radius: 48rpx 44rpx 48rpx 46rpx;
    font-size: 28rpx;
    color: $p2-ink-soft;
    transition: transform $p2-dur-fast $p2-ease;

    &:active {
      transform: scale(0.97);
    }

    &.disabled {
      opacity: 0.5;
    }
  }

  .btn-primary {
    flex: 1;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $p2-coral;
    border: 4rpx solid $p2-line;
    border-radius: 48rpx 44rpx 48rpx 46rpx;
    box-shadow: $p2-shadow-md;
    font-size: 30rpx;
    color: $p2-white;
    transition: transform $p2-dur-fast $p2-ease, opacity $p2-dur-fast $p2-ease;

    &:active {
      transform: scale(0.97);
    }

    /* 待命态：未选择任何卡片时略微缩小并降透明度；选中后平滑恢复到实色与原尺寸。
     * 这次"点亮"就是把视线从卡片引到按钮的信号（按钮离卡片较远，不引一下容易被忽略） */
    &.disabled {
      opacity: 0.45;
      transform: scale(0.97);
    }
  }

  .skip-link {
    margin-top: 28rpx;
    font-size: 24rpx;
    color: $p2-ink-soft;
    text-decoration: underline;

    &:active {
      opacity: 0.7;
    }
  }
}
</style>
