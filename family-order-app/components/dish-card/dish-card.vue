<template>
  <view class="dish-card animate-item-enter" :style="{ animationDelay: `${index * 50}ms` }" @tap="onCardTap">
    <!-- 左侧图片区 -->
    <view class="dish-image">
      <image v-if="dish.image" :src="dish.image" mode="aspectFill" class="img" />
      <view v-else class="emoji">{{ emoji }}</view>
    </view>

    <!-- 中间信息区 -->
    <view class="dish-info">
      <text class="dish-name">{{ dish.name }}</text>
      <text class="dish-desc">{{ dish.description || '暂无描述' }}</text>
      <view v-if="dish.categoryName" class="dish-tag">
        <text class="tag-text">{{ dish.categoryName }}</text>
      </view>
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
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border: 2rpx solid var(--theme-card-border, $color-coffee-100);
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: transform $dur-fast $ease-smooth, box-shadow $dur-base $ease-smooth;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-md;
  }
}

/* 左侧图片：圆角方形，无图显示 emoji */
.dish-image {
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

/* 中间信息区 */
.dish-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  .dish-name {
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

  .dish-tag {
    align-self: flex-start;
    margin-top: 4rpx;
    padding: 2rpx 12rpx;
    border-radius: $radius-full;
    background-color: var(--theme-secondary);
    line-height: 1.6;

    .tag-text {
      font-size: $font-size-xs;
      color: var(--theme-secondary-foreground);
      font-weight: $font-weight-medium;
    }
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
