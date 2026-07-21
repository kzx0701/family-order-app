"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useHeaderFixed = require("../../composables/useHeaderFixed.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_fo_switch2 = common_vendor.resolveComponent("fo-switch");
  const _component_transition_group = common_vendor.resolveComponent("transition-group");
  const _easycom_fo_empty2 = common_vendor.resolveComponent("fo-empty");
  const _easycom_order_card2 = common_vendor.resolveComponent("order-card");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  const _easycom_fo_input2 = common_vendor.resolveComponent("fo-input");
  const _easycom_fo_sheet2 = common_vendor.resolveComponent("fo-sheet");
  (_easycom_Icon2 + _easycom_skeleton2 + _easycom_fo_switch2 + _component_transition_group + _easycom_fo_empty2 + _easycom_order_card2 + _easycom_custom_tabbar2 + _easycom_fo_input2 + _easycom_fo_sheet2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_fo_switch = () => "../../components/fo-switch/fo-switch.js";
const _easycom_fo_empty = () => "../../components/fo-empty/fo-empty.js";
const _easycom_order_card = () => "../../components/order-card/order-card.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
const _easycom_fo_input = () => "../../components/fo-input/fo-input.js";
const _easycom_fo_sheet = () => "../../components/fo-sheet/fo-sheet.js";
if (!Math) {
  (_easycom_Icon + _easycom_skeleton + _easycom_fo_switch + _easycom_fo_empty + _easycom_order_card + _easycom_custom_tabbar + _easycom_fo_input + _easycom_fo_sheet)();
}
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const { headerHeight } = composables_useHeaderFixed.useHeaderFixed(".header");
    const userStore = store_user.useUserStore();
    const activeTab = common_vendor.ref("menu");
    const menuType = common_vendor.ref("coffee");
    const dishList = common_vendor.ref([]);
    const categoryList = common_vendor.ref([]);
    const loadingDishes = common_vendor.ref(false);
    const filteredDishes = common_vendor.computed(() => {
      return dishList.value.filter((d) => d.type === menuType.value);
    });
    const onMenuTypeChange = (type) => {
      if (menuType.value === type)
        return;
      menuType.value = type;
    };
    const coffeeCats = common_vendor.computed(() => categoryList.value.filter((c) => c.type === "coffee"));
    const foodCats = common_vendor.computed(() => categoryList.value.filter((c) => c.type === "food"));
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
      isRecommended: false
    });
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
    common_vendor.onMounted(() => {
      if (!userStore.isAdmin) {
        common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
        return;
      }
      loadDishes();
      loadCategories();
      loadOrders();
    });
    common_vendor.onPullDownRefresh(async () => {
      if (activeTab.value === "menu") {
        await Promise.all([loadDishes(), loadCategories()]);
      } else {
        await loadOrders();
      }
      common_vendor.index.stopPullDownRefresh();
    });
    const loadDishes = async () => {
      loadingDishes.value = true;
      try {
        const res = await common_vendor.wr.callFunction({
          name: "dishes-crud",
          data: { action: "list", token: userStore.token }
        });
        if (res.result.code === 0) {
          dishList.value = res.result.list;
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:527", "[admin] loadDishes error", e);
        common_vendor.index.showToast({ title: "加载菜品失败", icon: "none" });
      } finally {
        loadingDishes.value = false;
      }
    };
    const loadCategories = async () => {
      try {
        const res = await common_vendor.wr.callFunction({
          name: "categories-crud",
          data: { action: "list", token: userStore.token }
        });
        if (res.result.code === 0) {
          categoryList.value = res.result.list;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:544", "[admin] loadCategories error", e);
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
        const res = await common_vendor.wr.callFunction({
          name: "orders-crud",
          data: { action: "list", token: userStore.token, pageSize: 100 }
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
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:587", "[admin] loadOrders error", e);
        common_vendor.index.showToast({ title: "加载订单失败", icon: "none" });
      } finally {
        loadingOrders.value = false;
      }
    };
    const onOrderTap = ({ order }) => {
      common_vendor.index.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order._id}`
      });
    };
    const onOrderCancel = async ({ order }) => {
      const oldStatus = order.status;
      order.status = "cancelled";
      try {
        const res = await common_vendor.wr.callFunction({
          name: "orders-crud",
          data: {
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
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:626", "[admin] onOrderCancel error", e);
        order.status = oldStatus;
        common_vendor.index.showToast({ title: "取消失败", icon: "none" });
      }
    };
    const onSwitchRole = () => {
      common_vendor.index.showModal({
        title: "切换角色",
        content: "确定切换为下单人吗？切换后将隐藏管理功能，底部 tab 变为 3 个。",
        confirmText: "切换",
        confirmColor: "#6F4E37",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            common_vendor.index.showLoading({ title: "切换中...", mask: true });
            await userStore.setRole("orderer");
            common_vendor.index.hideLoading();
            common_vendor.index.reLaunch({ url: "/pages/home/home" });
          } catch (e) {
            common_vendor.index.hideLoading();
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:649", "[admin] onSwitchRole error", e);
            common_vendor.index.showToast({ title: e.message || "切换失败", icon: "none" });
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
    };
    const onChooseImage = () => {
      if (uploading.value)
        return;
      if (common_vendor.index.chooseMedia) {
        common_vendor.index.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          sizeType: ["compressed"],
          success: (res) => {
            if (res.tempFiles && res.tempFiles[0]) {
              uploadDishImage(res.tempFiles[0].tempFilePath);
            }
          },
          fail: (err) => {
            if (String(err.errMsg || "").indexOf("cancel") === -1) {
              common_vendor.index.__f__("error", "at pages/admin/admin.vue:719", "[admin] chooseMedia fail", err);
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
              common_vendor.index.__f__("error", "at pages/admin/admin.vue:734", "[admin] chooseImage fail", err);
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
        const res = await common_vendor.wr.uploadFile({
          filePath,
          cloudPath,
          onProgressCall: (p) => {
            uploadProgress.value = Math.floor(p.progress || 0);
          }
        });
        dishForm.image = res.fileID;
        common_vendor.index.showToast({ title: "上传成功", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:758", "[admin] uploadDishImage error", e);
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
          isRecommended: dishForm.isRecommended
        };
        if (editingDishId.value) {
          payload._id = editingDishId.value;
        }
        const res = await common_vendor.wr.callFunction({
          name: "dishes-crud",
          data: payload
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
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:804", "[admin] onSaveDish error", e);
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
            const r = await common_vendor.wr.callFunction({
              name: "dishes-crud",
              data: { action: "delete", token: userStore.token, _id: dish._id }
            });
            if (r.result.code !== 0) {
              common_vendor.index.showToast({ title: r.result.message || "删除失败", icon: "none" });
              return;
            }
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            dishList.value = dishList.value.filter((d) => d._id !== dish._id);
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:832", "[admin] onDeleteDish error", e);
            common_vendor.index.showToast({ title: "删除异常", icon: "none" });
          }
        }
      });
    };
    const onToggleSale = async (dish, value) => {
      const oldVal = dish.isOnSale;
      dish.isOnSale = value;
      try {
        const res = await common_vendor.wr.callFunction({
          name: "dishes-crud",
          data: { action: "toggleSale", token: userStore.token, _id: dish._id, isOnSale: value }
        });
        if (res.result.code !== 0) {
          dish.isOnSale = oldVal;
          common_vendor.index.showToast({ title: res.result.message || "切换失败", icon: "none" });
        }
      } catch (e) {
        dish.isOnSale = oldVal;
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:855", "[admin] onToggleSale error", e);
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
      catForm.type = "coffee";
      catFormError.value = "";
      editingCatId.value = "";
    };
    const onAddCategory = () => {
      resetCatForm();
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
        const res = await common_vendor.wr.callFunction({
          name: "categories-crud",
          data: payload
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
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:930", "[admin] onSaveCategory error", e);
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
            const r = await common_vendor.wr.callFunction({
              name: "categories-crud",
              data: { action: "delete", token: userStore.token, _id: cat._id }
            });
            if (r.result.code !== 0) {
              common_vendor.index.showToast({ title: r.result.message || "删除失败", icon: "none" });
              return;
            }
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await loadCategories();
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:955", "[admin] onDeleteCategory error", e);
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
        await common_vendor.wr.callFunction({
          name: "categories-crud",
          data: {
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
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:998", "[admin] moveCategory error", e);
        common_vendor.index.showToast({ title: "排序失败", icon: "none" });
        await loadCategories();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "utensils-crossed",
          size: 14
        }),
        b: common_vendor.o(onSwitchRole, "f4"),
        c: common_vendor.t(todayOrderCount.value),
        d: common_vendor.t(pendingOrderCount.value),
        e: pendingOrderCount.value > 0 ? 1 : "",
        f: pendingOrderCount.value > 0
      }, pendingOrderCount.value > 0 ? {} : {}, {
        g: common_vendor.unref(statusBarHeight) + 28 + "px",
        h: common_vendor.unref(headerHeight) + "px",
        i: activeTab.value === "menu" ? 1 : "",
        j: common_vendor.o(($event) => activeTab.value = "menu", "63"),
        k: activeTab.value === "orders" ? 1 : "",
        l: common_vendor.o(($event) => activeTab.value = "orders", "ca"),
        m: activeTab.value === "menu"
      }, activeTab.value === "menu" ? common_vendor.e({
        n: menuType.value === "coffee" ? 1 : "",
        o: common_vendor.o(($event) => onMenuTypeChange("coffee"), "4f"),
        p: menuType.value === "food" ? 1 : "",
        q: common_vendor.o(($event) => onMenuTypeChange("food"), "bc"),
        r: common_vendor.p({
          name: "settings",
          size: 16
        }),
        s: common_vendor.o(openCategoryManager, "8c"),
        t: loadingDishes.value && filteredDishes.value.length === 0
      }, loadingDishes.value && filteredDishes.value.length === 0 ? {
        v: common_vendor.p({
          type: "dish",
          count: 4
        })
      } : filteredDishes.value.length ? {
        x: common_vendor.f(filteredDishes.value, (dish, k0, i0) => {
          return common_vendor.e({
            a: dish.image
          }, dish.image ? {
            b: dish.image
          } : {
            c: common_vendor.t(dish.type === "coffee" ? "☕" : "🍲")
          }, {
            d: !dish.isOnSale
          }, !dish.isOnSale ? {} : {}, {
            e: dish.isRecommended
          }, dish.isRecommended ? {} : {}, {
            f: common_vendor.t(dish.name),
            g: dish.description
          }, dish.description ? {
            h: common_vendor.t(dish.description)
          } : {}, {
            i: dish.categoryName
          }, dish.categoryName ? {
            j: common_vendor.t(dish.categoryName)
          } : {}, {
            k: common_vendor.o(($event) => onToggleSale(dish, $event), dish._id),
            l: "dbc77958-4-" + i0 + ",dbc77958-3",
            m: common_vendor.p({
              modelValue: dish.isOnSale
            }),
            n: common_vendor.o(() => {
            }, dish._id),
            o: "dbc77958-5-" + i0 + ",dbc77958-3",
            p: common_vendor.o(($event) => onDeleteDish(dish), dish._id),
            q: common_vendor.o(() => {
            }, dish._id),
            r: dish._id,
            s: common_vendor.n(dish.type),
            t: common_vendor.o(($event) => onEditDish(dish), dish._id)
          });
        }),
        y: common_vendor.p({
          name: "trash",
          size: 18
        }),
        z: common_vendor.p({
          name: "dish"
        })
      } : {
        A: common_vendor.p({
          text: menuType.value === "coffee" ? "还没有咖啡菜品，点击右下角添加吧" : "还没有美食菜品，点击右下角添加吧",
          icon: menuType.value === "coffee" ? "☕" : "🍲"
        })
      }, {
        w: filteredDishes.value.length,
        B: common_vendor.p({
          name: "plus",
          size: 28,
          color: "#fff"
        }),
        C: common_vendor.o(onAddDish, "61")
      }) : common_vendor.e({
        D: common_vendor.f(orderFilters, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: f.value,
            c: orderFilter.value === f.value ? 1 : "",
            d: common_vendor.o(($event) => orderFilter.value = f.value, f.value)
          };
        }),
        E: loadingOrders.value && orderList.value.length === 0
      }, loadingOrders.value && orderList.value.length === 0 ? {
        F: common_vendor.p({
          type: "card",
          count: 3
        })
      } : filteredOrders.value.length ? {
        H: common_vendor.f(filteredOrders.value, (order, idx, i0) => {
          return {
            a: order._id,
            b: `${idx * 60}ms`,
            c: common_vendor.o(onOrderTap, order._id),
            d: common_vendor.o(onOrderCancel, order._id),
            e: "dbc77958-9-" + i0,
            f: common_vendor.p({
              order,
              ["show-user"]: true,
              cancelable: true
            })
          };
        })
      } : {
        I: common_vendor.p({
          text: orderEmptyText.value,
          icon: "📋"
        })
      }, {
        G: filteredOrders.value.length
      }), {
        J: common_vendor.o(($event) => dishForm.name = $event, "da"),
        K: common_vendor.p({
          label: "菜品名称",
          placeholder: "如：拿铁咖啡",
          required: true,
          error: dishFormError.value,
          modelValue: dishForm.name
        }),
        L: !dishForm.image && !uploading.value
      }, !dishForm.image && !uploading.value ? {
        M: common_vendor.p({
          name: "upload",
          size: 32,
          color: "#A8A29E"
        })
      } : uploading.value ? {
        O: common_vendor.t(uploadProgress.value)
      } : {
        P: dishForm.image
      }, {
        N: uploading.value,
        Q: common_vendor.o(onChooseImage, "50"),
        R: common_vendor.o(($event) => dishForm.description = $event, "a3"),
        S: common_vendor.p({
          label: "描述",
          type: "textarea",
          placeholder: "简单描述一下这道菜品...",
          maxlength: 100,
          modelValue: dishForm.description
        }),
        T: dishForm.type === "coffee" ? 1 : "",
        U: common_vendor.o(($event) => onTypeChange("coffee"), "24"),
        V: dishForm.type === "food" ? 1 : "",
        W: common_vendor.o(($event) => onTypeChange("food"), "3c"),
        X: availableCategories.value.length
      }, availableCategories.value.length ? {
        Y: !dishForm.categoryId ? 1 : "",
        Z: common_vendor.o(($event) => dishForm.categoryId = "", "25"),
        aa: common_vendor.f(availableCategories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat._id,
            c: dishForm.categoryId === cat._id ? 1 : "",
            d: common_vendor.o(($event) => dishForm.categoryId = cat._id, cat._id)
          };
        })
      } : {
        ab: common_vendor.o(openCategoryManager, "73")
      }, {
        ac: common_vendor.o(($event) => dishForm.isOnSale = $event, "3b"),
        ad: common_vendor.p({
          modelValue: dishForm.isOnSale
        }),
        ae: common_vendor.o(($event) => dishForm.isRecommended = $event, "a4"),
        af: common_vendor.p({
          modelValue: dishForm.isRecommended
        }),
        ag: common_vendor.o(closeDishForm, "7d"),
        ah: common_vendor.t(saving.value ? "保存中..." : "保存"),
        ai: saving.value ? 1 : "",
        aj: common_vendor.o(onSaveDish, "3a"),
        ak: common_vendor.o(closeDishForm, "61"),
        al: common_vendor.p({
          visible: dishFormVisible.value,
          title: editingDishId.value ? "编辑菜品" : "新增菜品",
          ["max-height"]: "88vh"
        }),
        am: catFormVisible.value
      }, catFormVisible.value ? {
        an: common_vendor.o(($event) => catForm.name = $event, "d8"),
        ao: common_vendor.p({
          label: "分类名称",
          placeholder: "如：拿铁系列、甜品",
          required: true,
          error: catFormError.value,
          maxlength: 20,
          modelValue: catForm.name
        }),
        ap: catForm.type === "coffee" ? 1 : "",
        aq: common_vendor.o(($event) => catForm.type = "coffee", "6f"),
        ar: catForm.type === "food" ? 1 : "",
        as: common_vendor.o(($event) => catForm.type = "food", "0a"),
        at: common_vendor.o(cancelCatForm, "88"),
        av: common_vendor.t(editingCatId.value ? "保存" : "添加"),
        aw: common_vendor.o(onSaveCategory, "54")
      } : {}, {
        ax: coffeeCats.value.length
      }, coffeeCats.value.length ? {
        ay: common_vendor.f(coffeeCats.value, (cat, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(cat.name),
            b: cat.name === "推荐"
          }, cat.name === "推荐" ? {} : {}, {
            c: "dbc77958-20-" + i0 + ",dbc77958-18",
            d: idx === 0 ? 1 : "",
            e: common_vendor.o(($event) => moveCategory(coffeeCats.value, idx, -1), cat._id),
            f: "dbc77958-21-" + i0 + ",dbc77958-18",
            g: idx === coffeeCats.value.length - 1 ? 1 : "",
            h: common_vendor.o(($event) => moveCategory(coffeeCats.value, idx, 1), cat._id),
            i: "dbc77958-22-" + i0 + ",dbc77958-18",
            j: common_vendor.o(($event) => onEditCategory(cat), cat._id),
            k: cat.name !== "推荐"
          }, cat.name !== "推荐" ? {
            l: "dbc77958-23-" + i0 + ",dbc77958-18",
            m: common_vendor.p({
              name: "trash",
              size: 16
            }),
            n: common_vendor.o(($event) => onDeleteCategory(cat), cat._id)
          } : {}, {
            o: cat._id
          });
        }),
        az: common_vendor.p({
          name: "chevron-up",
          size: 16
        }),
        aA: common_vendor.p({
          name: "chevron-down",
          size: 16
        }),
        aB: common_vendor.p({
          name: "edit",
          size: 16
        })
      } : {}, {
        aC: foodCats.value.length
      }, foodCats.value.length ? {
        aD: common_vendor.f(foodCats.value, (cat, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(cat.name),
            b: cat.name === "推荐"
          }, cat.name === "推荐" ? {} : {}, {
            c: "dbc77958-24-" + i0 + ",dbc77958-18",
            d: idx === 0 ? 1 : "",
            e: common_vendor.o(($event) => moveCategory(foodCats.value, idx, -1), cat._id),
            f: "dbc77958-25-" + i0 + ",dbc77958-18",
            g: idx === foodCats.value.length - 1 ? 1 : "",
            h: common_vendor.o(($event) => moveCategory(foodCats.value, idx, 1), cat._id),
            i: "dbc77958-26-" + i0 + ",dbc77958-18",
            j: common_vendor.o(($event) => onEditCategory(cat), cat._id),
            k: cat.name !== "推荐"
          }, cat.name !== "推荐" ? {
            l: "dbc77958-27-" + i0 + ",dbc77958-18",
            m: common_vendor.p({
              name: "trash",
              size: 16
            }),
            n: common_vendor.o(($event) => onDeleteCategory(cat), cat._id)
          } : {}, {
            o: cat._id
          });
        }),
        aE: common_vendor.p({
          name: "chevron-up",
          size: 16
        }),
        aF: common_vendor.p({
          name: "chevron-down",
          size: 16
        }),
        aG: common_vendor.p({
          name: "edit",
          size: 16
        })
      } : {}, {
        aH: !coffeeCats.value.length && !foodCats.value.length && !catFormVisible.value
      }, !coffeeCats.value.length && !foodCats.value.length && !catFormVisible.value ? {
        aI: common_vendor.p({
          text: "还没有分类，先添加一个吧",
          icon: "📂"
        })
      } : {}, {
        aJ: !catFormVisible.value
      }, !catFormVisible.value ? {
        aK: common_vendor.p({
          name: "plus",
          size: 18,
          color: "#6F4E37"
        }),
        aL: common_vendor.o(onAddCategory, "7e")
      } : {}, {
        aM: common_vendor.o(closeCategoryManager, "89"),
        aN: common_vendor.p({
          visible: catManagerVisible.value,
          title: "分类管理",
          ["max-height"]: "85vh"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
