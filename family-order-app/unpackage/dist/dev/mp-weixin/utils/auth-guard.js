"use strict";
const common_vendor = require("../common/vendor.js");
const store_user = require("../store/user.js");
const LOGIN_PATH = "/pages/login/login";
const ONBOARDING_PATH = "/pages/onboarding/onboarding";
const HOME_PATH = "/pages/home/home";
const GUARD_FREE = [LOGIN_PATH, ONBOARDING_PATH];
const NAV_APIS = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
const normalizeUrl = (url) => {
  const path = String(url || "").split("?")[0];
  return path.startsWith("/") ? path : `/${path}`;
};
const currentRoute = () => {
  try {
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    return current ? normalizeUrl(current.route) : "";
  } catch (e) {
    return "";
  }
};
const resolveGuardTarget = () => {
  const userStore = store_user.useUserStore();
  if (!userStore.isLoggedIn)
    return LOGIN_PATH;
  if (!userStore.onboardingCompleted)
    return ONBOARDING_PATH;
  return "";
};
const ensureAuth = ({ silent = false } = {}) => {
  const target = resolveGuardTarget();
  if (!target)
    return false;
  if (currentRoute() !== target) {
    if (!silent) {
      common_vendor.index.showToast({
        title: target === LOGIN_PATH ? "请先登录" : "请先完成信息配置",
        icon: "none"
      });
    }
    common_vendor.index.reLaunch({ url: target });
  }
  return true;
};
const setupAuthGuard = () => {
  NAV_APIS.forEach((api) => {
    common_vendor.index.addInterceptor(api, {
      invoke(args) {
        const target = normalizeUrl(args && args.url);
        if (GUARD_FREE.includes(target))
          return true;
        if (ensureAuth())
          return false;
        return true;
      }
    });
  });
};
exports.HOME_PATH = HOME_PATH;
exports.ONBOARDING_PATH = ONBOARDING_PATH;
exports.ensureAuth = ensureAuth;
exports.setupAuthGuard = setupAuthGuard;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth-guard.js.map
