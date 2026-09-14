"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_default_avatar2 = common_vendor.resolveComponent("default-avatar");
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_default_avatar2 + _easycom_Icon2 + _easycom_custom_tabbar2)();
}
const _easycom_default_avatar = () => "../../components/default-avatar/default-avatar.js";
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_default_avatar + _easycom_Icon + _easycom_custom_tabbar)();
}
const _sfc_main = {
  __name: "my",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const familyName = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.userInfo) == null ? void 0 : _a.familyName) || "我的家庭";
    });
    const modeLabel = common_vendor.computed(() => userStore.isAdmin ? "做饭人" : "干饭人");
    const goRecords = () => {
      common_vendor.index.navigateTo({ url: "/pages/record/record" });
    };
    const showPreviewTip = (title) => {
      common_vendor.index.showToast({ title, icon: "none" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(statusBarHeight) + 28 + "px",
        b: common_vendor.unref(userStore).avatar
      }, common_vendor.unref(userStore).avatar ? {
        c: common_vendor.unref(userStore).avatar
      } : {
        d: common_vendor.p({
          role: common_vendor.unref(userStore).isAdmin ? "admin" : "orderer"
        })
      }, {
        e: common_vendor.t(common_vendor.unref(userStore).nickname || "家庭成员"),
        f: common_vendor.t(modeLabel.value),
        g: common_vendor.unref(userStore).isAdmin ? 1 : "",
        h: common_vendor.p({
          name: "edit",
          size: 17,
          ["stroke-width"]: 2.2
        }),
        i: common_vendor.o(($event) => showPreviewTip("个人资料将在后续接入"), "7c"),
        j: common_vendor.p({
          name: "home",
          size: 21,
          ["stroke-width"]: 2.2
        }),
        k: common_vendor.t(familyName.value),
        l: common_vendor.t(modeLabel.value),
        m: common_vendor.p({
          name: "chevron-right",
          size: 15,
          ["stroke-width"]: 2.3
        }),
        n: common_vendor.o(($event) => showPreviewTip("身份切换将在登录改造中接入"), "75"),
        o: common_vendor.p({
          name: "chevron-right",
          size: 19,
          ["stroke-width"]: 2.4
        }),
        p: common_vendor.o(goRecords, "6e")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f1ef635"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my/my.js.map
