'use strict'

/**
 * 统一业务云函数（合并自 9 个独立云函数）
 *
 * 背景：阿里云 uniCloud 自 2026-03-16 起对云函数资源使用量（GBs）执行
 * "单个函数 + 小时"最低消费规则（某函数某小时内运行过即至少计 ~90GBs）。
 * 本项目为 2 人使用的低频小程序，9 个独立函数会触发 9 倍最低消费，
 * 因此合并为单个云函数 app-service，通过 event.module 路由到各业务模块，
 * 将每小时最低消费从 9×90GBs 降为 1×90GBs。
 *
 * 用法：
 *   uniCloud.callFunction({
 *     name: 'app-service',
 *     data: { module: 'user-login', ...原函数参数 }
 *   })
 *
 * module 与业务模块对应关系：
 *   - user-login          微信登录（code 换 openid）
 *   - user-update-profile 更新昵称/头像
 *   - user-update-role    设置角色
 *   - categories-crud     分类 CRUD
 *   - dishes-crud         菜品 CRUD
 *   - menu-list           菜单/分类查询（点单页）
 *   - home-data           首页聚合数据
 *   - orders-crud         订单 CRUD + 状态流转
 *   - subscribe-message   微信订阅消息推送
 */

const handlers = {
  'user-login': require('./modules/user-login.js'),
  'user-update-profile': require('./modules/user-update-profile.js'),
  'user-update-role': require('./modules/user-update-role.js'),
  'categories-crud': require('./modules/categories.js'),
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