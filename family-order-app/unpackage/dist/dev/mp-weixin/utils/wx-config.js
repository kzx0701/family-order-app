"use strict";
const WX_CONFIG = {
  // 订阅消息模板 ID（微信公众平台配置后填入，需与云函数 config.json 一致）
  subscribeTemplates: {
    orderNotify: "",
    // 下单通知模板 ID（推送给管理员）
    completeNotify: "",
    // 完成通知模板 ID（推送给下单人）
    urgeNotify: ""
    // 催单通知模板 ID（推送给管理员）
  },
  // 微信小程序 AppID（前端使用，如分享、登录等场景）
  appid: "wxbce36fe0e2e44d62"
};
exports.WX_CONFIG = WX_CONFIG;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/wx-config.js.map
