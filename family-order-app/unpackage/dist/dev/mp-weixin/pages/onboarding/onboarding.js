"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const utils_image = require("../../utils/image.js");
const utils_artwork = require("../../utils/artwork.js");
const utils_authGuard = require("../../utils/auth-guard.js");
const _sfc_main = {
  __name: "onboarding",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const headerTop = common_vendor.computed(() => statusBarHeight.value + 48);
    const step = common_vendor.ref(1);
    const pickedGender = common_vendor.ref("");
    const pickedMode = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const genderArt = {
      male: utils_image.imgUrl(utils_artwork.AVATAR_ART.male, { w: utils_artwork.AVATAR_ART_WIDTH }),
      female: utils_image.imgUrl(utils_artwork.AVATAR_ART.female, { w: utils_artwork.AVATAR_ART_WIDTH })
    };
    const canGoNext = common_vendor.computed(() => step.value === 1 ? !!pickedGender.value : !!pickedMode.value);
    common_vendor.onLoad(() => {
      if (userStore.onboardingCompleted) {
        common_vendor.index.reLaunch({ url: utils_authGuard.HOME_PATH });
      }
    });
    const goStep = (target) => {
      if (submitting.value)
        return;
      step.value = target;
    };
    const onPrimary = () => {
      if (submitting.value || !canGoNext.value)
        return;
      if (step.value === 1) {
        goStep(2);
        return;
      }
      submit({ gender: pickedGender.value, mode: pickedMode.value });
    };
    const onSkip = () => {
      if (submitting.value)
        return;
      submit({});
    };
    const submit = async (payload) => {
      submitting.value = true;
      try {
        await userStore.completeOnboarding(payload);
        common_vendor.index.showToast({ title: "设置好啦", icon: "none" });
        setTimeout(() => {
          common_vendor.index.reLaunch({ url: utils_authGuard.HOME_PATH });
        }, 500);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/onboarding/onboarding.vue:228", "[onboarding] submit error", e);
        common_vendor.index.showToast({ title: e.message || "保存失败，请重试", icon: "none" });
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: step.value === 1 ? 1 : "",
        b: step.value > 1 ? 1 : "",
        c: step.value === 2 ? 1 : "",
        d: common_vendor.t(step.value === 1 ? "你是男生还是女生" : "平时谁做饭呢"),
        e: common_vendor.t(step.value === 1 ? "用来给你配一张默认头像" : "选好身份，就能开始了"),
        f: headerTop.value + "px",
        g: step.value === 1
      }, step.value === 1 ? common_vendor.e({
        h: genderArt.female,
        i: pickedGender.value === "female"
      }, pickedGender.value === "female" ? {} : {}, {
        j: pickedGender.value === "female" ? 1 : "",
        k: common_vendor.o(($event) => pickedGender.value = "female", "88"),
        l: genderArt.male,
        m: pickedGender.value === "male"
      }, pickedGender.value === "male" ? {} : {}, {
        n: pickedGender.value === "male" ? 1 : "",
        o: common_vendor.o(($event) => pickedGender.value = "male", "e9")
      }) : common_vendor.e({
        p: pickedMode.value === "diner" ? 1 : "",
        q: pickedMode.value === "diner"
      }, pickedMode.value === "diner" ? {} : {}, {
        r: pickedMode.value === "diner" ? 1 : "",
        s: common_vendor.o(($event) => pickedMode.value = "diner", "70"),
        t: pickedMode.value === "cook" ? 1 : "",
        v: pickedMode.value === "cook"
      }, pickedMode.value === "cook" ? {} : {}, {
        w: pickedMode.value === "cook" ? 1 : "",
        x: common_vendor.o(($event) => pickedMode.value = "cook", "24")
      }), {
        y: step.value === 2
      }, step.value === 2 ? {
        z: submitting.value ? 1 : "",
        A: common_vendor.o(($event) => goStep(1), "bf")
      } : {}, {
        B: common_vendor.t(submitting.value ? "保存中…" : step.value === 1 ? "下一步" : "进入小程序"),
        C: !canGoNext.value || submitting.value ? 1 : "",
        D: common_vendor.o(onPrimary, "34"),
        E: common_vendor.o(onSkip, "e3")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-739199e6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/onboarding/onboarding.js.map
