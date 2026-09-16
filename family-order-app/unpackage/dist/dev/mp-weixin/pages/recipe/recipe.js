"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
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
  __name: "recipe",
  setup(__props) {
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const headerTop = common_vendor.computed(() => {
      var _a;
      const bottom = (_a = menuButton.value) == null ? void 0 : _a.bottom;
      return bottom ? Math.round(bottom + 6) : statusBarHeight.value + 42;
    });
    const showPreviewTip = () => {
      common_vendor.index.showToast({ title: "菜谱配置将在下一步接入", icon: "none" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).isCook
      }, common_vendor.unref(userStore).isCook ? {
        b: common_vendor.p({
          name: "settings",
          size: 18,
          ["stroke-width"]: 2.2
        }),
        c: common_vendor.o(showPreviewTip, "a4")
      } : {}, {
        d: headerTop.value + "px"
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb437fc6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe/recipe.js.map
