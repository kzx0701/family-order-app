<template>
  <view class="tabbar-footer">
    <view class="custom-tabbar" role="tablist" aria-label="主导航">
      <view
        v-for="tab in allTabs"
        :key="tab.key"
        class="tab-item"
        :class="[{ active: activeKey === tab.key }, 'tab-' + tab.key]"
        role="tab"
        :aria-label="tab.text"
        :aria-selected="activeKey === tab.key"
        @tap="onTabTap(tab)"
      >
        <view class="tab-icon-wrap">
          <view class="active-wash"></view>
          <image class="tab-art" :src="tab.art" mode="aspectFit" />
        </view>
        <view class="tab-label">
          <text class="tab-text">{{ tab.text }}</text>
          <view class="tab-underline"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 独立的小型矢量插画：不规则曲线、统一棕色线条、少量纸片色块。
const drawing = (content) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
  '<g stroke="#765540" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
  content + '</g></svg>'
)
const allTabs = [
  {
    key: 'home', text: '首页', path: '/pages/home/home',
    art: drawing('<path d="M9 18 10 33Q19 35 30 32L31 17" fill="#fffdf7"/><path d="M5 19Q12 10 20 5L35 18 31 21 20 11 9 22Z" fill="#f8c1b4"/><path d="m16 33 0-10q4-2 8 0l1 10" fill="#f9e8aa"/><path d="m27 7 0-3 4 1 0 7" fill="none"/>')
  },
  {
    key: 'menu', text: '菜单', path: '/pages/order/order',
    art: drawing('<path d="m27 15 5-12m0 13 4-11" fill="none"/><path d="M7 21Q5 16 11 15Q10 10 17 12Q20 7 25 13Q31 11 32 21" fill="#fffdf7"/><path d="M5 21Q6 34 20 35Q33 34 35 20Q21 24 5 21Z" fill="#f9e8aa"/><path d="m12 27 2 1m12-1 2-1m-10 5q3 2 5-1" fill="none"/><path d="m15 15 3 1m5 1 2-2" stroke="#85a96f"/>')
  },
  {
    key: 'recipe', text: '菜谱', path: '/pages/recipe/recipe',
    art: drawing('<path d="M8 6 29 5Q33 5 32 10L33 33 10 35Q5 35 6 30L5 11Q5 6 8 6Z" fill="#dbe8c8"/><path d="m11 7 1 23m-5 1q3-2 6-1l19-1" fill="none"/><path d="M17 15Q14 9 20 11Q24 6 26 12Q32 13 28 17L27 20 18 20Z" fill="#fffdf7"/><path d="m18 25 9-1" stroke="#85a96f"/>')
  },
  {
    key: 'my', text: '我的', path: '/pages/my/my',
    art: drawing('<path d="M8 34Q8 25 17 25L24 25Q33 26 33 34Z" fill="#dceef1"/><path d="M12 13Q10 24 21 25Q31 24 29 13Z" fill="#fff1dd"/><path d="M11 17Q7 8 16 6Q20 2 25 7Q32 7 30 17L25 11 21 14 18 10 12 17Z" fill="#d3ac85"/><path d="m16 18 .2.4m9-.4 .2.4m-7 3q3 2 5-.4" fill="none"/>')
  }
]
const activeKey = ref('home')
const syncActiveFromRoute = () => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const matched = allTabs.find((tab) => tab.path === '/' + current?.route)
  if (matched) activeKey.value = matched.key
}
const onTabTap = (tab) => {
  if (tab.key === activeKey.value) return
  uni.switchTab({ url: tab.path })
}
onMounted(syncActiveFromRoute)
onShow(syncActiveFromRoute)
</script>

<style lang="scss" scoped>
.tabbar-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  padding: 10rpx 24rpx calc(env(safe-area-inset-bottom) + 6rpx);
  background: $p2-paper;
  box-sizing: border-box;
}
.custom-tabbar {
  position: relative;
  display: flex;
  align-items: center;
  height: 112rpx;
  padding: 6rpx 8rpx;
  background: $p2-white;
  border: 2rpx solid $p2-line;
  border-radius: 25rpx 30rpx 23rpx 28rpx;
  box-shadow: 0 4rpx 0 rgba(98, 71, 53, 0.12);
  box-sizing: border-box;
}
.tab-item {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  color: $p2-ink-soft;
  transition: transform 160ms $p2-ease;
  &:active { transform: translateY(2rpx) scale(0.94); }
}
.tab-icon-wrap {
  position: relative;
  width: 64rpx;
  height: 60rpx;
}
.tab-art {
  position: relative;
  z-index: 1;
  display: block;
  width: 60rpx;
  height: 60rpx;
  margin: 0 auto;
  opacity: 0.75;
  transition: transform 200ms $p2-ease, opacity 200ms $p2-ease;
}
.active-wash {
  position: absolute;
  left: -7rpx;
  top: 8rpx;
  width: 78rpx;
  height: 47rpx;
  border-radius: 42% 58% 51% 49%;
  background: $p2-butter-soft;
  opacity: 0;
  transform: rotate(-7deg) scale(0.8);
  transition: opacity 200ms $p2-ease, transform 200ms $p2-ease;
}
.tab-menu .active-wash { background: $p2-coral-soft; }
.tab-recipe .active-wash { background: $p2-leaf-soft; }
.tab-my .active-wash { background: $p2-sky-soft; }
.tab-label { position: relative; padding: 0 3rpx 5rpx; }
.tab-text { position: relative; z-index: 1; font-size: 21rpx; line-height: 1.2; letter-spacing: 2rpx; }
.tab-underline {
  position: absolute;
  left: 0;
  right: 2rpx;
  bottom: 1rpx;
  height: 3rpx;
  border-radius: 55% 45% 60% 40%;
  background: $p2-coral;
  opacity: 0;
  transform: rotate(-4deg);
}
.active {
  color: $p2-ink;
  .tab-art { opacity: 1; transform: translateY(-2rpx) rotate(-3deg); }
  .active-wash { opacity: 1; transform: rotate(-7deg) scale(1); }
  .tab-text { font-weight: 700; }
  .tab-underline { opacity: 1; }
}
</style>
