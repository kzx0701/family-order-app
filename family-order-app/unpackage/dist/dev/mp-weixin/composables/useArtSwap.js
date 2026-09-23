"use strict";
const common_vendor = require("../common/vendor.js");
function useArtSwap({ isActive, resetOn = null, activeKey = "iconActive", tag = "art-swap" }) {
  const loaded = common_vendor.ref({});
  const canSwap = (item) => Boolean(item && item[activeKey] && isActive(item));
  const isStaticDimmed = (item) => canSwap(item) && Boolean(loaded.value[item.id]);
  const markLoaded = (id) => {
    loaded.value = { ...loaded.value, [id]: true };
  };
  const markFailed = (id) => {
    common_vendor.index.__f__("warn", "at composables/useArtSwap.js:68", `[${tag}] 分类动图加载失败，保持静态图`, id);
  };
  if (resetOn)
    common_vendor.watch(resetOn, () => {
      loaded.value = {};
    });
  return { canSwap, isStaticDimmed, markLoaded, markFailed };
}
exports.useArtSwap = useArtSwap;
//# sourceMappingURL=../../.sourcemap/mp-weixin/composables/useArtSwap.js.map
