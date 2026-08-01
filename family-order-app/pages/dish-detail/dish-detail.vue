<template>
  <view class="page-detail page-enter" :class="themeClass">
    <!-- 返回按钮（深色毛玻璃圆形，压在大图上，始终可见） -->
    <view class="back-btn" :style="{ top: statusBarHeight + 14 + 'px' }" @tap="goBack">
      <Icon name="arrow-left" :size="22" />
    </view>

    <!-- 加载中：Lottie 加载动画 -->
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
      <!-- 顶部大图：餐品主视觉，全出血展示 -->
      <view class="hero">
        <image
          v-if="dish.image"
          class="hero-img"
          :src="dish.image"
          mode="aspectFill"
          :style="{ transform: `translate3d(0, ${parallaxY}px, 0)` }"
        />
        <view v-else class="hero-placeholder">{{ heroEmoji }}</view>

        <!-- 顶部压暗：保证返回按钮在浅色图片上也可读 -->
        <view class="hero-top-mask" />
        <!-- 底部渐变：图片平滑过渡到奶油底色 -->
        <view class="hero-bottom-mask" />

        <!-- 冷热氛围层：热饮热气升腾 / 冰饮静态霜感（无闪烁动效） -->
        <view v-if="showTemp" class="temp-fx" :class="dish.temp">
          <template v-if="dish.temp === 'hot'">
            <view class="steam-wisp wisp-1" />
            <view class="steam-wisp wisp-2" />
            <view class="steam-wisp wisp-3" />
          </template>
          <template v-else>
            <view class="frost-mist" />
            <view class="frost-sheen-static" />
          </template>
        </view>

        <!-- 冷热标识：毛玻璃胶囊，贴合大图左下角 -->
        <view v-if="showTemp" class="temp-chip" :class="dish.temp">
          <text class="temp-chip-icon">{{ dish.temp === 'ice' ? '❄' : '🔥' }}</text>
          <text class="temp-chip-text">{{ dish.temp === 'ice' ? '冰饮' : '热饮' }}</text>
        </view>
      </view>

      <!-- 内容卡：圆角上浮，与大图衔接 -->
      <view class="info-card animate-slide-up" :class="tempClass">
        <!-- 标签行：分类 / 推荐 -->
        <view class="tag-row" v-if="categoryName || dish.isRecommended">
          <view v-if="categoryName" class="pill category-pill">
            <text>{{ categoryName }}</text>
          </view>
          <view v-if="dish.isRecommended" class="pill recommend-pill">
            <Icon name="star" :size="13" />
            <text>推荐</text>
          </view>
        </view>

        <!-- 菜品名称 -->
        <text class="name">{{ dish.name || '菜品名称' }}</text>

        <!-- 菜品描述 -->
        <text v-if="dish.description" class="desc">{{ dish.description }}</text>

        <!-- 细分隔线 -->
        <view class="divider" />

        <!-- 数量选择器：统一尺寸、规范触控 -->
        <view class="qty-row">
          <text class="qty-label">数量</text>
          <view class="qty-control">
            <!-- 减号：描边样式，数量为 1 时置灰 -->
            <view
              class="qty-btn qty-minus"
              :class="{ disabled: quantity <= 1 }"
              @tap="onMinus"
            >
              <Icon name="minus" :size="14" />
            </view>
            <!-- 数字：数量变化时轻微弹跳反馈 -->
            <text :key="quantity" class="qty-value">{{ quantity }}</text>
            <!-- 加号：主题色填充 -->
            <view class="qty-btn qty-plus" @tap="onPlus">
              <Icon name="plus" :size="14" color="#fff" />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部留白，避免被固定栏遮挡 -->
      <view class="bottom-spacer" />
    </template>

    <!-- 底部操作栏：悬浮圆角主按钮（购物车汇总在点单列表页底部） -->
    <view v-if="!loading && !loadError" class="bottom-bar">
      <view class="add-btn" @tap="onAddToCart">
        <text>加入点单</text>
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
  temp: '',
  isRecommended: false
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
 * 2. 购物车角标弹跳反馈
 * 3. 显示成功 toast
 * 4. 清空本页 quantity 状态并返回上一页
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
 * 通过 app-service 云函数（module: dishes-crud）查询
 */
const loadDish = async (dishId) => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: { module: 'dishes-crud', action: 'detail', _id: dishId }
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
      temp: d.temp || '',
      isRecommended: !!d.isRecommended
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

/* === 返回按钮（深色毛玻璃，浮于大图之上） === */
.back-btn {
  position: fixed;
  top: 32rpx;
  left: 28rpx;
  z-index: 100;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: rgba(44, 27, 20, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.35);
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(44, 27, 20, 0.2);
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

  .state-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
  }
}

/* === 顶部大图：餐品主视觉 === */
.hero {
  position: relative;
  width: 100%;
  height: 640rpx;
  background-color: var(--theme-secondary);
  overflow: hidden;

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
    font-size: 200rpx;
    line-height: 1;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  // 顶部压暗：保证返回按钮可读
  .hero-top-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 220rpx;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0));
    pointer-events: none;
  }

  // 底部渐变：与奶油底色平滑衔接
  .hero-bottom-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160rpx;
    background: linear-gradient(to top, $color-bg, rgba(255, 251, 245, 0));
    pointer-events: none;
  }

  /* === 冷热氛围层（纯图形，与列表 dish-card 同款语言） === */
  .temp-fx {
    position: absolute;
    inset: 0;
    pointer-events: none;

    /* 热饮：三缕热气自杯中袅袅升起 */
    &.hot {
      .steam-wisp {
        position: absolute;
        bottom: 200rpx;
        width: 10rpx;
        height: 40rpx;
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
        height: 52rpx;
        animation-delay: 0.9s;
      }

      .wisp-3 {
        left: 58%;
        animation-delay: 1.8s;
      }
    }

    /* 冰饮：静态霜感——杯底冷雾 + 固定磨砂高光（无循环动效） */
    &.ice {
      .frost-mist {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 220rpx;
        background: radial-gradient(
          ellipse at 50% 100%,
          rgba(186, 216, 255, 0.28) 0%,
          rgba(186, 216, 255, 0) 72%
        );
      }

      .frost-sheen-static {
        position: absolute;
        top: -40%;
        left: -30%;
        width: 90rpx;
        height: 180%;
        transform: rotate(22deg);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.18) 50%,
          rgba(255, 255, 255, 0) 100%
        );
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
      transform: translateY(-36rpx) scaleX(1.4);
    }
    100% {
      transform: translateY(-80rpx) scaleX(0.8);
      opacity: 0;
    }
  }


  /* === 冷热标识：毛玻璃胶囊，大图左下角 === */
  .temp-chip {
    position: absolute;
    left: 32rpx;
    bottom: 96rpx;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 22rpx;
    border-radius: $radius-full;
    background-color: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1rpx solid rgba(255, 255, 255, 0.4);
    line-height: 1;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);

    .temp-chip-icon {
      font-size: 22rpx;
      line-height: 1;
      color: #fff;
    }

    .temp-chip-text {
      font-size: 22rpx;
      font-weight: $font-weight-semibold;
      color: #fff;
      letter-spacing: 1rpx;
    }

    &.ice {
      background: linear-gradient(135deg, rgba(147, 197, 253, 0.92) 0%, rgba(59, 130, 246, 0.88) 100%);
      border-color: rgba(255, 255, 255, 0.6);
      box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.25);
    }

    &.hot {
      background-color: rgba(251, 146, 60, 0.32);
    }
  }
}

/* === 内容卡：圆角上浮，与大图衔接 === */
.info-card {
  position: relative;
  z-index: 2;
  margin: -48rpx 32rpx 0;
  padding: 44rpx 40rpx 40rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  border: 2rpx solid transparent;
  transition: border-color $dur-base $ease-smooth;

  /* 冷热氛围：仅保留轻量描边晕染，避免整卡渐变过重 */
  &.temp-ice {
    border-color: rgba(147, 197, 253, 0.45);
  }

  &.temp-hot {
    border-color: rgba(253, 186, 116, 0.5);
  }

  // 标签行
  .tag-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 20rpx;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    padding: 6rpx 20rpx;
    border-radius: $radius-full;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    line-height: 1.5;
  }

  .category-pill {
    background-color: var(--theme-secondary);
    color: var(--theme-secondary-foreground);
  }

  .recommend-pill {
    background-color: rgba(251, 191, 36, 0.16);
    color: #b45309;
  }

  .name {
    display: block;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--theme-text);
    line-height: $line-height-tight;
    letter-spacing: 1rpx;
  }

  .desc {
    display: block;
    margin-top: 18rpx;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: $line-height-relaxed;
  }

  .divider {
    height: 2rpx;
    background-color: $color-neutral-100;
    margin-top: 36rpx;
  }

  // 数量选择器
  .qty-row {
    @include flex-between;
    margin-top: 32rpx;

    .qty-label {
      font-size: $font-size-base;
      color: $color-text;
      font-weight: $font-weight-semibold;
    }

    .qty-control {
      display: flex;
      align-items: center;
      gap: 28rpx;

      .qty-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        @include flex-center;
        @include tap-feedback(0.9);
        transition: background-color $dur-base $ease-smooth,
          border-color $dur-base $ease-smooth, color $dur-base $ease-smooth,
          opacity $dur-fast $ease-smooth;
      }

      // 减号：描边主题色，到 1 时置灰
      .qty-minus {
        background-color: $color-card;
        border: 2rpx solid var(--theme-primary);
        color: var(--theme-primary);

        &.disabled {
          border-color: $color-neutral-200;
          color: $color-neutral-400;
          opacity: 0.6;
        }
      }

      // 加号：主题色填充
      .qty-plus {
        background-color: var(--theme-primary);
        color: #fff;
        box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.14);
      }

      // 数字：数量变化时轻弹反馈
      .qty-value {
        min-width: 52rpx;
        text-align: center;
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        color: $color-text;
        animation: qtyPop $dur-fast $ease-smooth;
      }
    }
  }
}

@keyframes qtyPop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* === 底部留白 === */
.bottom-spacer {
  height: 260rpx;
}

/* === 底部操作栏：毛玻璃悬浮条 + 通栏主按钮 === */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1rpx solid $color-neutral-100;
  box-shadow: 0 -8rpx 24rpx rgba(44, 27, 20, 0.06);

  .add-btn {
    @include btn-primary;
    width: 100%;
    height: 96rpx;
    border-radius: $radius-full;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    box-shadow: 0 8rpx 20rpx rgba(44, 27, 20, 0.16);
  }
}
</style>
