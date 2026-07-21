"use strict";
const common_vendor = require("../common/vendor.js");
const statusBarHeight = common_vendor.ref(0);
let initialized = false;
function useSafeArea() {
  if (!initialized) {
    initialized = true;
    try {
      const info = common_vendor.index.getSystemInfoSync();
      statusBarHeight.value = info.statusBarHeight || 20;
    } catch (e) {
      statusBarHeight.value = 20;
    }
  }
  return { statusBarHeight };
}
exports.useSafeArea = useSafeArea;
//# sourceMappingURL=../../.sourcemap/mp-weixin/composables/useSafeArea.js.map
