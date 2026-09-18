'use strict'

/**
 * 统一业务云函数（合并自 9 个独立云函数）
 *
 * 背景：本项目为家庭内部使用的低频小程序，多个业务模块统一合并为
 * 单个云函数 app-service，通过 event.module 路由到各业务模块，减少部署和维护成本。
 *
 * 用法：
 *   uniCloud.callFunction({
 *     name: 'app-service',
 *     data: { module: 'user-login', ...原函数参数 }
 *   })
 *
 * module 与业务模块对应关系：
 *   - user-login          微信一键登录（code 换 openid）
 *   - user-update-profile 更新昵称 / 头像 / 性别
 *   - user-identity       身份与引导状态（getState / completeOnboarding / switchMode）
 *   - family-data         家庭信息（get / updateName）
 *   - categories-crud     分类 CRUD
 *   - materials-crud      物料 CRUD（食材 / 调料共用一张表，靠 group 区分）
 *   - dishes-crud         菜品 CRUD
 *   - menu-list           菜单/分类查询（点单页）
 *   - home-data           首页聚合数据
 *   - orders-crud         订单 CRUD + 状态流转
 *   - subscribe-message   微信订阅消息推送
 */

const handlers = {
  'user-login': require('./modules/user-login.js'),
  'family-data': require('./modules/family-data.js'),
  'user-update-profile': require('./modules/user-update-profile.js'),
  'user-identity': require('./modules/user-identity.js'),
  'categories-crud': require('./modules/categories.js'),
  'materials-crud': require('./modules/materials.js'),
  'dishes-crud': require('./modules/dishes.js'),
  'menu-list': require('./modules/menu-list.js'),
  'home-data': require('./modules/home-data.js'),
  'orders-crud': require('./modules/orders.js'),
  'subscribe-message': require('./modules/subscribe-message.js')
}

exports.main = async (event, context) => {
  const { module, ...rest } = event || {}
  const handler = handlers[module]
  if (!handler || typeof handler.main !== 'function') {
    return { code: 400, message: '未知 module：' + module }
  }
  return await handler.main(rest, context)
}
