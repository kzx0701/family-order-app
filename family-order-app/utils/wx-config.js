/**
 * 微信小程序前端配置
 *
 * 仅存放前端可安全使用的配置项（AppID、订阅消息模板 ID）。
 * secret 仅在云函数 config.json 中配置，不放入前端代码。
 *
 * 部署步骤：
 *   1. 在微信公众平台注册小程序获取 AppID，填入 appid
 *   2. 在「订阅消息」模板库中申请以下模板，填入对应模板 ID：
 *      - orderNotify    下单通知（推送给管理员）
 *      - completeNotify 完成通知（推送给下单人）
 *      - pickupNotify   取餐提醒（推送给下单人）
 *   3. 云函数 subscribe-message/config.json 的 templates 字段需与本处保持一致
 */

export const WX_CONFIG = {
  // 订阅消息模板 ID（微信公众平台配置后填入，需与云函数 config.json 一致）
  subscribeTemplates: {
    orderNotify: 'pTwXlfi9AsqclwXuBl8KDzVViSAb0s5sRTRz_eWC9IA',    // 下单通知模板 ID（推送给管理员）
    completeNotify: 'Db7Tf9a6ghVEFtgPKsEvh_Dio95Dqjqo1YlI35DxnkQ', // 完成通知模板 ID（推送给下单人）
    pickupNotify: 'r_svuDQguRAj5xKzchqduq19JN9KRG23b-bk8EdYaCo'    // 取餐提醒模板 ID（推送给下单人）
  },
  // 微信小程序 AppID（前端使用，如分享、登录等场景）
  appid: 'wxbce36fe0e2e44d62'
}

export default WX_CONFIG
