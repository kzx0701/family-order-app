"use strict";
const common_vendor = require("../common/vendor.js");
const store_user = require("../store/user.js");
const ROLE_SELECT_PATH = "/pages/role-select/role-select";
const NAV_APIS = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
const normalizeUrl = (url) => {
  const path = String(url || "").split("?")[0];
  return path.startsWith("/") ? path : `/${path}`;
};
const isOnRoleSelect = () => {
  try {
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (!current)
      return false;
    return normalizeUrl(current.route) === ROLE_SELECT_PATH;
  } catch (e) {
    return false;
  }
};
const ensureRoleSelected = ({ silent = false } = {}) => {
  const userStore = store_user.useUserStore();
  if (userStore.role)
    return false;
  if (isOnRoleSelect())
    return true;
  if (!silent) {
    common_vendor.index.showToast({ title: "请先选择身份", icon: "none" });
  }
  common_vendor.index.reLaunch({ url: ROLE_SELECT_PATH });
  return true;
};
const setupRoleGuard = () => {
  NAV_APIS.forEach((api) => {
    common_vendor.index.addInterceptor(api, {
      invoke(args) {
        if (normalizeUrl(args && args.url) === ROLE_SELECT_PATH) {
          return true;
        }
        if (ensureRoleSelected()) {
          return false;
        }
        return true;
      }
    });
  });
};
exports.ensureRoleSelected = ensureRoleSelected;
exports.setupRoleGuard = setupRoleGuard;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/role-guard.js.map
