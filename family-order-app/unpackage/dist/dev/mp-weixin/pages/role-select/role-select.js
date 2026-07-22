"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "role-select",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const submitting = common_vendor.ref(false);
    const selectingRole = common_vendor.ref("");
    const onSelect = async (role) => {
      if (submitting.value)
        return;
      submitting.value = true;
      selectingRole.value = role;
      try {
        await userStore.setRole(role);
        common_vendor.index.showToast({
          title: role === "admin" ? "欢迎，大厨！" : "点单吧~",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.reLaunch({ url: "/pages/home/home" });
        }, 600);
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "设置失败", icon: "none" });
        submitting.value = false;
        selectingRole.value = "";
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(statusBarHeight) + 76 + "px",
        b: selectingRole.value === "orderer" ? 1 : "",
        c: common_vendor.p({
          name: "chevron-right",
          size: 14,
          color: "#6F4E37"
        }),
        d: selectingRole.value === "orderer" ? 1 : "",
        e: common_vendor.o(($event) => onSelect("orderer"), "47"),
        f: selectingRole.value === "admin" ? 1 : "",
        g: common_vendor.p({
          name: "chevron-right",
          size: 14,
          color: "#15803D"
        }),
        h: selectingRole.value === "admin" ? 1 : "",
        i: common_vendor.o(($event) => onSelect("admin"), "14")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e10c152c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/role-select/role-select.js.map
