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
      </view>

      <!-- 信息卡（与大图重叠，圆角浮起） -->
      <view class="info-card animate-slide-up">
        <!-- 标签行：分类 pill + 冷热徽章 -->
        <view class="pill-row" v-if="categoryName || (dish.type === 'coffee' && dish.temp)">
          <view v-if="categoryName" class="category-pill">
            <text class="pill-text">{{ categoryName }}</text>
          </view>
          <view v-if="dish.type === 'coffee' && dish.temp" class="temp-pill" :class="dish.temp">
            <text class="temp-pill-icon">{{ dish.temp === 'ice' ? '❄' : '🔥' }}</text>
            <text class="temp-pill-text">{{ dish.temp === 'ice' ? '冰饮' : '热饮' }}</text>
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
  categoryId: ''
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
      categoryId: d.categoryId || ''
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

  // 标签行：分类 pill + 冷热徽章
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

  .temp-pill {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
    padding: 6rpx 20rpx;
    border-radius: $radius-full;

    .temp-pill-icon {
      font-size: 20rpx;
      line-height: 1;
    }

    .temp-pill-text {
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    &.ice {
      background-color: #EFF6FF;
      .temp-pill-icon, .temp-pill-text { color: #2563EB; }
    }

    &.hot {
      background-color: #FEF2F2;
      .temp-pill-icon, .temp-pill-text { color: #DC2626; }
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
