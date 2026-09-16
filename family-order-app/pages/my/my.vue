<template>
  <view class="page-my page-enter">
    <view class="profile-card" :style="{ paddingTop: statusBarHeight + 52 + 'px' }">
      <view class="avatar-wrap">
        <image v-if="userStore.avatar" :src="userStore.avatar" class="avatar-image" mode="aspectFill" />
        <default-avatar v-else :gender="userStore.gender" />
      </view>
      <view class="profile-main">
        <text class="profile-name">{{ userStore.nickname || '家庭成员' }}</text>
        <view class="mode-chip" :class="{ cook: userStore.isCook }">
          <view class="mode-dot"></view>
          <text>{{ modeLabel }}</text>
        </view>
      </view>
      <view class="edit-mark" role="button" aria-label="编辑个人资料" @tap="onEditProfile">
        <Icon name="edit" :size="17" :stroke-width="2.2" />
        <text>编辑资料</text>
      </view>
    </view>

    <view class="menu-list">
    <view class="info-card family-card" @tap="onEditFamily">
      <image class="menu-art" src="/static/images/my-menu/family.webp" mode="aspectFit" aria-hidden="true" />
      <view class="info-main">
        <text class="menu-title">我的家庭</text>
        <text class="menu-description">{{ familyName }}</text>
      </view>
      <view class="record-arrow" aria-hidden="true">
        <Icon name="chevron-right" :size="19" :stroke-width="2.4" />
      </view>
    </view>

    <view class="info-card mode-card" @tap="onChangeMode">
      <image class="menu-art" src="/static/images/my-menu/identity.webp" mode="aspectFit" aria-hidden="true" />
      <view class="info-main">
        <text class="menu-title">切换身份</text>
        <text class="menu-description">当前是{{ modeLabel }}</text>
      </view>
      <view class="record-arrow">
        <Icon name="chevron-right" :size="19" :stroke-width="2.4" />
      </view>
    </view>

    <view class="record-entry" @tap="goRecords">
      <image class="menu-art" src="/static/images/my-menu/record.webp" mode="aspectFit" aria-hidden="true" />
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
/**
 * 我的页面：个人、身份、家庭与历史记录的统一入口
 *
 * 身份是可随时切换的工作模式（不限制次数），切换后服务端 lastMode 立即更新，
 * 饲养员权限随之生效；性别决定默认头像，同样可修改。
 */
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'

const { statusBarHeight } = useSafeArea()
const userStore = useUserStore()

const familyName = computed(() => userStore.familyName)
const modeLabel = computed(() => (userStore.isCook ? '饲养员' : '干饭人'))

const goRecords = () => {
  uni.navigateTo({ url: '/pages/record/record' })
}

const showPreviewTip = (title) => {
  uni.showToast({ title, icon: 'none' })
}

// 进入页面刷新服务端状态（家庭名称可能已由创建者修改，身份也可能在别处切换过）
onShow(() => {
  userStore.refreshProfile()
})

/** 身份选项：value 与云端枚举一致 */
const MODE_OPTIONS = [
  { value: 'diner', label: '干饭人' },
  { value: 'cook', label: '饲养员' }
]

/** 性别选项 */
const GENDER_OPTIONS = [
  { value: 'male', label: '男生' },
  { value: 'female', label: '女生' }
]

/**
 * 选择器：列出选项并标出当前值
 * @param {Array} options - [{ value, label }]
 * @param {string} current - 当前值
 * @param {Function} onPick - 选中回调（已过滤掉重复选择）
 */
const pickOption = (options, current, onPick) => {
  uni.showActionSheet({
    itemList: options.map((o) => (o.value === current ? `${o.label}（当前）` : o.label)),
    success: (res) => {
      const target = options[res.tapIndex]
      if (!target || target.value === current) return
      onPick(target)
    }
  })
}

/** 切换身份（可反复切换） */
const onChangeMode = () => {
  pickOption(MODE_OPTIONS, userStore.currentMode, async (target) => {
    try {
      await userStore.switchMode(target.value)
      uni.showToast({ title: `已切换为${target.label}`, icon: 'none' })
    } catch (e) {
      uni.showToast({ title: e.message || '切换失败', icon: 'none' })
    }
  })
}

/** 修改性别（影响默认头像） */
const onChangeGender = () => {
  pickOption(GENDER_OPTIONS, userStore.gender, async (target) => {
    try {
      await userStore.updateProfile({ gender: target.value })
      uni.showToast({ title: `已切换为${target.label}头像`, icon: 'none' })
    } catch (e) {
      uni.showToast({ title: e.message || '修改失败', icon: 'none' })
    }
  })
}

/** 编辑资料：目前接入性别，昵称与头像待后续接入 */
const onEditProfile = () => {
  uni.showActionSheet({
    itemList: ['修改性别', '修改昵称（后续接入）', '修改头像（后续接入）'],
    success: (res) => {
      if (res.tapIndex === 0) {
        onChangeGender()
        return
      }
      showPreviewTip('该功能将在后续接入')
    }
  })
}

/** 修改家庭名称：仅家庭创建者可改，服务端会二次校验 */
const onEditFamily = () => {
  if (!userStore.family) {
    showPreviewTip('家庭信息加载中，请稍后再试')
    return
  }
  if (!userStore.isFamilyOwner) {
    showPreviewTip('家庭名称由最初创建家庭的成员修改')
    return
  }
  uni.showModal({
    title: '修改家庭名称',
    editable: true,
    placeholderText: userStore.familyName,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await userStore.updateFamilyName(res.content)
        uni.showToast({ title: '家庭名称已更新', icon: 'none' })
      } catch (e) {
        uni.showToast({ title: e.message || '修改失败', icon: 'none' })
      }
    }
  })
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
  /* 不设 padding：头像直接贴到描边内侧，去掉原先 7rpx 的白色间隙
     （该间隙与页面底色几乎同色，读不出「白边」的设计意图，只显得图片离边框远） */
  padding: 0;
  border: 3rpx solid $p2-line;
  border-radius: 47% 53% 49% 51%;
  background: $p2-white;
  box-shadow: 5rpx 6rpx 0 rgba(98, 71, 53, 0.12);
  overflow: hidden;
}
.avatar-image { width: 100%; height: 100%; border-radius: inherit; }
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
.record-arrow {
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
.menu-art {
  display: block;
  width: 96rpx;
  height: 106rpx;
  flex: 0 0 96rpx;
}
</style>
