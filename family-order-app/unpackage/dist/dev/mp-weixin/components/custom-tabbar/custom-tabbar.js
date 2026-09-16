"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "custom-tabbar",
  setup(__props) {
    const drawing = (content) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g stroke="#765540" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + content + "</g></svg>"
    );
    const allTabs = [
      {
        key: "home",
        text: "首页",
        path: "/pages/home/home",
        art: drawing('<path d="M9 18 10 33Q19 35 30 32L31 17" fill="#fffdf7"/><path d="M5 19Q12 10 20 5L35 18 31 21 20 11 9 22Z" fill="#f8c1b4"/><path d="m16 33 0-10q4-2 8 0l1 10" fill="#f9e8aa"/><path d="m27 7 0-3 4 1 0 7" fill="none"/>')
      },
      {
        key: "menu",
        text: "菜单",
        path: "/pages/order/order",
        art: drawing('<path d="m27 15 5-12m0 13 4-11" fill="none"/><path d="M7 21Q5 16 11 15Q10 10 17 12Q20 7 25 13Q31 11 32 21" fill="#fffdf7"/><path d="M5 21Q6 34 20 35Q33 34 35 20Q21 24 5 21Z" fill="#f9e8aa"/><path d="m12 27 2 1m12-1 2-1m-10 5q3 2 5-1" fill="none"/><path d="m15 15 3 1m5 1 2-2" stroke="#85a96f"/>')
      },
      {
        key: "recipe",
        text: "菜谱",
        path: "/pages/recipe/recipe",
        art: drawing('<path d="M8 6 29 5Q33 5 32 10L33 33 10 35Q5 35 6 30L5 11Q5 6 8 6Z" fill="#dbe8c8"/><path d="m11 7 1 23m-5 1q3-2 6-1l19-1" fill="none"/><path d="M17 15Q14 9 20 11Q24 6 26 12Q32 13 28 17L27 20 18 20Z" fill="#fffdf7"/><path d="m18 25 9-1" stroke="#85a96f"/>')
      },
      {
        key: "my",
        text: "我的",
        path: "/pages/my/my",
        art: drawing('<path d="M8 34Q8 25 17 25L24 25Q33 26 33 34Z" fill="#dceef1"/><path d="M12 13Q10 24 21 25Q31 24 29 13Z" fill="#fff1dd"/><path d="M11 17Q7 8 16 6Q20 2 25 7Q32 7 30 17L25 11 21 14 18 10 12 17Z" fill="#d3ac85"/><path d="m16 18 .2.4m9-.4 .2.4m-7 3q3 2 5-.4" fill="none"/>')
      }
    ];
    const activeKey = common_vendor.ref("home");
    const syncActiveFromRoute = () => {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const matched = allTabs.find((tab) => tab.path === "/" + (current == null ? void 0 : current.route));
      if (matched)
        activeKey.value = matched.key;
    };
    const onTabTap = (tab) => {
      if (tab.key === activeKey.value)
        return;
      common_vendor.index.switchTab({ url: tab.path });
    };
    common_vendor.onMounted(syncActiveFromRoute);
    common_vendor.onShow(syncActiveFromRoute);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(allTabs, (tab, k0, i0) => {
          return {
            a: tab.art,
            b: common_vendor.t(tab.text),
            c: tab.key,
            d: common_vendor.n({
              active: activeKey.value === tab.key
            }),
            e: common_vendor.n("tab-" + tab.key),
            f: tab.text,
            g: activeKey.value === tab.key,
            h: common_vendor.o(($event) => onTabTap(tab), tab.key)
          };
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-51c48e3c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/custom-tabbar/custom-tabbar.js.map
