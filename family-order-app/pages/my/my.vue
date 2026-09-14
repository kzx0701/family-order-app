<template>
  <view class="page-my page-enter">
    <view class="page-header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <text class="page-kicker">我们的小小家庭</text>
      <text class="page-title">我的</text>
    </view>

    <view class="profile-card">
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
      <view class="edit-mark" @tap="showPreviewTip('个人资料将在后续接入')">
        <Icon name="edit" :size="17" :stroke-width="2.2" />
      </view>
    </view>

    <view class="info-card family-card">
      <view class="info-icon family-icon">
        <Icon name="home" :size="21" :stroke-width="2.2" />
      </view>
      <view class="info-main">
        <text class="info-label">当前家庭</text>
        <text class="info-value">{{ familyName }}</text>
      </view>
      <view class="owner-tag">家</view>
    </view>

    <view class="info-card mode-card" @tap="showPreviewTip('身份切换将在登录改造中接入')">
      <view class="info-icon mode-icon">↻</view>
      <view class="info-main">
        <text class="info-label">当前身份</text>
        <text class="info-value">{{ modeLabel }}</text>
      </view>
      <view class="info-action">
        <text>切换</text>
        <Icon name="chevron-right" :size="15" :stroke-width="2.3" />
      </view>
    </view>

    <view class="record-entry" @tap="goRecords">
      <view class="record-doodle">
        <view class="paper-sheet"></view>
        <view class="paper-line line-one"></view>
        <view class="paper-line line-two"></view>
        <view class="paper-pin"></view>
      </view>
      <view class="record-copy">
        <text class="record-title">点单记录</text>
        <text class="record-desc">看看家里最近都吃了什么</text>
      </view>
      <view class="record-arrow">
        <Icon name="chevron-right" :size="19" :stroke-width="2.4" />
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
const modeLabel = computed(() => (userStore.isAdmin ? '做饭人' : '干饭人'))

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
  padding: 0 28rpx calc(140rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 92% 10%, rgba(157, 198, 209, 0.17) 0 4rpx, transparent 5rpx),
    $p2-paper;
  color: $p2-ink;
}

.page-header { padding-bottom: 28rpx; }
.page-kicker { display: block; color: $p2-ink-soft; font-size: 22rpx; }
.page-title { display: block; margin-top: 8rpx; font-size: 48rpx; font-weight: 800; }

.profile-card,
.info-card,
.record-entry {
  border: 3rpx solid $p2-line;
  background: rgba(255, 254, 249, 0.92);
  box-shadow: $p2-shadow-md;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 31rpx 38rpx 28rpx 35rpx;
  transform: rotate(-0.4deg);
}

.avatar-wrap {
  width: 108rpx;
  height: 108rpx;
  overflow: hidden;
  flex: 0 0 auto;
  border: 3rpx solid $p2-line;
  border-radius: 45% 55% 49% 51%;
  background: $p2-butter-soft;

  .avatar-image { width: 100%; height: 100%; }
}

.profile-main { flex: 1; min-width: 0; }
.profile-name { display: block; font-size: 31rpx; font-weight: 800; }

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 10rpx;
  padding: 7rpx 13rpx;
  border: 2rpx solid rgba(118, 85, 64, 0.35);
  border-radius: 14rpx 17rpx 13rpx 18rpx;
  background: $p2-coral-soft;
  color: #88594f;
  font-size: 20rpx;
  font-weight: 700;

  &.cook { background: $p2-leaf-soft; color: #5b744c; }
}

.mode-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: currentColor; }

.edit-mark {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(118, 85, 64, 0.38);
  border-radius: 47% 53% 45% 55%;
  color: $p2-ink-soft;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 17rpx;
  min-height: 116rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: 25rpx 29rpx 24rpx 31rpx;
  box-shadow: $p2-shadow-sm;
}

.mode-card { border-radius: 30rpx 24rpx 29rpx 23rpx; }

.info-icon {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 3rpx solid $p2-line;
  border-radius: 45% 55% 48% 52%;
  font-weight: 800;
}

.family-icon { background: $p2-butter-soft; transform: rotate(-2deg); }
.mode-icon { background: $p2-sky-soft; font-size: 35rpx; transform: rotate(3deg); }
.info-main { flex: 1; }
.info-label { display: block; color: $p2-ink-soft; font-size: 20rpx; }
.info-value { display: block; margin-top: 5rpx; font-size: 27rpx; font-weight: 750; }

.owner-tag {
  width: 45rpx;
  height: 41rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $p2-coral-soft;
  border: 2rpx solid rgba(118, 85, 64, 0.3);
  border-radius: 43% 57% 48% 52%;
  font-size: 20rpx;
  font-weight: 800;
  transform: rotate(6deg);
}

.info-action {
  display: flex;
  align-items: center;
  gap: 3rpx;
  color: $p2-ink-soft;
  font-size: 21rpx;
}

.record-entry {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-height: 160rpx;
  margin-top: 24rpx;
  padding: 22rpx 22rpx;
  overflow: hidden;
  border-radius: 28rpx 35rpx 26rpx 31rpx;
  background: $p2-leaf-soft;
  transition: transform $p2-dur-fast $p2-ease, box-shadow $p2-dur-fast $p2-ease;

  &:active { transform: translate(2rpx, 3rpx); box-shadow: none; }
}

.record-doodle {
  position: relative;
  width: 96rpx;
  height: 106rpx;
  flex: 0 0 auto;
}

.paper-sheet {
  position: absolute;
  left: 13rpx;
  top: 8rpx;
  width: 69rpx;
  height: 88rpx;
  background: $p2-white;
  border: 3rpx solid $p2-line;
  border-radius: 11rpx 15rpx 10rpx 17rpx;
  transform: rotate(-4deg);
}

.paper-line {
  position: absolute;
  z-index: 2;
  left: 29rpx;
  width: 42rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: $p2-coral;
}

.line-one { top: 42rpx; transform: rotate(-6deg); }
.line-two { top: 60rpx; width: 31rpx; background: $p2-sky; transform: rotate(-4deg); }

.paper-pin {
  position: absolute;
  z-index: 3;
  left: 42rpx;
  top: 0;
  width: 22rpx;
  height: 16rpx;
  background: $p2-butter;
  border: 3rpx solid $p2-line;
  border-radius: 8rpx;
  transform: rotate(4deg);
}

.record-copy { flex: 1; }
.record-title { display: block; font-size: 30rpx; font-weight: 800; }
.record-desc { display: block; margin-top: 8rpx; color: $p2-ink-soft; font-size: 21rpx; }

.record-arrow {
  width: 51rpx;
  height: 51rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid $p2-line;
  border-radius: 50%;
  background: $p2-white;
}
</style>
