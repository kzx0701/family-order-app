"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_lottie = require("../../utils/lottie.js");
const _sfc_main = {
  __name: "lottie-loading",
  props: {
    // Lottie JSON 文件路径（与 animation-data 二选一）
    src: { type: String, default: "" },
    // 直接传入 Lottie JSON 对象（与 src 二选一）
    animationData: { type: Object, default: null },
    width: { type: String, default: "120rpx" },
    height: { type: String, default: "120rpx" },
    // 是否循环
    loop: { type: Boolean, default: true },
    // 是否自动播放
    autoplay: { type: Boolean, default: true },
    // 降级 spinner 颜色
    spinnerColor: { type: String, default: "#C4956A" }
  },
  setup(__props) {
    const props = __props;
    const canvasId = `lottie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fallback = common_vendor.ref(false);
    const instance = common_vendor.getCurrentInstance();
    const loadAnimation = async () => {
      let animData = props.animationData;
      if (!animData && props.src) {
        try {
          const res = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url: props.src,
              success: resolve,
              fail: reject
            });
          });
          animData = res.data;
        } catch (e) {
          common_vendor.index.__f__("error", "at components/lottie-loading/lottie-loading.vue:71", "[lottie-loading] 加载 JSON 失败，降级到 spinner", e);
          fallback.value = true;
          return;
        }
      }
      if (!animData) {
        fallback.value = true;
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
      const anim = await utils_lottie.loadLottieOnReady(
        canvasId,
        animData,
        { loop: props.loop, autoplay: props.autoplay },
        (instance == null ? void 0 : instance.proxy) || null
      );
      if (!anim) {
        fallback.value = true;
      }
    };
    common_vendor.onMounted(() => {
      loadAnimation();
    });
    common_vendor.onUnmounted(() => {
      utils_lottie.destroyLottie(canvasId);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !fallback.value
      }, !fallback.value ? {
        b: canvasId,
        c: __props.width,
        d: __props.height
      } : {
        e: __props.spinnerColor,
        f: __props.width,
        g: __props.height
      }, {
        h: __props.width,
        i: __props.height
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9a5dea6b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/lottie-loading/lottie-loading.js.map
