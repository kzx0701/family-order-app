"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_Icon2 + _easycom_custom_tabbar2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_Icon + _easycom_custom_tabbar)();
}
const _sfc_main = {
  __name: "home",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const cartStore = store_cart.useCartStore();
    const orders = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const entryArt = {
      food: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-6356c060-78ee-47d4-a481-a3b61fdf2c3e.png",
      coffee: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-a8278d19-e4a0-4e8d-9a1c-83483951710b.png"
    };
    const entryTitleArt = {
      food: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%88%91%E8%A6%81%E5%B9%B2%E9%A5%AD-standardized.png",
      coffee: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%9D%A5%E6%9D%AF%E5%92%96%E5%95%A1-standardized.png"
    };
    const familyName = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.userInfo) == null ? void 0 : _a.familyName) || "我的家庭";
    });
    const greeting = common_vendor.computed(() => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour >= 5 && hour < 11)
        return "早安，开饭啦";
      if (hour >= 11 && hour < 14)
        return "午饭时间到";
      if (hour >= 14 && hour < 18)
        return "下午好呀";
      if (hour >= 18 && hour < 22)
        return "晚饭吃什么";
      return "夜宵也可以";
    });
    const greetingSub = common_vendor.computed(() => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour >= 5 && hour < 11)
        return "新的一天，从喜欢的味道开始";
      if (hour >= 11 && hour < 14)
        return "看看家里今天能做点什么";
      if (hour >= 14 && hour < 18)
        return "想喝咖啡，还是提前点个菜？";
      if (hour >= 18 && hour < 22)
        return "家里的饭，总有一点不一样";
      return "小声点单，别把做饭人吵醒啦";
    });
    const displayOrders = common_vendor.computed(() => orders.value.slice(0, 3));
    const loadOrders = async () => {
      var _a;
      if (loading.value || !userStore.token)
        return;
      loading.value = true;
      try {
        const res = await common_vendor.Vs.callFunction({
          name: "app-service",
          data: {
            module: "home-data",
            token: userStore.token,
            role: userStore.role
          }
        });
        if (((_a = res.result) == null ? void 0 : _a.code) === 0)
          orders.value = res.result.list || [];
      } catch (e) {
        common_vendor.index.__f__("warn", "at pages/home/home.vue:192", "[home] recent orders unavailable during phase2 shell preview", e);
      } finally {
        loading.value = false;
      }
    };
    const goOrder = (type) => {
      cartStore.setPendingType(type);
      common_vendor.index.switchTab({ url: "/pages/order/order" });
    };
    const goMy = () => {
      common_vendor.index.switchTab({ url: "/pages/my/my" });
    };
    const goOrderDetail = (order) => {
      if (!(order == null ? void 0 : order._id))
        return;
      common_vendor.index.navigateTo({ url: `/pages/order-detail/order-detail?id=${order._id}` });
    };
    const orderItems = (order) => Array.isArray(order == null ? void 0 : order.items) ? order.items : [];
    const orderSummary = (order) => {
      if (order == null ? void 0 : order.summary)
        return order.summary;
      const items = orderItems(order);
      if (!items.length)
        return "一份家庭点单";
      return items.map((item) => `${item.name} ×${item.quantity || 1}`).join("、");
    };
    const orderKind = (order) => {
      var _a;
      const type = (order == null ? void 0 : order.orderType) || ((_a = orderItems(order)[0]) == null ? void 0 : _a.type);
      return type === "coffee" ? "kind-coffee" : "kind-food";
    };
    const orderEmoji = (order) => orderKind(order) === "kind-coffee" ? "☕" : "🍚";
    const formatOrderTime = (timestamp) => {
      if (!timestamp)
        return "刚刚";
      const date = new Date(timestamp);
      const today = /* @__PURE__ */ new Date();
      const sameDay = date.toDateString() === today.toDateString();
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      if (sameDay)
        return `今天 ${hour}:${minute}`;
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    const statusLabel = (status) => ({
      pending: "等开饭",
      preparing: "制作中",
      completed: "已完成",
      cancelled: "已取消"
    })[status] || "等开饭";
    common_vendor.watch(
      () => userStore.token,
      (token) => {
        if (token && !orders.value.length)
          loadOrders();
      }
    );
    common_vendor.onShow(loadOrders);
    common_vendor.onPullDownRefresh(async () => {
      await loadOrders();
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(familyName.value),
        b: common_vendor.t(greeting.value),
        c: common_vendor.t(greetingSub.value),
        d: common_vendor.unref(statusBarHeight) + 28 + "px",
        e: entryTitleArt.food,
        f: entryArt.food,
        g: common_vendor.o(($event) => goOrder("food"), "3e"),
        h: entryTitleArt.coffee,
        i: entryArt.coffee,
        j: common_vendor.o(($event) => goOrder("coffee"), "fe"),
        k: common_vendor.p({
          name: "chevron-right",
          size: 14,
          ["stroke-width"]: 2.3
        }),
        l: common_vendor.o(goMy, "54"),
        m: loading.value && orders.value.length === 0
      }, loading.value && orders.value.length === 0 ? {
        n: common_vendor.f(2, (n, k0, i0) => {
          return {
            a: n
          };
        })
      } : displayOrders.value.length === 0 ? {} : {
        p: common_vendor.f(displayOrders.value, (order, index, i0) => {
          return {
            a: common_vendor.t(orderEmoji(order)),
            b: common_vendor.n(orderKind(order)),
            c: common_vendor.t(orderSummary(order)),
            d: common_vendor.t(order.userName || "家庭成员"),
            e: common_vendor.t(formatOrderTime(order.createTime)),
            f: common_vendor.t(statusLabel(order.status)),
            g: common_vendor.n(`status-${order.status || "pending"}`),
            h: "07e72d3c-1-" + i0,
            i: order._id,
            j: `${index * 70}ms`,
            k: common_vendor.o(($event) => goOrderDetail(order), order._id)
          };
        }),
        q: common_vendor.p({
          name: "chevron-right",
          size: 14,
          ["stroke-width"]: 2.4
        })
      }, {
        o: displayOrders.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
