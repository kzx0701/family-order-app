<template>
  <view class="page-home page-enter">
    <!-- 顶部 header：趣味问候 + 头像 + 装饰图案（fixed 固定，滚动时常驻顶部） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 40 + 'px' }">
      <!-- 背景装饰 emoji（绝对定位，错落漂浮） -->
      <view class="header-deco">
        <!-- Lottie 装饰：咖啡杯冒热气，加载成功时显示动画，失败时 emoji 降级 -->
        <view class="deco-lottie-wrap" :class="{ 'is-loaded': decoLottieLoaded }">
          <canvas
            type="2d"
            id="home-deco-lottie"
            class="deco-lottie-canvas"
          ></canvas>
        </view>
        <text v-show="!decoLottieLoaded" class="deco deco-1">☕</text>
        <text class="deco deco-2">🍃</text>
        <text class="deco deco-3">✨</text>
        <text class="deco deco-4">🥐</text>
      </view>

      <view class="header-content">
        <view class="greeting-wrap">
          <text class="greeting">{{ greeting }}</text>
          <text class="greeting-sub">{{ greetingSub }}</text>
        </view>
        <view class="avatar-wrap" @tap="onAvatarTap">
          <image
            v-if="avatarUrl"
            class="avatar-img"
            :src="avatarUrl"
            mode="aspectFill"
          />
          <view v-else class="avatar-fallback">
            <default-avatar :role="userStore.role || 'admin'" />
          </view>
        </view>
      </view>
    </view>
    <!-- header 固定后的占位 view，撑开与 header 等高的空间 -->
    <view class="header-spacer" :style="{ height: headerHeight + 'px' }"></view>

    <!-- 双入口卡片（咖啡/美食） -->
    <view class="entries">
      <view
        class="entry-card entry-coffee animate-pop-in"
        :style="{ animationDelay: '80ms' }"
        @tap="goOrder('coffee')"
      >
        <view class="entry-deco deco-a">🥐</view>
        <view class="entry-deco deco-b">✨</view>
        <view class="entry-content">
          <text class="entry-emoji">☕</text>
          <text class="entry-title">来杯咖啡</text>
          <text class="entry-sub">香浓醇厚</text>
        </view>
      </view>

      <view
        class="entry-card entry-food animate-pop-in"
        :style="{ animationDelay: '180ms' }"
        @tap="goOrder('food')"
      >
        <view class="entry-deco deco-a">🥗</view>
        <view class="entry-deco deco-b">🍃</view>
        <view class="entry-content">
          <text class="entry-emoji">🍲</text>
          <text class="entry-title">想吃美食</text>
          <text class="entry-sub">家常美味</text>
        </view>
      </view>
    </view>

    <!-- 今日订单区域（角色差异化） -->
    <view class="section">
      <view class="section-header">
        <view class="section-title-wrap">
          <text class="section-title">{{ todaySectionTitle }}</text>
          <text class="section-count">{{ displayOrders.length }}</text>
        </view>
        <text class="section-more" @tap="goRecord">查看全部 ›</text>
      </view>

      <!-- 加载占位：骨架屏（替代原来的三点动效，更现代） -->
      <skeleton
        v-if="loading && orders.length === 0"
        type="card"
        :count="2"
      />

      <!-- 空状态：Lottie 空盘动画 + 趣味文案，Lottie 失败降级到 emoji -->
      <view v-else-if="orders.length === 0" class="empty-state animate-fade-in">
        <view class="empty-lottie-wrap" :class="{ 'is-loaded': emptyLottieLoaded }">
          <canvas
            type="2d"
            id="home-empty-lottie"
            class="empty-lottie-canvas"
          ></canvas>
        </view>
        <text v-show="!emptyLottieLoaded" class="empty-emoji">{{ emptyEmoji }}</text>
        <text class="empty-text">{{ emptyText }}</text>
      </view>

      <!-- 订单列表 -->
      <view v-else class="order-list">
        <order-card
          v-for="(order, idx) in displayOrders"
          :key="order._id"
          :order="order"
          :show-user="userStore.isAdmin"
          class="order-card-item animate-item-enter"
          :style="{ animationDelay: `${idx * 60}ms` }"
          @tap="onOrderTap"
        />
      </view>
    </view>

    <!-- 编辑昵称弹窗 -->
    <view
      v-if="showProfileModal"
      class="profile-modal-mask"
      @tap="closeProfileModal"
    >
      <view class="profile-modal" @tap.stop>
        <!-- 顶部大头像：点击触发微信 chooseAvatar 授权 -->
        <button
          class="modal-avatar-btn"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            v-if="editAvatar"
            class="modal-avatar"
            :src="editAvatar"
            mode="aspectFill"
          />
          <view v-else class="modal-avatar modal-avatar-fallback">
            <default-avatar :role="userStore.role || 'admin'" />
            <view class="modal-avatar-edit-hint">
              <text class="modal-avatar-edit-text">点击更换</text>
            </view>
          </view>
        </button>

        <!-- 标题 -->
        <text class="modal-title">编辑资料</text>

        <!-- 昵称输入框 -->
        <view class="modal-input-wrap">
          <input
            class="modal-input"
            type="text"
            :value="editNickname"
            placeholder="请输入昵称"
            placeholder-class="modal-input-placeholder"
            maxlength="20"
            :focus="showProfileModal"
            @input="onNicknameInput"
            @confirm="saveProfile"
          />
          <view class="modal-input-count">{{ editNickname.length }}/20</view>
        </view>

        <!-- 按钮组 -->
        <view class="modal-actions">
          <view class="modal-btn modal-btn-cancel" @tap="closeProfileModal">
            <text class="modal-btn-text">取消</text>
          </view>
          <view
            class="modal-btn modal-btn-save"
            :class="{ disabled: saving || !editNickname.trim() }"
            @tap="saveProfile"
          >
            <text class="modal-btn-text">{{ saving ? '保存中...' : '保存' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义底部 tab -->
    <custom-tabbar />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, getCurrentInstance, watch } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useHeaderFixed } from '@/composables/useHeaderFixed.js'
import { useCartStore } from '@/store/cart.js'
import { loadLottieOnReady, destroyLottie } from '@/utils/lottie.js'
import homeDecoAnim from '@/static/lottie/home-decoration.json'
import emptyAnim from '@/static/lottie/empty.json'

const { statusBarHeight } = useSafeArea()
const { headerHeight } = useHeaderFixed('.header')
const userStore = useUserStore()
const cartStore = useCartStore()

// 今日订单列表（由 home-data 云函数返回）
const orders = ref([])
const loading = ref(false)

/* === 编辑昵称弹窗状态 === */
const showProfileModal = ref(false) // 弹窗是否显示
const editNickname = ref('')        // 输入框中的昵称（可编辑）
const editAvatar = ref('')          // 临时头像路径（点击 chooseAvatar 后更新）
const avatarChanged = ref(false)    // 头像是否变化（决定是否上传）
const saving = ref(false)           // 保存中状态

/**
 * 点击头像：打开编辑资料弹窗
 * 把当前昵称和头像同步到输入框/预览
 */
const onAvatarTap = () => {
  editNickname.value = userStore.nickname || ''
  editAvatar.value = userStore.avatar || ''
  avatarChanged.value = false
  showProfileModal.value = true
}

/**
 * 关闭弹窗
 */
const closeProfileModal = () => {
  if (saving.value) return // 保存中不允许关闭
  showProfileModal.value = false
}

/**
 * 输入框输入事件
 */
const onNicknameInput = (e) => {
  editNickname.value = e.detail.value || ''
}

/**
 * 微信 chooseAvatar 回调
 * 用户从微信头像列表选择后触发，得到临时文件路径
 */
const onChooseAvatar = (e) => {
  const path = e.detail.avatarUrl
  if (path) {
    editAvatar.value = path
    avatarChanged.value = true
  }
}

/**
 * 保存资料
 * 1. 头像变化则上传
 * 2. 昵称变化则更新
 * 3. 都没变化直接关闭
 */
const saveProfile = async () => {
  const name = editNickname.value.trim()
  if (!name) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }

  const nicknameChanged = name !== userStore.nickname
  const needUploadAvatar = avatarChanged.value && editAvatar.value
  if (!nicknameChanged && !needUploadAvatar) {
    showProfileModal.value = false
    return
  }

  saving.value = true
  try {
    // 头像先上传
    if (needUploadAvatar) {
      await userStore.updateAvatar(editAvatar.value)
    }
    // 昵称变化才更新
    if (nicknameChanged) {
      await userStore.updateNickname(name)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    showProfileModal.value = false
  } catch (e) {
    console.error('[home] saveProfile error', e)
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

/* === Lottie 装饰加载状态 === */
const decoLottieLoaded = ref(false)  // header 装饰 Lottie 是否加载成功
const emptyLottieLoaded = ref(false) // 空状态 Lottie 是否加载成功
const DECO_CANVAS_ID = 'home-deco-lottie'
const EMPTY_CANVAS_ID = 'home-empty-lottie'
const instance = getCurrentInstance()

/**
 * 加载 header 装饰 Lottie（咖啡杯冒热气）
 * 失败时 decoLottieLoaded 保持 false，emoji ☕ 自然作为降级
 */
const loadDecoLottie = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 100))
  const anim = await loadLottieOnReady(
    DECO_CANVAS_ID,
    homeDecoAnim,
    { loop: true, autoplay: true },
    instance?.proxy || null
  )
  if (anim) {
    decoLottieLoaded.value = true
  }
}

/**
 * 加载空状态 Lottie（空盘子）
 * 失败时 emptyLottieLoaded 保持 false，emoji 自然作为降级
 */
const loadEmptyLottie = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 100))
  const anim = await loadLottieOnReady(
    EMPTY_CANVAS_ID,
    emptyAnim,
    { loop: true, autoplay: true },
    instance?.proxy || null
  )
  if (anim) {
    emptyLottieLoaded.value = true
  }
}

/* === 问候语（按本地时段切换） === */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return '早安~'
  if (h >= 11 && h < 14) return '午安~'
  if (h >= 14 && h < 18) return '下午好~'
  if (h >= 18 && h < 22) return '晚上好~'
  return '深夜啦~'
})
const greetingSub = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return '今天想吃点啥呀~'
  if (h >= 11 && h < 14) return '肚子饿了吗~'
  if (h >= 14 && h < 18) return '来杯下午茶吧~'
  if (h >= 18 && h < 22) return '晚饭想吃点啥~'
  return '夜宵时间到啦~'
})

/* === 头像：有图用图，无图用默认 user 图标 === */
const avatarUrl = computed(() => userStore.avatar || '')

/* === 今日订单区域：标题、空状态文案、列表（角色差异化） === */
const todaySectionTitle = computed(() =>
  userStore.isAdmin ? '今日待制作' : '今日我的点单'
)

const emptyEmoji = computed(() => (userStore.isAdmin ? '👨‍🍳' : '🛒'))
const emptyText = computed(() =>
  userStore.isAdmin
    ? '今天还没有订单~ 等老婆来点单吧'
    : '今天还没点单哦~ 去点一杯吧'
)

// 下单人视图最多展示 3 条；管理员展示全部今日待制作
const displayOrders = computed(() => {
  if (userStore.isAdmin) return orders.value
  return orders.value.slice(0, 3)
})

/* === 加载今日订单 === */
const loadOrders = async () => {
  if (loading.value) return
  // token 未就绪时跳过：App.vue bootstrap 异步恢复登录态，首页 onShow 可能先于 token 就绪
  if (!userStore.token) return
  loading.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'home-data',
      data: {
        token: userStore.token,
        role: userStore.role
      }
    })
    if (res.result.code === 0) {
      orders.value = res.result.list || []
    } else if (res.result.code === 401) {
      // 登录态未就绪或失效：静默不提示（由 App.vue bootstrap 管理登录态）
      console.warn('[home] home-data 401', res.result.message)
    } else {
      uni.showToast({ title: res.result.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[home] loadOrders error', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/* === 跳转入口 === */
// 注意：order 是 tabBar 页面，switchTab 不支持 query 参数
// 故通过 cart store 的 pendingType 字段中转，点单页 onShow 时消费
const goOrder = (type) => {
  cartStore.setPendingType(type)
  uni.switchTab({ url: '/pages/order/order' })
}

const goRecord = () => {
  uni.switchTab({ url: '/pages/record/record' })
}

/* === 点击订单卡片：跳转订单详情页 === */
const onOrderTap = ({ order }) => {
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${order._id}`
  })
}

/* === 生命周期 === */
// onMounted：加载 header 装饰 Lottie
onMounted(() => {
  loadDecoLottie()
})

// 监听空状态出现：当订单列表为空且非加载中时，加载空状态 Lottie
watch(
  () => !loading.value && orders.value.length === 0,
  (isEmpty) => {
    if (isEmpty) {
      nextTick(() => {
        loadEmptyLottie()
      })
    }
  }
)

// 监听 token 就绪：App.vue bootstrap 异步恢复登录态，
// 首次 onShow 时 token 可能未就绪导致 loadOrders 跳过；
// token 就绪后自动触发首次加载，避免首页空白
watch(
  () => userStore.token,
  (newToken) => {
    if (newToken && orders.value.length === 0 && !loading.value) {
      loadOrders()
    }
  }
)

// onShow：每次返回首页都刷新一次（下单返回后能看到新订单）
onShow(() => {
  loadOrders()
})

// 下拉刷新
onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})

// 卸载时销毁 Lottie 实例
onUnmounted(() => {
  destroyLottie(DECO_CANVAS_ID)
  destroyLottie(EMPTY_CANVAS_ID)
})
</script>

<style lang="scss" scoped>
.page-home {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
  background-color: $color-bg;
  display: flex;
  flex-direction: column;
}

/* === 顶部 header（fixed 固定，滚动时常驻顶部） === */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  overflow: hidden;
  padding: 56rpx 40rpx 32rpx;
  background: linear-gradient(160deg, #FFF8F0 0%, #FFEFD6 100%);
  border-bottom-left-radius: $radius-2xl;
  border-bottom-right-radius: $radius-2xl;

  .header-deco {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .deco {
      position: absolute;
      opacity: 0.55;
      font-size: 36rpx;
    }
    .deco-1 {
      top: 24rpx;
      right: 56rpx;
      font-size: 44rpx;
      animation: floatA 4.2s $ease-smooth infinite;
    }
    .deco-2 {
      top: 80rpx;
      right: 180rpx;
      animation: floatB 5s $ease-smooth infinite;
    }
    .deco-3 {
      top: 40rpx;
      left: 220rpx;
      animation: floatA 3.6s $ease-smooth infinite;
    }
    .deco-4 {
      top: 96rpx;
      left: 40rpx;
      font-size: 28rpx;
      opacity: 0.4;
      animation: floatB 4.8s $ease-smooth infinite;
    }

    /* Lottie 装饰：咖啡杯冒热气，定位与 deco-1 ☕ 重合 */
    /* 加载成功时 is-loaded 触发 opacity 渐显；失败时保持隐藏，emoji 降级 */
    .deco-lottie-wrap {
      position: absolute;
      top: 16rpx;
      right: 48rpx;
      width: 88rpx;
      height: 88rpx;
      opacity: 0;
      transition: opacity $dur-slow $ease-smooth;

      &.is-loaded {
        opacity: 0.9;
      }

      .deco-lottie-canvas {
        width: 100%;
        height: 100%;
      }
    }
  }

  .header-content {
    position: relative;
    z-index: 1;
    @include flex-between;
    gap: 24rpx;
  }

  .greeting-wrap {
    @include flex-column;
    gap: 6rpx;
    flex: 1;
    min-width: 0;

    .greeting {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $color-coffee-700;
      line-height: $line-height-tight;
    }

    .greeting-sub {
      font-size: $font-size-sm;
      color: $color-coffee-500;
      line-height: $line-height-normal;
    }
  }

  .avatar-wrap {
    flex-shrink: 0;

    .avatar-img,
    .avatar-fallback {
      width: 88rpx;
      height: 88rpx;
      border-radius: 50%;
      border: 4rpx solid #fff;
      box-shadow: $shadow-md;
    }

    .avatar-img {
      background-color: $color-bg-soft;
    }

    .avatar-fallback {
      overflow: hidden;
    }
  }
}

@keyframes floatA {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10rpx) rotate(8deg); }
}
@keyframes floatB {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(8rpx) rotate(-8deg); }
}

/* === 双入口卡片 === */
.entries {
  display: flex;
  gap: 24rpx;
  padding: 32rpx 40rpx 8rpx;

  .entry-card {
    position: relative;
    overflow: hidden;
    flex: 1;
    min-height: 220rpx;
    border-radius: $radius-2xl;
    box-shadow: $shadow-md;
    transition: transform $dur-base $ease-bounce, box-shadow $dur-base $ease-smooth;

    &:active {
      transform: scale(0.96);
      box-shadow: $shadow-sm;
    }

    .entry-deco {
      position: absolute;
      pointer-events: none;
      opacity: 0.55;
      z-index: 0;

      &.deco-a {
        top: 16rpx;
        right: 20rpx;
        font-size: 44rpx;
        animation: floatA 3.6s $ease-smooth infinite;
      }
      &.deco-b {
        bottom: 20rpx;
        left: 20rpx;
        font-size: 32rpx;
        animation: floatB 4.4s $ease-smooth infinite;
      }
    }

    .entry-content {
      position: relative;
      z-index: 1;
      height: 100%;
      @include flex-column;
      align-items: center;
      justify-content: center;
      padding: 32rpx 0;
      gap: 8rpx;

      .entry-emoji {
        font-size: 64rpx;
        line-height: 1;
        margin-bottom: 4rpx;
      }

      .entry-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        line-height: 1;
      }

      .entry-sub {
        font-size: $font-size-xs;
        opacity: 0.85;
      }
    }
  }

  /* 咖啡卡片：棕系渐变 */
  .entry-coffee {
    background: linear-gradient(160deg, #F5E6D3 0%, #E8D0B3 100%);
    .entry-title { color: $color-coffee-700; }
    .entry-sub { color: $color-coffee-400; }
  }

  /* 美食卡片：绿系渐变 */
  .entry-food {
    background: linear-gradient(160deg, #DCFCE7 0%, #BBF7D0 100%);
    .entry-title { color: $color-food-700; }
    .entry-sub { color: $color-food-600; opacity: 0.75; }
  }
}

/* === 今日订单区域 === */
.section {
  flex: 1;
  padding: 40rpx 40rpx 0;
  display: flex;
  flex-direction: column;

  .section-header {
    @include flex-between;
    margin-bottom: 24rpx;

    .section-title-wrap {
      display: flex;
      align-items: baseline;
      gap: 12rpx;

      .section-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: $color-coffee-700;
      }
      .section-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36rpx;
        height: 36rpx;
        padding: 0 12rpx;
        margin-left: 12rpx;
        border-radius: $radius-full;
        background-color: $color-coffee-100;
        font-size: $font-size-sm;
        color: $color-coffee-700;
        font-weight: $font-weight-bold;
        line-height: 1;
      }
    }

    .section-more {
      font-size: $font-size-sm;
      color: $color-coffee-500;
      @include tap-feedback;
    }
  }

  /* 加载占位 */
  .loading-state {
    @include flex-center;
    gap: 8rpx;
    padding: 64rpx 0;

    .loading-dot {
      font-size: $font-size-2xl;
      color: $color-coffee-400;
      animation: dotBlink 1.2s $ease-smooth infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  /* 空状态 */
  .empty-state {
    flex: 1;
    @include flex-column;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 32rpx 0;

    /* Lottie 空状态：空盘子动画，加载成功时渐显，失败时 emoji 降级 */
    .empty-lottie-wrap {
      width: 160rpx;
      height: 160rpx;
      opacity: 0;
      transition: opacity $dur-slow $ease-smooth;

      &.is-loaded {
        opacity: 1;
      }

      .empty-lottie-canvas {
        width: 100%;
        height: 100%;
      }
    }

    .empty-emoji {
      font-size: 96rpx;
      animation: pulse 2.4s $ease-smooth infinite;
    }

    .empty-text {
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-align: center;
      line-height: $line-height-relaxed;
    }
  }

  /* 订单列表 */
  .order-list {
    flex: 1;
    @include flex-column;
    gap: 20rpx;

    .order-card-item {
      /* 配合 .animate-item-enter，逐条滑入 */
    }
  }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* === 编辑昵称弹窗 === */
.profile-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.45);
  @include flex-center;
  animation: maskFadeIn $dur-base $ease-smooth both;
}

@keyframes maskFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.profile-modal {
  width: 600rpx;
  padding: 48rpx 40rpx 32rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: modalPopIn $dur-base $ease-bounce both;
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 顶部大头像：button 重置为透明，承载 chooseAvatar */
.modal-avatar-btn {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  padding: 0;
  margin: 0 0 24rpx;
  border: none;
  background: transparent;
  line-height: normal;

  &::after {
    border: none;
  }
}

.modal-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: $shadow-md;
  background-color: $color-bg-soft;
  box-sizing: border-box;
}

.modal-avatar-fallback {
  position: relative;

  .modal-avatar-edit-hint {
    position: absolute;
    bottom: -12rpx;
    left: 50%;
    transform: translateX(-50%);
    padding: 4rpx 14rpx;
    border-radius: $radius-full;
    background-color: rgba(0, 0, 0, 0.55);
    white-space: nowrap;

    .modal-avatar-edit-text {
      color: #fff;
      font-size: 20rpx;
      line-height: 1.2;
    }
  }
}

.modal-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
  margin-bottom: 32rpx;
}

/* 昵称输入框 */
.modal-input-wrap {
  position: relative;
  width: 100%;
  margin-bottom: 40rpx;

  .modal-input {
    width: 100%;
    height: 88rpx;
    padding: 0 100rpx 0 28rpx;
    border-radius: $radius-lg;
    background-color: $color-bg-soft;
    font-size: $font-size-base;
    color: $color-text;
    box-sizing: border-box;
    transition: background-color $dur-base $ease-smooth;
  }

  .modal-input-placeholder {
    color: $color-text-muted;
  }

  .modal-input-count {
    position: absolute;
    top: 50%;
    right: 24rpx;
    transform: translateY(-50%);
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}

/* 按钮组 */
.modal-actions {
  display: flex;
  gap: 24rpx;
  width: 100%;

  .modal-btn {
    flex: 1;
    height: 88rpx;
    border-radius: $radius-full;
    @include flex-center;
    @include tap-feedback(0.96);
    transition: opacity $dur-fast $ease-smooth, transform $dur-fast $ease-smooth;

    .modal-btn-text {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
    }

    &.modal-btn-cancel {
      background-color: $color-neutral-100;

      .modal-btn-text {
        color: $color-text-muted;
      }
    }

    &.modal-btn-save {
      background: linear-gradient(135deg, $color-coffee-500, $color-coffee-700);

      .modal-btn-text {
        color: #fff;
      }

      &.disabled {
        opacity: 0.5;
      }
    }
  }
}
</style>
