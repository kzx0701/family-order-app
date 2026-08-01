<template>
  <view class="page-admin page-enter">
    <!-- 头部（fixed 固定，滚动时常驻顶部） -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 28 + 'px' }">
      <view class="header-top">
        <view class="header-title-wrap">
          <text class="title">管理中心</text>
          <text class="subtitle">管理家庭菜单与订单</text>
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
        @tap="onOrdersTabTap"
      >
        订单管理
      </view>
    </view>

    <!-- 菜单管理 -->
    <!-- 面板滚动区：下拉刷新只作用于当前面板，页面本身锁定不滚动 -->
    <scroll-view
      class="pane-scroll"
      :scroll-y="!dragState.active"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onPaneRefresh"
    >
      <view v-if="activeTab === 'menu'" class="menu-pane" @tap="closeDishSwipe">
      <!-- 菜单类型切换 -->
      <view class="menu-switch-row">
        <view class="menu-switch">
          <view class="menu-switch-btn coffee" :class="{ active: menuType === 'coffee' }" @tap="onMenuTypeChange('coffee')">
            <text>☕ 咖啡菜单</text>
          </view>
          <view class="menu-switch-btn food" :class="{ active: menuType === 'food' }" @tap="onMenuTypeChange('food')">
            <text>🍲 美食菜单</text>
          </view>
        </view>
      </view>

      <!-- 分类入口 + 分类筛选（第二行） -->
      <view class="cat-row">
        <view class="cat-entry" @tap="openCategoryManager">
          <Icon name="settings" :size="16" />
          <text>分类</text>
        </view>
        <view class="cat-filter-scroll">
          <view
            class="cat-filter-pill"
            :class="{ active: filterCategoryId === '' }"
            @tap="filterCategoryId = ''"
          >
            全部
          </view>
          <view
            v-for="cat in currentCategories"
            :key="cat._id"
            class="cat-filter-pill"
            :class="{ active: filterCategoryId === cat._id }"
            @tap="filterCategoryId = cat._id"
          >
            {{ cat.name }}
          </view>
        </view>
      </view>

      <!-- 加载中：骨架屏占位 -->
      <view v-if="loadingDishes && filteredDishes.length === 0" class="dish-skeleton">
        <skeleton type="dish" :count="4" />
      </view>

      <template v-else>
        <!-- 菜品列表（带过渡动效，左滑删除，长按拖拽排序） -->
        <view class="dish-list" v-if="filteredDishes.length">
        <transition-group name="dish">
          <view
            class="dish-swipe-item"
            v-for="(dish, index) in filteredDishes"
            :key="dish._id"
            :class="{
              'is-dragging': dragState.active && dragState.index === index,
              'is-shifting': dragState.active && dragState.index !== index
            }"
            :style="getDragItemStyle(index)"
          >
            <!-- 滑动露出的删除按钮（排序模式下隐藏） -->
            <view v-if="!sortMode" class="dish-swipe-actions" @tap.stop>
              <view class="dish-swipe-btn delete" @tap.stop="onDishSwipeDelete(dish)">删除</view>
            </view>

            <!-- 普通态卡片：左滑删除 / 点击编辑 / 长按进入排序模式 -->
            <view
              v-if="!sortMode"
              class="dish-card"
              :class="[dish.type, { 'swipe-animating': dishSwipeAnimating[dish._id] }]"
              :style="{ transform: `translateX(${dishSwipeOffset[dish._id] || 0}px)` }"
              @touchstart="onDishTouchStart($event, dish._id)"
              @touchmove="onDishTouchMove($event, dish._id)"
              @touchend="onDishTouchEnd($event, dish._id)"
              @longpress="enterSortMode"
              @tap="onDishCardTap(dish)"
            >
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
              <view class="dish-sale-toggle" @tap.stop>
                <fo-switch :modelValue="dish.isOnSale" @change="onToggleSale(dish, $event)" />
              </view>
            </view>

            <!-- 排序态卡片：catch 触摸事件（页面不会随手势滚动），按下即拖 -->
            <view
              v-else
              class="dish-card sorting"
              :class="[dish.type, { 'is-held': dragState.active && dragState.index === index }]"
              @touchstart.stop="onSortTouchStart($event, dish, index)"
              @touchmove.stop="onSortTouchMove"
              @touchend.stop="onSortTouchEnd"
              @tap.stop="noop"
            >
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
              <!-- 排序抓手 -->
              <view class="drag-grip">
                <text class="drag-grip-icon">⠿</text>
              </view>
            </view>
          </view>
        </transition-group>
      </view>

        <!-- 空状态 -->
        <fo-empty v-else :text="menuType === 'coffee' ? '还没有咖啡菜品，点击右下角添加吧' : '还没有美食菜品，点击右下角添加吧'" :icon="menuType === 'coffee' ? '☕' : '🍲'" />
      </template>

    </view>


    <!-- 订单管理 -->
    <view v-else class="orders-pane" @tap="closeOrderSwipe">
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

      <!-- 订单列表（左滑取消/删除） -->
      <view v-else-if="filteredOrders.length" class="order-list">
        <view
          v-for="(order, idx) in filteredOrders"
          :key="order._id"
          class="order-swipe-item animate-item-enter"
          :style="{ animationDelay: `${idx * 60}ms` }"
        >
          <!-- 滑动露出的操作区 -->
          <view class="order-swipe-actions" @tap.stop>
            <view
              v-if="order.status === 'pending'"
              class="order-swipe-btn cancel"
              @tap.stop="onOrderSwipeCancel(order)"
            >取消</view>
            <view
              class="order-swipe-btn delete"
              @tap.stop="onOrderSwipeDelete(order)"
            >删除</view>
          </view>
          <!-- 订单卡片主体：可滑动 -->
          <view
            class="order-swipe-card"
            :class="{ 'is-flashing': orderFlashMap[order._id], 'swipe-animating': orderSwipeAnimating[order._id] }"
            :style="{ transform: `translateX(${orderSwipeOffset[order._id] || 0}px)` }"
            @touchstart="onOrderTouchStart($event, order._id)"
            @touchmove="onOrderTouchMove($event, order._id)"
            @touchend="onOrderTouchEnd($event, order._id)"
            @tap="onOrderCardTap(order)"
          >
            <!-- 左侧：emoji 图标 -->
            <view class="order-card-icon">{{ order.summaryEmoji || '🍽️' }}</view>
            <!-- 中部：摘要 + 时间/下单人 -->
            <view class="order-card-body">
              <text class="order-card-summary">{{ order.summary || '订单详情' }}</text>
              <view class="order-card-meta">
                <text class="meta-time">{{ formatOrderTime(order.createTime) }}</text>
                <text v-if="order.userName" class="meta-user">· {{ order.userName }}</text>
              </view>
            </view>
            <!-- 右侧：状态徽章 -->
            <view class="order-card-right">
              <status-badge :status="order.status" />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态（按筛选显示不同文案） -->
      <fo-empty v-else :text="orderEmptyText" icon="📋" />
      </view>

      <!-- 面板底部留白：避免列表被底部 tabbar 遮挡 -->
      <view class="pane-bottom-spacer" />
    </scroll-view>

    <!-- 排序模式操作栏：fixed 元素必须放在 scroll-view 外，否则会随列表滚动 -->
    <view v-if="sortMode && activeTab === 'menu'" class="sort-mode-bar">
      <text class="sort-mode-tip">拖动菜品调整顺序</text>
      <view class="sort-mode-done" @tap="exitSortMode">完成</view>
    </view>

    <!-- 新增菜品 FAB：fixed 元素必须放在 scroll-view 外，否则会随列表滚动 -->
    <view v-if="!sortMode && activeTab === 'menu'" class="fab" @tap="onAddDish">
      <Icon name="plus" :size="28" color="#fff" />
    </view>

    <custom-tabbar />

    <!-- 菜品表单 sheet（内容滚动，取消/保存按钮固定底部） -->
    <fo-sheet :visible="dishFormVisible" :title="editingDishId ? '编辑菜品' : '新增菜品'" max-height="76vh" @close="closeDishForm">
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
      </view>

      <!-- 操作按钮：固定在 sheet 底部，不随表单内容滚动 -->
      <template #footer>
        <view class="form-actions">
          <view class="form-btn cancel" @tap="closeDishForm">取消</view>
          <view class="form-btn save" :class="{ loading: saving }" @tap="onSaveDish">
            {{ saving ? '保存中...' : '保存' }}
          </view>
        </view>
      </template>
    </fo-sheet>

    <!-- 分类管理 sheet（只显示当前菜单类型的分类） -->
    <fo-sheet :visible="catManagerVisible" :title="catManagerTitle" max-height="85vh" @close="closeCategoryManager">
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
          <view class="cat-form-actions">
            <view class="cat-btn cancel" @tap="cancelCatForm">取消</view>
            <view class="cat-btn save" @tap="onSaveCategory">{{ editingCatId ? '保存' : '添加' }}</view>
          </view>
        </view>

        <!-- 当前菜单类型的分类列表 -->
        <view class="cat-group" v-if="currentCategories.length">
          <view class="cat-item" v-for="(cat, idx) in currentCategories" :key="cat._id">
            <view class="cat-item-name">
              <text>{{ cat.name }}</text>
              <text class="cat-system-tag" v-if="cat.name === '推荐'">内置</text>
            </view>
            <view class="cat-item-actions">
              <view class="cat-icon-btn" :class="{ disabled: idx === 0 }" @tap="moveCategory(currentCategories, idx, -1)">
                <Icon name="chevron-up" :size="16" />
              </view>
              <view class="cat-icon-btn" :class="{ disabled: idx === currentCategories.length - 1 }" @tap="moveCategory(currentCategories, idx, 1)">
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
        <fo-empty v-if="!currentCategories.length && !catFormVisible" text="还没有分类，先添加一个吧" icon="📂" />

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
import { ref, computed, onMounted, reactive, getCurrentInstance } from 'vue'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useHeaderFixed } from '@/composables/useHeaderFixed.js'
import { WX_CONFIG } from '@/utils/wx-config.js'

const { statusBarHeight } = useSafeArea()
const { headerHeight } = useHeaderFixed('.header')

// 组件实例（拖拽排序测量列表项位置用，必须 setup 顶层调用）
const instance = getCurrentInstance()

const userStore = useUserStore()

// === 顶部 tab ===
const activeTab = ref('menu')

// === 菜单管理状态 ===
const menuType = ref('coffee') // coffee | food，默认显示咖啡菜单
const dishList = ref([])
const categoryList = ref([])
const loadingDishes = ref(false)

// 分类筛选：空字符串表示"全部"
const filterCategoryId = ref('')

// 按当前菜单类型筛选分类
const currentCategories = computed(() =>
  categoryList.value.filter((c) => c.type === menuType.value)
)

// 分类管理标题（根据当前菜单类型）
const catManagerTitle = computed(() =>
  menuType.value === 'coffee' ? '☕ 咖啡分类管理' : '🍲 美食分类管理'
)

// 按当前菜单类型 + 分类筛选菜品
const filteredDishes = computed(() => {
  let list = dishList.value.filter((d) => d.type === menuType.value)
  if (filterCategoryId.value) {
    list = list.filter((d) => d.categoryId === filterCategoryId.value)
  }
  return list
})

// 切换菜单类型：重置分类筛选并收起菜品滑动
const onMenuTypeChange = (type) => {
  if (menuType.value === type) return
  menuType.value = type
  filterCategoryId.value = ''
  closeDishSwipe()
}

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

// === 菜品左滑删除 ===
// 右侧删除按钮宽度 160rpx，按屏幕宽度换算成 px
const DISH_SWIPE_WIDTH = Math.round((160 / 750) * uni.getSystemInfoSync().windowWidth)
const dishSwipeOffset = reactive({})      // 各卡片当前 x 偏移
const dishSwipeAnimating = reactive({})   // 各卡片是否处于动画态（吸附/回弹时启用 transition）
const dishTouchStartX = reactive({})       // 触摸起点
const dishTouchStartOffset = reactive({})  // 触摸时已有偏移
const dishTouchMoved = reactive({})        // 是否发生水平移动（用于区分点击）
const dishActiveSwipeId = ref('')           // 当前展开的卡片 _id

const onDishTouchStart = (e, id) => {
  const touch = e.touches[0]
  dishTouchStartX[id] = touch.clientX
  dishTouchStartOffset[id] = dishSwipeOffset[id] || 0
  dishTouchMoved[id] = false
  dishSwipeAnimating[id] = false
  // 点击新卡片时，收起其他展开的卡片
  if (dishActiveSwipeId.value && dishActiveSwipeId.value !== id) {
    dishSwipeAnimating[dishActiveSwipeId.value] = true
    dishSwipeOffset[dishActiveSwipeId.value] = 0
    dishActiveSwipeId.value = ''
  }
}

const onDishTouchMove = (e, id) => {
  const touch = e.touches[0]
  // 拖拽排序中：被拖拽卡片走纵向跟手逻辑，其余卡片手势忽略
  if (dragState.active) {
    if (dragState.id === id) onDragMove(touch.clientY)
    return
  }
  const dx = touch.clientX - dishTouchStartX[id]
  if (Math.abs(dx) > 5) dishTouchMoved[id] = true
  let next = dishTouchStartOffset[id] + dx
  // 限制范围：[-DISH_SWIPE_WIDTH, 0]，向右不超过 0
  if (next > 0) next = 0
  if (next < -DISH_SWIPE_WIDTH) next = -DISH_SWIPE_WIDTH
  dishSwipeOffset[id] = next
}

const onDishTouchEnd = (e, id) => {
  // 拖拽排序中：松手吸附归位并提交排序
  if (dragState.active) {
    if (dragState.id === id) finalizeDrag()
    return
  }
  const offset = dishSwipeOffset[id] || 0
  dishSwipeAnimating[id] = true
  if (offset < -DISH_SWIPE_WIDTH / 2) {
    dishSwipeOffset[id] = -DISH_SWIPE_WIDTH
    dishActiveSwipeId.value = id
  } else {
    dishSwipeOffset[id] = 0
    if (dishActiveSwipeId.value === id) dishActiveSwipeId.value = ''
  }
  // 动画结束后关闭 transition 标志，避免拖拽时不跟手
  setTimeout(() => { dishSwipeAnimating[id] = false }, 300)
  // touchMoved 延迟清零，确保 tap 事件能正确判断是否发生过滑动
  setTimeout(() => { dishTouchMoved[id] = false }, 0)
}

// 点击菜品卡片：进入编辑，但滑动后点击先收起不跳转
const onDishCardTap = (dish) => {
  // 长按进入排序模式后松手会伴随一次 tap，吞掉避免误进入编辑
  if (suppressNextTap) return
  // 若发生过滑动，不触发点击
  if (dishTouchMoved[dish._id]) return
  // 若当前卡片展开，先收起不跳转
  if ((dishSwipeOffset[dish._id] || 0) < 0) {
    dishSwipeAnimating[dish._id] = true
    dishSwipeOffset[dish._id] = 0
    dishActiveSwipeId.value = ''
    setTimeout(() => { dishSwipeAnimating[dish._id] = false }, 300)
    return
  }
  onEditDish(dish)
}

/* ============================================================
 * 拖拽排序（iOS 提醒事项式「排序模式」）
 *
 * 为什么不采用"长按即拖"：iOS 手势的滚动行为在 touchstart 时即确定，
 * 长按后再激活拖拽无法阻止手势驱动页面滚动（整个页面跟手移动）。
 * 小程序的 catchtouchmove 无法按状态动态切换，因此拆成两种卡片：
 *   普通态：bind 触摸（页面可滚动），长按进入排序模式
 *   排序态：catch 触摸（手势不再触发页面滚动），按下即拖
 * 模式切换发生在两次手势之间，规避了 catch 无法动态切换的限制。
 * ============================================================ */
const sortMode = ref(false)
// 长按进入排序模式后，松手伴随的 tap 抑制标记
let suppressNextTap = false

/**
 * 长按：进入排序模式（仅「全部」视图；收起左滑删除 + 触感反馈 + 提示）
 */
const enterSortMode = () => {
  if (sortMode.value) return
  if (filterCategoryId.value) {
    uni.showToast({ title: '切换到「全部」再排序', icon: 'none' })
    return
  }
  closeDishSwipe()
  sortMode.value = true
  suppressNextTap = true
  setTimeout(() => { suppressNextTap = false }, 400)
  uni.vibrateShort({ type: 'medium', fail: () => {} })
  uni.showToast({ title: '排序模式：直接拖动菜品', icon: 'none' })
}

/**
 * 退出排序模式（点「完成」）：清理拖拽残留状态
 */
const exitSortMode = () => {
  sortMode.value = false
  dragState.active = false
  dragState.id = ''
  dragState.index = -1
  dragState.overIndex = -1
  dragState.deltaY = 0
  dragState.releasing = false
}

// 排序态卡片占位 tap（catchtap 拦截，防止冒泡触发其他点击）
const noop = () => {}

/**
 * 排序态按下：立即开始拖拽（测量步进 + 冻结页面滚动位置）
 */
const onSortTouchStart = (e, dish, index) => {
  if (dragState.active) return
  const touch = e.touches[0]
  const startY = touch.clientY
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.selectAll('.dish-swipe-item').boundingClientRect()
  query.exec((res) => {
    const rects = res[0] || []
    if (!rects[index] || rects.length < 2) return
    // 步进 = 相邻两项 top 差值（天然包含卡片间距）
    const stride = rects[1].top - rects[0].top
    if (stride <= 0) return
    dragState.stride = stride
    dragState.active = true
    dragState.id = dish._id
    dragState.index = index
    dragState.overIndex = index
    dragState.startY = startY
    dragState.deltaY = 0
    dragState.releasing = false
    uni.vibrateShort({ type: 'light', fail: () => {} })
  })
}

/**
 * 排序态移动：被拖卡片跟手 + 其他卡片过渡让位
 */
const onSortTouchMove = (e) => {
  if (!dragState.active) return
  onDragMove(e.touches[0].clientY)
}

/**
 * 排序态松手：吸附归位并提交排序
 */
const onSortTouchEnd = () => {
  if (dragState.active) finalizeDrag()
}

/* === 拖拽状态（FLIP 思路，全程 transform，丝滑不掉帧） === */
const dragState = reactive({
  active: false,      // 是否处于拖拽中（此时面板 scroll-view 的 scroll-y 被锁定）
  id: '',             // 被拖拽菜品 _id
  index: -1,          // 起始下标（当前 filteredDishes 中）
  overIndex: -1,      // 目标下标（手指当前对应槽位）
  startY: 0,          // 触摸起点 clientY
  deltaY: 0,          // 当前纵向位移
  stride: 0,          // 单项步进高度（卡片高 + 卡片间距）
  releasing: false    // 松手吸附阶段（被拖卡片启用过渡）
})

/**
 * 拖拽移动：被拖卡片跟手，计算目标槽位（其他卡片凭此过渡让位）
 */
const onDragMove = (clientY) => {
  dragState.deltaY = clientY - dragState.startY
  const len = filteredDishes.value.length
  const next = Math.min(
    Math.max(dragState.index + Math.round(dragState.deltaY / dragState.stride), 0),
    len - 1
  )
  if (next !== dragState.overIndex) {
    dragState.overIndex = next
    // 每跨过一个槽位给一次轻触感
    uni.vibrateShort({ type: 'light', fail: () => {} })
  }
}

/**
 * 各项拖拽样式：
 * - 被拖项：translateY 跟手 + 轻微放大浮起（吸附阶段开过渡）
 * - 其他项：处于 [起始, 目标] 区间的项向反方向平移一个步进让位（带过渡）
 */
const getDragItemStyle = (index) => {
  if (!dragState.active) return {}
  const { index: from, overIndex: to, stride } = dragState
  if (index === from) {
    return {
      transform: `translateY(${dragState.deltaY}px) scale(1.03)`,
      zIndex: 60,
      transition: dragState.releasing ? 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
    }
  }
  let shift = 0
  if (from < to && index > from && index <= to) shift = -stride
  else if (from > to && index >= to && index < from) shift = stride
  return {
    transform: `translateY(${shift}px)`,
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

/**
 * 松手：被拖卡片吸附到目标槽位（0.2s 过渡），到位后提交重排
 */
const finalizeDrag = () => {
  dragState.releasing = true
  dragState.deltaY = (dragState.overIndex - dragState.index) * dragState.stride
  const { index, overIndex } = dragState
  setTimeout(() => {
    if (overIndex !== index) applyReorder(index, overIndex)
    dragState.active = false
    dragState.id = ''
    dragState.index = -1
    dragState.overIndex = -1
    dragState.deltaY = 0
    dragState.releasing = false
  }, 200)
}

/**
 * 本地重排当前菜单类型的菜品，并持久化到云端
 * sortOrder 重写为连续序号（1..n），与 listDishes 的 asc 排序对齐
 */
const applyReorder = (from, to) => {
  const typeList = dishList.value.filter((d) => d.type === menuType.value)
  const [moved] = typeList.splice(from, 1)
  typeList.splice(to, 0, moved)
  const items = typeList.map((d, i) => ({ _id: d._id, sortOrder: i + 1 }))
  const sortMap = {}
  items.forEach((it) => { sortMap[it._id] = it.sortOrder })
  // 乐观更新：当前类型用新顺序，其他类型保持原样
  const others = dishList.value.filter((d) => d.type !== menuType.value)
  dishList.value = [
    ...typeList.map((d) => ({ ...d, sortOrder: sortMap[d._id] })),
    ...others
  ]

  // 云端持久化（失败则重新拉取回滚）
  uniCloud.callFunction({
    name: 'app-service',
    data: { module: 'dishes-crud', action: 'sort', token: userStore.token, items }
  }).then((res) => {
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.message || '排序保存失败', icon: 'none' })
      loadDishes()
    }
  }).catch((e) => {
    console.error('[admin] persist reorder error', e)
    uni.showToast({ title: '排序保存失败，已恢复', icon: 'none' })
    loadDishes()
  })
}

// 点击空白区域：收起当前展开的菜品卡片
const closeDishSwipe = () => {
  if (dishActiveSwipeId.value) {
    dishSwipeAnimating[dishActiveSwipeId.value] = true
    dishSwipeOffset[dishActiveSwipeId.value] = 0
    const id = dishActiveSwipeId.value
    dishActiveSwipeId.value = ''
    setTimeout(() => { dishSwipeAnimating[id] = false }, 300)
  }
}

// 滑动删除：调用原有 onDeleteDish 逻辑
const onDishSwipeDelete = (dish) => {
  onDeleteDish(dish)
}

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

// === 订单左滑取消/删除 ===
// 右侧操作区：取消 160rpx + 删除 160rpx，按屏幕宽度换算成 px
const ORDER_SWIPE_WIDTH_FULL = Math.round((320 / 750) * uni.getSystemInfoSync().windowWidth)
const ORDER_SWIPE_WIDTH_DELETE_ONLY = Math.round((160 / 750) * uni.getSystemInfoSync().windowWidth)
const orderSwipeOffset = reactive({})      // 各卡片当前 x 偏移
const orderSwipeAnimating = reactive({})    // 各卡片是否处于动画态
const orderTouchStartX = reactive({})       // 触摸起点
const orderTouchStartOffset = reactive({})  // 触摸时已有偏移
const orderTouchMoved = reactive({})        // 是否发生水平移动
const orderActiveSwipeId = ref('')          // 当前展开的卡片 _id
const orderFlashMap = reactive({})          // 状态变化时的闪光动效

const triggerOrderFlash = (id) => {
  orderFlashMap[id] = true
  setTimeout(() => { orderFlashMap[id] = false }, 600)
}

// 根据订单状态决定可滑出的最大宽度（pending 有取消+删除，其他只有删除）
const getOrderSwipeWidth = (order) => {
  if (order.status === 'pending') return ORDER_SWIPE_WIDTH_FULL
  return ORDER_SWIPE_WIDTH_DELETE_ONLY
}

const onOrderTouchStart = (e, id) => {
  const touch = e.touches[0]
  orderTouchStartX[id] = touch.clientX
  orderTouchStartOffset[id] = orderSwipeOffset[id] || 0
  orderTouchMoved[id] = false
  orderSwipeAnimating[id] = false
  // 点击新卡片时，收起其他展开的卡片
  if (orderActiveSwipeId.value && orderActiveSwipeId.value !== id) {
    orderSwipeAnimating[orderActiveSwipeId.value] = true
    orderSwipeOffset[orderActiveSwipeId.value] = 0
    orderActiveSwipeId.value = ''
  }
}

const onOrderTouchMove = (e, id) => {
  const touch = e.touches[0]
  const dx = touch.clientX - orderTouchStartX[id]
  if (Math.abs(dx) > 5) orderTouchMoved[id] = true
  let next = orderTouchStartOffset[id] + dx
  // 限制范围：[-ORDER_SWIPE_WIDTH_FULL, 0]，向右不超过 0
  if (next > 0) next = 0
  if (next < -ORDER_SWIPE_WIDTH_FULL) next = -ORDER_SWIPE_WIDTH_FULL
  orderSwipeOffset[id] = next
}

const onOrderTouchEnd = (e, id) => {
  // 读取绑定的 order 状态来决定吸附宽度
  const order = filteredOrders.value.find((o) => o._id === id)
  const maxW = order ? getOrderSwipeWidth(order) : ORDER_SWIPE_WIDTH_FULL
  const offset = orderSwipeOffset[id] || 0
  orderSwipeAnimating[id] = true
  if (offset < -maxW / 2) {
    orderSwipeOffset[id] = -maxW
    orderActiveSwipeId.value = id
  } else {
    orderSwipeOffset[id] = 0
    if (orderActiveSwipeId.value === id) orderActiveSwipeId.value = ''
  }
  // 动画结束后关闭 transition 标志，避免拖拽时不跟手
  setTimeout(() => { orderSwipeAnimating[id] = false }, 300)
  // touchMoved 延迟清零，确保 tap 事件能正确判断是否发生过滑动
  setTimeout(() => { orderTouchMoved[id] = false }, 0)
}

// 点击订单卡片：跳转详情页，但滑动后点击先收起不跳转
const onOrderCardTap = (order) => {
  // 若发生过滑动，不触发点击
  if (orderTouchMoved[order._id]) return
  // 若当前卡片展开，先收起不跳转
  if ((orderSwipeOffset[order._id] || 0) < 0) {
    orderSwipeAnimating[order._id] = true
    orderSwipeOffset[order._id] = 0
    orderActiveSwipeId.value = ''
    setTimeout(() => { orderSwipeAnimating[order._id] = false }, 300)
    return
  }
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${order._id}`
  })
}

// 点击空白区域：收起当前展开的订单卡片
const closeOrderSwipe = () => {
  if (orderActiveSwipeId.value) {
    orderSwipeAnimating[orderActiveSwipeId.value] = true
    orderSwipeOffset[orderActiveSwipeId.value] = 0
    const id = orderActiveSwipeId.value
    orderActiveSwipeId.value = ''
    setTimeout(() => { orderSwipeAnimating[id] = false }, 300)
  }
}

// 滑动取消：收起后调用 onOrderCancel
const onOrderSwipeCancel = (order) => {
  orderSwipeAnimating[order._id] = true
  orderSwipeOffset[order._id] = 0
  orderActiveSwipeId.value = ''
  setTimeout(() => { orderSwipeAnimating[order._id] = false }, 300)
  onOrderCancel(order)
}

// 滑动删除：调用 onOrderDelete
const onOrderSwipeDelete = (order) => {
  onOrderDelete(order)
}

// 订单时间格式化：HH:mm
const formatOrderTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// === 订阅消息：首次进入订单管理时引导订阅 ===
const onOrdersTabTap = () => {
  activeTab.value = 'orders'
  const asked = uni.getStorageSync('fo_admin_notify_asked')
  if (!asked) {
    onSubscribeOrderNotify()
  }
}

const onSubscribeOrderNotify = () => {
  // #ifdef MP-WEIXIN
  uni.requestSubscribeMessage({
    tmplIds: [WX_CONFIG.subscribeTemplates.orderNotify],
    success: () => {
      uni.setStorageSync('fo_admin_notify_asked', '1')
    },
    fail: () => {
      // 用户拒绝或失败不标记，下次进入仍可提示
    }
  })
  // #endif
}

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

// 面板下拉刷新（scroll-view refresher）：按当前 tab 刷新对应数据
const refreshing = ref(false)
const onPaneRefresh = async () => {
  refreshing.value = true
  try {
    if (activeTab.value === 'menu') {
      await Promise.all([loadDishes(), loadCategories()])
    } else {
      await loadOrders()
    }
  } finally {
    refreshing.value = false
  }
}

// === 数据加载 ===
const loadDishes = async () => {
  loadingDishes.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: { module: 'dishes-crud', action: 'list', token: userStore.token }
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
      name: 'app-service',
      data: { module: 'categories-crud', action: 'list', token: userStore.token }
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
      name: 'app-service',
      data: { module: 'orders-crud', action: 'list', token: userStore.token, pageSize: 100 }
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

// === 订单状态操作（乐观更新 + 失败回滚 + 闪光动效） ===

// 取消订单：调 orders-crud cancel（仅 pending 可取消）
const onOrderCancel = async (order) => {
  const oldStatus = order.status
  // 乐观更新
  order.status = 'cancelled'
  triggerOrderFlash(order._id)
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'orders-crud',
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

// 删除订单记录（任意状态，二次确认，物理删除）
const onOrderDelete = (order) => {
  uni.showModal({
    title: '删除订单',
    content: '确定要删除这条订单记录吗？删除后不可恢复。',
    confirmText: '删除',
    confirmColor: '#EF4444',
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await uniCloud.callFunction({
          name: 'app-service',
          data: {
            module: 'orders-crud',
            action: 'delete',
            _id: order._id,
            token: userStore.token
          }
        })
        if (res.result.code !== 0) {
          uni.showToast({ title: res.result.message || '删除失败', icon: 'none' })
          return
        }
        // 从本地列表移除
        orderList.value = orderList.value.filter((o) => o._id !== order._id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        console.error('[admin] onOrderDelete error', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
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
// 方案A：微信原生裁剪（固定比例）。裁剪比例由 width/height 决定，默认 1:1 方形，
// 如需 4:3 改为 { width: 800, height: 600 }；crop 仅小程序端生效，其他端自动忽略。
const DISH_CROP = { width: 800, height: 800, quality: 85 }

// 优先使用 chooseMedia（微信新版API，支持 crop 原生裁剪），降级到 chooseImage（旧版兼容，无裁剪）
const onChooseImage = () => {
  if (uploading.value) return
  if (uni.chooseMedia) {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      // 原生裁剪：选图后弹出微信裁剪界面，用户可在 1:1 框内拖动/缩放图片
      crop: DISH_CROP,
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
      name: 'app-service',
      data: { module: 'dishes-crud', ...payload }
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
          name: 'app-service',
          data: { module: 'dishes-crud', action: 'delete', token: userStore.token, _id: dish._id }
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
      name: 'app-service',
      data: { module: 'dishes-crud', action: 'toggleSale', token: userStore.token, _id: dish._id, isOnSale: value }
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
  catForm.type = menuType.value
  catFormError.value = ''
  editingCatId.value = ''
}

const onAddCategory = () => {
  resetCatForm()
  catForm.type = menuType.value
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
      name: 'app-service',
      data: { module: 'categories-crud', ...payload }
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
          name: 'app-service',
          data: { module: 'categories-crud', action: 'delete', token: userStore.token, _id: cat._id }
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
      name: 'app-service',
      data: {
        module: 'categories-crud',
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
  // 应用外壳页标准：视口锁定，页面本身不滚动（下拉刷新由面板 scroll-view 承担）
  @include page-shell;
  background-color: $color-bg;
}

/* 面板滚动区：菜单/订单面板在此滚动，下拉刷新只作用于它 */
.pane-scroll {
  @include page-shell-body;
}

.pane-bottom-spacer {
  height: calc(140rpx + env(safe-area-inset-bottom));
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

/* === 菜单类型切换行（仅菜单切换按钮） === */
.menu-switch-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 32rpx 16rpx;

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
}

/* === 分类行：分类入口 + 横向分类筛选 === */
.cat-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 32rpx 24rpx;

  .cat-entry {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    // 与 cat-filter-pill 统一尺寸：同高、同圆角、同字号
    height: 60rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    border-radius: $radius-full;
    background-color: $color-coffee-100;
    color: $color-coffee-700;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    line-height: 1;
    @include tap-feedback;
  }

  .cat-filter-scroll {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: nowrap;
    gap: 12rpx;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .cat-filter-pill {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    // 与 cat-entry 统一尺寸：同高、同圆角、同字号
    height: 60rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    border-radius: $radius-full;
    background-color: $color-card;
    color: $color-text-muted;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    line-height: 1;
    @include tap-feedback;
    transition: all $dur-base $ease-smooth;
    box-shadow: $shadow-sm;

    &.active {
      background: linear-gradient(135deg, $color-coffee-500, $color-coffee-600);
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(111, 78, 55, 0.25);
    }
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

/* === 菜品滑动删除容器 === */
.dish-swipe-item {
  position: relative;
  overflow: hidden;
  border-radius: $radius-2xl;
  margin-bottom: 20rpx;

  /* 拖拽中的卡片：浮起 + 加深阴影 + 微提亮，明确"被拿起"的层级感 */
  &.is-dragging {
    overflow: visible;
    box-shadow: 0 16rpx 40rpx rgba(44, 27, 20, 0.22);
    opacity: 0.98;
  }
}

/* === 排序模式 === */
/* 排序态卡片：轻微抖动提示"可拖动"（被拖起的那张停止抖动） */
.dish-card.sorting {
  animation: sortWiggle 0.32s ease-in-out infinite alternate;

  &.is-held {
    animation: none;
  }
}

@keyframes sortWiggle {
  from {
    transform: rotate(-0.5deg);
  }
  to {
    transform: rotate(0.5deg);
  }
}

/* 排序抓手 */
.drag-grip {
  flex-shrink: 0;
  width: 48rpx;
  height: 64rpx;
  border-radius: $radius-md;
  background-color: $color-neutral-100;
  @include flex-center;

  .drag-grip-icon {
    font-size: 28rpx;
    color: $color-neutral-400;
    line-height: 1;
  }
}

/* 排序模式操作栏：固定在底部 tabbar 上方 */
.sort-mode-bar {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  z-index: 200;
  @include flex-between;
  padding: 20rpx 28rpx;
  border-radius: $radius-full;
  background-color: rgba(44, 27, 20, 0.88);
  box-shadow: $shadow-lg;
  animation: slideUp $dur-base $ease-smooth both;

  .sort-mode-tip {
    font-size: $font-size-sm;
    color: rgba(255, 255, 255, 0.85);
  }

  .sort-mode-done {
    padding: 10rpx 36rpx;
    border-radius: $radius-full;
    background: linear-gradient(135deg, $color-coffee-400, $color-coffee-600);
    color: #fff;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    @include tap-feedback(0.94);
  }
}

/* 右侧滑动操作区：圆角块状按钮 */
.dish-swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 16rpx;
  padding: 16rpx 16rpx 16rpx 0;
  z-index: 1;

  .dish-swipe-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 144rpx;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: #fff;
    border-radius: $radius-xl;
    box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.12);

    &:active {
      opacity: 0.92;
      transform: scale(0.96);
    }
  }

  .delete {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }
}

.dish-card {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;
  border-left: 8rpx solid transparent;
  transition: box-shadow $dur-base $ease-smooth;

  &.coffee {
    border-left-color: $color-coffee-400;
  }

  &.food {
    border-left-color: $color-food-400;
  }

  /* 吸附/回弹时的丝滑过渡 */
  &.swipe-animating {
    transition: transform 0.3s $ease-smooth;
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

/* 菜品上架开关（卡片内右侧） */
.dish-sale-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
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

/* === 订单滑动卡片容器 === */
.order-swipe-item {
  position: relative;
  overflow: hidden;
  border-radius: $radius-xl;
}

/* 右侧滑动操作区：圆角块状按钮 */
.order-swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 16rpx;
  padding: 16rpx 16rpx 16rpx 0;
  z-index: 1;

  .order-swipe-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 144rpx;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: #fff;
    border-radius: $radius-xl;
    box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.12);

    &:active {
      opacity: 0.92;
      transform: scale(0.96);
    }
  }

  .cancel {
    background: linear-gradient(135deg, #9CA3AF, #6B7280);
  }

  .delete {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }
}

/* === 订单卡片主体 === */
.order-swipe-card {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $color-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: box-shadow $dur-base $ease-smooth;

  /* 吸附/回弹时的丝滑过渡 */
  &.swipe-animating {
    transition: transform 0.3s $ease-smooth;
  }

  /* 状态变化时整体闪光，强化动效反馈 */
  &.is-flashing {
    box-shadow: 0 0 0 4rpx rgba(255, 167, 38, 0.22), $shadow-md;
  }

  /* 左侧 emoji 图标 */
  .order-card-icon {
    flex-shrink: 0;
    width: 88rpx;
    height: 88rpx;
    border-radius: $radius-lg;
    background-color: $color-bg-soft;
    @include flex-center;
    font-size: 44rpx;
  }

  /* 中部内容 */
  .order-card-body {
    flex: 1;
    min-width: 0;
    @include flex-column;
    gap: 8rpx;

    .order-card-summary {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-text-strong;
      line-height: $line-height-tight;
      @include ellipsis(2);
    }

    .order-card-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: $font-size-xs;
      color: $color-text-muted;

      .meta-user {
        color: $color-coffee-500;
        font-weight: $font-weight-medium;
      }
    }
  }

  /* 右侧：状态徽章 */
  .order-card-right {
    flex-shrink: 0;
    @include flex-column;
    align-items: flex-end;
    justify-content: center;
  }
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
