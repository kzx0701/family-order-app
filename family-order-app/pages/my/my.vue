<template>
  <view class="page-my page-enter">
    <view class="profile-card" :style="{ paddingTop: statusBarHeight + 52 + 'px' }">
      <view class="avatar-wrap">
        <image v-if="userStore.avatar" :src="userStore.avatar" class="avatar-image" mode="aspectFill" />
        <default-avatar v-else :role="userStore.isAdmin ? 'admin' : 'orderer'" />
      </view>
      <view class="profile-main">
        <text class="profile-name">{{ userStore.nickname || '家庭成员' }}</text>
        <view class="mode-chip" :class="{ cook: userStore.isAdmin }">
          <view class="mode-dot"></view>
          <text>{{ modeLabel }}</text>
        </view>
      </view>
      <view class="edit-mark" role="button" aria-label="编辑个人资料" @tap="showPreviewTip('个人资料将在后续接入')">
        <Icon name="edit" :size="17" :stroke-width="2.2" />
        <text>编辑资料</text>
      </view>
    </view>

    <view class="menu-list">
    <view class="info-card family-card">
      <view class="menu-doodle home-doodle" aria-hidden="true">
        <view class="home-wall"></view>
        <view class="home-roof"></view>
        <view class="home-window"></view>
        <view class="home-door"></view>
      </view>
      <view class="info-main">
        <text class="menu-title">我的家庭</text>
        <text class="menu-description">{{ familyName }}</text>
      </view>
      <view class="owner-tag">家</view>
    </view>

    <view class="info-card mode-card" @tap="showPreviewTip('身份切换将在登录改造中接入')">
      <view class="menu-doodle identity-doodle" aria-hidden="true">
        <view class="identity-sheet"></view>
        <view class="identity-head"></view>
        <view class="identity-body"></view>
        <view class="identity-line"></view>
        <view class="identity-pin"></view>
      </view>
      <view class="info-main">
        <text class="menu-title">切换身份</text>
        <text class="menu-description">当前是{{ modeLabel }}</text>
      </view>
      <view class="record-arrow">
        <Icon name="chevron-right" :size="19" :stroke-width="2.4" />
      </view>
    </view>

    <view class="record-entry" @tap="goRecords">
      <view class="record-doodle menu-doodle" aria-hidden="true">
        <view class="paper-sheet"></view>
        <view class="paper-line line-one"></view>
        <view class="paper-line line-two"></view>
        <view class="paper-pin"></view>
      </view>
      <view class="record-copy">
        <text class="menu-title">点单记录</text>
        <text class="menu-description">看看家里最近都吃了什么</text>
      </view>
      <view class="record-arrow">
        <Icon name="chevron-right" :size="19" :stroke-width="2.4" />
      </view>
    </view>
    </view>

    <custom-tabbar />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

const familyName = computed(() => userStore.userInfo?.familyName || '我的家庭')
const modeLabel = computed(() => (userStore.isAdmin ? '饲养员' : '干饭人'))

const goRecords = () => {
  uni.navigateTo({ url: '/pages/record/record' })
}

const showPreviewTip = (title) => {
  uni.showToast({ title, icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page-my {
  min-height: 100vh;
  padding: 0 28rpx calc(180rpx + env(safe-area-inset-bottom));
  background: $p2-paper;
  color: $p2-ink;
}

.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 44rpx;
  text-align: center;
}
.avatar-wrap {
  position: relative;
  width: 146rpx;
  height: 146rpx;
  padding: 7rpx;
  border: 3rpx solid $p2-line;
  border-radius: 47% 53% 49% 51%;
  background: $p2-white;
  box-shadow: 5rpx 6rpx 0 rgba(98, 71, 53, 0.12);
  overflow: hidden;
}
.avatar-image { width: 100%; height: 100%; border-radius: 50%; }
.profile-main { margin-top: 22rpx; max-width: 100%; }
.profile-name {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  padding: 5rpx 16rpx;
  border: 2rpx solid rgba(118, 85, 64, 0.3);
  border-radius: 14rpx 18rpx 13rpx 16rpx;
  background: $p2-coral-soft;
  font-size: 21rpx;
  color: $p2-ink;
  &.cook { background: $p2-leaf-soft; }
}
.mode-dot { width: 7rpx; height: 7rpx; border-radius: 50%; background: currentColor; }
.edit-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 64rpx;
  margin-top: 10rpx;
  padding: 0 22rpx;
  color: $p2-ink-soft;
  font-size: 22rpx;
  &:active { opacity: 0.6; }
}
.menu-list { display: flex; flex-direction: column; gap: 20rpx; }
.info-card,
.record-entry {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22rpx;
  height: 148rpx;
  box-sizing: border-box;
  padding: 18rpx 24rpx;
  border: 3rpx solid $p2-line;
  border-radius: 26rpx 32rpx 25rpx 30rpx;
  box-shadow: $p2-shadow-sm;
}
.family-card { background: #f9edce; }
.mode-card { background: #e3eef0; }
.record-entry { background: $p2-leaf-soft; }
.mode-card,
.record-entry {
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;
  &:active { transform: translate(2rpx, 3rpx); box-shadow: none; }
}
.info-main,
.record-copy { flex: 1; min-width: 0; }
.menu-title { display: block; font-size: 29rpx; font-weight: 750; line-height: 1.4; }
.menu-description {
  display: block;
  margin-top: 7rpx;
  color: $p2-ink-soft;
  font-size: 21rpx;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.record-arrow,
.owner-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  flex: 0 0 auto;
  border: 2rpx solid rgba(118, 85, 64, 0.6);
  border-radius: 48% 52% 46% 54%;
  background: $p2-white;
  color: $p2-ink-soft;
}
.owner-tag { font-size: 23rpx; }
.menu-doodle { position: relative; width: 96rpx; height: 106rpx; flex: 0 0 96rpx; }
.paper-sheet {
  position: absolute;
  left: 13rpx; top: 8rpx; width: 69rpx; height: 88rpx;
  background: $p2-white;
  border: 3rpx solid $p2-line;
  border-radius: 11rpx 15rpx 10rpx 17rpx;
  transform: rotate(-4deg);
}
.paper-line {
  position: absolute;
  z-index: 2;
  left: 29rpx; width: 42rpx; height: 4rpx;
  border-radius: 999rpx;
  background: $p2-coral;
}
.line-one { top: 42rpx; transform: rotate(-6deg); }
.line-two { top: 60rpx; width: 31rpx; background: $p2-sky; transform: rotate(-4deg); }
.paper-pin {
  position: absolute;
  z-index: 3;
  left: 42rpx; top: 0; width: 22rpx; height: 16rpx;
  background: $p2-butter;
  border: 3rpx solid $p2-line;
  border-radius: 8rpx;
  transform: rotate(4deg);
}
.home-wall {
  position: absolute;
  left: 17rpx; top: 39rpx; width: 64rpx; height: 56rpx;
  background: $p2-white;
  border: 3rpx solid $p2-line;
  border-radius: 4rpx 5rpx 12rpx 8rpx;
  transform: rotate(-3deg);
}
.home-roof {
  position: absolute;
  left: 18rpx; top: 17rpx; width: 61rpx; height: 61rpx;
  background: $p2-coral-soft;
  border-top: 3rpx solid $p2-line;
  border-left: 3rpx solid $p2-line;
  border-radius: 7rpx 0 0 0;
  transform: rotate(42deg) scale(0.76);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}
.home-window {
  position: absolute;
  left: 29rpx; top: 57rpx; width: 14rpx; height: 14rpx;
  border: 2rpx solid $p2-line;
  border-radius: 3rpx;
  background: $p2-butter;
}
.home-door {
  position: absolute;
  right: 26rpx; bottom: 12rpx; width: 17rpx; height: 29rpx;
  border: 2rpx solid $p2-line;
  border-bottom: 0;
  border-radius: 8rpx 7rpx 0 0;
  background: $p2-leaf-soft;
}
.identity-sheet {
  position: absolute;
  left: 10rpx; top: 19rpx; width: 78rpx; height: 72rpx;
  border: 3rpx solid $p2-line;
  border-radius: 13rpx 10rpx 15rpx 11rpx;
  background: $p2-white;
  transform: rotate(4deg);
}
.identity-pin {
  position: absolute;
  left: 39rpx; top: 10rpx; width: 25rpx; height: 18rpx;
  border: 3rpx solid $p2-line;
  border-radius: 7rpx;
  background: $p2-butter;
  transform: rotate(4deg);
}
.identity-head {
  position: absolute;
  left: 27rpx; top: 40rpx; width: 17rpx; height: 17rpx;
  border: 2rpx solid $p2-line;
  border-radius: 50%;
  background: $p2-coral-soft;
}
.identity-body {
  position: absolute;
  left: 21rpx; top: 60rpx; width: 29rpx; height: 17rpx;
  border: 2rpx solid $p2-line;
  border-radius: 14rpx 14rpx 5rpx 5rpx;
  background: $p2-leaf-soft;
}
.identity-line {
  position: absolute;
  left: 59rpx; top: 50rpx; width: 17rpx; height: 4rpx;
  border-radius: 4rpx;
  background: $p2-sky;
  box-shadow: 0 13rpx 0 $p2-coral-soft;
  transform: rotate(4deg);
}
</style>
