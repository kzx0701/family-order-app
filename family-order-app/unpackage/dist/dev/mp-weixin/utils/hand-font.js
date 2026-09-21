"use strict";
const common_vendor = require("../common/vendor.js");
const FONT_FAMILY = "MaokenWeb";
const FONT_URL = encodeURI(
  "https://env-00jy6tjoglvj.normal.cloudstatic.cn/黑米咖啡/字体/maoken-web-1408.woff"
);
let pending = null;
function repaintCurrentPage() {
  try {
    const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
    const current = pages[pages.length - 1];
    const vm = current && (current.$vm || current);
    if (vm && typeof vm.$forceUpdate === "function") {
      vm.$forceUpdate();
    }
  } catch (e) {
    common_vendor.index.__f__("warn", "at utils/hand-font.js:76", "[hand-font] 重绘当前页失败（可忽略）", e);
  }
  common_vendor.index.$emit("hand-font-ready");
}
function loadHandFont() {
  if (pending)
    return pending;
  pending = new Promise((resolve) => {
    common_vendor.index.loadFontFace({
      family: FONT_FAMILY,
      source: `url("${FONT_URL}")`,
      // 全局生效：官方说明 global 需在 app.js 里调用才全局生效，
      // 否则只在「调用时的那个页面」生效
      global: true,
      success: () => {
        common_vendor.index.__f__("log", "at utils/hand-font.js:101", "[hand-font] 网络字集已就绪，菜名等长尾字符启用手写体");
        repaintCurrentPage();
        resolve(true);
      },
      fail: (err) => {
        pending = null;
        common_vendor.index.__f__("warn", "at utils/hand-font.js:109", "[hand-font] 网络字集加载失败，已回退本地子集（长尾字符覆盖率下降）", err);
        resolve(false);
      }
    });
  });
  return pending;
}
exports.loadHandFont = loadHandFont;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/hand-font.js.map
