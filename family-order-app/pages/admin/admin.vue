<template>
  <view class="page-admin page-enter">
    <!-- 头部（fixed 固定，滚动时常驻顶部） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <view class="header-top">
        <view class="header-title-wrap">
          <text class="title">管理中心</text>
          <text class="subtitle">管理家庭菜单与订单</text>
        </view>
        <!-- 切换为下单人按钮 -->
        <view class="role-switch-btn" @tap="onSwitchRole">
          <Icon name="utensils-crossed" :size="14" />
          <text>切换为下单人</text>
        </view>
      </view>
      <!-- 统计卡片：今日订单 + 待制作 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-num">{{ todayOrderCount }}</text>
          <text class="stat-label">今日订单</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-num-wrap">
            <text class="stat-num" :class="{ 'is-pending': pendingOrderCount > 0 }">{{ pendingOrderCount }}</text>
            <view v-if="pendingOrderCount > 0" class="stat-pulse-dot"></view>
          </view>
          <text class="stat-label">待制作</text>
        </view>
      </view>
    </view>
    <!-- header 固定后的占位 view -->
    <view class="header-spacer" :style="{ height: headerHeight + 'px' }"></view>

    <!-- 顶部双 tab 切换 -->
    <view class="tabs">
      <view
        class="tab"
        :class="{ active: activeTab === 'menu' }"
        @tap="activeTab = 'menu'"
      >
        菜单管理
      </view>
      <view
        class="tab"
        :class="{ active: activeTab === 'orders' }"
        @tap="activeTab = 'orders'"
      >
        订单管理
      </view>
    </view>

    <!-- 菜单管理 -->
    <view v-if="activeTab === 'menu'" class="menu-pane">
      <!-- 菜单类型切换 + 分类入口 -->
      <view class="menu-switch-row">
        <view class="menu-switch">
          <view class="menu-switch-btn coffee" :class="{ active: menuType === 'coffee' }" @tap="onMenuTypeChange('coffee')">
            <text>☕ 咖啡菜单</text>
          </view>
          <view class="menu-switch-btn food" :class="{ active: menuType === 'food' }" @tap="onMenuTypeChange('food')">
            <text>🍲 美食菜单</text>
          </view>
        </view>
        <view class="cat-entry" @tap="openCategoryManager">
          <Icon name="settings" :size="16" />
          <text>分类</text>
        </view>
      </view>

      <!-- 加载中：骨架屏占位 -->
      <view v-if="loadingDishes && filteredDishes.length === 0" class="dish-skeleton">
        <skeleton type="dish" :count="4" />
      </view>

      <!-- 菜品列表（带过渡动效） -->
      <view class="dish-list" v-else-if="filteredDishes.length">
        <transition-group name="dish">
          <view class="dish-card" v-for="dish in filteredDishes" :key="dish._id" :class="dish.type" @tap="onEditDish(dish)">
            <view class="dish-image">
              <image v-if="dish.image" :src="dish.image" mode="aspectFill" class="dish-img" />
              <view v-else class="dish-img-placeholder">{{ dish.type === 'coffee' ? '☕' : '🍲' }}</view>
              <view class="dish-off-badge" v-if="!dish.isOnSale">已下架</view>
              <view class="dish-recommend-badge" v-if="dish.isRecommended">推荐</view>
            </view>
            <view class="dish-info">
              <view class="dish-name-row">
                <text class="dish-name">{{ dish.name }}</text>
                <view v-if="dish.type === 'coffee' && dish.temp" class="temp-badge" :class="dish.temp">
                  <text class="temp-badge-icon">{{ dish.temp === 'ice' ? '❄' : '🔥' }}</text>
                  <text class="temp-badge-text">{{ dish.temp === 'ice' ? '冰' : '热' }}</text>
                </view>
              </view>
              <view class="dish-desc" v-if="dish.description">{{ dish.description }}</view>
              <view class="dish-cat" v-if="dish.categoryName">
                <text class="dish-cat-dot">●</text>
                <text>{{ dish.categoryName }}</text>
              </view>
            </view>
            <view class="dish-actions" @tap.stop>
              <view class="sale-switch" @tap.stop>
                <fo-switch :modelValue="dish.isOnSale" @change="onToggleSale(dish, $event)" />
              </view>
              <view class="icon-btn danger" @tap.stop="onDeleteDish(dish)">
                <Icon name="trash" :size="18" />
              </view>
            </view>
          </view>
        </transition-group>
      </view>

      <!-- 空状态 -->
      <fo-empty v-else :text="menuType === 'coffee' ? '还没有咖啡菜品，点击右下角添加吧' : '还没有美食菜品，点击右下角添加吧'" :icon="menuType === 'coffee' ? '☕' : '🍲'" />

      <!-- 新增菜品 FAB -->
      <view class="fab" @tap="onAddDish">
        <Icon name="plus" :size="28" color="#fff" />
      </view>
    </view>

    <!-- 订单管理 -->
    <view v-else class="orders-pane">
      <!-- 状态筛选 pill -->
      <view class="order-filter-row">
        <view
          v-for="f in orderFilters"
          :key="f.value"
          class="order-pill"
          :class="{ active: orderFilter === f.value }"
          @tap="orderFilter = f.value"
        >
          {{ f.label }}
        </view>
      </view>

      <!-- 加载中：骨架屏占位 -->
      <view v-if="loadingOrders && orderList.length === 0" class="order-skeleton">
        <skeleton type="card" :count="3" />
      </view>

      <!-- 订单列表 -->
      <view v-else-if="filteredOrders.length" class="order-list">
        <order-card
          v-for="(order, idx) in filteredOrders"
          :key="order._id"
          :order="order"
          show-user
          cancelable
          class="order-card-item animate-item-enter"
          :style="{ animationDelay: `${idx * 60}ms` }"
          @tap="onOrderTap"
          @cancel="onOrderCancel"
        />
      </view>

      <!-- 空状态（按筛选显示不同文案） -->
      <fo-empty v-else :text="orderEmptyText" icon="📋" />
    </view>

    <custom-tabbar />

    <!-- 菜品表单 sheet -->
    <fo-sheet :visible="dishFormVisible" :title="editingDishId ? '编辑菜品' : '新增菜品'" max-height="88vh" @close="closeDishForm">
      <view class="dish-form">
        <!-- 名称 -->
        <fo-input
          v-model="dishForm.name"
          label="菜品名称"
          placeholder="如：拿铁咖啡"
          required
          :error="dishFormError"
        />

        <!-- 图片上传 -->
        <view class="form-label">
          <text class="label-text">菜品图片</text>
          <text class="label-hint">推荐上传，可让点单页更诱人</text>
        </view>
        <view class="image-uploader" @tap="onChooseImage">
          <view v-if="!dishForm.image && !uploading" class="upload-placeholder">
            <Icon name="upload" :size="32" color="#A8A29E" />
            <text class="upload-text">点击上传图片</text>
          </view>
          <view v-else-if="uploading" class="upload-progress">
            <view class="progress-ring"></view>
            <text class="progress-text">上传中 {{ uploadProgress }}%</text>
          </view>
          <view v-else class="image-preview">
            <image :src="dishForm.image" mode="aspectFill" class="preview-img" />
            <view class="preview-mask">
              <text>重新上传</text>
            </view>
          </view>
        </view>

        <!-- 描述 -->
        <fo-input
          v-model="dishForm.description"
          label="描述"
          type="textarea"
          placeholder="简单描述一下这道菜品..."
          :maxlength="100"
        />

        <!-- 类型 -->
        <view class="form-label">
          <text class="label-text">类型</text>
          <text class="label-required">*</text>
        </view>
        <view class="type-chips">
          <view class="type-chip coffee" :class="{ active: dishForm.type === 'coffee' }" @tap="onTypeChange('coffee')">
            <text>☕ 咖啡</text>
          </view>
          <view class="type-chip food" :class="{ active: dishForm.type === 'food' }" @tap="onTypeChange('food')">
            <text>🍲 美食</text>
          </view>
        </view>

        <!-- 冷热配置（仅咖啡） -->
        <view v-if="dishForm.type === 'coffee'">
          <view class="form-label">
            <text class="label-text">冷热</text>
            <text class="label-required">*</text>
          </view>
          <view class="type-chips">
            <view class="type-chip ice" :class="{ active: dishForm.temp === 'ice' }" @tap="dishForm.temp = 'ice'">
              <text>❄ 冰</text>
            </view>
            <view class="type-chip hot" :class="{ active: dishForm.temp === 'hot' }" @tap="dishForm.temp = 'hot'">
              <text>🔥 热</text>
            </view>
          </view>
        </view>

        <!-- 分类 -->
        <view class="form-label">
          <text class="label-text">分类</text>
        </view>
        <view class="cat-chips" v-if="availableCategories.length">
          <view
            class="cat-chip"
            :class="{ active: !dishForm.categoryId }"
            @tap="dishForm.categoryId = ''"
          >
            <text>无分类</text>
          </view>
          <view
            v-for="cat in availableCategories"
            :key="cat._id"
            class="cat-chip"
            :class="{ active: dishForm.categoryId === cat._id }"
            @tap="dishForm.categoryId = cat._id"
          >
            <text>{{ cat.name }}</text>
          </view>
        </view>
        <view class="cat-empty-hint" v-else>
          <text>该类型暂无分类，</text>
          <text class="cat-empty-link" @tap="openCategoryManager">去添加</text>
        </view>

        <!-- 是否上架 -->
        <view class="sale-row">
          <view class="sale-label">
            <text class="sale-title">是否上架</text>
            <text class="sale-hint">下架后不在点单页展示</text>
          </view>
          <fo-switch v-model="dishForm.isOnSale" />
        </view>

        <!-- 是否推荐 -->
        <view class="sale-row">
          <view class="sale-label">
            <text class="sale-title">是否推荐</text>
            <text class="sale-hint">推荐菜品显示在点单页推荐区</text>
          </view>
          <fo-switch v-model="dishForm.isRecommended" />
        </view>

        <!-- 操作按钮 -->
        <view class="form-actions">
          <view class="form-btn cancel" @tap="closeDishForm">取消</view>
          <view class="form-btn save" :class="{ loading: saving }" @tap="onSaveDish">
            {{ saving ? '保存中...' : '保存' }}
          </view>
        </view>
      </view>
    </fo-sheet>

    <!-- 分类管理 sheet -->
    <fo-sheet :visible="catManagerVisible" title="分类管理" max-height="85vh" @close="closeCategoryManager">
      <view class="cat-manager">
        <!-- 新增/编辑表单 -->
        <view class="cat-form" v-if="catFormVisible">
          <fo-input
            v-model="catForm.name"
            label="分类名称"
            placeholder="如：拿铁系列、甜品"
            required
            :error="catFormError"
            :maxlength="20"
          />
          <view class="form-label">
            <text class="label-text">类型</text>
            <text class="label-required">*</text>
          </view>
          <view class="type-chips">
            <view class="type-chip coffee" :class="{ active: catForm.type === 'coffee' }" @tap="catForm.type = 'coffee'">
              <text>☕ 咖啡</text>
            </view>
            <view class="type-chip food" :class="{ active: catForm.type === 'food' }" @tap="catForm.type = 'food'">
              <text>🍲 美食</text>
            </view>
          </view>
          <view class="cat-form-actions">
            <view class="cat-btn cancel" @tap="cancelCatForm">取消</view>
            <view class="cat-btn save" @tap="onSaveCategory">{{ editingCatId ? '保存' : '添加' }}</view>
          </view>
        </view>

        <!-- 咖啡分类组 -->
        <view class="cat-group" v-if="coffeeCats.length">
          <view class="cat-group-title">☕ 咖啡分类</view>
          <view class="cat-item" v-for="(cat, idx) in coffeeCats" :key="cat._id">
            <view class="cat-item-name">
              <text>{{ cat.name }}</text>
              <text class="cat-system-tag" v-if="cat.name === '推荐'">内置</text>
            </view>
            <view class="cat-item-actions">
              <view class="cat-icon-btn" :class="{ disabled: idx === 0 }" @tap="moveCategory(coffeeCats, idx, -1)">
                <Icon name="chevron-up" :size="16" />
              </view>
              <view class="cat-icon-btn" :class="{ disabled: idx === coffeeCats.length - 1 }" @tap="moveCategory(coffeeCats, idx, 1)">
                <Icon name="chevron-down" :size="16" />
              </view>
              <view class="cat-icon-btn" @tap="onEditCategory(cat)">
                <Icon name="edit" :size="16" />
              </view>
              <view class="cat-icon-btn danger" v-if="cat.name !== '推荐'" @tap="onDeleteCategory(cat)">
                <Icon name="trash" :size="16" />
              </view>
            </view>
          </view>
        </view>

        <!-- 美食分类组 -->
        <view class="cat-group" v-if="foodCats.length">
          <view class="cat-group-title">🍲 美食分类</view>
          <view class="cat-item" v-for="(cat, idx) in foodCats" :key="cat._id">
            <view class="cat-item-name">
              <text>{{ cat.name }}</text>
              <text class="cat-system-tag" v-if="cat.name === '推荐'">内置</text>
            </view>
            <view class="cat-item-actions">
              <view class="cat-icon-btn" :class="{ disabled: idx === 0 }" @tap="moveCategory(foodCats, idx, -1)">
                <Icon name="chevron-up" :size="16" />
              </view>
              <view class="cat-icon-btn" :class="{ disabled: idx === foodCats.length - 1 }" @tap="moveCategory(foodCats, idx, 1)">
                <Icon name="chevron-down" :size="16" />
              </view>
              <view class="cat-icon-btn" @tap="onEditCategory(cat)">
                <Icon name="edit" :size="16" />
              </view>
              <view class="cat-icon-btn danger" v-if="cat.name !== '推荐'" @tap="onDeleteCategory(cat)">
                <Icon name="trash" :size="16" />
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <fo-empty v-if="!coffeeCats.length && !foodCats.length && !catFormVisible" text="还没有分类，先添加一个吧" icon="📂" />

        <!-- 新增按钮 -->
        <view class="cat-add-btn" v-if="!catFormVisible" @tap="onAddCategory">
          <Icon name="plus" :size="18" color="#6F4E37" />
          <text>新增分类</text>
        </view>
      </view>
    </fo-sheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useHeaderFixed } from '@/composables/useHeaderFixed.js'

const { statusBarHeight } = useSafeArea()
const { headerHeight } = useHeaderFixed('.header')

const userStore = useUserStore()

// === 顶部 tab ===
const activeTab = ref('menu')

// === 菜单管理状态 ===
const menuType = ref('coffee') // coffee | food，默认显示咖啡菜单
const dishList = ref([])
const categoryList = ref([])
const loadingDishes = ref(false)

// 按当前菜单类型筛选菜品
const filteredDishes = computed(() => {
  return dishList.value.filter((d) => d.type === menuType.value)
})

// 切换菜单类型
const onMenuTypeChange = (type) => {
  if (menuType.value === type) return
  menuType.value = type
}

// 咖啡 / 美食分类
const coffeeCats = computed(() => categoryList.value.filter((c) => c.type === 'coffee'))
const foodCats = computed(() => categoryList.value.filter((c) => c.type === 'food'))

// 表单可选分类（按当前选择的类型）
const availableCategories = computed(() =>
  categoryList.value.filter((c) => c.type === dishForm.type)
)

// === 菜品表单状态 ===
const dishFormVisible = ref(false)
const editingDishId = ref('')
const dishFormError = ref('')
const saving = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const dishForm = reactive({
  name: '',
  image: '',
  description: '',
  type: 'coffee',
  categoryId: '',
  isOnSale: true,
  isRecommended: false,
  temp: 'hot' // 冷热配置：仅咖啡有效，ice（冰）/ hot（热）
})

// === 分类管理状态 ===
const catManagerVisible = ref(false)
const catFormVisible = ref(false)
const editingCatId = ref('')
const catFormError = ref('')
const catForm = reactive({
  name: '',
  type: 'coffee'
})

// === 订单管理状态 ===
const orderList = ref([])
const loadingOrders = ref(false)
const ordersLoaded = ref(false)
// 状态筛选：all | pending | preparing | completed | cancelled
const orderFilter = ref('all')

// 状态筛选 pill 配置
const orderFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待制作' },
  { value: 'preparing', label: '制作中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

// 按筛选过滤订单（订单列表本身已按 createTime 倒序）
const filteredOrders = computed(() => {
  if (orderFilter.value === 'all') return orderList.value
  return orderList.value.filter((o) => o.status === orderFilter.value)
})

// 空状态文案（按筛选区分）
const orderEmptyText = computed(() => {
  const map = {
    all: '还没有订单哦~',
    pending: '暂无待制作订单 🎉',
    preparing: '暂无制作中订单',
    completed: '暂无已完成订单',
    cancelled: '暂无已取消订单'
  }
  return map[orderFilter.value] || '暂无订单'
})

// 计算 Asia/Shanghai 当天 00:00:00 ~ 23:59:59 毫秒时间戳
const getTodayRangeShanghai = () => {
  const SHANGHAI_OFFSET = 8 * 3600 * 1000
  const now = Date.now()
  const shanghaiNow = new Date(now + SHANGHAI_OFFSET)
  const y = shanghaiNow.getUTCFullYear()
  const m = shanghaiNow.getUTCMonth()
  const d = shanghaiNow.getUTCDate()
  const start = Date.UTC(y, m, d, 0, 0, 0) - SHANGHAI_OFFSET
  const end = start + 24 * 3600 * 1000 - 1
  return { start, end }
}

// 今日订单数
const todayOrderCount = computed(() => {
  const { start, end } = getTodayRangeShanghai()
  return orderList.value.filter((o) => o.createTime >= start && o.createTime <= end).length
})

// 待制作订单数
const pendingOrderCount = computed(() => {
  return orderList.value.filter((o) => o.status === 'pending').length
})

// === 生命周期 ===
onMounted(() => {
  // 权限校验：非管理员不拉取数据
  if (!userStore.isAdmin) {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    return
  }
  loadDishes()
  loadCategories()
  // 同时加载订单用于统计卡片与订单管理 tab，避免切换 tab 时重复请求
  loadOrders()
})

// 下拉刷新：按当前 tab 刷新对应数据
onPullDownRefresh(async () => {
  if (activeTab.value === 'menu') {
    await Promise.all([loadDishes(), loadCategories()])
  } else {
    await loadOrders()
  }
  uni.stopPullDownRefresh()
})

// === 数据加载 ===
const loadDishes = async () => {
  loadingDishes.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'dishes-crud',
      data: { action: 'list', token: userStore.token }
    })
    if (res.result.code === 0) {
      dishList.value = res.result.list
    } else {
      uni.showToast({ title: res.result.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[admin] loadDishes error', e)
    uni.showToast({ title: '加载菜品失败', icon: 'none' })
  } finally {
    loadingDishes.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await uniCloud.callFunction({
      name: 'categories-crud',
      data: { action: 'list', token: userStore.token }
    })
    if (res.result.code === 0) {
      categoryList.value = res.result.list
    }
  } catch (e) {
    console.error('[admin] loadCategories error', e)
  }
}

// === 订单数据加载 ===
// 由订单 items 构建菜品摘要字符串（与 home-data 云函数逻辑一致）
const buildOrderSummary = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '订单详情'
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ')
}

// 根据首道菜名推断 emoji（与 home-data 云函数逻辑一致）
const pickOrderEmoji = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '🍽️'
  const name = String(items[0].name || '')
  if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name)) return '☕'
  if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name)) return '🥐'
  if (/面|粉|粥|拉面|乌冬|noodle/i.test(name)) return '🍜'
  if (/饭|炒饭|盖饭|咖喱|便当/i.test(name)) return '🍚'
  if (/沙律|沙拉|salad/i.test(name)) return '🥗'
  if (/汤|羹/i.test(name)) return '🍲'
  return '🍽️'
}

const loadOrders = async () => {
  loadingOrders.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'orders-crud',
      data: { action: 'list', token: userStore.token, pageSize: 100 }
    })
    if (res.result.code === 0) {
      // orders-crud 不返回 summary/summaryEmoji 字段，客户端补充构建
      orderList.value = (res.result.list || []).map((o) => ({
        ...o,
        summary: buildOrderSummary(o.items),
        summaryEmoji: pickOrderEmoji(o.items)
      }))
      ordersLoaded.value = true
    } else {
      uni.showToast({ title: res.result.message || '加载订单失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[admin] loadOrders error', e)
    uni.showToast({ title: '加载订单失败', icon: 'none' })
  } finally {
    loadingOrders.value = false
  }
}

// === 订单状态操作（乐观更新 + 失败回滚） ===
// 注：列表内直接推进状态的入口已移除，管理员点击订单卡片进入详情页操作
//     order-card 仅保留 cancel（取消订单）能力

// 点击订单卡片：跳转订单详情页（管理员在详情页推进状态）
const onOrderTap = ({ order }) => {
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${order._id}`
  })
}

// 取消订单：调 orders-crud cancel（仅 pending 可取消）
const onOrderCancel = async ({ order }) => {
  const oldStatus = order.status
  // 乐观更新
  order.status = 'cancelled'
  try {
    const res = await uniCloud.callFunction({
      name: 'orders-crud',
      data: {
        action: 'cancel',
        _id: order._id,
        token: userStore.token
      }
    })
    if (res.result.code !== 0) {
      order.status = oldStatus
      uni.showToast({ title: res.result.message || '取消失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '已取消', icon: 'success' })
  } catch (e) {
    console.error('[admin] onOrderCancel error', e)
    order.status = oldStatus
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

// === 切换为下单人 ===
const onSwitchRole = () => {
  uni.showModal({
    title: '切换角色',
    content: '确定切换为下单人吗？切换后将隐藏管理功能，底部 tab 变为 3 个。',
    confirmText: '切换',
    confirmColor: '#6F4E37',
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '切换中...', mask: true })
        await userStore.setRole('orderer')
        uni.hideLoading()
        // reLaunch 重新加载应用，更新底部 tab 配置
        uni.reLaunch({ url: '/pages/home/home' })
      } catch (e) {
        uni.hideLoading()
        console.error('[admin] onSwitchRole error', e)
        uni.showToast({ title: e.message || '切换失败', icon: 'none' })
      }
    }
  })
}

// === 菜品表单 ===
const resetDishForm = () => {
  dishForm.name = ''
  dishForm.image = ''
  dishForm.description = ''
  dishForm.type = menuType.value // 默认使用当前菜单类型
  dishForm.categoryId = ''
  dishForm.isOnSale = true
  dishForm.isRecommended = false
  dishForm.temp = 'hot'
  dishFormError.value = ''
  editingDishId.value = ''
}

const onAddDish = () => {
  resetDishForm()
  dishFormVisible.value = true
}

const onEditDish = (dish) => {
  resetDishForm()
  editingDishId.value = dish._id
  dishForm.name = dish.name
  dishForm.image = dish.image
  dishForm.description = dish.description
  dishForm.type = dish.type
  dishForm.categoryId = dish.categoryId
  dishForm.isOnSale = dish.isOnSale
  dishForm.isRecommended = dish.isRecommended || false
  dishForm.temp = dish.temp === 'ice' || dish.temp === 'hot' ? dish.temp : 'hot'
  dishFormVisible.value = true
}

const closeDishForm = () => {
  dishFormVisible.value = false
  resetDishForm()
}

// 类型变化时重置分类与冷热
const onTypeChange = (type) => {
  dishForm.type = type
  // 若当前分类不属于该类型，则清空
  const belongs = categoryList.value.some((c) => c._id === dishForm.categoryId && c.type === type)
  if (!belongs) {
    dishForm.categoryId = ''
  }
  // 切换为美食时清空冷热配置
  if (type !== 'coffee') {
    dishForm.temp = ''
  } else if (!dishForm.temp) {
    dishForm.temp = 'hot'
  }
}

// 图片选择 + 上传
// 优先使用 chooseMedia（微信新版API），降级到 chooseImage（旧版兼容）
const onChooseImage = () => {
  if (uploading.value) return
  if (uni.chooseMedia) {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles[0]) {
          uploadDishImage(res.tempFiles[0].tempFilePath)
        }
      },
      fail: (err) => {
        if (String(err.errMsg || '').indexOf('cancel') === -1) {
          console.error('[admin] chooseMedia fail', err)
        }
      }
    })
  } else {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        uploadDishImage(tempPath)
      },
      fail: (err) => {
        if (String(err.errMsg || '').indexOf('cancel') === -1) {
          console.error('[admin] chooseImage fail', err)
        }
      }
    })
  }
}

const uploadDishImage = async (filePath) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const cloudPath = `dishes/${timestamp}_${random}.jpg`
  uploading.value = true
  uploadProgress.value = 0
  try {
    const res = await uniCloud.uploadFile({
      filePath,
      cloudPath,
      onProgressCall: (p) => {
        uploadProgress.value = Math.floor(p.progress || 0)
      }
    })
    dishForm.image = res.fileID
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (e) {
    console.error('[admin] uploadDishImage error', e)
    uni.showToast({ title: '上传失败，请重试', icon: 'none' })
  } finally {
    uploading.value = false
  }
}

// 保存菜品
const onSaveDish = async () => {
  // 校验
  if (!dishForm.name.trim()) {
    dishFormError.value = '菜品名称必填'
    return
  }
  dishFormError.value = ''
  saving.value = true
  try {
    const payload = {
      action: editingDishId.value ? 'update' : 'create',
      token: userStore.token,
      name: dishForm.name,
      image: dishForm.image,
      description: dishForm.description,
      type: dishForm.type,
      categoryId: dishForm.categoryId,
      isOnSale: dishForm.isOnSale,
      isRecommended: dishForm.isRecommended,
      temp: dishForm.type === 'coffee' ? dishForm.temp : ''
    }
    if (editingDishId.value) {
      payload._id = editingDishId.value
    }
    const res = await uniCloud.callFunction({
      name: 'dishes-crud',
      data: payload
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      return
    }
    uni.showToast({
      title: editingDishId.value ? '已更新' : '已添加',
      icon: 'success'
    })
    closeDishForm()
    await loadDishes()
  } catch (e) {
    console.error('[admin] onSaveDish error', e)
    uni.showToast({ title: '保存异常', icon: 'none' })
  } finally {
    saving.value = false
  }
}

// 删除菜品
const onDeleteDish = (dish) => {
  uni.showModal({
    title: '删除菜品',
    content: `确定删除「${dish.name}」吗？`,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const r = await uniCloud.callFunction({
          name: 'dishes-crud',
          data: { action: 'delete', token: userStore.token, _id: dish._id }
        })
        if (r.result.code !== 0) {
          uni.showToast({ title: r.result.message || '删除失败', icon: 'none' })
          return
        }
        uni.showToast({ title: '已删除', icon: 'success' })
        // 本地移除，触发列表过渡动画
        dishList.value = dishList.value.filter((d) => d._id !== dish._id)
      } catch (e) {
        console.error('[admin] onDeleteDish error', e)
        uni.showToast({ title: '删除异常', icon: 'none' })
      }
    }
  })
}

// 上下架切换
const onToggleSale = async (dish, value) => {
  // 乐观更新：先切换本地状态，失败则回滚
  const oldVal = dish.isOnSale
  dish.isOnSale = value
  try {
    const res = await uniCloud.callFunction({
      name: 'dishes-crud',
      data: { action: 'toggleSale', token: userStore.token, _id: dish._id, isOnSale: value }
    })
    if (res.result.code !== 0) {
      dish.isOnSale = oldVal
      uni.showToast({ title: res.result.message || '切换失败', icon: 'none' })
    }
  } catch (e) {
    dish.isOnSale = oldVal
    console.error('[admin] onToggleSale error', e)
    uni.showToast({ title: '切换失败', icon: 'none' })
  }
}

// === 分类管理 ===
const openCategoryManager = () => {
  catManagerVisible.value = true
  if (!categoryList.value.length) {
    loadCategories()
  }
}

const closeCategoryManager = () => {
  catManagerVisible.value = false
  cancelCatForm()
}

const resetCatForm = () => {
  catForm.name = ''
  catForm.type = 'coffee'
  catFormError.value = ''
  editingCatId.value = ''
}

const onAddCategory = () => {
  resetCatForm()
  catFormVisible.value = true
}

const onEditCategory = (cat) => {
  resetCatForm()
  editingCatId.value = cat._id
  catForm.name = cat.name
  catForm.type = cat.type
  catFormVisible.value = true
}

const cancelCatForm = () => {
  catFormVisible.value = false
  resetCatForm()
}

// 保存分类（新增或编辑）
const onSaveCategory = async () => {
  if (!catForm.name.trim()) {
    catFormError.value = '分类名称必填'
    return
  }
  catFormError.value = ''
  try {
    const payload = {
      action: editingCatId.value ? 'update' : 'create',
      token: userStore.token,
      name: catForm.name,
      type: catForm.type
    }
    if (editingCatId.value) {
      payload._id = editingCatId.value
    }
    const res = await uniCloud.callFunction({
      name: 'categories-crud',
      data: payload
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      return
    }
    uni.showToast({
      title: editingCatId.value ? '已更新' : '已添加',
      icon: 'success'
    })
    cancelCatForm()
    await loadCategories()
  } catch (e) {
    console.error('[admin] onSaveCategory error', e)
    uni.showToast({ title: '保存异常', icon: 'none' })
  }
}

// 删除分类
const onDeleteCategory = (cat) => {
  uni.showModal({
    title: '删除分类',
    content: `确定删除「${cat.name}」吗？该分类下的菜品将变为无分类。`,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const r = await uniCloud.callFunction({
          name: 'categories-crud',
          data: { action: 'delete', token: userStore.token, _id: cat._id }
        })
        if (r.result.code !== 0) {
          uni.showToast({ title: r.result.message || '删除失败', icon: 'none' })
          return
        }
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadCategories()
      } catch (e) {
        console.error('[admin] onDeleteCategory error', e)
        uni.showToast({ title: '删除异常', icon: 'none' })
      }
    }
  })
}

// 上移 / 下移分类
const moveCategory = async (list, idx, direction) => {
  const target = idx + direction
  if (target < 0 || target >= list.length) return
  const a = list[idx]
  const b = list[target]
  // 捕获交换前的原始 sortOrder
  const aOriginalSort = a.sortOrder ?? idx
  const bOriginalSort = b.sortOrder ?? target
  // 交换后：a 拿 b 的原排序值，b 拿 a 的原排序值
  const aNewSort = bOriginalSort
  const bNewSort = aOriginalSort

  // 乐观更新：本地立即交换两项的 sortOrder
  categoryList.value = categoryList.value.map((c) => {
    if (c._id === a._id) return { ...c, sortOrder: aNewSort }
    if (c._id === b._id) return { ...c, sortOrder: bNewSort }
    return c
  })

  // 同步到云端（发送交换后的新值）
  try {
    await uniCloud.callFunction({
      name: 'categories-crud',
      data: {
        action: 'sort',
        token: userStore.token,
        items: [
          { _id: a._id, sortOrder: aNewSort },
          { _id: b._id, sortOrder: bNewSort }
        ]
      }
    })
    // 重新拉取以保证顺序与服务端一致
    await loadCategories()
  } catch (e) {
    console.error('[admin] moveCategory error', e)
    uni.showToast({ title: '排序失败', icon: 'none' })
    await loadCategories()
  }
}
</script>

<style lang="scss" scoped>
.page-admin {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
  background-color: $color-bg;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 56rpx 40rpx 24rpx;
  background-color: $color-bg;
  @include flex-column;
  gap: 24rpx;

  .header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16rpx;
  }

  .header-title-wrap {
    @include flex-column;
    gap: 8rpx;
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-coffee-700;
  }

  .subtitle {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  /* 切换为下单人按钮 */
  .role-switch-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 10rpx 20rpx;
    border-radius: $radius-full;
    background-color: $color-card;
    border: 2rpx solid $color-coffee-200;
    color: $color-coffee-600;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    @include tap-feedback;
    flex-shrink: 0;
    box-shadow: $shadow-sm;
  }

  /* 统计卡片：今日订单 + 待制作 */
  .stats-card {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    background: linear-gradient(135deg, #FFF8F0, #FFEFD6);
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    .stat-item {
      flex: 1;
      @include flex-column;
      align-items: center;
      gap: 6rpx;

      .stat-num-wrap {
        position: relative;
        @include flex-center;
      }

      .stat-num {
        font-size: $font-size-2xl;
        font-weight: $font-weight-bold;
        color: $color-coffee-700;
        line-height: 1;
        transition: color $dur-base $ease-smooth;

        /* 待制作数 > 0 时变红，引起管理员注意 */
        &.is-pending {
          color: $color-state-error;
        }
      }

      /* 待制作红点呼吸动效 */
      .stat-pulse-dot {
        position: absolute;
        top: -4rpx;
        right: -16rpx;
        width: 14rpx;
        height: 14rpx;
        border-radius: 50%;
        background-color: $color-state-error;
        animation: pulse 1.4s $ease-smooth infinite;
      }

      .stat-label {
        font-size: $font-size-xs;
        color: $color-text-muted;
      }
    }

    .stat-divider {
      width: 1rpx;
      height: 56rpx;
      background-color: rgba(196, 149, 106, 0.3);
    }
  }
}

.tabs {
  display: flex;
  padding: 0 32rpx;
  margin-bottom: 24rpx;
  border-bottom: 1rpx solid $color-border;

  .tab {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: $font-size-base;
    color: $color-text-muted;
    position: relative;
    transition: color $dur-base $ease-smooth;

    &.active {
      color: $color-coffee-600;
      font-weight: $font-weight-semibold;

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 48rpx;
        height: 6rpx;
        border-radius: $radius-full;
        background: linear-gradient(90deg, $color-coffee-500, $color-coffee-600);
        animation: tabUnderline $dur-base $ease-bounce both;
      }
    }
  }
}

@keyframes tabUnderline {
  from { width: 0; }
  to { width: 48rpx; }
}

/* === 菜单类型切换行 === */
.menu-switch-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 32rpx 24rpx;

  .menu-switch {
    flex: 1;
    display: flex;
    background-color: $color-neutral-100;
    border-radius: $radius-full;
    padding: 6rpx;
    gap: 6rpx;
  }

  .menu-switch-btn {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    border-radius: $radius-full;
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
    transition: all $dur-base $ease-smooth;

    &.coffee.active {
      background-color: $color-coffee-600;
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(111, 78, 55, 0.25);
    }

    &.food.active {
      background-color: $color-food-600;
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(22, 163, 74, 0.25);
    }
  }

  .cat-entry {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 16rpx 24rpx;
    border-radius: $radius-full;
    background-color: $color-coffee-100;
    color: $color-coffee-700;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include tap-feedback;
  }
}

.dish-list {
  padding: 0 32rpx;
}

/* 菜品骨架屏容器 */
.dish-skeleton {
  padding: 0 32rpx;
}

/* 订单骨架屏容器 */
.order-skeleton {
  padding: 0 32rpx;
}

.dish-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;
  border-left: 8rpx solid transparent;
  transition: transform $dur-base $ease-smooth, box-shadow $dur-base $ease-smooth;

  &.coffee {
    border-left-color: $color-coffee-400;
  }

  &.food {
    border-left-color: $color-food-400;
  }

  &:active {
    transform: scale(0.99);
  }
}

.dish-image {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-lg;
  overflow: hidden;
  flex-shrink: 0;
  background-color: $color-bg-soft;

  .dish-img {
    width: 100%;
    height: 100%;
  }

  .dish-img-placeholder {
    width: 100%;
    height: 100%;
    @include flex-center;
    font-size: 56rpx;
  }

  .dish-off-badge {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    padding: 2rpx 12rpx;
    border-radius: $radius-full;
    background-color: rgba(239, 68, 68, 0.9);
    color: #fff;
    font-size: $font-size-xs;
  }

  .dish-recommend-badge {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    padding: 2rpx 12rpx;
    border-radius: $radius-full;
    background-color: rgba(245, 158, 11, 0.9);
    color: #fff;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
  }
}

.dish-info {
  flex: 1;
  min-width: 0;
  @include flex-column;
  gap: 8rpx;

  .dish-name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .dish-name {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-text;
    @include ellipsis;
    flex: 1;
    min-width: 0;
  }

  .temp-badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 2rpx;
    padding: 2rpx 12rpx;
    border-radius: $radius-full;
    line-height: 1.6;

    .temp-badge-icon {
      font-size: 18rpx;
      line-height: 1;
    }

    .temp-badge-text {
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }

    &.ice {
      background-color: #EFF6FF;
      .temp-badge-icon, .temp-badge-text { color: #2563EB; }
    }

    &.hot {
      background-color: #FEF2F2;
      .temp-badge-icon, .temp-badge-text { color: #DC2626; }
    }
  }

  .dish-desc {
    font-size: $font-size-sm;
    color: $color-text-muted;
    @include ellipsis(2);
    line-height: $line-height-normal;
  }

  .dish-cat {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: $font-size-xs;
    color: $color-coffee-500;

    .dish-cat-dot {
      font-size: 10rpx;
    }
  }
}

.dish-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  flex-shrink: 0;

  .icon-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    @include flex-center;
    color: $color-neutral-500;
    background-color: $color-neutral-100;
    @include tap-feedback(0.9);

    &.danger {
      color: $color-state-error;
    }
  }
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(160rpx + env(safe-area-inset-bottom));
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $color-coffee-500, $color-coffee-600);
  @include flex-center;
  box-shadow: 0 8rpx 24rpx rgba(111, 78, 55, 0.35);
  @include tap-feedback(0.92);
  z-index: 50;
  transition: transform $dur-base $ease-bounce;

  &::before {
    content: '';
    position: absolute;
    inset: -4rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $color-coffee-400, $color-coffee-600);
    opacity: 0.3;
    z-index: -1;
    filter: blur(8rpx);
  }
}

/* === 菜品表单 === */
.dish-form {
  padding-bottom: 40rpx;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  margin-top: 8rpx;

  .label-text {
    font-size: $font-size-sm;
    color: $color-text-strong;
    font-weight: $font-weight-medium;
  }

  .label-required {
    margin-left: 4rpx;
    color: $color-state-error;
    font-size: $font-size-sm;
  }

  .label-hint {
    margin-left: 12rpx;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}

.image-uploader {
  width: 100%;
  height: 280rpx;
  border-radius: $radius-lg;
  background-color: $color-bg-soft;
  border: 2rpx dashed $color-border;
  @include flex-center;
  overflow: hidden;
  margin-bottom: 24rpx;
  @include tap-feedback(0.98);

  .upload-placeholder {
    @include flex-column;
    align-items: center;
    gap: 12rpx;

    .upload-text {
      font-size: $font-size-sm;
      color: $color-text-muted;
    }
  }

  .upload-progress {
    @include flex-column;
    align-items: center;
    gap: 16rpx;

    .progress-ring {
      width: 56rpx;
      height: 56rpx;
      border: 6rpx solid $color-coffee-100;
      border-top-color: $color-coffee-600;
      border-radius: 50%;
      animation: spin 800ms linear infinite;
    }

    .progress-text {
      font-size: $font-size-sm;
      color: $color-coffee-600;
    }
  }

  .image-preview {
    position: relative;
    width: 100%;
    height: 100%;

    .preview-img {
      width: 100%;
      height: 100%;
    }

    .preview-mask {
      position: absolute;
      inset: 0;
      background-color: rgba(44, 27, 20, 0.45);
      @include flex-center;
      color: #fff;
      font-size: $font-size-sm;
      opacity: 0;
      transition: opacity $dur-base $ease-smooth;
    }
  }

  &:active .preview-mask {
    opacity: 1;
  }
}

.type-chips {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .type-chip {
    flex: 1;
    padding: 20rpx 0;
    border-radius: $radius-md;
    background-color: $color-bg-soft;
    border: 2rpx solid transparent;
    text-align: center;
    font-size: $font-size-base;
    color: $color-text-muted;
    @include tap-feedback;
    transition: all $dur-base $ease-smooth;

    &.coffee.active {
      background-color: $color-coffee-100;
      border-color: $color-coffee-500;
      color: $color-coffee-700;
      font-weight: $font-weight-semibold;
    }

    &.food.active {
      background-color: $color-food-100;
      border-color: $color-food-500;
      color: $color-food-700;
      font-weight: $font-weight-semibold;
    }

    &.ice.active {
      background-color: #EFF6FF;
      border-color: #3B82F6;
      color: #1D4ED8;
      font-weight: $font-weight-semibold;
    }

    &.hot.active {
      background-color: #FEF2F2;
      border-color: #EF4444;
      color: #B91C1C;
      font-weight: $font-weight-semibold;
    }
  }
}

.cat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;

  .cat-chip {
    padding: 12rpx 24rpx;
    border-radius: $radius-full;
    background-color: $color-bg-soft;
    color: $color-text-muted;
    font-size: $font-size-sm;
    @include tap-feedback;
    transition: all $dur-base $ease-smooth;

    &.active {
      background-color: $color-coffee-600;
      color: #fff;
    }
  }
}

.cat-empty-hint {
  margin-bottom: 24rpx;
  font-size: $font-size-sm;
  color: $color-text-muted;

  .cat-empty-link {
    color: $color-coffee-500;
    font-weight: $font-weight-medium;
  }
}

.sale-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: $color-bg-soft;
  border-radius: $radius-md;
  margin-bottom: 32rpx;

  .sale-label {
    @include flex-column;
    gap: 4rpx;

    .sale-title {
      font-size: $font-size-base;
      color: $color-text;
      font-weight: $font-weight-medium;
    }

    .sale-hint {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }
}

.form-actions {
  display: flex;
  gap: 16rpx;

  .form-btn {
    flex: 1;
    padding: 24rpx 0;
    border-radius: $radius-md;
    text-align: center;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    @include tap-feedback;

    &.cancel {
      background-color: $color-neutral-100;
      color: $color-text-muted;
    }

    &.save {
      background: linear-gradient(135deg, $color-coffee-500, $color-coffee-600);
      color: #fff;

      &.loading {
        opacity: 0.7;
      }
    }
  }
}

/* === 分类管理 === */
.cat-manager {
  padding-bottom: 40rpx;
}

.cat-form {
  padding: 24rpx;
  background-color: $color-bg-soft;
  border-radius: $radius-lg;
  margin-bottom: 24rpx;
  animation: slideDown $dur-base $ease-smooth both;

  .cat-form-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;

    .cat-btn {
      flex: 1;
      padding: 20rpx 0;
      border-radius: $radius-md;
      text-align: center;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      @include tap-feedback;

      &.cancel {
        background-color: $color-card;
        color: $color-text-muted;
      }

      &.save {
        background-color: $color-coffee-600;
        color: #fff;
      }
    }
  }
}

.cat-group {
  margin-bottom: 24rpx;

  .cat-group-title {
    font-size: $font-size-sm;
    color: $color-coffee-600;
    font-weight: $font-weight-semibold;
    margin-bottom: 12rpx;
    padding-left: 8rpx;
  }
}

.cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background-color: $color-card;
  border-radius: $radius-md;
  margin-bottom: 12rpx;
  box-shadow: $shadow-sm;
  animation: fadeIn $dur-base $ease-smooth both;

  .cat-item-name {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: $font-size-base;
    color: $color-text;
    font-weight: $font-weight-medium;

    .cat-system-tag {
      padding: 2rpx 12rpx;
      border-radius: $radius-full;
      background-color: $color-coffee-100;
      color: $color-coffee-700;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }
  }

  .cat-item-actions {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .cat-icon-btn {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      @include flex-center;
      color: $color-neutral-500;
      @include tap-feedback(0.9);

      &.danger {
        color: $color-state-error;
      }

      &.disabled {
        opacity: 0.3;
        pointer-events: none;
      }
    }
  }
}

.cat-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx 0;
  border: 2rpx dashed $color-coffee-300;
  border-radius: $radius-md;
  color: $color-coffee-600;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  @include tap-feedback;
}

/* === 列表过渡动画 === */
.dish-enter-active,
.dish-leave-active {
  transition: all $dur-base $ease-smooth;
}

.dish-enter-from {
  opacity: 0;
  transform: translateY(30rpx) scale(0.96);
}

.dish-leave-to {
  opacity: 0;
  transform: translateX(-60rpx) scale(0.9);
}

.dish-move {
  transition: transform $dur-base $ease-smooth;
}

/* === 订单管理 === */
.orders-pane {
  @include flex-column;
}

/* 状态筛选 pill 行 */
.order-filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 12rpx;
  padding: 0 32rpx 24rpx;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  .order-pill {
    flex-shrink: 0;
    padding: 12rpx 24rpx;
    border-radius: $radius-full;
    background-color: $color-card;
    color: $color-text-muted;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include tap-feedback;
    transition: all $dur-base $ease-smooth;
    box-shadow: $shadow-sm;

    &.active {
      background: linear-gradient(135deg, $color-coffee-500, $color-coffee-600);
      color: #fff;
      transform: scale(1.04);
      box-shadow: 0 4rpx 12rpx rgba(111, 78, 55, 0.25);
    }
  }
}

/* 订单列表 */
.order-list {
  @include flex-column;
  gap: 20rpx;
  padding: 0 32rpx;
}

/* 加载占位（与首页风格一致的三点动画） */
.loading-state {
  @include flex-center;
  gap: 8rpx;
  padding: 80rpx 0;

  .loading-dot {
    font-size: $font-size-2xl;
    color: $color-coffee-400;
    animation: dotBlink 1.2s $ease-smooth infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>
