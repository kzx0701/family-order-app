"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_authGuard = require("../../utils/auth-guard.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const ready = common_vendor.ref(false);
    const submitting = common_vendor.ref(false);
    common_vendor.onLoad(async () => {
      await userStore.restore();
      if (userStore.isLoggedIn) {
        common_vendor.index.__f__("log", "at pages/login/login.vue:66", "[login] 已登录，跳过登录页");
        common_vendor.index.reLaunch({ url: userStore.onboardingCompleted ? utils_authGuard.HOME_PATH : utils_authGuard.ONBOARDING_PATH });
        return;
      }
      ready.value = true;
    });
    const onLogin = async () => {
      if (submitting.value)
        return;
      submitting.value = true;
      try {
        await userStore.login();
        common_vendor.index.__f__("log", "at pages/login/login.vue:81", "[login] 登录成功", userStore.openid);
        common_vendor.index.reLaunch({ url: userStore.onboardingCompleted ? utils_authGuard.HOME_PATH : utils_authGuard.ONBOARDING_PATH });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:84", "[login] login error", e);
        common_vendor.index.showToast({ title: e.message || "登录失败，请重试", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: ready.value
      }, ready.value ? {
        b: common_vendor.t(submitting.value ? "登录中…" : "微信一键登录"),
        c: submitting.value ? 1 : "",
        d: common_vendor.o(onLogin, "56")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
