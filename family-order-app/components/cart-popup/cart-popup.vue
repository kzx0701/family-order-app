<template>
  <view v-if="visible" class="cart-popup-root" :class="themeClass">
    <!-- 遮罩层：点击关闭，阻止背景滚动 -->
    <view
      class="cart-mask"
      :class="{ 'cart-mask--show': show }"
      @tap="onClose"
      @touchmove.stop.prevent="noop"
    ></view>

    <!-- 底部卡片 -->
    <view class="cart-sheet" :class="{ 'cart-sheet--show': show }">
      <!-- 顶部抓手 -->
      <view class="cart-handle"></view>

      <!-- 标题栏：购物车 + 清空 -->
      <view class="cart-header">
        <view class="cart-title-wrap">
          <text class="cart-title">购物车</text>
          <view v-if="items.length > 0" class="cart-kinds">
            <text class="cart-kinds-text">{{ totalKinds }} 种</text>
          </view>
        </view>
        <view
          v-if="items.length > 0"
          class="cart-clear"
          @tap="onClear"
        >
          <Icon name="trash" :size="14" />
          <text class="cart-clear-text">清空</text>
        </view>
      </view>

      <!-- 内容区：空状态 或 菜品列表 -->
      <scroll-view scroll-y class="cart-content" :class="{ 'is-empty': items.length === 0 }">
        <!-- 空状态 -->
        <view v-if="items.length === 0" class="cart-empty">
          <text class="cart-empty-emoji">🛒</text>
          <text class="cart-empty-text">还没点东西哦~</text>
          <view class="cart-empty-hint" @tap="onClose">
            <text class="cart-empty-hint-text">去选好吃的</text>
          </view>
        </view>

        <!-- 菜品列表 -->
        <view v-else class="cart-list">
          <view
            v-for="(item, idx) in items"
            :key="item.dishId"
            class="cart-item"
            :class="{ 'is-removing': !!removingMap[item.dishId] }"
            :style="removingMap[item.dishId] ? {} : { animationDelay: `${Math.min(idx, 8) * 40}ms` }"
          >
            <!-- 菜品图：圆角小图 -->
            <view class="item-img-wrap">
              <image v-if="item.image" :src="item.image" class="item-img" mode="aspectFill" />
              <view v-else class="item-emoji">{{ item.type === 'food' ? '🍲' : '☕' }}</view>
            </view>

            <!-- 信息：名称 + 描述 -->
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-desc">{{ item.description || '暂无描述' }}</text>
            </view>

            <!-- 数量选择器：- 数字 + -->
            <view class="item-qty">
              <view class="qty-btn qty-minus" @tap="onMinus(item.dishId)">
                <Icon name="minus" :size="14" />
              </view>
              <text :key="item.quantity" class="qty-value">{{ item.quantity }}</text>
              <view class="qty-btn qty-plus" @tap="onPlus(item.dishId)">
                <Icon name="plus" :size="14" color="#fff" />
              </view>
            </view>

            <!-- 删除按钮：直接移除 -->
            <view class="item-del" @tap="onRemove(item.dishId)">
              <Icon name="trash" :size="14" />
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮：去下单 -->
      <view v-if="items.length > 0" class="cart-footer">
        <view class="cart-submit-btn" @tap="onSubmit">
          <text class="cart-submit-text">去下单</text>
          <view class="cart-submit-badge">
            <text class="cart-submit-badge-text">{{ totalCount }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 购物车浮层组件
 * 底部弹出 sheet 样式：半透明遮罩 + 底部白色卡片滑入
 *
 * 用法：
 *   <cart-popup :visible="visible" :theme="orderType" @close="..." @submit="..." />
 *
 * 功能：
 * - 顶部抓手 + 标题"购物车" + 清空按钮
 * - 中间菜品列表（可滚动）：图 + 名称 + 描述 + 数量选择器 + 删除按钮
 * - 空状态：emoji + 文案"还没点东西哦~"
 * - 底部"去下单"按钮
 * - 数量调整时丝滑过渡（数字放大反馈）
 * - 主题适配（coffee/food）
 */
import { computed, watch, ref, nextTick } from 'vue'
import { useCartStore } from '@/store/cart.js'

const props = defineProps({
  // 是否显示
  visible: { type: Boolean, default: false },
  // 主题：coffee / food
  theme: { type: String, default: 'coffee' }
})

const emit = defineEmits(['close', 'submit'])

const cartStore = useCartStore()

// 购物车数据（响应式）
const items = computed(() => cartStore.activeItems)
const totalCount = computed(() => cartStore.totalCount)
const totalKinds = computed(() => cartStore.totalKinds)

// 主题 class
const themeClass = computed(() => `theme-${props.theme}`)

// 控制 sheet 的滑入动画：visible 变 true 时下一帧再切换到 show 状态
const show = ref(false)
watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        show.value = true
      })
    } else {
      show.value = false
    }
  },
  { immediate: true }
)

// 空函数：用于阻止 touchmove 默认行为
const noop = () => {}

// 正在淡出移除的菜品 id 映射，用于实现移除淡出动画
const removingMap = ref({})

// 关闭：先反向动画，再 emit close
const onClose = () => {
  show.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

// 清空购物车：二次确认
const onClear = () => {
  uni.showModal({
    title: '清空购物车',
    content: '确定要清空所有菜品吗？',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        cartStore.clearCart()
        removingMap.value = {}
      }
    }
  })
}

/**
 * 启动移除动画：先标记 is-removing 触发淡出，动画结束后真正移除
 * 避免重复触发
 */
const startRemove = (dishId) => {
  if (removingMap.value[dishId]) return
  removingMap.value = { ...removingMap.value, [dishId]: true }
  setTimeout(() => {
    cartStore.removeItem(dishId)
    const next = { ...removingMap.value }
    delete next[dishId]
    removingMap.value = next
  }, 250)
}

// 数量 -1：若当前数量为 1，走淡出移除流程；否则正常递减
const onMinus = (dishId) => {
  const item = items.value.find((i) => i.dishId === dishId)
  if (item && item.quantity <= 1) {
    startRemove(dishId)
  } else {
    cartStore.decrement(dishId)
  }
}

// 数量 +1
const onPlus = (dishId) => {
  cartStore.increment(dishId)
}

// 删除该菜品：走淡出移除流程
const onRemove = (dishId) => {
  startRemove(dishId)
}

// 去下单：先收起浮层，再 emit submit
const onSubmit = () => {
  show.value = false
  setTimeout(() => {
    emit('submit')
  }, 300)
}
</script>

<style lang="scss" scoped>
.cart-popup-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
}

/* === 遮罩层：fadeIn === */
.cart-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(44, 27, 20, 0.45);
  opacity: 0;
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);

  &--show {
    opacity: 1;
  }
}

/* === 底部卡片：slideUp 弹性缓动 === */
.cart-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $color-card;
  border-radius: $radius-2xl $radius-2xl 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -8rpx 32rpx rgba(44, 27, 20, 0.12);
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &--show {
    transform: translateY(0);
  }
}

/* 顶部抓手 */
.cart-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: $radius-full;
  background-color: $color-neutral-200;
  margin: 16rpx auto 0;
  flex-shrink: 0;
}

/* === 标题栏 === */
.cart-header {
  @include flex-between;
  padding: 20rpx 40rpx 16rpx;
  flex-shrink: 0;

  .cart-title-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .cart-title {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $color-coffee-800;
    }

    .cart-kinds {
      padding: 2rpx 14rpx;
      border-radius: $radius-full;
      background-color: var(--theme-secondary);
      transition: background-color $dur-base $ease-smooth;

      .cart-kinds-text {
        font-size: $font-size-xs;
        color: var(--theme-secondary-foreground);
        font-weight: $font-weight-medium;
      }
    }
  }

  .cart-clear {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 20rpx;
    border-radius: $radius-full;
    background-color: $color-neutral-100;
    color: $color-neutral-500;
    transition: transform $dur-fast $ease-smooth,
      background-color $dur-base $ease-smooth;

    &:active {
      transform: scale(0.94);
      background-color: $color-neutral-200;
    }

    .cart-clear-text {
      font-size: $font-size-sm;
      color: $color-neutral-500;
    }
  }
}

/* === 内容区 === */
.cart-content {
  flex: 1;
  padding: 8rpx 32rpx;
  min-height: 240rpx;
  max-height: 56vh;

  &.is-empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* === 空状态 === */
.cart-empty {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 60rpx 0 80rpx;
  animation: fadeIn $dur-base $ease-smooth both;

  .cart-empty-emoji {
    font-size: 96rpx;
    line-height: 1;
    animation: pulse 2.4s $ease-smooth infinite;
  }

  .cart-empty-text {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .cart-empty-hint {
    margin-top: 8rpx;
    padding: 12rpx 36rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);
    transition: transform $dur-fast $ease-bounce,
      background-color $dur-base $ease-smooth;

    &:active {
      transform: scale(0.96);
    }

    .cart-empty-hint-text {
      color: var(--theme-primary);
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }
  }
}

/* === 菜品列表 === */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 8rpx 0 24rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background-color: $color-bg;
  border-radius: $radius-lg;
  animation: itemEnter 300ms $ease-smooth both;
  transition: opacity $dur-base $ease-smooth, transform $dur-base $ease-smooth;

  /* 移除中：淡出 + 右滑 */
  &.is-removing {
    animation: itemLeave 250ms $ease-smooth both;
  }

  /* 菜品图：圆角小图 96rpx */
  .item-img-wrap {
    flex-shrink: 0;
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-md;
    overflow: hidden;
    background-color: var(--theme-secondary);
    @include flex-center;

    .item-img {
      width: 100%;
      height: 100%;
    }

    .item-emoji {
      font-size: 40rpx;
      line-height: 1;
    }
  }

  /* 信息：名称 + 描述 */
  .item-info {
    flex: 1;
    min-width: 0;
    @include flex-column;
    gap: 4rpx;

    .item-name {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-text;
      @include ellipsis(1);
    }

    .item-desc {
      font-size: $font-size-xs;
      color: $color-text-muted;
      @include ellipsis(1);
    }
  }

  /* 数量选择器：与详情页一致风格 */
  .item-qty {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex-shrink: 0;

    .qty-btn {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      @include flex-center;
      transition: transform $dur-fast $ease-bounce,
        background-color $dur-base $ease-smooth;

      &:active {
        transform: scale(0.82);
      }
    }

    .qty-minus {
      background-color: $color-neutral-100;
      color: $color-neutral-600;
    }

    .qty-plus {
      background-color: var(--theme-primary);
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    }

    /* 数字：数量变化时放大反馈 */
    .qty-value {
      min-width: 40rpx;
      text-align: center;
      font-size: $font-size-base;
      font-weight: $font-weight-bold;
      color: $color-text;
      animation: numPop 280ms $ease-bounce;
    }
  }

  /* 删除按钮 */
  .item-del {
    flex-shrink: 0;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    @include flex-center;
    color: $color-neutral-400;
    transition: transform $dur-fast $ease-smooth,
      color $dur-base $ease-smooth, background-color $dur-base $ease-smooth;

    &:active {
      transform: scale(0.85);
      color: $color-state-error;
      background-color: rgba(239, 68, 68, 0.08);
    }
  }
}

/* === 底部按钮 === */
.cart-footer {
  flex-shrink: 0;
  padding: 16rpx 32rpx 24rpx;
  border-top: 1px solid $color-border;

  .cart-submit-btn {
    position: relative;
    background-color: var(--theme-primary);
    padding: 24rpx 0;
    border-radius: $radius-full;
    text-align: center;
    transition: transform $dur-fast $ease-bounce,
      background-color $dur-base $ease-smooth;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);

    &:active {
      transform: scale(0.97);
    }

    .cart-submit-text {
      color: #fff;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
    }

    /* 件数徽章：跟随主题色，白字圆角 */
    .cart-submit-badge {
      position: absolute;
      top: 50%;
      right: 32rpx;
      transform: translateY(-50%);
      min-width: 36rpx;
      height: 36rpx;
      padding: 0 10rpx;
      border-radius: $radius-full;
      background-color: rgba(255, 255, 255, 0.25);
      @include flex-center;

      .cart-submit-badge-text {
        color: #fff;
        font-size: $font-size-xs;
        font-weight: $font-weight-bold;
      }
    }
  }
}

/* === 列表项入场动画 === */
@keyframes itemEnter {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* === 列表项移除动画：淡出 + 右滑 === */
@keyframes itemLeave {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(60rpx) scale(0.9);
  }
}

/* === 数字放大反馈 === */
@keyframes numPop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}
</style>
