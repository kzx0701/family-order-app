"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useHeaderFixed = require("../../composables/useHeaderFixed.js");
const utils_wxConfig = require("../../utils/wx-config.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_fo_switch2 = common_vendor.resolveComponent("fo-switch");
  const _component_transition_group = common_vendor.resolveComponent("transition-group");
  const _easycom_fo_empty2 = common_vendor.resolveComponent("fo-empty");
  const _easycom_status_badge2 = common_vendor.resolveComponent("status-badge");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  const _easycom_fo_input2 = common_vendor.resolveComponent("fo-input");
  const _easycom_fo_sheet2 = common_vendor.resolveComponent("fo-sheet");
  (_easycom_Icon2 + _easycom_skeleton2 + _easycom_fo_switch2 + _component_transition_group + _easycom_fo_empty2 + _easycom_status_badge2 + _easycom_custom_tabbar2 + _easycom_fo_input2 + _easycom_fo_sheet2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_fo_switch = () => "../../components/fo-switch/fo-switch.js";
const _easycom_fo_empty = () => "../../components/fo-empty/fo-empty.js";
const _easycom_status_badge = () => "../../components/status-badge/status-badge.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
const _easycom_fo_input = () => "../../components/fo-input/fo-input.js";
const _easycom_fo_sheet = () => "../../components/fo-sheet/fo-sheet.js";
if (!Math) {
  (_easycom_Icon + _easycom_skeleton + _easycom_fo_switch + _easycom_fo_empty + _easycom_status_badge + _easycom_custom_tabbar + _easycom_fo_input + _easycom_fo_sheet)();
}
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const { headerHeight } = composables_useHeaderFixed.useHeaderFixed(".header");
    const instance = common_vendor.getCurrentInstance();
    const userStore = store_user.useUserStore();
    const activeTab = common_vendor.ref("menu");
    const menuType = common_vendor.ref("coffee");
    const dishList = common_vendor.ref([]);
    const categoryList = common_vendor.ref([]);
    const loadingDishes = common_vendor.ref(false);
    const filterCategoryId = common_vendor.ref("");
    const currentCategories = common_vendor.computed(
      () => categoryList.value.filter((c) => c.type === menuType.value)
    );
    const catManagerTitle = common_vendor.computed(
      () => menuType.value === "coffee" ? "☕ 咖啡分类管理" : "🍲 美食分类管理"
    );
    const filteredDishes = common_vendor.computed(() => {
      let list = dishList.value.filter((d) => d.type === menuType.value);
      if (filterCategoryId.value) {
        list = list.filter((d) => d.categoryId === filterCategoryId.value);
      }
      return list;
    });
    const onMenuTypeChange = (type) => {
      if (menuType.value === type)
        return;
      menuType.value = type;
      filterCategoryId.value = "";
      closeDishSwipe();
    };
    const availableCategories = common_vendor.computed(
      () => categoryList.value.filter((c) => c.type === dishForm.type)
    );
    const dishFormVisible = common_vendor.ref(false);
    const editingDishId = common_vendor.ref("");
    const dishFormError = common_vendor.ref("");
    const saving = common_vendor.ref(false);
    const uploading = common_vendor.ref(false);
    const uploadProgress = common_vendor.ref(0);
    const dishForm = common_vendor.reactive({
      name: "",
      image: "",
      description: "",
      type: "coffee",
      categoryId: "",
      isOnSale: true,
      isRecommended: false,
      temp: "hot"
      // 冷热配置：仅咖啡有效，ice（冰）/ hot（热）
    });
    const DISH_SWIPE_WIDTH = Math.round(160 / 750 * common_vendor.index.getSystemInfoSync().windowWidth);
    const dishSwipeOffset = common_vendor.reactive({});
    const dishSwipeAnimating = common_vendor.reactive({});
    const dishTouchStartX = common_vendor.reactive({});
    const dishTouchStartOffset = common_vendor.reactive({});
    const dishTouchMoved = common_vendor.reactive({});
    const dishActiveSwipeId = common_vendor.ref("");
    const onDishTouchStart = (e, id) => {
      const touch = e.touches[0];
      dishTouchStartX[id] = touch.clientX;
      dishTouchStartOffset[id] = dishSwipeOffset[id] || 0;
      dishTouchMoved[id] = false;
      dishSwipeAnimating[id] = false;
      if (dishActiveSwipeId.value && dishActiveSwipeId.value !== id) {
        dishSwipeAnimating[dishActiveSwipeId.value] = true;
        dishSwipeOffset[dishActiveSwipeId.value] = 0;
        dishActiveSwipeId.value = "";
      }
    };
    const onDishTouchMove = (e, id) => {
      const touch = e.touches[0];
      if (dragState.active) {
        if (dragState.id === id)
          onDragMove(touch.clientY);
        return;
      }
      const dx = touch.clientX - dishTouchStartX[id];
      if (Math.abs(dx) > 5)
        dishTouchMoved[id] = true;
      let next = dishTouchStartOffset[id] + dx;
      if (next > 0)
        next = 0;
      if (next < -DISH_SWIPE_WIDTH)
        next = -DISH_SWIPE_WIDTH;
      dishSwipeOffset[id] = next;
    };
    const onDishTouchEnd = (e, id) => {
      if (dragState.active) {
        if (dragState.id === id)
          finalizeDrag();
        return;
      }
      const offset = dishSwipeOffset[id] || 0;
      dishSwipeAnimating[id] = true;
      if (offset < -DISH_SWIPE_WIDTH / 2) {
        dishSwipeOffset[id] = -DISH_SWIPE_WIDTH;
        dishActiveSwipeId.value = id;
      } else {
        dishSwipeOffset[id] = 0;
        if (dishActiveSwipeId.value === id)
          dishActiveSwipeId.value = "";
      }
      setTimeout(() => {
        dishSwipeAnimating[id] = false;
      }, 300);
      setTimeout(() => {
        dishTouchMoved[id] = false;
      }, 0);
    };
    const onDishCardTap = (dish) => {
      if (suppressNextTap)
        return;
      if (dishTouchMoved[dish._id])
        return;
      if ((dishSwipeOffset[dish._id] || 0) < 0) {
        dishSwipeAnimating[dish._id] = true;
        dishSwipeOffset[dish._id] = 0;
        dishActiveSwipeId.value = "";
        setTimeout(() => {
          dishSwipeAnimating[dish._id] = false;
        }, 300);
        return;
      }
      onEditDish(dish);
    };
    const sortMode = common_vendor.ref(false);
    let suppressNextTap = false;
    const enterSortMode = () => {
      if (sortMode.value)
        return;
      if (filterCategoryId.value) {
        common_vendor.index.showToast({ title: "切换到「全部」再排序", icon: "none" });
        return;
      }
      closeDishSwipe();
      sortMode.value = true;
      suppressNextTap = true;
      setTimeout(() => {
        suppressNextTap = false;
      }, 400);
      common_vendor.index.vibrateShort({ type: "medium", fail: () => {
      } });
      common_vendor.index.showToast({ title: "排序模式：直接拖动菜品", icon: "none" });
    };
    const exitSortMode = () => {
      sortMode.value = false;
      dragState.active = false;
      dragState.id = "";
      dragState.index = -1;
      dragState.overIndex = -1;
      dragState.deltaY = 0;
      dragState.releasing = false;
    };
    const noop = () => {
    };
    const onSortTouchStart = (e, dish, index) => {
      if (dragState.active)
        return;
      const touch = e.touches[0];
      const startY = touch.clientY;
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.selectAll(".dish-swipe-item").boundingClientRect();
      query.exec((res) => {
        const rects = res[0] || [];
        if (!rects[index] || rects.length < 2)
          return;
        const stride = rects[1].top - rects[0].top;
        if (stride <= 0)
          return;
        dragState.stride = stride;
        dragState.active = true;
        dragState.id = dish._id;
        dragState.index = index;
        dragState.overIndex = index;
        dragState.startY = startY;
        dragState.deltaY = 0;
        dragState.releasing = false;
        common_vendor.index.vibrateShort({ type: "light", fail: () => {
        } });
      });
    };
    const onSortTouchMove = (e) => {
      if (!dragState.active)
        return;
      onDragMove(e.touches[0].clientY);
    };
    const onSortTouchEnd = () => {
      if (dragState.active)
        finalizeDrag();
    };
    const dragState = common_vendor.reactive({
      active: false,
      // 是否处于拖拽中（此时面板 scroll-view 的 scroll-y 被锁定）
      id: "",
      // 被拖拽菜品 _id
      index: -1,
      // 起始下标（当前 filteredDishes 中）
      overIndex: -1,
      // 目标下标（手指当前对应槽位）
      startY: 0,
      // 触摸起点 clientY
      deltaY: 0,
      // 当前纵向位移
      stride: 0,
      // 单项步进高度（卡片高 + 卡片间距）
      releasing: false
      // 松手吸附阶段（被拖卡片启用过渡）
    });
    const onDragMove = (clientY) => {
      dragState.deltaY = clientY - dragState.startY;
      const len = filteredDishes.value.length;
      const next = Math.min(
        Math.max(dragState.index + Math.round(dragState.deltaY / dragState.stride), 0),
        len - 1
      );
      if (next !== dragState.overIndex) {
        dragState.overIndex = next;
        common_vendor.index.vibrateShort({ type: "light", fail: () => {
        } });
      }
    };
    const getDragItemStyle = (index) => {
      if (!dragState.active)
        return {};
      const { index: from, overIndex: to, stride } = dragState;
      if (index === from) {
        return {
          transform: `translateY(${dragState.deltaY}px) scale(1.03)`,
          zIndex: 60,
          transition: dragState.releasing ? "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
        };
      }
      let shift = 0;
      if (from < to && index > from && index <= to)
        shift = -stride;
      else if (from > to && index >= to && index < from)
        shift = stride;
      return {
        transform: `translateY(${shift}px)`,
        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      };
    };
    const finalizeDrag = () => {
      dragState.releasing = true;
      dragState.deltaY = (dragState.overIndex - dragState.index) * dragState.stride;
      const { index, overIndex } = dragState;
      setTimeout(() => {
        if (overIndex !== index)
          applyReorder(index, overIndex);
        dragState.active = false;
        dragState.id = "";
        dragState.index = -1;
        dragState.overIndex = -1;
        dragState.deltaY = 0;
        dragState.releasing = false;
      }, 200);
    };
    const applyReorder = (from, to) => {
      const typeList = dishList.value.filter((d) => d.type === menuType.value);
      const [moved] = typeList.splice(from, 1);
      typeList.splice(to, 0, moved);
      const items = typeList.map((d, i) => ({ _id: d._id, sortOrder: i + 1 }));
      const sortMap = {};
      items.forEach((it) => {
        sortMap[it._id] = it.sortOrder;
      });
      const others = dishList.value.filter((d) => d.type !== menuType.value);
      dishList.value = [
        ...typeList.map((d) => ({ ...d, sortOrder: sortMap[d._id] })),
        ...others
      ];
      common_vendor._r.callFunction({
        name: "app-service",
        data: { module: "dishes-crud", action: "sort", token: userStore.token, items }
      }).then((res) => {
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "排序保存失败", icon: "none" });
          loadDishes();
        }
      }).catch((e) => {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:821", "[admin] persist reorder error", e);
        common_vendor.index.showToast({ title: "排序保存失败，已恢复", icon: "none" });
        loadDishes();
      });
    };
    const closeDishSwipe = () => {
      if (dishActiveSwipeId.value) {
        dishSwipeAnimating[dishActiveSwipeId.value] = true;
        dishSwipeOffset[dishActiveSwipeId.value] = 0;
        const id = dishActiveSwipeId.value;
        dishActiveSwipeId.value = "";
        setTimeout(() => {
          dishSwipeAnimating[id] = false;
        }, 300);
      }
    };
    const onDishSwipeDelete = (dish) => {
      onDeleteDish(dish);
    };
    const catManagerVisible = common_vendor.ref(false);
    const catFormVisible = common_vendor.ref(false);
    const editingCatId = common_vendor.ref("");
    const catFormError = common_vendor.ref("");
    const catForm = common_vendor.reactive({
      name: "",
      type: "coffee"
    });
    const orderList = common_vendor.ref([]);
    const loadingOrders = common_vendor.ref(false);
    const ordersLoaded = common_vendor.ref(false);
    const orderFilter = common_vendor.ref("all");
    const orderFilters = [
      { value: "all", label: "全部" },
      { value: "pending", label: "待制作" },
      { value: "preparing", label: "制作中" },
      { value: "completed", label: "已完成" },
      { value: "cancelled", label: "已取消" }
    ];
    const filteredOrders = common_vendor.computed(() => {
      if (orderFilter.value === "all")
        return orderList.value;
      return orderList.value.filter((o) => o.status === orderFilter.value);
    });
    const orderEmptyText = common_vendor.computed(() => {
      const map = {
        all: "还没有订单哦~",
        pending: "暂无待制作订单 🎉",
        preparing: "暂无制作中订单",
        completed: "暂无已完成订单",
        cancelled: "暂无已取消订单"
      };
      return map[orderFilter.value] || "暂无订单";
    });
    const getTodayRangeShanghai = () => {
      const SHANGHAI_OFFSET = 8 * 3600 * 1e3;
      const now = Date.now();
      const shanghaiNow = new Date(now + SHANGHAI_OFFSET);
      const y = shanghaiNow.getUTCFullYear();
      const m = shanghaiNow.getUTCMonth();
      const d = shanghaiNow.getUTCDate();
      const start = Date.UTC(y, m, d, 0, 0, 0) - SHANGHAI_OFFSET;
      const end = start + 24 * 3600 * 1e3 - 1;
      return { start, end };
    };
    const todayOrderCount = common_vendor.computed(() => {
      const { start, end } = getTodayRangeShanghai();
      return orderList.value.filter((o) => o.createTime >= start && o.createTime <= end).length;
    });
    const pendingOrderCount = common_vendor.computed(() => {
      return orderList.value.filter((o) => o.status === "pending").length;
    });
    const ORDER_SWIPE_WIDTH_FULL = Math.round(320 / 750 * common_vendor.index.getSystemInfoSync().windowWidth);
    const ORDER_SWIPE_WIDTH_DELETE_ONLY = Math.round(160 / 750 * common_vendor.index.getSystemInfoSync().windowWidth);
    const orderSwipeOffset = common_vendor.reactive({});
    const orderSwipeAnimating = common_vendor.reactive({});
    const orderTouchStartX = common_vendor.reactive({});
    const orderTouchStartOffset = common_vendor.reactive({});
    const orderTouchMoved = common_vendor.reactive({});
    const orderActiveSwipeId = common_vendor.ref("");
    const orderFlashMap = common_vendor.reactive({});
    const triggerOrderFlash = (id) => {
      orderFlashMap[id] = true;
      setTimeout(() => {
        orderFlashMap[id] = false;
      }, 600);
    };
    const getOrderSwipeWidth = (order) => {
      if (order.status === "pending")
        return ORDER_SWIPE_WIDTH_FULL;
      return ORDER_SWIPE_WIDTH_DELETE_ONLY;
    };
    const onOrderTouchStart = (e, id) => {
      const touch = e.touches[0];
      orderTouchStartX[id] = touch.clientX;
      orderTouchStartOffset[id] = orderSwipeOffset[id] || 0;
      orderTouchMoved[id] = false;
      orderSwipeAnimating[id] = false;
      if (orderActiveSwipeId.value && orderActiveSwipeId.value !== id) {
        orderSwipeAnimating[orderActiveSwipeId.value] = true;
        orderSwipeOffset[orderActiveSwipeId.value] = 0;
        orderActiveSwipeId.value = "";
      }
    };
    const onOrderTouchMove = (e, id) => {
      const touch = e.touches[0];
      const dx = touch.clientX - orderTouchStartX[id];
      if (Math.abs(dx) > 5)
        orderTouchMoved[id] = true;
      let next = orderTouchStartOffset[id] + dx;
      if (next > 0)
        next = 0;
      if (next < -ORDER_SWIPE_WIDTH_FULL)
        next = -ORDER_SWIPE_WIDTH_FULL;
      orderSwipeOffset[id] = next;
    };
    const onOrderTouchEnd = (e, id) => {
      const order = filteredOrders.value.find((o) => o._id === id);
      const maxW = order ? getOrderSwipeWidth(order) : ORDER_SWIPE_WIDTH_FULL;
      const offset = orderSwipeOffset[id] || 0;
      orderSwipeAnimating[id] = true;
      if (offset < -maxW / 2) {
        orderSwipeOffset[id] = -maxW;
        orderActiveSwipeId.value = id;
      } else {
        orderSwipeOffset[id] = 0;
        if (orderActiveSwipeId.value === id)
          orderActiveSwipeId.value = "";
      }
      setTimeout(() => {
        orderSwipeAnimating[id] = false;
      }, 300);
      setTimeout(() => {
        orderTouchMoved[id] = false;
      }, 0);
    };
    const onOrderCardTap = (order) => {
      if (orderTouchMoved[order._id])
        return;
      if ((orderSwipeOffset[order._id] || 0) < 0) {
        orderSwipeAnimating[order._id] = true;
        orderSwipeOffset[order._id] = 0;
        orderActiveSwipeId.value = "";
        setTimeout(() => {
          orderSwipeAnimating[order._id] = false;
        }, 300);
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order._id}`
      });
    };
    const closeOrderSwipe = () => {
      if (orderActiveSwipeId.value) {
        orderSwipeAnimating[orderActiveSwipeId.value] = true;
        orderSwipeOffset[orderActiveSwipeId.value] = 0;
        const id = orderActiveSwipeId.value;
        orderActiveSwipeId.value = "";
        setTimeout(() => {
          orderSwipeAnimating[id] = false;
        }, 300);
      }
    };
    const onOrderSwipeCancel = (order) => {
      orderSwipeAnimating[order._id] = true;
      orderSwipeOffset[order._id] = 0;
      orderActiveSwipeId.value = "";
      setTimeout(() => {
        orderSwipeAnimating[order._id] = false;
      }, 300);
      onOrderCancel(order);
    };
    const onOrderSwipeDelete = (order) => {
      onOrderDelete(order);
    };
    const formatOrderTime = (ts) => {
      if (!ts)
        return "";
      const d = new Date(ts);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };
    const onOrdersTabTap = () => {
      activeTab.value = "orders";
      const asked = common_vendor.index.getStorageSync("fo_admin_notify_asked");
      if (!asked) {
        onSubscribeOrderNotify();
      }
    };
    const onSubscribeOrderNotify = () => {
      common_vendor.index.requestSubscribeMessage({
        tmplIds: [utils_wxConfig.WX_CONFIG.subscribeTemplates.orderNotify],
        success: () => {
          common_vendor.index.setStorageSync("fo_admin_notify_asked", "1");
        },
        fail: () => {
        }
      });
    };
    common_vendor.onMounted(() => {
      if (!userStore.isAdmin) {
        common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
        return;
      }
      loadDishes();
      loadCategories();
      loadOrders();
    });
    const refreshing = common_vendor.ref(false);
    const onPaneRefresh = async () => {
      refreshing.value = true;
      try {
        if (activeTab.value === "menu") {
          await Promise.all([loadDishes(), loadCategories()]);
        } else {
          await loadOrders();
        }
      } finally {
        refreshing.value = false;
      }
    };
    const loadDishes = async () => {
      loadingDishes.value = true;
      try {
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "dishes-crud", action: "list", token: userStore.token }
        });
        if (res.result.code === 0) {
          dishList.value = res.result.list;
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1094", "[admin] loadDishes error", e);
        common_vendor.index.showToast({ title: "加载菜品失败", icon: "none" });
      } finally {
        loadingDishes.value = false;
      }
    };
    const loadCategories = async () => {
      try {
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "categories-crud", action: "list", token: userStore.token }
        });
        if (res.result.code === 0) {
          categoryList.value = res.result.list;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1111", "[admin] loadCategories error", e);
      }
    };
    const buildOrderSummary = (items) => {
      if (!Array.isArray(items) || items.length === 0)
        return "订单详情";
      return items.map((i) => `${i.name} x${i.quantity}`).join(", ");
    };
    const pickOrderEmoji = (items) => {
      if (!Array.isArray(items) || items.length === 0)
        return "🍽️";
      const name = String(items[0].name || "");
      if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name))
        return "☕";
      if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name))
        return "🥐";
      if (/面|粉|粥|拉面|乌冬|noodle/i.test(name))
        return "🍜";
      if (/饭|炒饭|盖饭|咖喱|便当/i.test(name))
        return "🍚";
      if (/沙律|沙拉|salad/i.test(name))
        return "🥗";
      if (/汤|羹/i.test(name))
        return "🍲";
      return "🍽️";
    };
    const loadOrders = async () => {
      loadingOrders.value = true;
      try {
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "orders-crud", action: "list", token: userStore.token, pageSize: 100 }
        });
        if (res.result.code === 0) {
          orderList.value = (res.result.list || []).map((o) => ({
            ...o,
            summary: buildOrderSummary(o.items),
            summaryEmoji: pickOrderEmoji(o.items)
          }));
          ordersLoaded.value = true;
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载订单失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1154", "[admin] loadOrders error", e);
        common_vendor.index.showToast({ title: "加载订单失败", icon: "none" });
      } finally {
        loadingOrders.value = false;
      }
    };
    const onOrderCancel = async (order) => {
      const oldStatus = order.status;
      order.status = "cancelled";
      triggerOrderFlash(order._id);
      try {
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: {
            module: "orders-crud",
            action: "cancel",
            _id: order._id,
            token: userStore.token
          }
        });
        if (res.result.code !== 0) {
          order.status = oldStatus;
          common_vendor.index.showToast({ title: res.result.message || "取消失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({ title: "已取消", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1186", "[admin] onOrderCancel error", e);
        order.status = oldStatus;
        common_vendor.index.showToast({ title: "取消失败", icon: "none" });
      }
    };
    const onOrderDelete = (order) => {
      common_vendor.index.showModal({
        title: "删除订单",
        content: "确定要删除这条订单记录吗？删除后不可恢复。",
        confirmText: "删除",
        confirmColor: "#EF4444",
        success: async (r) => {
          if (!r.confirm)
            return;
          try {
            const res = await common_vendor._r.callFunction({
              name: "app-service",
              data: {
                module: "orders-crud",
                action: "delete",
                _id: order._id,
                token: userStore.token
              }
            });
            if (res.result.code !== 0) {
              common_vendor.index.showToast({ title: res.result.message || "删除失败", icon: "none" });
              return;
            }
            orderList.value = orderList.value.filter((o) => o._id !== order._id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:1219", "[admin] onOrderDelete error", e);
            common_vendor.index.showToast({ title: "删除失败", icon: "none" });
          }
        }
      });
    };
    const resetDishForm = () => {
      dishForm.name = "";
      dishForm.image = "";
      dishForm.description = "";
      dishForm.type = menuType.value;
      dishForm.categoryId = "";
      dishForm.isOnSale = true;
      dishForm.isRecommended = false;
      dishForm.temp = "hot";
      dishFormError.value = "";
      editingDishId.value = "";
    };
    const onAddDish = () => {
      resetDishForm();
      dishFormVisible.value = true;
    };
    const onEditDish = (dish) => {
      resetDishForm();
      editingDishId.value = dish._id;
      dishForm.name = dish.name;
      dishForm.image = dish.image;
      dishForm.description = dish.description;
      dishForm.type = dish.type;
      dishForm.categoryId = dish.categoryId;
      dishForm.isOnSale = dish.isOnSale;
      dishForm.isRecommended = dish.isRecommended || false;
      dishForm.temp = dish.temp === "ice" || dish.temp === "hot" ? dish.temp : "hot";
      dishFormVisible.value = true;
    };
    const closeDishForm = () => {
      dishFormVisible.value = false;
      resetDishForm();
    };
    const onTypeChange = (type) => {
      dishForm.type = type;
      const belongs = categoryList.value.some((c) => c._id === dishForm.categoryId && c.type === type);
      if (!belongs) {
        dishForm.categoryId = "";
      }
      if (type !== "coffee") {
        dishForm.temp = "";
      } else if (!dishForm.temp) {
        dishForm.temp = "hot";
      }
    };
    const DISH_CROP = { width: 800, height: 800, quality: 85 };
    const onChooseImage = () => {
      if (uploading.value)
        return;
      if (common_vendor.index.chooseMedia) {
        common_vendor.index.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          // 原生裁剪：选图后弹出微信裁剪界面，用户可在 1:1 框内拖动/缩放图片
          crop: DISH_CROP,
          success: (res) => {
            if (res.tempFiles && res.tempFiles[0]) {
              uploadDishImage(res.tempFiles[0].tempFilePath);
            }
          },
          fail: (err) => {
            if (String(err.errMsg || "").indexOf("cancel") === -1) {
              common_vendor.index.__f__("error", "at pages/admin/admin.vue:1302", "[admin] chooseMedia fail", err);
            }
          }
        });
      } else {
        common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            const tempPath = res.tempFilePaths[0];
            uploadDishImage(tempPath);
          },
          fail: (err) => {
            if (String(err.errMsg || "").indexOf("cancel") === -1) {
              common_vendor.index.__f__("error", "at pages/admin/admin.vue:1317", "[admin] chooseImage fail", err);
            }
          }
        });
      }
    };
    const uploadDishImage = async (filePath) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const cloudPath = `dishes/${timestamp}_${random}.jpg`;
      uploading.value = true;
      uploadProgress.value = 0;
      try {
        const res = await common_vendor._r.uploadFile({
          filePath,
          cloudPath,
          onProgressCall: (p) => {
            uploadProgress.value = Math.floor(p.progress || 0);
          }
        });
        dishForm.image = res.fileID;
        common_vendor.index.showToast({ title: "上传成功", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1341", "[admin] uploadDishImage error", e);
        common_vendor.index.showToast({ title: "上传失败，请重试", icon: "none" });
      } finally {
        uploading.value = false;
      }
    };
    const onSaveDish = async () => {
      if (!dishForm.name.trim()) {
        dishFormError.value = "菜品名称必填";
        return;
      }
      dishFormError.value = "";
      saving.value = true;
      try {
        const payload = {
          action: editingDishId.value ? "update" : "create",
          token: userStore.token,
          name: dishForm.name,
          image: dishForm.image,
          description: dishForm.description,
          type: dishForm.type,
          categoryId: dishForm.categoryId,
          isOnSale: dishForm.isOnSale,
          isRecommended: dishForm.isRecommended,
          temp: dishForm.type === "coffee" ? dishForm.temp : ""
        };
        if (editingDishId.value) {
          payload._id = editingDishId.value;
        }
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "dishes-crud", ...payload }
        });
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "保存失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({
          title: editingDishId.value ? "已更新" : "已添加",
          icon: "success"
        });
        closeDishForm();
        await loadDishes();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1388", "[admin] onSaveDish error", e);
        common_vendor.index.showToast({ title: "保存异常", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const onDeleteDish = (dish) => {
      common_vendor.index.showModal({
        title: "删除菜品",
        content: `确定删除「${dish.name}」吗？`,
        confirmColor: "#EF4444",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            const r = await common_vendor._r.callFunction({
              name: "app-service",
              data: { module: "dishes-crud", action: "delete", token: userStore.token, _id: dish._id }
            });
            if (r.result.code !== 0) {
              common_vendor.index.showToast({ title: r.result.message || "删除失败", icon: "none" });
              return;
            }
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            dishList.value = dishList.value.filter((d) => d._id !== dish._id);
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:1416", "[admin] onDeleteDish error", e);
            common_vendor.index.showToast({ title: "删除异常", icon: "none" });
          }
        }
      });
    };
    const onToggleSale = async (dish, value) => {
      const oldVal = dish.isOnSale;
      dish.isOnSale = value;
      try {
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "dishes-crud", action: "toggleSale", token: userStore.token, _id: dish._id, isOnSale: value }
        });
        if (res.result.code !== 0) {
          dish.isOnSale = oldVal;
          common_vendor.index.showToast({ title: res.result.message || "切换失败", icon: "none" });
        }
      } catch (e) {
        dish.isOnSale = oldVal;
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1439", "[admin] onToggleSale error", e);
        common_vendor.index.showToast({ title: "切换失败", icon: "none" });
      }
    };
    const openCategoryManager = () => {
      catManagerVisible.value = true;
      if (!categoryList.value.length) {
        loadCategories();
      }
    };
    const closeCategoryManager = () => {
      catManagerVisible.value = false;
      cancelCatForm();
    };
    const resetCatForm = () => {
      catForm.name = "";
      catForm.type = menuType.value;
      catFormError.value = "";
      editingCatId.value = "";
    };
    const onAddCategory = () => {
      resetCatForm();
      catForm.type = menuType.value;
      catFormVisible.value = true;
    };
    const onEditCategory = (cat) => {
      resetCatForm();
      editingCatId.value = cat._id;
      catForm.name = cat.name;
      catForm.type = cat.type;
      catFormVisible.value = true;
    };
    const cancelCatForm = () => {
      catFormVisible.value = false;
      resetCatForm();
    };
    const onSaveCategory = async () => {
      if (!catForm.name.trim()) {
        catFormError.value = "分类名称必填";
        return;
      }
      catFormError.value = "";
      try {
        const payload = {
          action: editingCatId.value ? "update" : "create",
          token: userStore.token,
          name: catForm.name,
          type: catForm.type
        };
        if (editingCatId.value) {
          payload._id = editingCatId.value;
        }
        const res = await common_vendor._r.callFunction({
          name: "app-service",
          data: { module: "categories-crud", ...payload }
        });
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "保存失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({
          title: editingCatId.value ? "已更新" : "已添加",
          icon: "success"
        });
        cancelCatForm();
        await loadCategories();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1515", "[admin] onSaveCategory error", e);
        common_vendor.index.showToast({ title: "保存异常", icon: "none" });
      }
    };
    const onDeleteCategory = (cat) => {
      common_vendor.index.showModal({
        title: "删除分类",
        content: `确定删除「${cat.name}」吗？该分类下的菜品将变为无分类。`,
        confirmColor: "#EF4444",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            const r = await common_vendor._r.callFunction({
              name: "app-service",
              data: { module: "categories-crud", action: "delete", token: userStore.token, _id: cat._id }
            });
            if (r.result.code !== 0) {
              common_vendor.index.showToast({ title: r.result.message || "删除失败", icon: "none" });
              return;
            }
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await loadCategories();
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:1540", "[admin] onDeleteCategory error", e);
            common_vendor.index.showToast({ title: "删除异常", icon: "none" });
          }
        }
      });
    };
    const moveCategory = async (list, idx, direction) => {
      const target = idx + direction;
      if (target < 0 || target >= list.length)
        return;
      const a = list[idx];
      const b = list[target];
      const aOriginalSort = a.sortOrder ?? idx;
      const bOriginalSort = b.sortOrder ?? target;
      const aNewSort = bOriginalSort;
      const bNewSort = aOriginalSort;
      categoryList.value = categoryList.value.map((c) => {
        if (c._id === a._id)
          return { ...c, sortOrder: aNewSort };
        if (c._id === b._id)
          return { ...c, sortOrder: bNewSort };
        return c;
      });
      try {
        await common_vendor._r.callFunction({
          name: "app-service",
          data: {
            module: "categories-crud",
            action: "sort",
            token: userStore.token,
            items: [
              { _id: a._id, sortOrder: aNewSort },
              { _id: b._id, sortOrder: bNewSort }
            ]
          }
        });
        await loadCategories();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:1584", "[admin] moveCategory error", e);
        common_vendor.index.showToast({ title: "排序失败", icon: "none" });
        await loadCategories();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(todayOrderCount.value),
        b: common_vendor.t(pendingOrderCount.value),
        c: pendingOrderCount.value > 0 ? 1 : "",
        d: pendingOrderCount.value > 0
      }, pendingOrderCount.value > 0 ? {} : {}, {
        e: common_vendor.unref(statusBarHeight) + 28 + "px",
        f: common_vendor.unref(headerHeight) + "px",
        g: activeTab.value === "menu" ? 1 : "",
        h: common_vendor.o(($event) => activeTab.value = "menu", "2d"),
        i: activeTab.value === "orders" ? 1 : "",
        j: common_vendor.o(onOrdersTabTap, "81"),
        k: activeTab.value === "menu"
      }, activeTab.value === "menu" ? common_vendor.e({
        l: menuType.value === "coffee" ? 1 : "",
        m: common_vendor.o(($event) => onMenuTypeChange("coffee"), "f2"),
        n: menuType.value === "food" ? 1 : "",
        o: common_vendor.o(($event) => onMenuTypeChange("food"), "fc"),
        p: common_vendor.p({
          name: "settings",
          size: 16
        }),
        q: common_vendor.o(openCategoryManager, "19"),
        r: filterCategoryId.value === "" ? 1 : "",
        s: common_vendor.o(($event) => filterCategoryId.value = "", "54"),
        t: common_vendor.f(currentCategories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat._id,
            c: filterCategoryId.value === cat._id ? 1 : "",
            d: common_vendor.o(($event) => filterCategoryId.value = cat._id, cat._id)
          };
        }),
        v: loadingDishes.value && filteredDishes.value.length === 0
      }, loadingDishes.value && filteredDishes.value.length === 0 ? {
        w: common_vendor.p({
          type: "dish",
          count: 4
        })
      } : common_vendor.e({
        x: filteredDishes.value.length
      }, filteredDishes.value.length ? {
        y: common_vendor.f(filteredDishes.value, (dish, index, i0) => {
          return common_vendor.e(!sortMode.value ? {
            a: common_vendor.o(($event) => onDishSwipeDelete(dish), dish._id),
            b: common_vendor.o(() => {
            }, dish._id)
          } : {}, !sortMode.value ? common_vendor.e({
            c: dish.image
          }, dish.image ? {
            d: dish.image
          } : {
            e: common_vendor.t(dish.type === "coffee" ? "☕" : "🍲")
          }, {
            f: !dish.isOnSale
          }, !dish.isOnSale ? {} : {}, {
            g: dish.isRecommended
          }, dish.isRecommended ? {} : {}, {
            h: common_vendor.t(dish.name),
            i: dish.type === "coffee" && dish.temp
          }, dish.type === "coffee" && dish.temp ? {
            j: common_vendor.t(dish.temp === "ice" ? "❄" : "🔥"),
            k: common_vendor.t(dish.temp === "ice" ? "冰" : "热"),
            l: common_vendor.n(dish.temp)
          } : {}, {
            m: dish.description
          }, dish.description ? {
            n: common_vendor.t(dish.description)
          } : {}, {
            o: dish.categoryName
          }, dish.categoryName ? {
            p: common_vendor.t(dish.categoryName)
          } : {}, {
            q: common_vendor.o(($event) => onToggleSale(dish, $event), dish._id),
            r: "dbc77958-3-" + i0 + ",dbc77958-2",
            s: common_vendor.p({
              modelValue: dish.isOnSale
            }),
            t: common_vendor.o(() => {
            }, dish._id),
            v: common_vendor.n(dish.type),
            w: common_vendor.n({
              "swipe-animating": dishSwipeAnimating[dish._id]
            }),
            x: `translateX(${dishSwipeOffset[dish._id] || 0}px)`,
            y: common_vendor.o(($event) => onDishTouchStart($event, dish._id), dish._id),
            z: common_vendor.o(($event) => onDishTouchMove($event, dish._id), dish._id),
            A: common_vendor.o(($event) => onDishTouchEnd($event, dish._id), dish._id),
            B: common_vendor.o(enterSortMode, dish._id),
            C: common_vendor.o(($event) => onDishCardTap(dish), dish._id)
          }) : common_vendor.e({
            D: dish.image
          }, dish.image ? {
            E: dish.image
          } : {
            F: common_vendor.t(dish.type === "coffee" ? "☕" : "🍲")
          }, {
            G: !dish.isOnSale
          }, !dish.isOnSale ? {} : {}, {
            H: dish.isRecommended
          }, dish.isRecommended ? {} : {}, {
            I: common_vendor.t(dish.name),
            J: dish.type === "coffee" && dish.temp
          }, dish.type === "coffee" && dish.temp ? {
            K: common_vendor.t(dish.temp === "ice" ? "❄" : "🔥"),
            L: common_vendor.t(dish.temp === "ice" ? "冰" : "热"),
            M: common_vendor.n(dish.temp)
          } : {}, {
            N: dish.description
          }, dish.description ? {
            O: common_vendor.t(dish.description)
          } : {}, {
            P: dish.categoryName
          }, dish.categoryName ? {
            Q: common_vendor.t(dish.categoryName)
          } : {}, {
            R: common_vendor.n(dish.type),
            S: common_vendor.n({
              "is-held": dragState.active && dragState.index === index
            }),
            T: common_vendor.o(($event) => onSortTouchStart($event, dish, index), dish._id),
            U: common_vendor.o(onSortTouchMove, dish._id),
            V: common_vendor.o(onSortTouchEnd, dish._id),
            W: common_vendor.o(noop, dish._id)
          }), {
            X: dish._id,
            Y: dragState.active && dragState.index === index ? 1 : "",
            Z: dragState.active && dragState.index !== index ? 1 : "",
            aa: common_vendor.s(getDragItemStyle(index))
          });
        }),
        z: !sortMode.value,
        A: !sortMode.value,
        B: common_vendor.p({
          name: "dish"
        })
      } : {
        C: common_vendor.p({
          text: menuType.value === "coffee" ? "还没有咖啡菜品，点击右下角添加吧" : "还没有美食菜品，点击右下角添加吧",
          icon: menuType.value === "coffee" ? "☕" : "🍲"
        })
      }), {
        D: common_vendor.o(closeDishSwipe, "c4")
      }) : common_vendor.e({
        E: common_vendor.f(orderFilters, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: f.value,
            c: orderFilter.value === f.value ? 1 : "",
            d: common_vendor.o(($event) => orderFilter.value = f.value, f.value)
          };
        }),
        F: loadingOrders.value && orderList.value.length === 0
      }, loadingOrders.value && orderList.value.length === 0 ? {
        G: common_vendor.p({
          type: "card",
          count: 3
        })
      } : filteredOrders.value.length ? {
        I: common_vendor.f(filteredOrders.value, (order, idx, i0) => {
          return common_vendor.e({
            a: order.status === "pending"
          }, order.status === "pending" ? {
            b: common_vendor.o(($event) => onOrderSwipeCancel(order), order._id)
          } : {}, {
            c: common_vendor.o(($event) => onOrderSwipeDelete(order), order._id),
            d: common_vendor.o(() => {
            }, order._id),
            e: common_vendor.t(order.summaryEmoji || "🍽️"),
            f: common_vendor.t(order.summary || "订单详情"),
            g: common_vendor.t(formatOrderTime(order.createTime)),
            h: order.userName
          }, order.userName ? {
            i: common_vendor.t(order.userName)
          } : {}, {
            j: "dbc77958-6-" + i0,
            k: common_vendor.p({
              status: order.status
            }),
            l: orderFlashMap[order._id] ? 1 : "",
            m: orderSwipeAnimating[order._id] ? 1 : "",
            n: `translateX(${orderSwipeOffset[order._id] || 0}px)`,
            o: common_vendor.o(($event) => onOrderTouchStart($event, order._id), order._id),
            p: common_vendor.o(($event) => onOrderTouchMove($event, order._id), order._id),
            q: common_vendor.o(($event) => onOrderTouchEnd($event, order._id), order._id),
            r: common_vendor.o(($event) => onOrderCardTap(order), order._id),
            s: order._id,
            t: `${idx * 60}ms`
          });
        })
      } : {
        J: common_vendor.p({
          text: orderEmptyText.value,
          icon: "📋"
        })
      }, {
        H: filteredOrders.value.length,
        K: common_vendor.o(closeOrderSwipe, "74")
      }), {
        L: !dragState.active,
        M: refreshing.value,
        N: common_vendor.o(onPaneRefresh, "5a"),
        O: sortMode.value && activeTab.value === "menu"
      }, sortMode.value && activeTab.value === "menu" ? {
        P: common_vendor.o(exitSortMode, "90")
      } : {}, {
        Q: !sortMode.value && activeTab.value === "menu"
      }, !sortMode.value && activeTab.value === "menu" ? {
        R: common_vendor.p({
          name: "plus",
          size: 28,
          color: "#fff"
        }),
        S: common_vendor.o(onAddDish, "48")
      } : {}, {
        T: common_vendor.o(($event) => dishForm.name = $event, "11"),
        U: common_vendor.p({
          label: "菜品名称",
          placeholder: "如：拿铁咖啡",
          required: true,
          error: dishFormError.value,
          modelValue: dishForm.name
        }),
        V: !dishForm.image && !uploading.value
      }, !dishForm.image && !uploading.value ? {
        W: common_vendor.p({
          name: "upload",
          size: 32,
          color: "#A8A29E"
        })
      } : uploading.value ? {
        Y: common_vendor.t(uploadProgress.value)
      } : {
        Z: dishForm.image
      }, {
        X: uploading.value,
        aa: common_vendor.o(onChooseImage, "db"),
        ab: common_vendor.o(($event) => dishForm.description = $event, "ea"),
        ac: common_vendor.p({
          label: "描述",
          type: "textarea",
          placeholder: "简单描述一下这道菜品...",
          maxlength: 100,
          modelValue: dishForm.description
        }),
        ad: dishForm.type === "coffee" ? 1 : "",
        ae: common_vendor.o(($event) => onTypeChange("coffee"), "c5"),
        af: dishForm.type === "food" ? 1 : "",
        ag: common_vendor.o(($event) => onTypeChange("food"), "ec"),
        ah: dishForm.type === "coffee"
      }, dishForm.type === "coffee" ? {
        ai: dishForm.temp === "ice" ? 1 : "",
        aj: common_vendor.o(($event) => dishForm.temp = "ice", "d6"),
        ak: dishForm.temp === "hot" ? 1 : "",
        al: common_vendor.o(($event) => dishForm.temp = "hot", "fc")
      } : {}, {
        am: availableCategories.value.length
      }, availableCategories.value.length ? {
        an: !dishForm.categoryId ? 1 : "",
        ao: common_vendor.o(($event) => dishForm.categoryId = "", "cc"),
        ap: common_vendor.f(availableCategories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat._id,
            c: dishForm.categoryId === cat._id ? 1 : "",
            d: common_vendor.o(($event) => dishForm.categoryId = cat._id, cat._id)
          };
        })
      } : {
        aq: common_vendor.o(openCategoryManager, "65")
      }, {
        ar: common_vendor.o(($event) => dishForm.isOnSale = $event, "a7"),
        as: common_vendor.p({
          modelValue: dishForm.isOnSale
        }),
        at: common_vendor.o(($event) => dishForm.isRecommended = $event, "95"),
        av: common_vendor.p({
          modelValue: dishForm.isRecommended
        }),
        aw: common_vendor.o(closeDishForm, "05"),
        ax: common_vendor.t(saving.value ? "保存中..." : "保存"),
        ay: saving.value ? 1 : "",
        az: common_vendor.o(onSaveDish, "4f"),
        aA: common_vendor.o(closeDishForm, "45"),
        aB: common_vendor.p({
          visible: dishFormVisible.value,
          title: editingDishId.value ? "编辑菜品" : "新增菜品",
          ["max-height"]: "76vh"
        }),
        aC: catFormVisible.value
      }, catFormVisible.value ? {
        aD: common_vendor.o(($event) => catForm.name = $event, "44"),
        aE: common_vendor.p({
          label: "分类名称",
          placeholder: "如：拿铁系列、甜品",
          required: true,
          error: catFormError.value,
          maxlength: 20,
          modelValue: catForm.name
        }),
        aF: common_vendor.o(cancelCatForm, "bc"),
        aG: common_vendor.t(editingCatId.value ? "保存" : "添加"),
        aH: common_vendor.o(onSaveCategory, "ab")
      } : {}, {
        aI: currentCategories.value.length
      }, currentCategories.value.length ? {
        aJ: common_vendor.f(currentCategories.value, (cat, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(cat.name),
            b: cat.name === "推荐"
          }, cat.name === "推荐" ? {} : {}, {
            c: "dbc77958-18-" + i0 + ",dbc77958-16",
            d: idx === 0 ? 1 : "",
            e: common_vendor.o(($event) => moveCategory(currentCategories.value, idx, -1), cat._id),
            f: "dbc77958-19-" + i0 + ",dbc77958-16",
            g: idx === currentCategories.value.length - 1 ? 1 : "",
            h: common_vendor.o(($event) => moveCategory(currentCategories.value, idx, 1), cat._id),
            i: "dbc77958-20-" + i0 + ",dbc77958-16",
            j: common_vendor.o(($event) => onEditCategory(cat), cat._id),
            k: cat.name !== "推荐"
          }, cat.name !== "推荐" ? {
            l: "dbc77958-21-" + i0 + ",dbc77958-16",
            m: common_vendor.p({
              name: "trash",
              size: 16
            }),
            n: common_vendor.o(($event) => onDeleteCategory(cat), cat._id)
          } : {}, {
            o: cat._id
          });
        }),
        aK: common_vendor.p({
          name: "chevron-up",
          size: 16
        }),
        aL: common_vendor.p({
          name: "chevron-down",
          size: 16
        }),
        aM: common_vendor.p({
          name: "edit",
          size: 16
        })
      } : {}, {
        aN: !currentCategories.value.length && !catFormVisible.value
      }, !currentCategories.value.length && !catFormVisible.value ? {
        aO: common_vendor.p({
          text: "还没有分类，先添加一个吧",
          icon: "📂"
        })
      } : {}, {
        aP: !catFormVisible.value
      }, !catFormVisible.value ? {
        aQ: common_vendor.p({
          name: "plus",
          size: 18,
          color: "#6F4E37"
        }),
        aR: common_vendor.o(onAddCategory, "20")
      } : {}, {
        aS: common_vendor.o(closeCategoryManager, "fa"),
        aT: common_vendor.p({
          visible: catManagerVisible.value,
          title: catManagerTitle.value,
          ["max-height"]: "85vh"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
