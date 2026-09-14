<template>
  <view class="custom-tabbar">
    <view class="tabbar-line line-a"></view>
    <view class="tabbar-line line-b"></view>

    <view
      v-for="tab in allTabs"
      :key="tab.key"
      class="tab-item"
      :class="[{ active: activeKey === tab.key }, `tab-${tab.key}`]"
      @tap="onTabTap(tab)"
    >
      <view class="tab-icon-wrap">
        <view class="active-blob"></view>
        <Icon :name="tab.icon" :size="21" :stroke-width="2.2" />
      </view>
      <text class="tab-text">{{ tab.text }}</text>
      <view class="tab-scribble"></view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const allTabs = [
  { key: 'home', text: '首页', icon: 'home', path: '/pages/home/home' },
  { key: 'menu', text: '菜单', icon: 'food', path: '/pages/order/order' },
  { key: 'recipe', text: '菜谱', icon: 'book-open', path: '/pages/recipe/recipe' },
  { key: 'my', text: '我的', icon: 'user', path: '/pages/my/my' }
]

const activeKey = ref('home')

const syncActiveFromRoute = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    if (!current) return
    const route = '/' + current.route
    const matched = allTabs.find((tab) => tab.path === route)
    if (matched) activeKey.value = matched.key
  } catch (e) {
    console.error('[custom-tabbar] syncActiveFromRoute error', e)
  }
}

const onTabTap = (tab) => {
  if (tab.key === activeKey.value) return
  uni.switchTab({ url: tab.path })
}

onMounted(syncActiveFromRoute)
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: 14rpx;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  height: calc(106rpx + env(safe-area-inset-bottom));
  padding: 12rpx 10rpx env(safe-area-inset-bottom);
  background: rgba(255, 253, 247, 0.97);
  border: 3rpx solid $p2-line;
  border-radius: 28rpx 34rpx 26rpx 32rpx;
  box-shadow: $p2-shadow-md;
  box-sizing: border-box;

  .tabbar-line {
    position: absolute;
    height: 3rpx;
    border-radius: 999rpx;
    background: rgba(118, 85, 64, 0.2);
    pointer-events: none;
  }

  .line-a {
    top: 5rpx;
    left: 42rpx;
    width: 110rpx;
    transform: rotate(-1deg);
  }

  .line-b {
    top: 7rpx;
    right: 52rpx;
    width: 76rpx;
    transform: rotate(1.2deg);
  }
}

.tab-item {
  position: relative;
  flex: 1;
  height: 82rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5rpx;
  color: #a58f7b;
  transition: color $p2-dur-fast $p2-ease, transform $p2-dur-fast $p2-ease;

  &:active {
    transform: scale(0.92) rotate(-1deg);
  }

  &.active {
    color: $p2-ink;

    .active-blob {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) rotate(-4deg);
    }

    .tab-icon-wrap {
      transform: translateY(-3rpx) rotate(-1deg);
    }

    .tab-text {
      font-weight: 700;
    }

    .tab-scribble {
      opacity: 1;
      transform: translateX(-50%) scaleX(1) rotate(-2deg);
    }
  }

  &.tab-menu .active-blob {
    background: $p2-coral-soft;
  }

  &.tab-recipe .active-blob {
    background: $p2-leaf-soft;
  }

  &.tab-my .active-blob {
    background: $p2-sky-soft;
  }
}

.tab-icon-wrap {
  position: relative;
  z-index: 1;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform $p2-dur-base $p2-ease;

  .fo-icon {
    position: relative;
    z-index: 2;
  }
}

.active-blob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 58rpx;
  height: 46rpx;
  background: $p2-butter-soft;
  border: 2rpx solid rgba(98, 71, 53, 0.12);
  border-radius: 48% 55% 46% 58%;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.55) rotate(3deg);
  transition: opacity $p2-dur-base $p2-ease, transform $p2-dur-base $p2-ease;
}

.tab-text {
  position: relative;
  z-index: 1;
  font-size: 20rpx;
  line-height: 1;
  letter-spacing: 1rpx;
}

.tab-scribble {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 34rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: $p2-coral;
  opacity: 0;
  transform: translateX(-50%) scaleX(0.2) rotate(2deg);
  transition: opacity $p2-dur-base $p2-ease, transform $p2-dur-base $p2-ease;
}
</style>
