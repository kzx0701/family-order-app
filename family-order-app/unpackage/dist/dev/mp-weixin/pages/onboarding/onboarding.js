"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
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
    const { gender: genderArt, role: roleArt, bg: CARD_BG } = utils_artwork.ONBOARDING_ART;
    const canGoNext = common_vendor.computed(() => step.value === 1 ? !!pickedGender.value : !!pickedMode.value);
    const isDimmed = (picked, key) => !!picked && picked !== key;
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
        common_vendor.index.reLaunch({ url: utils_authGuard.HOME_PATH });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/onboarding/onboarding.vue:236", "[onboarding] submit error", e);
        common_vendor.index.showToast({ title: e.message || "保存失败，请重试", icon: "none" });
        submitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: step.value === 1 ? 1 : "",
        b: step.value > 1 ? 1 : "",
        c: step.value > 1 ? 1 : "",
        d: common_vendor.o(($event) => goStep(1), "80"),
        e: step.value === 2 ? 1 : "",
        f: common_vendor.t(step.value === 1 ? "你是男生还是女生" : "平时谁做饭呢"),
        g: headerTop.value + "px",
        h: step.value === 1
      }, step.value === 1 ? {
        i: common_vendor.unref(CARD_BG).female,
        j: common_vendor.unref(genderArt).female,
        k: pickedGender.value === "female" ? 1 : "",
        l: isDimmed(pickedGender.value, "female") ? 1 : "",
        m: common_vendor.o(($event) => pickedGender.value = "female", "d7"),
        n: common_vendor.unref(CARD_BG).male,
        o: common_vendor.unref(genderArt).male,
        p: pickedGender.value === "male" ? 1 : "",
        q: isDimmed(pickedGender.value, "male") ? 1 : "",
        r: common_vendor.o(($event) => pickedGender.value = "male", "0e")
      } : {
        s: common_vendor.unref(CARD_BG).diner,
        t: common_vendor.unref(roleArt).diner,
        v: pickedMode.value === "diner" ? 1 : "",
        w: isDimmed(pickedMode.value, "diner") ? 1 : "",
        x: common_vendor.o(($event) => pickedMode.value = "diner", "76"),
        y: common_vendor.unref(CARD_BG).cook,
        z: common_vendor.unref(roleArt).cook,
        A: pickedMode.value === "cook" ? 1 : "",
        B: isDimmed(pickedMode.value, "cook") ? 1 : "",
        C: common_vendor.o(($event) => pickedMode.value = "cook", "c6")
      }, {
        D: common_vendor.t(submitting.value ? "保存中…" : step.value === 1 ? "下一步" : "进入小程序"),
        E: !canGoNext.value || submitting.value ? 1 : "",
        F: common_vendor.o(onPrimary, "4c"),
        G: common_vendor.o(onSkip, "0b")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-739199e6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/onboarding/onboarding.js.map
