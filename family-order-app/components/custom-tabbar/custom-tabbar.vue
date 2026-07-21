<template>
  <view class="custom-tabbar">
    <view
      v-for="(tab, index) in visibleTabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: activeKey === tab.key }"
      @tap="onTabTap(tab)"
    >
      <view class="tab-icon-wrap">
        <Icon :name="tab.icon" :size="20" />
        <view v-if="tab.badge" class="tab-badge">{{ tab.badge }}</view>
      </view>
      <text class="tab-text">{{ tab.text }}</text>
      <view class="tab-indicator"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user.js'
import { useCartStore } from '@/store/cart.js'

const userStore = useUserStore()
const cartStore = useCartStore()

// 所有 tab 定义（管理员 4 个，下单人隐藏管理）
const allTabs = [
  { key: 'home', text: '首页', icon: 'home', path: '/pages/home/home' },
  { key: 'order', text: '点单', icon: 'utensils-crossed', path: '/pages/order/order' },
  { key: 'record', text: '记录', icon: 'clipboard-list', path: '/pages/record/record' },
  { key: 'admin', text: '管理', icon: 'settings', path: '/pages/admin/admin' }
]

// 根据角色过滤：下单人不显示"管理"tab
const visibleTabs = computed(() => {
  if (userStore.isAdmin) return allTabs
  return allTabs.filter((t) => t.key !== 'admin')
})

// 当前激活 tab（从当前页面路由推断）
const activeKey = ref('home')

onMounted(() => {
  syncActiveFromRoute()
})

// 从 getCurrentPages 推断当前激活的 tab
const syncActiveFromRoute = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    if (!current) return
    const route = '/' + current.route
    const matched = allTabs.find((t) => t.path === route)
    if (matched) {
      activeKey.value = matched.key
    }
  } catch (e) {
    console.error('[custom-tabbar] syncActiveFromRoute error', e)
  }
}

const onTabTap = (tab) => {
  if (tab.key === activeKey.value) return
  uni.switchTab({ url: tab.path })
}
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: calc(80rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background-color: rgba(255, 251, 245, 0.96);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 -1rpx 0 rgba(231, 229, 228, 0.8);
}

.tab-item {
  flex: 1;
  @include flex-column;
  align-items: center;
  justify-content: flex-end;
  gap: 2rpx;
  height: 80rpx;
  padding-bottom: 4rpx;
  position: relative;
  color: $color-neutral-400;
  transition: color $dur-base $ease-smooth;

  .tab-icon-wrap {
    position: relative;
    @include flex-center;
    width: 40rpx;
    height: 40rpx;
    transition: transform $dur-base $ease-bounce;

    .tab-badge {
      position: absolute;
      top: -8rpx;
      right: -16rpx;
      min-width: 28rpx;
      height: 28rpx;
      padding: 0 6rpx;
      border-radius: $radius-full;
      background-color: $color-state-error;
      color: #fff;
      font-size: 18rpx;
      line-height: 28rpx;
      text-align: center;
      font-weight: $font-weight-bold;
    }
  }

  .tab-text {
    font-size: $font-size-xs;
    line-height: 1;
    transition: color $dur-base $ease-smooth;
  }

  .tab-indicator {
    position: absolute;
    top: 4rpx;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 40rpx;
    height: 4rpx;
    border-radius: $radius-full;
    background: linear-gradient(90deg, $color-coffee-500, $color-coffee-600);
    transition: transform $dur-base $ease-bounce;
  }

  &.active {
    color: $color-coffee-600;

    .tab-icon-wrap {
      transform: translateY(-4rpx) scale(1.1);
    }

    .tab-text {
      font-weight: $font-weight-semibold;
    }

    .tab-indicator {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &:active {
    .tab-icon-wrap {
      transform: scale(0.92);
    }
  }
}
</style>
