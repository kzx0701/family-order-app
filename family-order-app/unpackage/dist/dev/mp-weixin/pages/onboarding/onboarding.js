"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const utils_image = require("../../utils/image.js");
const utils_artwork = require("../../utils/artwork.js");
const utils_authGuard = require("../../utils/auth-guard.js");
const GENDER_ART_WIDTH = 400;
const ROLE_ART_WIDTH = 480;
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
      male: utils_image.imgUrl(utils_artwork.AVATAR_ART.male, { w: GENDER_ART_WIDTH }),
      female: utils_image.imgUrl(utils_artwork.AVATAR_ART.female, { w: GENDER_ART_WIDTH })
    };
    const ROLE_ART = {
      diner: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%A4%B4%E5%83%8F/exec-2ded22a0-aa85-4c5b-998d-7698c43421a4.png",
      cook: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%A4%B4%E5%83%8F/exec-c8b750dd-f6ae-412a-9a27-27e1e489818c.png"
    };
    const roleArt = {
      diner: utils_image.imgUrl(ROLE_ART.diner, { w: ROLE_ART_WIDTH }),
      cook: utils_image.imgUrl(ROLE_ART.cook, { w: ROLE_ART_WIDTH })
    };
    const CARD_BG = {
      female: `url(${utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-79fd56c8-73b1-4f33-8fb9-6224f06d3e48.png", { w: 1080 })})`,
      male: `url(${utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-0ef5a4be-7dd3-46e6-a638-8d939f9c8aba.png", { w: 1080 })})`,
      diner: `url(${utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-4e70c4a6-75e9-4619-ae25-316ccf8e2368.png", { w: 1080 })})`,
      cook: `url(${utils_image.imgUrl("https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E7%95%8C%E9%9D%A2/exec-df221cce-3e89-49a0-9d41-2eb9163488de.png", { w: 1080 })})`
    };
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
        common_vendor.index.showToast({ title: "设置好啦", icon: "none" });
        setTimeout(() => {
          common_vendor.index.reLaunch({ url: utils_authGuard.HOME_PATH });
        }, 500);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/onboarding/onboarding.vue:277", "[onboarding] submit error", e);
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
        e: headerTop.value + "px",
        f: step.value === 1
      }, step.value === 1 ? {
        g: genderArt.female,
        h: pickedGender.value === "female" ? 1 : "",
        i: isDimmed(pickedGender.value, "female") ? 1 : "",
        j: CARD_BG.female,
        k: common_vendor.o(($event) => pickedGender.value = "female", "0a"),
        l: genderArt.male,
        m: pickedGender.value === "male" ? 1 : "",
        n: isDimmed(pickedGender.value, "male") ? 1 : "",
        o: CARD_BG.male,
        p: common_vendor.o(($event) => pickedGender.value = "male", "0b")
      } : {
        q: roleArt.diner,
        r: pickedMode.value === "diner" ? 1 : "",
        s: isDimmed(pickedMode.value, "diner") ? 1 : "",
        t: CARD_BG.diner,
        v: common_vendor.o(($event) => pickedMode.value = "diner", "19"),
        w: roleArt.cook,
        x: pickedMode.value === "cook" ? 1 : "",
        y: isDimmed(pickedMode.value, "cook") ? 1 : "",
        z: CARD_BG.cook,
        A: common_vendor.o(($event) => pickedMode.value = "cook", "74")
      }, {
        B: step.value === 2
      }, step.value === 2 ? {
        C: submitting.value ? 1 : "",
        D: common_vendor.o(($event) => goStep(1), "69")
      } : {}, {
        E: common_vendor.t(submitting.value ? "保存中…" : step.value === 1 ? "下一步" : "进入小程序"),
        F: !canGoNext.value || submitting.value ? 1 : "",
        G: common_vendor.o(onPrimary, "45"),
        H: common_vendor.o(onSkip, "f1")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-739199e6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/onboarding/onboarding.js.map
