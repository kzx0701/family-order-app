"use strict";
const WX_CONFIG = {
  // 订阅消息模板 ID（微信公众平台配置后填入，需与云函数 config.json 一致）
  subscribeTemplates: {
    orderNotify: "pTwXlfi9AsqclwXuBl8KDzVViSAb0s5sRTRz_eWC9IA",
    // 下单通知模板 ID（推送给管理员）
    completeNotify: "Db7Tf9a6ghVEFtgPKsEvh_Dio95Dqjqo1YlI35DxnkQ",
    // 完成通知模板 ID（推送给下单人）
    pickupNotify: "r_svuDQguRAj5xKzchqduq19JN9KRG23b-bk8EdYaCo"
    // 取餐提醒模板 ID（推送给下单人）
  },
  // 微信小程序 AppID（前端使用，如分享、登录等场景）
  appid: "wxbce36fe0e2e44d62"
};
exports.WX_CONFIG = WX_CONFIG;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/wx-config.js.map
