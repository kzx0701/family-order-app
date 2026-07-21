"use strict";
const common_vendor = require("../common/vendor.js");
function useHeaderFixed(selector = ".header") {
  const headerHeight = common_vendor.ref(0);
  const remeasure = () => {
    common_vendor.index.createSelectorQuery().select(selector).boundingClientRect((rect) => {
      if (rect && rect.height) {
        headerHeight.value = rect.height;
      }
    }).exec();
  };
  common_vendor.onMounted(async () => {
    await common_vendor.nextTick$1();
    setTimeout(remeasure, 50);
  });
  return { headerHeight, remeasure };
}
exports.useHeaderFixed = useHeaderFixed;
//# sourceMappingURL=../../.sourcemap/mp-weixin/composables/useHeaderFixed.js.map
