<template>
  <view
    class="dish-card animate-item-enter"
    :class="tempClass"
    :style="{ animationDelay: `${index * 50}ms` }"
    @tap="onCardTap"
  >
    <!-- 左侧图片区（冷热氛围承载区） -->
    <view class="dish-image">
      <image v-if="dish.image" :src="dish.image" mode="aspectFill" class="img" />
      <view v-else class="emoji">{{ emoji }}</view>

      <!-- 冷热氛围动效层：热饮热气升腾 / 冰饮冰霜流光 -->
      <view v-if="showTemp" class="temp-fx" :class="dish.temp">
        <template v-if="dish.temp === 'hot'">
          <view class="steam-wisp wisp-1" />
          <view class="steam-wisp wisp-2" />
          <view class="steam-wisp wisp-3" />
        </template>
        <view v-else class="frost-sheen" />
      </view>

      <!-- 冷热角标：融入图片左下角的渐变胶囊（替代原先名字旁的孤立标签） -->
      <view v-if="showTemp" class="temp-chip" :class="dish.temp">
        <text class="temp-chip-icon">{{ dish.temp === 'ice' ? '❄' : '🔥' }}</text>
        <text class="temp-chip-text">{{ dish.temp === 'ice' ? '冰' : '热' }}</text>
      </view>
    </view>

    <!-- 中间信息区 -->
    <view class="dish-info">
      <view class="dish-name-row">
        <text class="dish-name">{{ dish.name }}</text>
      </view>
      <text class="dish-desc">{{ dish.description || '暂无描述' }}</text>
    </view>

    <!-- 右侧"+"按钮 -->
    <view class="add-btn" @tap.stop="onAddTap">
      <Icon name="plus" :size="18" color="#fff" />
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  // 菜品对象：{ dishId, name, image, description, type, categoryName, ... }
  dish: { type: Object, required: true },
  // 在列表中的序号（用于错落入场动画的延迟）
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['add-to-cart', 'tap'])

// 根据菜品类型推断占位 emoji
const emoji = computed(() => (props.dish.type === 'food' ? '🍲' : '☕'))

// 是否展示冷热状态（仅咖啡且有 temp 字段）
const showTemp = computed(() => props.dish.type === 'coffee' && !!props.dish.temp)

// 卡片整体冷热氛围类：temp-ice / temp-hot
const tempClass = computed(() => (showTemp.value ? `temp-${props.dish.temp}` : ''))

// 必须在 setup 顶层调用 getCurrentInstance，事件处理函数中调用会返回 null
const instance = getCurrentInstance()

// 点击整张卡片：跳详情
const onCardTap = () => {
  emit('tap', props.dish)
}

// 点击"+"按钮：通过 boundingClientRect 获取按钮位置后抛出
const onAddTap = (e) => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select('.add-btn')
    .boundingClientRect((rect) => {
      // rect 可能为 null（极端情况），降级用事件触发点
      const x = rect ? rect.left + rect.width / 2 : (e.detail && e.detail.x) || 0
      const y = rect ? rect.top + rect.height / 2 : (e.detail && e.detail.y) || 0
      emit('add-to-cart', { dish: props.dish, originX: x, originY: y })
    })
    .exec()
}
</script>

<style lang="scss" scoped>
.dish-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border: 2rpx solid var(--theme-card-border, $color-coffee-100);
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: transform $dur-fast $ease-smooth, box-shadow $dur-base $ease-smooth,
    border-color $dur-base $ease-smooth;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-md;
  }

  /* === 冷热卡片氛围：状态融入整张卡片的气质，而非孤立标签 === */
  /* 冰饮：右上一抹冰蓝渐变晕染 + 冷色描边 */
  &.temp-ice {
    background: linear-gradient(135deg, $color-card 52%, rgba(191, 219, 254, 0.38) 100%);
    border-color: rgba(147, 197, 253, 0.55);
  }

  /* 热饮：右上一抹暖橙渐变晕染 + 暖色描边（贴近咖啡主题的暖调） */
  &.temp-hot {
    background: linear-gradient(135deg, $color-card 52%, rgba(254, 215, 170, 0.42) 100%);
    border-color: rgba(253, 186, 116, 0.55);
  }
}

/* 左侧图片：圆角方形，无图显示 emoji */
.dish-image {
  position: relative;
  flex-shrink: 0;
  width: 128rpx;
  height: 128rpx;
  border-radius: $radius-lg;
  overflow: hidden;
  background-color: var(--theme-secondary);
  @include flex-center;

  .img {
    width: 100%;
    height: 100%;
  }

  .emoji {
    font-size: 56rpx;
    line-height: 1;
  }
}

/* === 冷热氛围动效层（覆盖在图片上，不响应点击） === */
.temp-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;

  /* 热饮：三缕热气自杯中袅袅升起 */
  &.hot {
    .steam-wisp {
      position: absolute;
      bottom: 30rpx;
      width: 7rpx;
      height: 20rpx;
      border-radius: $radius-full;
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 10rpx rgba(255, 255, 255, 0.8);
      opacity: 0;
      animation: steamRise 2.4s $ease-smooth infinite;
    }

    .wisp-1 {
      left: 40rpx;
    }

    .wisp-2 {
      left: 60rpx;
      height: 26rpx;
      animation-delay: 0.8s;
    }

    .wisp-3 {
      left: 80rpx;
      animation-delay: 1.6s;
    }
  }

  /* 冰饮：一道冰霜流光周期性扫过杯面 */
  &.ice {
    .frost-sheen {
      position: absolute;
      top: -40%;
      left: -70%;
      width: 44rpx;
      height: 180%;
      transform: rotate(22deg);
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.65) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: frostSweep 2.8s $ease-smooth infinite;
    }
  }
}

@keyframes steamRise {
  0% {
    transform: translateY(10rpx) scaleX(1);
    opacity: 0;
  }
  30% {
    opacity: 0.85;
  }
  60% {
    transform: translateY(-16rpx) scaleX(1.4);
  }
  100% {
    transform: translateY(-36rpx) scaleX(0.8);
    opacity: 0;
  }
}

@keyframes frostSweep {
  0% {
    left: -70%;
  }
  60%,
  100% {
    left: 130%;
  }
}

/* === 冷热角标：图片左下角的渐变胶囊 === */
.temp-chip {
  position: absolute;
  left: 8rpx;
  bottom: 8rpx;
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  padding: 3rpx 14rpx;
  border-radius: $radius-full;
  line-height: 1.5;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);

  .temp-chip-icon {
    font-size: 20rpx;
    line-height: 1;
    color: #fff;
  }

  .temp-chip-text {
    font-size: 20rpx;
    font-weight: $font-weight-semibold;
    color: #fff;
    letter-spacing: 1rpx;
  }

  &.ice {
    background: linear-gradient(135deg, #7cb3f7 0%, #4a8cef 100%);
  }

  &.hot {
    background: linear-gradient(135deg, #fbb25c 0%, #ef7d1a 100%);
  }
}

/* 中间信息区 */
.dish-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  .dish-name-row {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .dish-name {
    flex: 1;
    min-width: 0;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    color: var(--theme-text);
    line-height: $line-height-tight;
    @include ellipsis(1);
  }

  .dish-desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: $line-height-normal;
    @include ellipsis(1);
  }
}

/* 右侧"+"按钮 */
.add-btn {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: var(--theme-primary);
  @include flex-center;
  transition: transform $dur-fast $ease-bounce, box-shadow $dur-base $ease-smooth;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);

  &:active {
    transform: scale(0.85) rotate(90deg);
  }
}
</style>
