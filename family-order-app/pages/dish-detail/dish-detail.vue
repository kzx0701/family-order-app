<template>
  <view class="page-detail page-enter" :class="themeClass">
    <!-- 返回按钮（毛玻璃圆形，始终可见） -->
    <view class="back-btn" :style="{ top: statusBarHeight + 16 + 'px' }" @tap="goBack">
      <Icon name="arrow-left" :size="20" />
    </view>

    <!-- 加载中：Lottie 加载动画，失败降级到 CSS spinner -->
    <view v-if="loading" class="state-block">
      <lottie-loading
        :animation-data="loadingAnim"
        width="160rpx"
        height="160rpx"
      />
      <text class="state-text">正在加载菜品...</text>
    </view>

    <!-- 加载失败 -->
    <error-state
      v-else-if="loadError"
      emoji="😵"
      title="加载失败"
      :desc="loadError"
      retry-text="重新加载"
      @retry="retryLoad"
    />

    <!-- 详情内容 -->
    <template v-else>
      <!-- 顶部大图 -->
      <view class="hero">
        <image
          v-if="dish.image"
          class="hero-img"
          :src="dish.image"
          mode="aspectFill"
          :style="{ transform: `translate3d(0, ${parallaxY}px, 0)` }"
        />
        <view v-else class="hero-placeholder">{{ heroEmoji }}</view>
        <!-- 渐变遮罩，增加视觉层次 -->
        <view class="hero-mask" />

        <!-- 冷热氛围动效层：热饮热气升腾 / 冰饮冰霜流光（与列表同款语言） -->
        <view v-if="showTemp" class="temp-fx" :class="dish.temp">
          <template v-if="dish.temp === 'hot'">
            <view class="steam-wisp wisp-1" />
            <view class="steam-wisp wisp-2" />
            <view class="steam-wisp wisp-3" />
          </template>
          <view v-else class="frost-sheen" />
        </view>

        <!-- 冷热浮动标识：大图右下角的渐变胶囊 -->
        <view v-if="showTemp" class="temp-chip" :class="dish.temp">
          <text class="temp-chip-icon">{{ dish.temp === 'ice' ? '❄' : '🔥' }}</text>
          <text class="temp-chip-text">{{ dish.temp === 'ice' ? '冰饮' : '热饮' }}</text>
        </view>
      </view>

      <!-- 信息卡（与大图重叠，圆角浮起；冷热时带同款氛围晕染） -->
      <view class="info-card animate-slide-up" :class="tempClass">
        <!-- 标签行：分类 pill -->
        <view class="pill-row" v-if="categoryName">
          <view class="category-pill">
            <text class="pill-text">{{ categoryName }}</text>
          </view>
        </view>

        <!-- 菜品名称 -->
        <text class="name">{{ dish.name || '菜品名称' }}</text>

        <!-- 菜品描述 -->
        <text class="desc">{{ dish.description || '暂无描述' }}</text>

        <!-- 数量选择器 -->
        <view class="qty-row">
          <text class="qty-label">数量</text>
          <view class="qty-control">
            <!-- 减号：边框主题色，到 1 时置灰 -->
            <view
              class="qty-btn qty-minus"
              :class="{ disabled: quantity <= 1 }"
              @tap="onMinus"
            >
              <Icon name="minus" :size="16" />
            </view>
            <!-- 数字 -->
            <text class="qty-value">{{ quantity }}</text>
            <!-- 加号：主题色背景 -->
            <view class="qty-btn qty-plus" @tap="onPlus">
              <Icon name="plus" :size="16" />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部留白，避免被固定栏遮挡 -->
      <view class="bottom-spacer" />
    </template>

    <!-- 底部固定栏：加入点单（无背景容器，按钮直接贴底） -->
    <view v-if="!loading && !loadError" class="bottom-bar">
      <view class="add-btn" @tap="onAddToCart">
        <text class="add-text">加入点单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import { useCartStore } from '@/store/cart.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
// 静态引入 Lottie JSON（微信小程序 uni.request 不支持 / 开头的本地路径）
import loadingAnim from '@/static/lottie/loading.json'

const { statusBarHeight } = useSafeArea()
const cartStore = useCartStore()

/* === 菜品信息 === */
const dish = ref({
  dishId: '',
  name: '',
  image: '',
  description: '',
  type: 'coffee',
  categoryId: '',
  temp: ''
})

/* === 分类名（单独查询，用于分类标签） === */
const categoryName = ref('')

/* === 数量 === */
const quantity = ref(1)

/* === 加载状态 === */
const loading = ref(false)
const loadError = ref('')

/* === 当前菜品 ID（供重试使用） === */
const currentDishId = ref('')

/* === 视差滚动偏移量（px） === */
const parallaxY = ref(0)

/* === 主题类 === */
const themeClass = computed(() => `theme-${dish.value.type || 'coffee'}`)

/* === 大图占位 emoji === */
const heroEmoji = computed(() => (dish.value.type === 'food' ? '🍲' : '☕'))

/* === 冷热状态（仅咖啡且有 temp 字段） === */
const showTemp = computed(() => dish.value.type === 'coffee' && !!dish.value.temp)

/* === 信息卡冷热氛围类：temp-ice / temp-hot === */
const tempClass = computed(() => (showTemp.value ? `temp-${dish.value.temp}` : ''))

/* === 加号：数量 +1 === */
const onPlus = () => {
  quantity.value++
}

/* === 减号：数量 -1，最小 1 === */
const onMinus = () => {
  if (quantity.value > 1) quantity.value--
}

/**
 * 加入点单
 * 1. 调用 cartStore.addItem
 * 2. 显示成功反馈
 * 3. 清空本页 quantity 状态
 * 4. 返回上一页（点单页）
 */
const onAddToCart = () => {
  cartStore.addItem(
    {
      dishId: dish.value.dishId,
      name: dish.value.name,
      image: dish.value.image,
      type: dish.value.type,
      description: dish.value.description
    },
    quantity.value
  )
  uni.showToast({ title: '已加入点单', icon: 'success' })
  // 清空数量状态（用户返回再进时为默认 1）
  quantity.value = 1
  // 延迟返回，让 toast 显示一会儿
  setTimeout(() => uni.navigateBack(), 600)
}

/* === 返回上一页 === */
const goBack = () => {
  uni.navigateBack()
}

/* === 重试加载菜品 === */
const retryLoad = () => {
  if (currentDishId.value) {
    loadDish(currentDishId.value)
  }
}

/**
 * 加载菜品详情
 * 通过 dishes-crud 云函数查询，避免 clientDB 权限问题
 */
const loadDish = async (dishId) => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await uniCloud.callFunction({
      name: 'dishes-crud',
      data: { action: 'detail', _id: dishId }
    })
    if (res.result.code !== 0) {
      loadError.value = res.result.message || '菜品不存在或已下架'
      return
    }
    const d = res.result.dish
    dish.value = {
      dishId: d._id,
      name: d.name || '',
      image: d.image || '',
      description: d.description || '',
      type: d.type || 'coffee',
      categoryId: d.categoryId || '',
      temp: d.temp || ''
    }
    categoryName.value = d.categoryName || ''
  } catch (e) {
    console.error('[dish-detail] loadDish error', e)
    loadError.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

/* === 页面滚动：更新大图视差偏移 === */
onPageScroll((e) => {
  // 大图随滚动缓慢下移，制造视差效果
  // 限制最大偏移，避免露出空白
  parallaxY.value = Math.min(e.scrollTop * 0.3, 70)
})

/* === 页面加载：从路由参数获取 dishId 和 type === */
onLoad((options) => {
  const { dishId, type } = options || {}
  // 先用路由 type 初始化主题，避免主题闪烁
  if (type && ['coffee', 'food'].includes(type)) {
    dish.value.type = type
  }
  if (!dishId) {
    loadError.value = '参数错误'
    return
  }
  // 保存 dishId 供重试使用
  currentDishId.value = dishId
  loadDish(dishId)
})
</script>

<style lang="scss" scoped>
.page-detail {
  position: relative;
  min-height: 100vh;
  background-color: $color-bg;
}

/* === 返回按钮（毛玻璃圆形） === */
.back-btn {
  position: fixed;
  top: 32rpx;
  left: 32rpx;
  z-index: 100;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--theme-text);
  border: 1rpx solid rgba(0, 0, 0, 0.04);
  box-shadow: $shadow-sm;
  @include flex-center;
  @include tap-feedback(0.9);
}

/* === 加载 / 错误状态 === */
.state-block {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  min-height: 100vh;
  padding: 80rpx 0;

  .loading-dots {
    display: flex;
    gap: 8rpx;

    .dot {
      font-size: $font-size-3xl;
      color: var(--theme-primary);
      animation: dotBlink 1.2s $ease-smooth infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  .state-emoji {
    font-size: 96rpx;
    line-height: 1;
  }

  .state-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
  }

  .state-action {
    margin-top: 8rpx;
    padding: 14rpx 40rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);
    @include tap-feedback(0.96);

    .state-action-text {
      color: var(--theme-primary);
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }
  }
}

@keyframes dotBlink {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* === 顶部大图 === */
.hero {
  position: relative;
  width: 100%;
  height: 520rpx; // 约 260px
  background-color: var(--theme-secondary);
  overflow: hidden;
  border-radius: 0 0 40rpx 40rpx;

  .hero-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 130%; // 多出 30% 供视差滚动位移，避免露出空白
    will-change: transform;
  }

  .hero-placeholder {
    position: absolute;
    inset: 0;
    @include flex-center;
    font-size: 160rpx;
    line-height: 1;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  // 渐变遮罩：底部加深，增加视觉层次
  .hero-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0) 55%,
      rgba(0, 0, 0, 0.28) 100%
    );
    pointer-events: none;
  }

  /* === 冷热氛围动效层（与列表 dish-card 同款语言，纯图形不涉及文字） === */
  .temp-fx {
    position: absolute;
    inset: 0;
    pointer-events: none;

    /* 热饮：三缕热气自杯中袅袅升起（大图版，更高更长） */
    &.hot {
      .steam-wisp {
        position: absolute;
        bottom: 160rpx;
        width: 10rpx;
        height: 34rpx;
        border-radius: $radius-full;
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 16rpx rgba(255, 255, 255, 0.8);
        opacity: 0;
        animation: steamRise 2.6s $ease-smooth infinite;
      }

      .wisp-1 {
        left: 42%;
      }

      .wisp-2 {
        left: 50%;
        height: 44rpx;
        animation-delay: 0.9s;
      }

      .wisp-3 {
        left: 58%;
        animation-delay: 1.8s;
      }
    }

    /* 冰饮：一道冰霜流光周期性扫过杯面（大图版） */
    &.ice {
      .frost-sheen {
        position: absolute;
        top: -40%;
        left: -30%;
        width: 80rpx;
        height: 180%;
        transform: rotate(22deg);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.55) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: frostSweep 3s $ease-smooth infinite;
      }
    }
  }

  @keyframes steamRise {
    0% {
      transform: translateY(16rpx) scaleX(1);
      opacity: 0;
    }
    30% {
      opacity: 0.85;
    }
    60% {
      transform: translateY(-32rpx) scaleX(1.4);
    }
    100% {
      transform: translateY(-72rpx) scaleX(0.8);
      opacity: 0;
    }
  }

  @keyframes frostSweep {
    0% {
      left: -30%;
    }
    60%,
    100% {
      left: 110%;
    }
  }

  /* === 冷热浮动标识：大图右下角的渐变胶囊（文字静止，无动画） === */
  .temp-chip {
    position: absolute;
    right: 32rpx;
    bottom: 80rpx; // 避开信息卡 48rpx 的重叠区
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 26rpx;
    border-radius: $radius-full;
    line-height: 1.5;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.18);

    .temp-chip-icon {
      font-size: 26rpx;
      line-height: 1;
      color: #fff;
    }

    .temp-chip-text {
      font-size: 24rpx;
      font-weight: $font-weight-semibold;
      color: #fff;
      letter-spacing: 2rpx;
    }

    &.ice {
      background: linear-gradient(135deg, #7cb3f7 0%, #4a8cef 100%);
    }

    &.hot {
      background: linear-gradient(135deg, #fbb25c 0%, #ef7d1a 100%);
    }
  }
}

/* === 信息卡 === */
.info-card {
  position: relative;
  z-index: 2;
  margin: -48rpx 32rpx 0;
  padding: 40rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  border: 2rpx solid transparent;
  transition: border-color $dur-base $ease-smooth;

  /* 冷热氛围晕染（与列表卡片同款，呼应大图标识） */
  &.temp-ice {
    background: linear-gradient(160deg, $color-card 48%, rgba(191, 219, 254, 0.35) 100%);
    border-color: rgba(147, 197, 253, 0.5);
  }

  &.temp-hot {
    background: linear-gradient(160deg, $color-card 48%, rgba(254, 215, 170, 0.4) 100%);
    border-color: rgba(253, 186, 116, 0.5);
  }

  // 标签行：分类 pill
  .pill-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 20rpx;
  }

  .category-pill {
    padding: 6rpx 20rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);

    .pill-text {
      font-size: $font-size-xs;
      color: var(--theme-secondary-foreground);
      font-weight: $font-weight-medium;
    }
  }

  .name {
    display: block;
    font-size: 48rpx; // 约 24px
    font-weight: $font-weight-bold;
    color: var(--theme-text);
    line-height: $line-height-tight;
  }

  .desc {
    display: block;
    margin-top: 16rpx;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: $line-height-relaxed;
  }

  // 数量选择器
  .qty-row {
    @include flex-between;
    margin-top: 40rpx;
    padding-top: 32rpx;
    border-top: 2rpx solid $color-neutral-100;

    .qty-label {
      font-size: $font-size-base;
      color: $color-text;
      font-weight: $font-weight-medium;
    }

    .qty-control {
      display: flex;
      align-items: center;
      gap: 32rpx;

      .qty-btn {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        @include flex-center;
        @include tap-feedback(0.9);
        transition: background-color $dur-base $ease-smooth,
          border-color $dur-base $ease-smooth, color $dur-base $ease-smooth,
          opacity $dur-fast $ease-smooth;
      }

      // 减号：边框主题色，到 1 时置灰
      .qty-minus {
        background-color: $color-card;
        border: 2rpx solid var(--theme-primary);
        color: var(--theme-primary);

        &.disabled {
          border-color: $color-neutral-300;
          color: $color-text-disabled;
          opacity: 0.5;
        }
      }

      // 加号：主题色背景
      .qty-plus {
        background-color: var(--theme-primary);
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
      }

      .qty-value {
        min-width: 56rpx;
        text-align: center;
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        color: $color-text;
      }
    }
  }
}

/* === 底部留白 === */
.bottom-spacer {
  height: 220rpx;
}

/* === 底部固定栏：按钮直接贴底，无背景容器 === */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  // 无背景色、无 padding，让按钮完全铺满贴底
  display: flex;
  flex-direction: column;

  .add-btn {
    @include btn-primary;
    width: 100%;
    // 贴底的足够高度，包含安全区域
    padding: 32rpx 32rpx;
    padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
    border-radius: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
    transition: transform $dur-fast $ease-bounce,
      opacity $dur-fast $ease-smooth;

    .add-text {
      color: inherit;
    }
  }
}
</style>
