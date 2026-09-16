<template>
  <view class="page-onboarding">
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="blob blob-coral"></view>
      <view class="blob blob-leaf"></view>
    </view>

    <!-- 顶部：步骤指示 + 标题组 -->
    <view class="hero" :style="{ paddingTop: headerTop + 'px' }">
      <view class="step-dots">
        <view class="dot" :class="{ active: step === 1, done: step > 1 }"></view>
        <view class="dot" :class="{ active: step === 2 }"></view>
      </view>

      <!-- 标题 + 手绘笔触。笔触与首页 header-scribble 同一套画法（两条带旋转的圆头短线），
           宽度按标题块百分比自适应；它同时承担两个作用：
             1. 补齐首页「标题 + 笔触」的层次，标题区不再只有一行字
             2. 承接视线 —— 标题与卡片之间有约 100pt 留白，有这段笔触后空白成为节奏而不是空隙 -->
      <view class="hero-title-group">
        <text class="hero-title">{{ step === 1 ? '你是男生还是女生' : '平时谁做饭呢' }}</text>
        <view class="title-scribble">
          <view class="scribble-line scribble-line-main"></view>
          <view class="scribble-line scribble-line-sub"></view>
        </view>
      </view>
    </view>

    <!-- 第一步：选择性别 -->
    <view v-if="step === 1" class="pick-list">
      <!-- 上下两个弹性留白按 30:70 分配多余高度（原先 40:60 把标题与卡片拉得过远）：
           卡片中心落在「标题底 ~ 底部按钮」的中点附近，同时把标题到卡片的距离收到约 92pt。
           没用 justify-content:center 是因为它会上下均分，
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
          <view class="pick-name">
            <text class="pick-prefix">我是</text>
            <text class="pick-main">女生</text>
          </view>
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
          <view class="pick-name">
            <text class="pick-prefix">我是</text>
            <text class="pick-main">男生</text>
          </view>
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
        :style="{ backgroundImage: CARD_BG.diner }"
        @tap="pickedMode = 'diner'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="roleArt.diner" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <view class="pick-name">
            <text class="pick-prefix">我是</text>
            <text class="pick-main">干饭人</text>
          </view>
        </view>
      </view>

      <view
        class="pick-card card-cook"
        :class="{ selected: pickedMode === 'cook', dimmed: isDimmed(pickedMode, 'cook') }"
        :style="{ backgroundImage: CARD_BG.cook }"
        @tap="pickedMode = 'cook'"
      >
        <view class="pick-frame">
          <image class="pick-art" :src="roleArt.cook" mode="aspectFill" :webp="true" />
        </view>
        <view class="pick-body">
          <view class="pick-name">
            <text class="pick-prefix">我是</text>
            <text class="pick-main">饲养员</text>
          </view>
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
import { AVATAR_ART } from '@/utils/artwork.js'
import { HOME_PATH } from '@/utils/auth-guard.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

// 顶部起始位置：本页顶部没有右侧元素，不与微信胶囊争位，留出状态栏 + 48px 即可
const headerTop = computed(() => statusBarHeight.value + 48)

const step = ref(1)
const pickedGender = ref('')
const pickedMode = ref('')
const submitting = ref(false)

/**
 * 性别卡人物素材的输出宽度
 *
 * 脱框后人物按 240rpx 显示：最大机型（414px 屏宽）约 132.5 逻辑像素，DPR3 需约 398 物理像素，取 400。
 * 不复用 utils/artwork.js 的 AVATAR_ART_WIDTH（240，是按 146rpx 内径算的）：
 * 那个值还被通用头像组件引用，为引导页改大只会让那边白下载流量。
 */
const GENDER_ART_WIDTH = 400

/**
 * 身份卡人物素材的输出宽度
 *
 * 身份卡容器按 268rpx 显示（比性别卡的 240rpx 大，理由见下方 ROLE_ART 的说明）：
 * 最大机型约 147.6 逻辑像素，DPR3 需约 443 物理像素，取 480。
 */
const ROLE_ART_WIDTH = 480

/** 性别卡：复用默认头像素材（与「我的」页面的默认头像同一套图） */
const genderArt = {
  male: imgUrl(AVATAR_ART.male, { w: GENDER_ART_WIDTH }),
  female: imgUrl(AVATAR_ART.female, { w: GENDER_ART_WIDTH })
}

/**
 * 身份卡：干饭人 / 饲养员的角色插画
 *
 * 与性别卡不同，这两张素材只在本页使用 —— 按项目约定（仅单处使用的素材就近声明，
 * 不塞进 utils/artwork.js）就地声明。
 */
const ROLE_ART = {
  diner: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%A4%B4%E5%83%8F/exec-2ded22a0-aa85-4c5b-998d-7698c43421a4.png',
  cook: 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%A4%B4%E5%83%8F/exec-c8b750dd-f6ae-412a-9a27-27e1e489818c.png'
}

const roleArt = {
  diner: imgUrl(ROLE_ART.diner, { w: ROLE_ART_WIDTH }),
  cook: imgUrl(ROLE_ART.cook, { w: ROLE_ART_WIDTH })
}

/**
 * 选择卡的蜡笔涂鸦背景图（四张卡各一张）
 *
 * 涂鸦元素分布在画面左右两端、中间留大片留白，正好给人物与文案让位；
 * 左侧那段涂鸦在人物贴左后会被人物盖住，露出的只有轮廓外的装饰。
 *
 * 卡片显示比例约 2.87（654:228）与原图 2.99（2170:725）接近但不等：
 * 用 100% 100% 拉伸而不是 cover 裁切 —— 涂鸦都在边缘，裁切会切掉一部分图案，
 * 而几个百分点的形变落在手绘涂鸦上几乎看不出来。
 */
const CARD_BG = {
  female: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-79fd56c8-73b1-4f33-8fb9-6224f06d3e48.png', { w: 1080 })})`,
  male: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-0ef5a4be-7dd3-46e6-a638-8d939f9c8aba.png', { w: 1080 })})`,
  diner: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-4e70c4a6-75e9-4619-ae25-316ccf8e2368.png', { w: 1080 })})`,
  cook: `url(${imgUrl('https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-df221cce-3e89-49a0-9d41-2eb9163488de.png', { w: 1080 })})`
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
/* 选择卡文字的手绘字体（含 base64 数据，按需引入；不可放进 uni.scss，否则会被重复打进每个页面的 wxss） */
@import '@/scss/font-maoken.scss';

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
  /* 整体下移：「步骤条 + 标题 + 卡片」原本挤在屏幕偏上位置，标题组与卡片一起下沉，
   * 让整屏视觉重心落到屏幕中部。
   * 用 margin 而不是加大 padding-top —— padding-top 是由内联样式按状态栏与胶囊避让
   * 动态给值的（headerTop），在这里写死会破坏避让逻辑 */
  margin-top: 120rpx;

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

  /* 标题组：宽度收缩到标题本身，笔触才能按百分比跟随标题长短 */
  .hero-title-group {
    @include flex-column;
    align-items: center;
  }

  .hero-title {
    /* 猫啃什锦黑：与首页标题、卡片文字统一为同一只手绘体（单字重，固定 normal 防合成加粗） */
    font-family: $p2-font-hand, $p2-font-fallback;
    /* 56rpx：手绘体的笔画比系统黑体细、字内留白多，同字号下视觉重量更轻，
     * 比原来的 52rpx 上调一档做补偿。
     * 实测：字面宽度是 1em（8 字在 56rpx 下 462rpx），hero 可用 630rpx，不会折行 */
    font-size: 56rpx;
    line-height: 1.2;
    font-weight: normal;
    letter-spacing: 2rpx;
    color: $p2-ink;
  }

  /* 手绘笔触：与首页 .header-scribble 同一套画法（不规则圆角 + 轻微旋转制造笔迹歪斜，
   * 不用规整弧线）。区别只在布局 —— 首页标题左对齐、笔触也左对齐；
   * 这里标题居中，所以笔触整体居中、内部两笔左对齐，副笔靠左自然形成排线错落。 */
  .title-scribble {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 72%;
    margin-top: 18rpx;
  }

  .scribble-line {
    height: 10rpx;
    border-top: 4rpx solid $p2-coral;
    border-radius: 50%;
  }

  .scribble-line-main {
    width: 100%;
    transform: rotate(-1.6deg);
    opacity: 0.78;
  }

  /* 第二笔更短更淡，形成手绘排线的节奏，而不是单根规整的下划线 */
  .scribble-line-sub {
    width: 52%;
    margin-top: 8rpx;
    border-top-width: 3rpx;
    transform: rotate(-0.6deg);
    opacity: 0.45;
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
 * 用比例而非固定 padding 的好处是屏幕变矮时留白自动收窄，不会把卡片挤出屏幕。
 * 30:70 的依据：要同时满足两个目标 ——
 *   1. 卡片中心落在「标题底 ~ 底部按钮」区间的中点附近（各机型都接近屏幕几何中心）
 *   2. 标题到卡片的距离不能太远：40:60 时大屏上约 129pt，标题与卡片被拉成两段；
 *      降到 30:70 后收到约 92pt，卡片中心仍只在屏幕中心上下 8pt 内浮动。
 * 比例越小标题越靠近卡片，但卡片同时被推得越靠上 —— 这是同一个旋钮的两端。
 * （配套：.hero 的 margin-top 决定标题自身下沉多少，两者共同决定最终观感） */
.spacer {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 0;

  &.spacer-top {
    flex-grow: 30;
  }

  &.spacer-bottom {
    flex-grow: 70;
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
  /* 退后态内容（人物 + 文字）的淡化程度：共用同一个值，保证两者同步 */
  --dim-opacity: 0.7;

  /* 四张卡的人物都是「脱框贴左满高」，卡片内不再有 flex 元素撑高，需要显式给高度：
   * 228rpx = 原头像框 148 + 上下内边距 72 + 边框 8。
   * overflow: hidden 用来收口人物底部 —— 四张素材的底边都接近画布边缘，
   * 没有圆框弧线可收，只能靠卡片下边缘裁掉。 */
  height: 228rpx;
  overflow: hidden;

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

/* === 卡片各自的底色、倾斜与人物容器尺寸（分别为 0,1,0 特异性）===
 * 人物容器尺寸的差异来自素材自带留白不同：
 *   性别卡头像：主体占画布 88.6% 宽 → 容器 240rpx 时主体约 213rpx
 *   身份卡插画：主体只占 78.9%（干饭人）/ 80.2%（饲养员）宽，留白明显更大，
 *               所以容器放大到 268rpx，主体才回到约 211rpx，与性别卡视觉等大。
 * 四张卡的容器顶都落在距卡片顶 28rpx 处（= 228 − 容器 + 下沉量），两页人物节奏一致。
 * --frame-left: -14rpx 是水平微调：身份卡素材左留白（10.6% / 12.9%）比性别卡的 5.7% 大，
 * 左移一点才能让主体左缘（约 14rpx）与性别卡的 13.7rpx 对齐。
 * --role-ink 是各自的身份色，供选项主体文字使用：取色逻辑是与卡片底色同色系加深
 * （男生青蓝呼应蓝卡、饲养员草绿呼应绿卡），或取互补暖色从同色系里跳出来（女生玫瑰红、干饭人番茄红）。
 * 四色在奶油白贴纸上对比度均 ≥ 4:1。 */
.card-female {
  --bg: #f6c7b8;
  --role-ink: #c2506a;
  --tilt: -1deg;
  --frame-size: 240rpx;
  --frame-bottom: -40rpx;
  border-radius: 32rpx 44rpx 29rpx 46rpx;
  animation-delay: 0.05s;
}

.card-male {
  --bg: #c9e3e7;
  --role-ink: #2f6b80;
  --tilt: 1deg;
  --frame-size: 240rpx;
  --frame-bottom: -40rpx;
  border-radius: 44rpx 31rpx 47rpx 28rpx;
  animation-delay: 0.15s;
}

.card-diner {
  --bg: #{$p2-butter-soft};
  --role-ink: #c9553e;
  --tilt: -1deg;
  --frame-size: 268rpx;
  --frame-bottom: -68rpx;
  --frame-left: -14rpx;
  border-radius: 32rpx 44rpx 29rpx 46rpx;
  animation-delay: 0.05s;
}

.card-cook {
  --bg: #{$p2-leaf-soft};
  --role-ink: #4a7a35;
  --tilt: 1deg;
  --frame-size: 268rpx;
  --frame-bottom: -68rpx;
  --frame-left: -14rpx;
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

/* === 四张卡的脱框人物 ===
 *
 * 原为 148rpx 的白底圆框（性别卡是头像素材，身份卡是 CSS 手绘人物），现在统一改成
 * 「贴左满高」的脱框构图。依据：
 *   四张素材都是透明底半身像（实测四角 alpha=0，透明像素 32%~53%），
 *   不需要白底去遮挡背景涂鸦；而 148rpx 的圆框会把肩、胸、碗/锅一并切掉。
 *   身份卡原先那套 CSS 手绘人物（脸 + 厨师帽 + 五官 + 漂浮装饰）已整体删除，
 *   改用与性别卡同源的插画素材。
 *
 * 尺寸与位置全部由卡片变量给出（--frame-size / --frame-bottom / --frame-left），
 * 四张卡统一为：卡片内可见 200rpx、容器顶距卡片顶 28rpx，底部沉出卡片由 overflow 收口。
 * 贴左而不右移避让涂鸦：实测两张背景图左侧的涂鸦（花 / 云 / 螺旋线 / 爱心）
 * 都落在人物轮廓覆盖范围内，会被人物盖住，露出的只有轮廓外的装饰。
 */
.pick-frame {
  position: absolute;
  left: var(--frame-left, 0);
  bottom: var(--frame-bottom);
  z-index: 1; /* 抬到按下/退后遮罩之上 */
  width: var(--frame-size);
  height: var(--frame-size);
  transition: opacity 220ms $p2-ease;
}

/* 退后态：人物与文字同步淡出。
 * 原来圆框只有 148rpx、不淡化影响有限；脱框放大后人物与文字是卡片里权重最大的两个元素，
 * 只淡化人物会看着「人退了、字还在」，压不出「选中 / 未选中」的差别。
 * 文字用 opacity 也是安全的：48rpx 属大字号，深棕 #624735 叠在卡片底色上原对比度约 5.5:1，
 * 淡化到 0.7 后约 3.9:1 —— 满足大字文本 AA 的 3:1 要求，且未选中项本就不需要强对比。
 * 两者共用 --dim-opacity，避免以后调值只改到一半。 */
.pick-card.dimmed .pick-frame,
.pick-card.dimmed .pick-body {
  opacity: var(--dim-opacity);
}

.pick-art {
  width: 100%;
  height: 100%;
}

/* === 卡片文字区 === */
.pick-body {
  position: relative;
  z-index: 1; /* 抬到按下/退后遮罩之上 */
  flex: 1;
  @include flex-column;
  align-items: flex-start;
  gap: 8rpx;
  /* 与 .pick-frame 用同一条曲线与时长，退后态时人物与文字同步淡出，不各走各的 */
  transition: opacity 220ms $p2-ease;

  /* 选项文字：默认统一字号、统一深棕，谁都不抢戏；
   * 「放大 + 身份色」只在**选中时**出现，作为选中反馈的一部分。
   *
   * 这比"一直突出"更合理：选项未定时四个选项是等价的，不该有谁先跳出来；
   * 用户做出选择后，被选中的那一项才放大并染上自己的身份色 —— 反馈即确认。
   * （早前试过给整块文字加奶油白贴纸，与卡片自身的涂鸦底叠在一起太重，已废弃。）
   *
   * 用 flex + 两个平级 text 而不是嵌套 <text>：小程序里嵌套 text 的样式继承行为
   * 在不同基础库版本间有差异，平级元素更稳。baseline 让两段共用一条基线。 */
  .pick-name {
    display: flex;
    align-items: baseline;
    font-size: 44rpx;
    color: $p2-ink;
    /* 猫啃什锦黑：单字重手绘体（usWeightClass 500），固定 normal 以避免合成加粗破坏笔触。
     * 性别卡与身份卡共用本样式，两页文字因此统一为同一只手绘字体 */
    font-family: $p2-font-hand, $p2-font-fallback;
    font-weight: normal;
  }

  /* 主体前留 4rpx：选中放大后字形变大、字内留白变少，没这点间距会与「我是」贴在一起 */
  .pick-prefix {
    margin-right: 4rpx;
  }

  /* 主体的动效基础（选中态样式在下方顶层规则里）。
   *
   * 用 transform: scale 而不是改 font-size —— 这是"极其丝滑"的关键：
   * font-size 过渡会触发文字逐帧重排（reflow），低端机上就是肉眼可见的顿感；
   * transform 只走合成层、不触发布局，配合 will-change 能稳定在 60fps。 */
  .pick-main {
    transform-origin: left bottom;
    will-change: transform;
    transition: transform 320ms $p2-ease, color 320ms $p2-ease;
  }
}

/* === 选中态：主体放大并染上身份色 ===
 *
 * 必须写在顶层 —— .pick-card 是 .pick-body 的父级，嵌进上面会生成
 * 「.pick-body .pick-card.selected ...」这种永远匹配不到的后代选择器。
 *
 * 倍率 1.5：44rpx × 1.5 = 66rpx，比页面标题（56rpx）大一档 ——
 * 选中项要明确成为画面焦点，此时"不能盖过标题"的约束让位于"突出用户的选择"。
 * 取 1.5（= 3/2）而不是 1.4 / 1.45：简单整数分数倍的缩放像素对位更整齐，
 * 非整数倍在静止时更容易看出栅格化发虚（这是 transform 缩放文字的已知代价）。
 * transform-origin 取左下角：底边（基线一侧）固定、向上生长，读起来像"长高"，
 * 而不是向四周膨胀；基线与不缩放的「我是」保持齐平 —— 换成 center 会让基线错位。
 * 时长 320ms 比卡片自身的 220ms 略长，形成「卡片先到位 → 身份再突出」的先后节奏；
 * 曲线沿用项目统一的 $p2-ease（平滑缓出，无回弹 —— 回弹会造成方向反转的顿挫感）。 */
.pick-card.selected .pick-main {
  transform: scale(1.5);
  color: var(--role-ink, #{$p2-ink});
}

/* 脱框后人物是绝对定位、不占 flex 位置，文字需要自己让出人物宽度。
 * 让出的是**主体**右缘而不是容器右缘 —— 素材自带左右留白，容器边缘落在透明区，
 * 按容器算会让文字与人物之间空出一条看不见的缝。主体边界用脚本扫过（按 alpha 阈值统计每列）：
 *   性别卡：主体右缘 226rpx
 *   身份卡：主体右缘 235rpx（两张身份素材留白不对称，取较大者，保证都不压到人）
 * 两者统一留 20rpx 视觉间隙 → 文字起点 246 / 255rpx，再各自减去卡片左内边距 32rpx。
 *
 * 本次把身份卡起点从 282rpx 收到 255rpx（左移 27rpx）：选中态主体放大 1.5 倍后，
 * 文字右缘会伸进卡片右侧的涂鸦区（实测涂鸦从 410rpx 起，饭碗插画在 501rpx 之后），
 * 左移后与饭碗的重叠由 71rpx 减到 40rpx —— 这已是不缩小人物的极限（再左移就压到人了）。
 * 性别卡同步收紧，两页「人物 — 文字」的关系保持一致。 */
.card-female .pick-body,
.card-male .pick-body {
  padding-left: 214rpx;
}

.card-diner .pick-body,
.card-cook .pick-body {
  padding-left: 223rpx;
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
