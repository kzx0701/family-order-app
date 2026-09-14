<template>
  <view class="page-recipe page-enter">
    <view class="page-header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <view>
        <text class="page-kicker">家里会做的，都记在这里</text>
        <text class="page-title">家庭菜谱</text>
      </view>
      <view v-if="userStore.isAdmin" class="config-button" @tap="showPreviewTip">
        <Icon name="settings" :size="18" :stroke-width="2.2" />
        <text>配置</text>
      </view>
    </view>

    <view class="recipe-preview-card">
      <view class="book-doodle">
        <view class="book-left"></view>
        <view class="book-right"></view>
        <view class="book-line line-a"></view>
        <view class="book-line line-b"></view>
        <view class="book-leaf"></view>
      </view>
      <text class="preview-title">菜谱页正在搭建</text>
      <text class="preview-desc">下一步会在这里放进家里的每一道拿手菜</text>
      <view class="preview-tags">
        <view>配料</view>
        <view>口味</view>
        <view>步骤</view>
      </view>
    </view>

    <custom-tabbar />
  </view>
</template>

<script setup>
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

const showPreviewTip = () => {
  uni.showToast({ title: '菜谱配置将在下一步接入', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page-recipe {
  min-height: 100vh;
  padding: 0 28rpx calc(140rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 87% 18%, rgba(133, 169, 111, 0.14) 0 3rpx, transparent 4rpx),
    $p2-paper;
  color: $p2-ink;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  padding-bottom: 32rpx;
}

.page-kicker {
  display: block;
  color: $p2-ink-soft;
  font-size: 22rpx;
}

.page-title {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 800;
}

.config-button {
  display: flex;
  align-items: center;
  gap: 7rpx;
  padding: 12rpx 18rpx;
  border: 3rpx solid $p2-line;
  border-radius: 18rpx 23rpx 17rpx 21rpx;
  background: $p2-leaf-soft;
  box-shadow: $p2-shadow-sm;
  font-size: 22rpx;
  font-weight: 700;
  transform: rotate(1deg);

  &:active { transform: translate(2rpx, 3rpx) rotate(0); box-shadow: none; }
}

.recipe-preview-card {
  min-height: 560rpx;
  padding: 62rpx 36rpx 44rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 3rpx solid $p2-line;
  border-radius: 34rpx 28rpx 39rpx 30rpx;
  background: rgba(255, 254, 249, 0.92);
  box-shadow: $p2-shadow-md;
}

.book-doodle {
  position: relative;
  width: 230rpx;
  height: 180rpx;
  margin-bottom: 34rpx;
}

.book-left,
.book-right {
  position: absolute;
  top: 35rpx;
  width: 102rpx;
  height: 118rpx;
  background: $p2-butter-soft;
  border: 4rpx solid $p2-line;
}

.book-left {
  left: 13rpx;
  border-radius: 24rpx 5rpx 12rpx 28rpx;
  transform: rotate(-5deg);
}

.book-right {
  right: 13rpx;
  background: $p2-coral-soft;
  border-radius: 5rpx 24rpx 28rpx 12rpx;
  transform: rotate(5deg);
}

.book-line {
  position: absolute;
  z-index: 2;
  height: 4rpx;
  width: 58rpx;
  border-radius: 999rpx;
  background: rgba(98, 71, 53, 0.48);
}

.line-a { left: 35rpx; top: 82rpx; transform: rotate(-7deg); }
.line-b { right: 35rpx; top: 103rpx; transform: rotate(7deg); }

.book-leaf {
  position: absolute;
  z-index: 3;
  right: 39rpx;
  top: 54rpx;
  width: 28rpx;
  height: 47rpx;
  background: $p2-leaf;
  border: 3rpx solid $p2-line;
  border-radius: 78% 22% 70% 30%;
  transform: rotate(38deg);
}

.preview-title {
  font-size: 33rpx;
  font-weight: 800;
}

.preview-desc {
  max-width: 430rpx;
  margin-top: 12rpx;
  color: $p2-ink-soft;
  font-size: 23rpx;
  line-height: 1.7;
}

.preview-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 32rpx;

  view {
    padding: 10rpx 18rpx;
    border: 2rpx solid rgba(118, 85, 64, 0.36);
    border-radius: 16rpx 19rpx 14rpx 20rpx;
    background: $p2-paper-deep;
    color: $p2-ink-soft;
    font-size: 21rpx;

    &:nth-child(2) { transform: rotate(-2deg); background: $p2-leaf-soft; }
    &:nth-child(3) { transform: rotate(2deg); background: $p2-sky-soft; }
  }
}
</style>
