<template>
  <view class="order-page" :class="'mode-' + mode">
    <view class="top-area" :style="{ paddingTop: headerTop + 'px' }">
      <view class="heading">
        <view><text class="page-title">{{ mode === 'food' ? '今天，想吃点什么？' : '给今天，加点咖啡香' }}</text><text class="subtitle">{{ mode === 'food' ? '你负责好好吃，我负责用心做。' : '忙里偷个闲，喝杯喜欢的。' }}</text></view>
        <image class="heading-art" :src="mode === 'food' ? bowlArt : menuItems[4].image" mode="aspectFit" />
      </view>
      <view class="mode-tabs" role="tablist" aria-label="点单类型">
        <view class="mode-slider" :class="{ coffee: mode === 'coffee' }" />
        <button v-for="type in types" :key="type.id" role="tab" :aria-selected="mode === type.id" :aria-label="type.label" class="mode-tab" :class="{ active: mode === type.id }" @tap="switchMode(type.id)">
          <Icon :name="type.icon" :size="20" :stroke-width="1.6" /><text>{{ type.label }}</text><text v-if="countFor(type.id)" class="tab-count">{{ countFor(type.id) }}</text>
        </button>
      </view>
      <view class="filter-row">
        <scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
          <view class="category-list"><button v-for="category in menuCategories[mode]" :key="category.id" class="category" :class="{ selected: categories[mode] === category.id }" :aria-pressed="categories[mode] === category.id" @tap="categories[mode] = category.id"><text>{{ category.name }}</text><view class="category-underline" /></button></view>
        </scroll-view>
        <button class="search-toggle" :class="{ active: searchOpen }" aria-label="搜索菜单" :aria-expanded="searchOpen" @tap="toggleSearch"><view class="search-glass" /></button>
      </view>
      <view v-if="searchOpen" class="search-box"><view class="search-glass" /><input v-model="queries[mode]" placeholder="找找今天想吃的…" maxlength="40" confirm-type="search" aria-label="搜索菜品或咖啡" /><button v-if="queries[mode]" class="round-button" aria-label="清空搜索" @tap="queries[mode] = ''"><Icon name="close" :size="17" /></button></view>
    </view>

    <scroll-view :key="mode + categories[mode]" scroll-y class="menu-scroll" :show-scrollbar="false">
      <view class="list-inner">
        <view class="little-note"><Icon :name="mode === 'food' ? 'note' : 'coffee'" :size="17" :stroke-width="1.6" /><text>{{ mode === 'food' ? '家里的拿手菜，今天也为你留了一份。' : '冷热与甜度，都按你的心情来。' }}</text><text class="note-spark">✧</text></view>
        <view :key="mode + categories[mode]" class="menu-list">
          <view v-for="item in visibleItems" :key="item.id" class="dish-row" :class="{ chosen: itemCount(item.id) > 0 }">
            <button class="art-button" :aria-label="'查看' + item.name" @tap="openDish(item)"><view class="art-wash" :class="item.tone" /><image class="dish-image" :src="item.image" mode="aspectFit" /></button>
            <view class="dish-copy">
              <button class="dish-title-button" :aria-label="'选择' + item.name + '口味'" @tap="openDish(item)"><text class="dish-name">{{ item.name }}</text><Icon name="chevron-right" :size="14" /></button>
              <text class="dish-description">{{ item.subtitle }}</text>
              <text class="dish-tag" :class="item.tone">{{ item.tag }}</text>
              <view class="dish-bottom">
                <button class="flavor-button" :aria-label="item.name + '选口味'" @tap="openDish(item)"><text>选口味</text><Icon name="chevron-down" :size="12" /></button>
                <view class="counter">
                  <button v-if="itemCount(item.id)" class="quantity-button minus" :aria-label="'减少' + item.name" @tap="removeLatest(item.id)"><Icon name="minus" :size="15" /></button>
                  <text v-if="itemCount(item.id)" class="quantity-value">{{ itemCount(item.id) }}</text>
                  <button class="quantity-button plus" :aria-label="'添加' + item.name" @tap="quickAdd(item)"><Icon name="plus" :size="18" /></button>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="!visibleItems.length" class="empty-list"><image :src="bowlArt" mode="aspectFit" /><text class="empty-title">这口快乐，还没找到</text><text>换个关键词或分类试试看吧。</text><button class="light-button" @tap="resetFilters">看看全部</button></view>
        <view class="list-end"><text>—</text><text>{{ mode === 'food' ? '好好吃饭，是今天的小正事' : '日子慢慢过，咖啡慢慢喝' }}</text><text>—</text></view>
        <text class="mock-label">菜单体验 · 示例数据</text>
      </view>
    </scroll-view>

    <view class="cart-dock">
      <view class="cart-bar" :class="{ filled: total > 0 }">
        <button class="cart-summary" aria-label="查看已选清单" @tap="openCart">
          <view class="basket-icon"><Icon :name="mode === 'food' ? 'shopping-bag' : 'coffee'" :size="24" :stroke-width="1.6" /><text v-if="total" :key="total" class="basket-count">{{ total }}</text></view>
          <view><text class="cart-title">{{ total ? '已选 ' + total + (mode === 'food' ? ' 份好味道' : ' 杯小快乐') : '今天的快乐，还差一口' }}</text><text class="cart-subtitle">{{ total ? '点这里，看看你的小清单' : mode === 'food' ? '挑几道喜欢的，开饭啦' : '选一杯喜欢的，歇一歇' }}</text></view>
          <Icon v-if="total" name="chevron-up" :size="14" />
        </button>
        <button class="checkout-button" :disabled="!total" @tap="openReview"><text>去点单</text><Icon name="chevron-right" :size="16" /></button>
      </view>
    </view>
    <custom-tabbar />

    <view v-if="panel" class="sheet-layer">
      <view class="sheet-mask" :class="{ closing }" @tap="closePanel" @touchmove.stop.prevent />
      <view class="sheet" :class="{ closing, 'success-sheet': panel === 'success' }" role="dialog" aria-modal="true" :aria-label="panelTitle">
        <view class="sheet-handle" />
        <view class="sheet-heading"><view><text class="sheet-title">{{ panelTitle }}</text><text class="sheet-subtitle">{{ panelSubtitle }}</text></view><button class="close-button" aria-label="关闭弹层" @tap="closePanel"><Icon name="close" :size="20" /></button></view>
        <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="false">
          <view v-if="panel === 'dish' && selected" class="dish-detail">
            <image class="detail-image" :src="selected.image" mode="aspectFit" />
            <text class="detail-description">{{ selected.description }}</text>
            <view v-for="(option, index) in selected.options" :key="option.name" class="option-group"><text class="option-label">{{ option.name }}</text><view class="option-values"><button v-for="value in option.values" :key="value" class="option-button" :class="{ selected: selectedOptions[index] === value }" :aria-pressed="selectedOptions[index] === value" @tap="selectedOptions[index] = value">{{ value }}</button></view></view>
            <view class="portion-row"><text>来{{ mode === 'food' ? '几份' : '几杯' }}？</text><view class="counter"><button class="quantity-button minus" aria-label="减少选购数量" :disabled="selectedQuantity <= 1" @tap="selectedQuantity--"><Icon name="minus" :size="16" /></button><text class="quantity-value">{{ selectedQuantity }}</text><button class="quantity-button plus" aria-label="增加选购数量" :disabled="selectedQuantity >= 20" @tap="selectedQuantity++"><Icon name="plus" :size="18" /></button></view></view>
          </view>
          <template v-else-if="panel === 'cart' || panel === 'review'">
            <view v-if="total" class="cart-content">
              <view v-if="panel === 'cart'" class="cart-toolbar"><text>{{ cart.length }} 种{{ mode === 'food' ? '好味道' : '小快乐' }}</text><button class="clear-cart" @tap="confirmClear = true"><Icon name="trash" :size="14" />清空清单</button></view>
              <view v-for="line in cart" :key="line.key" class="cart-line"><image :src="line.image" mode="aspectFit" /><view class="line-copy"><text class="line-title">{{ line.name }}</text><text class="line-options">{{ line.options.join(' · ') }}</text></view>
                <view v-if="panel === 'cart'" class="counter"><button class="quantity-button minus" :aria-label="'清单减少' + line.name + line.options.join('')" @tap="decreaseLine(cart, line.key)"><Icon name="minus" :size="14" /></button><text class="quantity-value">{{ line.quantity }}</text><button class="quantity-button plus" :aria-label="'清单增加' + line.name + line.options.join('')" @tap="incrementLine(line)"><Icon name="plus" :size="16" /></button></view>
                <text v-else class="review-quantity">× {{ line.quantity }}</text>
              </view>
              <view v-if="panel === 'review'" class="order-notes"><text class="option-label">给{{ mode === 'food' ? '做饭人' : '咖啡师' }}的小纸条 <text>选填</text></text><textarea v-model="notes[mode]" class="note-input" placeholder="比如少一点葱，或者想晚一点吃…" maxlength="120" :show-confirm-bar="false" /><text class="note-counter">{{ notes[mode].length }}/120</text><view class="demo-notice"><Icon name="note" :size="14" /><text>这是模拟点单，不会发送给家人。</text></view></view>
            </view>
            <view v-else class="empty-cart"><image :src="bowlArt" mode="aspectFit" /><text class="empty-title">清单还空着呢</text><text>先挑一点喜欢的吧。</text></view>
          </template>
          <view v-else-if="panel === 'success'" class="success-content"><view class="success-stamp"><Icon name="check" :size="35" :stroke-width="1.7" /></view><text class="success-title">小纸条，写好啦！</text><text class="success-caption">好味道，值得慢慢等。</text><view class="receipt"><text class="receipt-label">本次模拟点单 · {{ submitted.type === 'food' ? '菜品' : '咖啡' }}</text><view v-for="line in submitted.lines" :key="line.key" class="receipt-line"><view><text>{{ line.name }}</text><text class="receipt-options">{{ line.options.join(' · ') }}</text></view><text>× {{ line.quantity }}</text></view><text v-if="submitted.note" class="receipt-note">小纸条：{{ submitted.note }}</text><text class="receipt-total">一共 {{ submitted.count }} {{ submitted.type === 'food' ? '份' : '杯' }} · 满满心意</text></view><text class="demo-notice">仅完成本地演示，没有创建真实订单。</text></view>
        </scroll-view>
        <view class="sheet-footer">
          <button v-if="panel === 'dish'" class="primary-button" @tap="addSelected"><Icon name="plus" :size="18" />加入清单 · {{ selectedQuantity }} {{ mode === 'food' ? '份' : '杯' }}</button>
          <button v-else-if="panel === 'cart'" class="primary-button" @tap="total ? openReview() : closePanel()">{{ total ? '选好了，去点单 · ' + total + (mode === 'food' ? ' 份' : ' 杯') : '去挑点好吃的' }}<Icon name="chevron-right" :size="17" /></button>
          <template v-else-if="panel === 'review'"><button class="back-to-cart" @tap="panel = 'cart'">再看看</button><button class="primary-button" :disabled="!total || submitting" @tap="submitMock">{{ submitting ? '正在写小纸条…' : '确认点单' }}<Icon name="check" :size="17" /></button></template>
          <button v-else class="primary-button" @tap="closePanel">收好，继续逛逛<Icon name="check" :size="17" /></button>
        </view>
      </view>
    </view>
    <fo-dialog :visible="confirmClear" title="清空这份小清单？" subtitle="只清空当前分类的已选内容。" cancel-text="再想想" confirm-text="清空" @close="confirmClear = false" @confirm="clearCart" />
    <view v-if="feedback" class="feedback" role="status"><Icon name="check" :size="15" /><text>{{ feedback }}</text></view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { onLoad, onShow, onHide, onBackPress } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useCartStore } from '@/store/cart.js'
import { bowlArt, menuItems, menuCategories, addToCart, decreaseLine } from '@/mock/order-menu.js'
const { statusBarHeight, menuButton } = useSafeArea()
const headerTop = computed(() => menuButton.value?.bottom ? menuButton.value.bottom + 12 : statusBarHeight.value + 16)
const types = [{id:'food',label:'吃点好的',icon:'food'},{id:'coffee',label:'喝杯咖啡',icon:'coffee'}]
const mode = ref('food'), categories = reactive({food:'all',coffee:'all'}), queries = reactive({food:'',coffee:''})
const carts = reactive({food:[],coffee:[]}), notes = reactive({food:'',coffee:''})
const cart = computed(() => carts[mode.value])
const countFor = type => carts[type].reduce((sum, line) => sum + line.quantity, 0)
const total = computed(() => countFor(mode.value))
const itemCount = id => cart.value.filter(line => line.id === id).reduce((sum, line) => sum + line.quantity, 0)
const visibleItems = computed(() => menuItems.filter(item => item.type === mode.value && (categories[mode.value] === 'all' || (categories[mode.value] === 'signature' ? item.signature : item.category === categories[mode.value])) && (item.name + item.subtitle).includes(queries[mode.value].trim())))
const searchOpen = ref(false), panel = ref(''), closing = ref(false), confirmClear = ref(false), feedback = ref('')
const selected = ref(null), selectedOptions = ref([]), selectedQuantity = ref(1), submitting = ref(false), submitted = ref(null)
let closeTimer, feedbackTimer, submitTimer
onLoad(options => { if (['food','coffee'].includes(options?.type)) mode.value = options.type })
onShow(() => { const pending = useCartStore().consumePendingType(); if (['food','coffee'].includes(pending)) mode.value = pending })
const switchMode = type => { if (panel.value || mode.value === type) return; mode.value = type; feedback.value = '' }
const resetFilters = () => { queries[mode.value] = ''; categories[mode.value] = 'all' }
const toggleSearch = () => { searchOpen.value = !searchOpen.value; if (!searchOpen.value) queries[mode.value] = '' }
const showFeedback = text => { clearTimeout(feedbackTimer); feedback.value = text; feedbackTimer = setTimeout(() => { feedback.value = '' }, 1400) }
const quickAdd = item => { if (addToCart(cart.value, item)) showFeedback('已加一' + (mode.value === 'food' ? '份' : '杯') + ' ' + item.name); else showFeedback('这一种口味最多选 20 份') }
const removeLatest = id => { const line = [...cart.value].reverse().find(item => item.id === id); if (line) decreaseLine(cart.value, line.key) }
const openDish = item => { selected.value = item; selectedOptions.value = [...item.defaults]; selectedQuantity.value = 1; closing.value = false; panel.value = 'dish' }
const openCart = () => { closing.value = false; panel.value = 'cart' }
const openReview = () => { if (!total.value || closing.value) return; panel.value = 'review' }
const closePanel = () => { if (closing.value || submitting.value) return; closing.value = true; closeTimer = setTimeout(() => { panel.value = ''; closing.value = false; selected.value = null }, 220) }
const addSelected = () => {
  if (closing.value || !selected.value) return
  if (!addToCart(cart.value, selected.value, selectedOptions.value, selectedQuantity.value)) { showFeedback('这一种口味最多选 20 份'); return }
  showFeedback(selected.value.name + '已加入清单'); closePanel()
}
const incrementLine = line => { const item = menuItems.find(item => item.id === line.id); if (!addToCart(cart.value, item, line.options)) showFeedback('这一种口味最多选 20 份') }
const clearCart = () => { carts[mode.value] = []; confirmClear.value = false }
const submitMock = () => {
  if (submitting.value || !total.value) return
  submitting.value = true
  const type = mode.value
  const snapshot = {type,lines:JSON.parse(JSON.stringify(cart.value)),note:notes[type].trim(),count:total.value}
  submitTimer = setTimeout(() => {
    submitted.value = snapshot; carts[type] = []; notes[type] = ''; submitting.value = false; panel.value = 'success'
  }, 350)
}
const cleanup = () => { clearTimeout(closeTimer); clearTimeout(feedbackTimer); clearTimeout(submitTimer); panel.value = ''; closing.value = false; confirmClear.value = false; submitting.value = false; feedback.value = '' }
onHide(cleanup)
onUnmounted(cleanup)
onBackPress(() => { if (confirmClear.value) { confirmClear.value = false; return true } if (panel.value) { closePanel(); return true } return false })
const panelTitle = computed(() => panel.value === 'dish' ? selected.value?.name : panel.value === 'cart' ? '今天的快乐清单' : panel.value === 'review' ? '把想吃的，写成小纸条' : '点单小回执')
const panelSubtitle = computed(() => panel.value === 'dish' ? selected.value?.subtitle : panel.value === 'cart' ? mode.value === 'food' ? '每一道，都是你喜欢的味道' : '一杯一杯，装进今天的小快乐' : panel.value === 'review' ? '确认一下，就准备开饭的心情' : '这是一张本地演示回执')
</script>

<style lang="scss" scoped>
@import '@/scss/font-menu.scss';
.order-page { height:100vh; height:100dvh; display:flex; flex-direction:column; overflow:hidden; background:$p2-paper; color:$p2-ink; padding-bottom:calc(132rpx + env(safe-area-inset-bottom)); box-sizing:border-box; }
button { background:none; border-radius:0; margin:0; padding:0; line-height:inherit; font:inherit; color:inherit; &::after { border:0; } &:active:not([disabled]) { transform:scale(.95); } transition:transform 110ms $p2-ease; &[disabled] { opacity:.45; } }
.top-area { padding:0 32rpx; flex-shrink:0; }
.heading { display:flex; align-items:center; justify-content:space-between; gap:8rpx; padding-bottom:24rpx; }
.page-title { display:block; font-family:MenuHand,$p2-font-fallback; font-size:46rpx; line-height:1.5; }
.subtitle { display:block; margin-top:7rpx; color:$p2-ink-soft; font-size:23rpx; }
.heading-art { width:112rpx; height:112rpx; flex-shrink:0; transform:rotate(6deg); }
.mode-tabs { position:relative; display:flex; border:2rpx solid $p2-line; border-radius:22rpx 26rpx 19rpx 23rpx; background:$p2-surface; padding:7rpx; height:96rpx; }
.mode-slider { position:absolute; top:7rpx; bottom:7rpx; left:7rpx; width:calc(50% - 7rpx); background:$p2-leaf-soft; border-radius:16rpx 20rpx 15rpx 19rpx; transform:translateX(0); transition:transform 240ms $p2-ease,background 240ms ease; &.coffee { transform:translateX(100%); background:$p2-butter-soft; } }
.mode-tab { position:relative; z-index:1; flex:1; display:flex; justify-content:center; align-items:center; gap:12rpx; font-size:29rpx; color:$p2-ink-soft; &.active { color:$p2-ink; font-weight:600; } }
.tab-count { font-size:18rpx; line-height:30rpx; min-width:30rpx; border-radius:50%; background:$p2-coral; color:$p2-white; padding:0 5rpx; }
.filter-row { display:flex; align-items:center; gap:12rpx; padding-top:10rpx; }
.category-scroll { flex:1; width:0; min-width:0; }
.category-list { display:flex; align-items:center; gap:24rpx; padding:12rpx 0 16rpx; }
.category { position:relative; flex-shrink:0; font-size:25rpx; padding:14rpx 3rpx; color:$p2-ink-soft; &.selected { color:$p2-ink; font-weight:600; .category-underline { opacity:1; transform:rotate(-3deg) scaleX(1); } } }
.category-underline { position:absolute; bottom:3rpx; left:0; right:0; height:5rpx; background:$p2-leaf; border-radius:60% 40%; opacity:0; transform:scaleX(.4); transition:transform 180ms $p2-ease,opacity 180ms ease; }
.search-toggle { width:68rpx; height:62rpx; display:flex; justify-content:center; align-items:center; border-left:2rpx solid #e6dac5; &.active { background:$p2-paper-deep; border-radius:15rpx; } }
.search-glass { width:24rpx; height:24rpx; border:3rpx solid $p2-ink-soft; border-radius:50%; position:relative; flex-shrink:0; &::after { content:''; position:absolute; width:10rpx; height:3rpx; background:$p2-ink-soft; right:-8rpx; bottom:-4rpx; transform:rotate(45deg); } }
.search-box { display:flex; align-items:center; gap:20rpx; padding:0 22rpx; background:$p2-surface; border:2rpx solid #cdbba4; border-radius:18rpx; margin-bottom:15rpx; input { flex:1; min-width:0; height:74rpx; font-size:26rpx; } }
.round-button { display:flex; align-items:center; justify-content:center; width:50rpx; height:60rpx; }
.menu-scroll { flex:1; min-height:0; height:0; width:100%; }
.list-inner { padding:0 32rpx 22rpx; }
.little-note { display:flex; align-items:center; gap:12rpx; background:#f5edce; padding:16rpx 18rpx; border-radius:6rpx 16rpx 10rpx 17rpx; font-size:21rpx; color:#8a7454; margin-bottom:22rpx; }
.note-spark { margin-left:auto; font-size:26rpx; color:#bc9860; }
.menu-list { animation:list-in 240ms $p2-ease backwards; }
.dish-row { display:flex; align-items:center; gap:17rpx; background:$p2-surface; border:2rpx solid #b6a18a; border-radius:25rpx 21rpx 29rpx 19rpx; margin-bottom:22rpx; padding:16rpx 20rpx 16rpx 6rpx; box-shadow:3rpx 4rpx 0 #6247350d; &.chosen { border-color:#91a177; } &:nth-child(even) { border-radius:19rpx 27rpx 20rpx 25rpx; } }
.art-button { position:relative; flex-shrink:0; width:244rpx; height:232rpx; display:flex; align-items:center; justify-content:center; }
.art-wash { position:absolute; width:190rpx; height:148rpx; border-radius:48% 52% 47% 53%; background:#f4ebce; transform:rotate(-8deg); opacity:.65; &.green { background:#e1eacb; } &.blue { background:#e1edef; } &.coral { background:#f7e0d5; } }
.dish-image { position:relative; width:100%; height:100%; }
.dish-copy { flex:1; min-width:0; }
.dish-title-button { display:flex; align-items:center; justify-content:space-between; width:100%; text-align:left; padding:6rpx 0; }
.dish-name { font-family:MenuHand,$p2-font-fallback; font-size:36rpx; line-height:1.4; }
.dish-description { display:block; margin-top:3rpx; font-size:21rpx; color:$p2-ink-soft; line-height:1.6; }
.dish-tag { display:inline-block; margin-top:12rpx; font-size:19rpx; padding:4rpx 10rpx; border-radius:7rpx 10rpx; background:#f7ebbc; color:#84714e; &.green { background:#e4edda; color:#6c8055; } &.blue { background:#e4edef; color:#6b868b; } &.coral { background:#f8e1d7; color:#a56855; } }
.dish-bottom { display:flex; justify-content:space-between; align-items:center; gap:6rpx; margin-top:14rpx; min-height:64rpx; }
.flavor-button { display:flex; align-items:center; gap:5rpx; color:$p2-ink-soft; font-size:21rpx; min-height:62rpx; white-space:nowrap; }
.counter { display:flex; align-items:center; flex-shrink:0; gap:6rpx; }
.quantity-button { width:58rpx; height:58rpx; border:2rpx solid $p2-line; border-radius:18rpx 16rpx 19rpx 15rpx; display:flex; justify-content:center; align-items:center; flex-shrink:0; &.plus { background:$p2-leaf-soft; box-shadow:2rpx 3rpx 0 #62473512; } &.minus { background:$p2-white; border-color:#c9bba7; width:50rpx; height:50rpx; } }
.quantity-value { min-width:27rpx; text-align:center; font-size:26rpx; font-variant-numeric:tabular-nums; }
.list-end { display:flex; justify-content:center; gap:14rpx; color:$p2-ink-soft; font-size:21rpx; margin:30rpx 0 15rpx; }
.mock-label { display:block; text-align:center; font-size:18rpx; color:#a59078; }
.cart-dock { flex-shrink:0; padding:16rpx 25rpx 8rpx; }
.cart-bar { display:flex; align-items:center; justify-content:space-between; gap:8rpx; padding:14rpx 13rpx; border:2rpx solid $p2-line; border-radius:25rpx 22rpx 20rpx 24rpx; background:$p2-surface; box-shadow:3rpx 4rpx 0 #62473510; &.filled { background:#f3f4e8; } }
.cart-summary { flex:1; min-width:0; display:flex; align-items:center; gap:16rpx; text-align:left; }
.basket-icon { position:relative; width:68rpx; height:72rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.basket-count { position:absolute; top:-4rpx; right:-3rpx; min-width:30rpx; line-height:30rpx; font-size:19rpx; text-align:center; padding:0 5rpx; border-radius:50%; background:$p2-coral; color:white; animation:count-pop 200ms $p2-ease; }
.cart-title { display:block; font-size:25rpx; font-weight:600; }.cart-subtitle { display:block; font-size:18rpx; color:$p2-ink-soft; margin-top:6rpx; }
.checkout-button { display:flex; align-items:center; justify-content:center; gap:6rpx; background:$p2-coral-soft; border:2rpx solid $p2-line; padding:18rpx 20rpx; height:76rpx; border-radius:17rpx 21rpx 16rpx 19rpx; font-size:27rpx; flex-shrink:0; }
.mode-coffee { .quantity-button.plus { background:$p2-butter-soft; }.category-underline { background:$p2-butter; }.cart-bar.filled { background:#faf0d7; }.little-note { background:#f4e8db; } }
.empty-list,.empty-cart { display:flex; flex-direction:column; align-items:center; gap:16rpx; text-align:center; color:$p2-ink-soft; font-size:25rpx; padding:40rpx 10rpx; image { width:150rpx; height:150rpx; } }
.empty-title { font-family:MenuHand,$p2-font-fallback; font-size:34rpx; color:$p2-ink; }
.light-button { border:2rpx solid #b9c39f; border-radius:15rpx; padding:17rpx 25rpx; background:$p2-leaf-soft; margin-top:12rpx; }
.sheet-layer { position:fixed; inset:0; z-index:300; }
.sheet-mask { position:absolute; inset:0; background:#3c2a2059; animation:mask-in 180ms ease; transition:opacity 220ms ease; &.closing { opacity:0; } }
.sheet { position:absolute; bottom:0; left:0; right:0; background:$p2-paper; border-radius:34rpx 39rpx 0 0; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; padding:18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom)); box-sizing:border-box; animation:sheet-in 260ms $p2-ease; transition:transform 220ms $p2-ease; &.closing { transform:translateY(100%); } }
.sheet-handle { flex-shrink:0; width:64rpx; height:7rpx; background:#d9cbb4; border-radius:9rpx; margin:0 auto 24rpx; }
.sheet-heading { display:flex; justify-content:space-between; align-items:center; gap:12rpx; flex-shrink:0; margin-bottom:20rpx; }
.sheet-title { display:block; font-family:MenuHand,$p2-font-fallback; font-size:39rpx; line-height:1.5; }.sheet-subtitle { display:block; color:$p2-ink-soft; font-size:22rpx; margin-top:5rpx; }
.close-button { width:65rpx; height:65rpx; display:flex; align-items:center; justify-content:center; background:$p2-paper-deep; border-radius:50%; flex-shrink:0; }
.sheet-scroll { flex:1; min-height:0; max-height:calc(88vh - 280rpx - env(safe-area-inset-bottom)); }
.sheet-footer { display:flex; align-items:center; gap:14rpx; padding-top:22rpx; flex-shrink:0; }
.primary-button { flex:1; display:flex; align-items:center; justify-content:center; gap:12rpx; padding:24rpx 18rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:20rpx 24rpx 18rpx 22rpx; box-shadow:3rpx 4rpx 0 #62473515; font-size:29rpx; min-height:88rpx; }
.dish-detail { padding-bottom:4rpx; }.detail-image { display:block; width:350rpx; height:260rpx; margin:0 auto 12rpx; }
.detail-description { display:block; font-size:25rpx; line-height:1.85; color:$p2-ink-soft; margin:6rpx 0 24rpx; }
.option-group { padding:16rpx 0; }.option-label { display:block; font-size:26rpx; font-weight:600; margin-bottom:17rpx; text { font-size:21rpx; color:$p2-ink-soft; font-weight:400; } }
.option-values { display:flex; gap:15rpx; flex-wrap:wrap; }.option-button { padding:17rpx 26rpx; font-size:25rpx; border:2rpx solid #d0c4b1; border-radius:16rpx 19rpx 14rpx 18rpx; background:$p2-white; &.selected { border-color:#889b6b; background:$p2-leaf-soft; } }
.portion-row { display:flex; align-items:center; justify-content:space-between; padding:22rpx 0 10rpx; font-size:26rpx; border-top:2rpx dashed #ddd0bb; margin-top:16rpx; }
.cart-toolbar { display:flex; align-items:center; justify-content:space-between; color:$p2-ink-soft; font-size:23rpx; padding:4rpx 0 18rpx; }.clear-cart { display:flex; align-items:center; gap:7rpx; min-height:52rpx; }
.cart-line { display:flex; align-items:center; gap:16rpx; padding:20rpx 0; border-top:2rpx dashed #dfd2bd; image { width:100rpx; height:100rpx; flex-shrink:0; } }
.line-copy { flex:1; min-width:0; }.line-title { display:block; font-size:28rpx; font-weight:600; }.line-options { display:block; font-size:22rpx; color:$p2-ink-soft; margin-top:8rpx; }.review-quantity { font-size:28rpx; }
.order-notes { padding:28rpx 0 12rpx; border-top:2rpx dashed #dfd2bd; }.note-input { width:100%; height:145rpx; padding:18rpx 22rpx; border:2rpx solid #d9c9b2; border-radius:17rpx 21rpx 16rpx 20rpx; background:$p2-surface; font-size:25rpx; line-height:1.7; box-sizing:border-box; }.note-counter { display:block; text-align:right; font-size:20rpx; color:$p2-ink-soft; margin-top:8rpx; }
.demo-notice { display:flex; align-items:center; justify-content:center; gap:8rpx; font-size:21rpx; color:$p2-ink-soft; padding:20rpx 0 8rpx; }
.back-to-cart { padding:24rpx; font-size:26rpx; }
.success-content { text-align:center; }.success-stamp { display:flex; align-items:center; justify-content:center; width:112rpx; height:112rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:48% 52% 44% 56%; margin:10rpx auto 22rpx; transform:rotate(-7deg); }.success-title { display:block; font-family:MenuHand,$p2-font-fallback; font-size:44rpx; }.success-caption { display:block; margin-top:10rpx; color:$p2-ink-soft; font-size:25rpx; }
.receipt { background:$p2-surface; border:2rpx solid #e0d5c1; border-radius:8rpx; padding:24rpx; margin-top:25rpx; text-align:left; }.receipt-label { display:block; font-size:21rpx; color:$p2-ink-soft; padding-bottom:15rpx; border-bottom:2rpx dashed #e0d5c1; }.receipt-line { display:flex; justify-content:space-between; gap:18rpx; padding:18rpx 0; font-size:26rpx; }.receipt-options { display:block; font-size:21rpx; color:$p2-ink-soft; margin-top:5rpx; }.receipt-note { display:block; font-size:23rpx; color:$p2-ink-soft; margin:10rpx 0; white-space:pre-wrap; overflow-wrap:anywhere; }.receipt-total { display:block; text-align:center; border-top:2rpx dashed #e0d5c1; padding-top:17rpx; font-size:24rpx; }
.feedback { position:fixed; z-index:1100; bottom:calc(285rpx + env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:10rpx; white-space:nowrap; padding:16rpx 22rpx; border-radius:18rpx; background:#624735ee; color:$p2-white; font-size:23rpx; pointer-events:none; animation:mask-in 130ms ease; }
@keyframes list-in { from { opacity:0; transform:translateY(8rpx); } to { opacity:1; transform:translateY(0); } }
@keyframes count-pop { from { transform:scale(.75); } to { transform:scale(1); } }
@keyframes mask-in { from { opacity:0; } to { opacity:1; } }
@keyframes sheet-in { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (prefers-reduced-motion:reduce) { button,.mode-slider,.category-underline,.sheet,.sheet-mask { transition:none; }.menu-list,.basket-count,.sheet,.sheet-mask,.feedback { animation:none; } }
@media screen and (max-width:360px) { .art-button { width:220rpx; }.page-title { font-size:43rpx; }.dish-name { font-size:34rpx; }.dish-description { font-size:20rpx; }.dish-row { gap:12rpx; }.cart-title { font-size:23rpx; } }
</style>
