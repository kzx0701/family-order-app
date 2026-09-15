"use strict";
const common_vendor = require("../common/vendor.js");
const statusBarHeight = common_vendor.ref(0);
const menuButton = common_vendor.ref(null);
let initialized = false;
function useSafeArea() {
  var _a, _b;
  if (!initialized) {
    initialized = true;
    try {
      const info = common_vendor.index.getSystemInfoSync();
      statusBarHeight.value = info.statusBarHeight || 20;
    } catch (e) {
      statusBarHeight.value = 20;
    }
    try {
      menuButton.value = ((_b = (_a = common_vendor.index).getMenuButtonBoundingClientRect) == null ? void 0 : _b.call(_a)) || null;
    } catch (e) {
      menuButton.value = null;
    }
  }
  return { statusBarHeight, menuButton };
}
exports.useSafeArea = useSafeArea;
//# sourceMappingURL=../../.sourcemap/mp-weixin/composables/useSafeArea.js.map
