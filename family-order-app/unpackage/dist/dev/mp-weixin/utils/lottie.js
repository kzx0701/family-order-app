"use strict";
const common_vendor = require("../common/vendor.js");
const animationMap = /* @__PURE__ */ new Map();
let lottieLib = null;
try {
  lottieLib = require("lottie-miniprogram");
} catch (e) {
  common_vendor.index.__f__("warn", "at utils/lottie.js:19", "[lottie] lottie-miniprogram 加载失败，将降级到 CSS 动效", e);
  lottieLib = null;
}
const getLottie = () => {
  return lottieLib;
};
const getCanvasNode = (canvasId, instance = null) => {
  return new Promise((resolve, reject) => {
    const query = instance ? common_vendor.index.createSelectorQuery().in(instance) : common_vendor.index.createSelectorQuery();
    query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        reject(new Error(`[lottie] canvas #${canvasId} 未找到`));
        return;
      }
      resolve({
        canvas: res[0].node,
        width: res[0].width,
        height: res[0].height
      });
    });
  });
};
const loadLottieOnReady = async (canvasId, animationData, options = {}, instance = null) => {
  const lottie = await getLottie();
  if (!lottie)
    return null;
  try {
    const { canvas, width, height } = await getCanvasNode(canvasId, instance);
    const dpr = common_vendor.index.getSystemInfoSync().pixelRatio || 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    if (typeof lottie.setup === "function") {
      lottie.setup({ adapter: canvas });
    }
    const anim = lottie.loadAnimation({
      canvas,
      renderer: "canvas",
      loop: options.loop !== false,
      autoplay: options.autoplay !== false,
      animationData
    });
    animationMap.set(canvasId, anim);
    return anim;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/lottie.js:103", "[lottie] loadLottieOnReady error", e);
    return null;
  }
};
const destroyLottie = (canvasId) => {
  const anim = animationMap.get(canvasId);
  if (anim && typeof anim.destroy === "function") {
    anim.destroy();
  }
  animationMap.delete(canvasId);
};
exports.destroyLottie = destroyLottie;
exports.loadLottieOnReady = loadLottieOnReady;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/lottie.js.map
