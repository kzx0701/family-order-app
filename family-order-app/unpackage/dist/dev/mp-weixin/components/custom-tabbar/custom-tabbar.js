"use strict";
const common_vendor = require("../../common/vendor.js");
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
    const allTabs = [
      { key: "home", text: "首页", icon: "home", path: "/pages/home/home" },
      { key: "menu", text: "菜单", icon: "food", path: "/pages/order/order" },
      { key: "recipe", text: "菜谱", icon: "book-open", path: "/pages/recipe/recipe" },
      { key: "my", text: "我的", icon: "user", path: "/pages/my/my" }
    ];
    const activeKey = common_vendor.ref("home");
    const syncActiveFromRoute = () => {
      try {
        const pages = getCurrentPages();
        const current = pages[pages.length - 1];
        if (!current)
          return;
        const route = "/" + current.route;
        const matched = allTabs.find((tab) => tab.path === route);
        if (matched)
          activeKey.value = matched.key;
      } catch (e) {
        common_vendor.index.__f__("error", "at components/custom-tabbar/custom-tabbar.vue:44", "[custom-tabbar] syncActiveFromRoute error", e);
      }
    };
    const onTabTap = (tab) => {
      if (tab.key === activeKey.value)
        return;
      common_vendor.index.switchTab({ url: tab.path });
    };
    common_vendor.onMounted(syncActiveFromRoute);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(allTabs, (tab, k0, i0) => {
          return {
            a: "51c48e3c-0-" + i0,
            b: common_vendor.p({
              name: tab.icon,
              size: 21,
              ["stroke-width"]: 2.2
            }),
            c: common_vendor.t(tab.text),
            d: tab.key,
            e: common_vendor.n({
              active: activeKey.value === tab.key
            }),
            f: common_vendor.n(`tab-${tab.key}`),
            g: common_vendor.o(($event) => onTabTap(tab), tab.key)
          };
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-51c48e3c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/custom-tabbar/custom-tabbar.js.map
