<template>
  <view class="order-card-wrap">
    <!-- 主卡片行（整张可点击进入详情页） -->
    <view class="order-card" :class="{ 'is-flashing': flashing, 'is-expanded': expandable && expanded }" @tap="onCardTap">
      <!-- 左侧图标 -->
      <view class="card-icon">{{ displayEmoji }}</view>

      <!-- 中部内容 -->
      <view class="card-body">
        <text class="card-summary">{{ displaySummary }}</text>
        <view class="card-meta">
          <text class="meta-time">{{ formattedTime }}</text>
          <text v-if="showUser && order.userName" class="meta-user">· {{ order.userName }}</text>
          <text v-if="expandable" class="meta-expand">{{ expanded ? '收起' : '详情' }} ›</text>
        </view>
      </view>

      <!-- 右侧：状态徽章 + 预约时间（替代原"开始制作"按钮） -->
      <view class="card-actions">
        <status-badge :status="order.status" />
        <text v-if="reservationText" class="reservation-time">{{ reservationText }}</text>
        <view class="action-row" v-if="showCancel">
          <view
            v-if="showCancel"
            class="action-btn btn-cancel"
            @tap.stop="onCancel"
          >
            <text class="action-text">取消</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 展开详情（菜品列表 / 预约时间 / 备注） -->
    <view v-if="expandable && expanded" class="card-detail animate-slide-down">
      <!-- 菜品列表 -->
      <view class="detail-items">
        <view v-for="(item, idx) in order.items" :key="idx" class="detail-item">
          <image v-if="item.image" class="item-img" :src="item.image" mode="aspectFill" />
          <view v-else class="item-img placeholder">{{ itemEmoji(item) }}</view>
          <text class="item-name">{{ item.name }}</text>
          <text class="item-qty">x{{ item.quantity }}</text>
        </view>
      </view>
      <!-- 预约时间 -->
      <view v-if="order.reservationType === 'scheduled' && order.reservationTime" class="detail-row">
        <view class="row-icon"><Icon name="clock" :size="14" /></view>
        <text class="row-label">预约</text>
        <text class="row-value">{{ formattedReservation }}</text>
      </view>
      <!-- 备注 -->
      <view v-if="order.note" class="detail-row">
        <view class="row-icon"><Icon name="note" :size="14" /></view>
        <text class="row-label">备注</text>
        <text class="row-value">{{ order.note }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 订单卡片组件
 * 用于首页今日订单区域、管理页订单列表展示
 *
 * 用法（首页今日订单，可点击进入详情）：
 *   <order-card :order="order" :show-user="isAdmin" @tap="onTap" />
 *
 * 用法（管理页订单管理，支持取消 + 展开）：
 *   <order-card :order="order" show-user cancelable expandable
 *               @cancel="onCancel" />
 *
 * 事件：
 *   tap    - 点击整张卡片时触发，payload: { order }
 *   cancel - 管理员点击取消按钮时触发，payload: { order }
 *
 * 依赖 order 字段：_id, status, items, summary(可选), summaryEmoji(可选),
 *                  createTime, userName, note, reservationType, reservationTime
 */
import { computed, ref } from 'vue'

const props = defineProps({
  order: { type: Object, required: true },
  // 是否显示点单人（管理员视图）
  showUser: { type: Boolean, default: false },
  // 是否在 pending 状态显示取消按钮
  cancelable: { type: Boolean, default: false },
  // 是否允许点击卡片展开详情
  expandable: { type: Boolean, default: false }
})

const emit = defineEmits(['tap', 'cancel'])

// 状态变化时的局部闪光动效开关
const flashing = ref(false)
// 展开状态
const expanded = ref(false)

// 取消按钮：仅 cancelable + pending 状态显示
const showCancel = computed(() => {
  if (!props.cancelable) return false
  return props.order.status === 'pending'
})

// 摘要：优先用 order.summary，否则从 items 构建
const displaySummary = computed(() => {
  if (props.order.summary) return props.order.summary
  const items = props.order.items
  if (!Array.isArray(items) || items.length === 0) return '订单详情'
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ')
})

// emoji：优先用 order.summaryEmoji，否则从首道菜名推断
const displayEmoji = computed(() => {
  if (props.order.summaryEmoji) return props.order.summaryEmoji
  const items = props.order.items
  if (!Array.isArray(items) || items.length === 0) return '🍽️'
  return pickEmoji(items[0]?.name || '')
})

// 时间格式化：HH:mm
const formattedTime = computed(() => {
  const ts = props.order.createTime
  if (!ts) return ''
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
})

// 预约时间格式化：MM-dd HH:mm
const formattedReservation = computed(() => {
  if (!props.order.reservationTime) return ''
  const d = new Date(props.order.reservationTime)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
})

// 右侧预约时间显示文案：
//   asap → "尽快"
//   scheduled → "今天/明天 HH:mm"
//   reservationTime=0 或无 → 空（不显示）
const reservationText = computed(() => {
  const o = props.order
  if (!o) return ''
  if (o.reservationType === 'asap') return '尽快'
  if (o.reservationType === 'scheduled' && o.reservationTime) {
    const d = new Date(o.reservationTime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((target - today) / 86400000)
    let dayLabel
    if (diffDays === 0) dayLabel = '今天'
    else if (diffDays === 1) dayLabel = '明天'
    else if (diffDays === 2) dayLabel = '后天'
    else dayLabel = `${d.getMonth() + 1}月${d.getDate()}日`
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${dayLabel} ${hh}:${mi}`
  }
  return ''
})

// 菜品占位 emoji
const itemEmoji = (item) => pickEmoji(item?.name || '')

// 根据菜名关键词推断 emoji（与 home-data 云函数逻辑保持一致）
const pickEmoji = (name) => {
  if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name)) return '☕'
  if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name)) return '🥐'
  if (/面|粉|粥|拉面|乌冬|noodle/i.test(name)) return '🍜'
  if (/饭|炒饭|盖饭|咖喱|便当/i.test(name)) return '🍚'
  if (/沙律|沙拉|salad/i.test(name)) return '🥗'
  if (/汤|羹/i.test(name)) return '🍲'
  return '🍽️'
}

// 点击卡片：可展开时切换展开，否则 emit tap 进入详情页
const onCardTap = () => {
  if (props.expandable) {
    expanded.value = !expanded.value
    return
  }
  emit('tap', { order: props.order })
}

const onCancel = () => {
  flashing.value = true
  setTimeout(() => {
    flashing.value = false
  }, 600)
  emit('cancel', { order: props.order })
}
</script>

<style lang="scss" scoped>
.order-card-wrap {
  /* 容器：承载主卡片 + 展开详情，不承载视觉样式 */
}

.order-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background-color: $color-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: transform $dur-fast $ease-smooth, box-shadow $dur-fast $ease-smooth, border-radius $dur-base $ease-smooth;

  /* 状态变化时整体闪光，强化动效反馈 */
  &.is-flashing {
    box-shadow: 0 0 0 4rpx rgba(255, 167, 38, 0.18), $shadow-md;
  }

  /* 展开时底部圆角消失，与详情区平滑衔接 */
  &.is-expanded {
    border-radius: $radius-xl $radius-xl 0 0;
  }

  /* 可展开时点击有微妙反馈 */
  .card-icon {
    flex-shrink: 0;
    width: 88rpx;
    height: 88rpx;
    border-radius: $radius-lg;
    background-color: $color-bg-soft;
    @include flex-center;
    font-size: 44rpx;
  }

  .card-body {
    flex: 1;
    min-width: 0;
    @include flex-column;
    gap: 8rpx;

    .card-summary {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-text-strong;
      line-height: $line-height-tight;
      @include ellipsis(1);
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: $font-size-xs;
      color: $color-text-muted;

      .meta-user {
        color: $color-coffee-500;
        font-weight: $font-weight-medium;
      }

      .meta-expand {
        margin-left: auto;
        color: $color-coffee-400;
        font-weight: $font-weight-medium;
      }
    }
  }

  .card-actions {
    flex-shrink: 0;
    @include flex-column;
    align-items: flex-end;
    gap: 12rpx;

    // 预约时间文本（替代原"开始制作"按钮）
    .reservation-time {
      font-size: $font-size-xs;
      color: $color-coffee-500;
      font-weight: $font-weight-medium;
      line-height: 1;
    }

    .action-row {
      display: flex;
      gap: 8rpx;
      align-items: center;
    }
  }
}

/* 操作按钮：仅保留取消按钮样式 */
.action-btn {
  padding: 10rpx 24rpx;
  border-radius: $radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  transition: transform $dur-fast $ease-smooth, opacity $dur-fast $ease-smooth;

  &:active {
    transform: scale(0.92);
    opacity: 0.85;
  }

  .action-text {
    color: #fff;
  }

  /* 取消：灰色边框，透明背景 */
  &.btn-cancel {
    background-color: transparent;
    border: 2rpx solid $color-neutral-300;
    box-shadow: none;

    .action-text {
      color: $color-text-muted;
    }
  }
}

/* 展开详情区 */
.card-detail {
  padding: 20rpx 24rpx 24rpx;
  background-color: $color-bg-soft;
  border-radius: 0 0 $radius-xl $radius-xl;
  box-shadow: $shadow-sm;

  .detail-items {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx dashed $color-border;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .item-img {
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-sm;
      background-color: $color-card;
      flex-shrink: 0;

      &.placeholder {
        @include flex-center;
        font-size: 28rpx;
      }
    }

    .item-name {
      flex: 1;
      font-size: $font-size-sm;
      color: $color-text;
      @include ellipsis;
    }

    .item-qty {
      font-size: $font-size-sm;
      color: $color-coffee-500;
      font-weight: $font-weight-semibold;
      flex-shrink: 0;
    }
  }

  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
    margin-top: 12rpx;
    font-size: $font-size-sm;

    .row-icon {
      color: $color-coffee-500;
      @include flex-center;
      width: 28rpx;
      height: 28rpx;
      flex-shrink: 0;
      margin-top: 2rpx;
    }

    .row-label {
      color: $color-text-muted;
      flex-shrink: 0;
    }

    .row-value {
      flex: 1;
      color: $color-text;
      line-height: $line-height-normal;
    }
  }
}
</style>
