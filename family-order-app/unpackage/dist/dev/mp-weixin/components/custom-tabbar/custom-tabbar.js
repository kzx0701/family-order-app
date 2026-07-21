"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const store_cart = require("../../store/cart.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "custom-tabbar",
  setup(__props) {
    const userStore = store_user.useUserStore();
    store_cart.useCartStore();
    const allTabs = [
      { key: "home", text: "首页", icon: "home", path: "/pages/home/home" },
      { key: "order", text: "点单", icon: "utensils-crossed", path: "/pages/order/order" },
      { key: "record", text: "记录", icon: "clipboard-list", path: "/pages/record/record" },
      { key: "admin", text: "管理", icon: "settings", path: "/pages/admin/admin" }
    ];
    const visibleTabs = common_vendor.computed(() => {
      if (userStore.isAdmin)
        return allTabs;
      return allTabs.filter((t) => t.key !== "admin");
    });
    const activeKey = common_vendor.ref("home");
    common_vendor.onMounted(() => {
      syncActiveFromRoute();
    });
    const syncActiveFromRoute = () => {
      try {
        const pages = getCurrentPages();
        const current = pages[pages.length - 1];
        if (!current)
          return;
        const route = "/" + current.route;
        const matched = allTabs.find((t) => t.path === route);
        if (matched) {
          activeKey.value = matched.key;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at components/custom-tabbar/custom-tabbar.vue:61", "[custom-tabbar] syncActiveFromRoute error", e);
      }
    };
    const onTabTap = (tab) => {
      if (tab.key === activeKey.value)
        return;
      common_vendor.index.switchTab({ url: tab.path });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(visibleTabs.value, (tab, index, i0) => {
          return common_vendor.e({
            a: "51c48e3c-0-" + i0,
            b: common_vendor.p({
              name: tab.icon,
              size: 20
            }),
            c: tab.badge
          }, tab.badge ? {
            d: common_vendor.t(tab.badge)
          } : {}, {
            e: common_vendor.t(tab.text),
            f: tab.key,
            g: activeKey.value === tab.key ? 1 : "",
            h: common_vendor.o(($event) => onTabTap(tab), tab.key)
          });
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-51c48e3c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/custom-tabbar/custom-tabbar.js.map
