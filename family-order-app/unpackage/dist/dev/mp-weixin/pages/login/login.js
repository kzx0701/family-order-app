"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_authGuard = require("../../utils/auth-guard.js");
const utils_artwork = require("../../utils/artwork.js");
const utils_image = require("../../utils/image.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const LOGIN_HERO_ART = utils_image.imgUrl(
      "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-42d08783-064c-4a45-91de-3518a7ec03e1.png",
      { w: 1080, q: 90 }
    );
    const ready = common_vendor.ref(false);
    const submitting = common_vendor.ref(false);
    common_vendor.onLoad(async () => {
      await userStore.restore();
      if (userStore.isLoggedIn) {
        common_vendor.index.__f__("log", "at pages/login/login.vue:91", "[login] 已登录，跳过登录页");
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
        common_vendor.index.__f__("log", "at pages/login/login.vue:106", "[login] 登录成功", userStore.openid);
        common_vendor.index.reLaunch({ url: userStore.onboardingCompleted ? utils_authGuard.HOME_PATH : utils_authGuard.ONBOARDING_PATH });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:109", "[login] login error", e);
        common_vendor.index.showToast({ title: e.message || "登录失败，请重试", icon: "none" });
      } finally {
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: ready.value
      }, ready.value ? {
        b: common_vendor.f(common_vendor.unref(utils_artwork.ONBOARDING_IMAGE_LIST), (src, k0, i0) => {
          return {
            a: src,
            b: src
          };
        }),
        c: common_vendor.unref(LOGIN_HERO_ART),
        d: common_vendor.p({
          name: "wechat",
          size: "44rpx",
          color: "#fffef9"
        }),
        e: common_vendor.t(submitting.value ? "登录中…" : "微信一键登录"),
        f: submitting.value ? 1 : "",
        g: common_vendor.o(onLogin, "bf")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
