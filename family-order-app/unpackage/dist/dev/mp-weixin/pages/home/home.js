"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const utils_image = require("../../utils/image.js");
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
const ENTRY_ART_WIDTH = 960;
const SCENE_ART_WIDTH = 480;
const _sfc_main = {
  __name: "home",
  setup(__props) {
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const cartStore = store_cart.useCartStore();
    const orders = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const headerTop = common_vendor.computed(() => {
      var _a;
      const bottom = (_a = menuButton.value) == null ? void 0 : _a.bottom;
      return bottom ? Math.round(bottom + 6) : statusBarHeight.value + 42;
    });
    const entryArt = {
      food: utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-6356c060-78ee-47d4-a481-a3b61fdf2c3e.png", { w: ENTRY_ART_WIDTH }),
      coffee: utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-a8278d19-e4a0-4e8d-9a1c-83483951710b.png", { w: ENTRY_ART_WIDTH })
    };
    const entryTitleArt = {
      food: utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%88%91%E8%A6%81%E5%B9%B2%E9%A5%AD-standardized.png", { w: ENTRY_ART_WIDTH }),
      coffee: utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/title-%E6%9D%A5%E6%9D%AF%E5%92%96%E5%95%A1-standardized.png", { w: ENTRY_ART_WIDTH })
    };
    const SCENES = [
      { key: "morning", from: 5, to: 11, title: "早呀，饿了吗", sub: "今天第一口，想吃点什么" },
      { key: "noon", from: 11, to: 14, title: "到饭点啦", sub: "看看家里能做点什么" },
      { key: "afternoon", from: 14, to: 18, title: "下午茶时间", sub: "来杯咖啡，还是先点个菜" },
      { key: "evening", from: 18, to: 22, title: "今晚吃什么", sub: "家里的饭，总有点不一样" },
      { key: "night", from: 22, to: 24, title: "还没睡呀", sub: "小声点单，别吵醒饲养员" }
    ];
    const currentHour = common_vendor.ref((/* @__PURE__ */ new Date()).getHours());
    const currentScene = common_vendor.computed(
      () => SCENES.find((s) => currentHour.value >= s.from && currentHour.value < s.to) || SCENES[SCENES.length - 1]
    );
    const sceneTitle = common_vendor.computed(() => currentScene.value.title);
    const sceneSub = common_vendor.computed(() => currentScene.value.sub);
    const SCENE_ART_SOURCE = {
      morning: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-51031047-c358-406f-8339-f837b96e9c7b.png",
      noon: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-7b6620ff-7380-4c40-8933-c2fc7ca33375.png",
      afternoon: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-a653e17c-4186-4c05-b069-07d47e146b62.png",
      evening: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/scene-18-22-%E6%99%9A%E4%B8%8A-v2-512.png",
      night: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9C%BA%E6%99%AF/exec-a9988768-ab65-498e-b4dc-770b1d9ef4dc.png"
    };
    const sceneArt = Object.fromEntries(
      Object.entries(SCENE_ART_SOURCE).map(([key, url]) => [
        key,
        url ? utils_image.imgUrl(url, { w: SCENE_ART_WIDTH }) : ""
      ])
    );
    const sceneArtSrc = common_vendor.computed(() => sceneArt[currentScene.value.key] || "");
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
            token: userStore.token
          }
        });
        if (((_a = res.result) == null ? void 0 : _a.code) === 0)
          orders.value = res.result.list || [];
      } catch (e) {
        common_vendor.index.__f__("warn", "at pages/home/home.vue:249", "[home] recent orders unavailable during phase2 shell preview", e);
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
    common_vendor.onShow(() => {
      currentHour.value = (/* @__PURE__ */ new Date()).getHours();
      loadOrders();
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadOrders();
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(sceneTitle.value),
        b: common_vendor.t(sceneSub.value),
        c: sceneArtSrc.value
      }, sceneArtSrc.value ? {
        d: sceneArtSrc.value
      } : {}, {
        e: headerTop.value + "px",
        f: entryTitleArt.food,
        g: entryArt.food,
        h: common_vendor.o(($event) => goOrder("food"), "d0"),
        i: entryTitleArt.coffee,
        j: entryArt.coffee,
        k: common_vendor.o(($event) => goOrder("coffee"), "7f"),
        l: common_vendor.p({
          name: "chevron-right",
          size: 14,
          ["stroke-width"]: 2.3
        }),
        m: common_vendor.o(goMy, "4a"),
        n: loading.value && orders.value.length === 0
      }, loading.value && orders.value.length === 0 ? {
        o: common_vendor.f(2, (n, k0, i0) => {
          return {
            a: n
          };
        })
      } : displayOrders.value.length === 0 ? {} : {
        q: common_vendor.f(displayOrders.value, (order, index, i0) => {
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
        r: common_vendor.p({
          name: "chevron-right",
          size: 14,
          ["stroke-width"]: 2.4
        })
      }, {
        p: displayOrders.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
