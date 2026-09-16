'use strict'

/**
 * 统一鉴权工具（供 app-service 各业务模块复用）
 *
 * 设计原则（见 PHASE-2-TECHNICAL-DESIGN.md §6.2 / §6.3）：
 *   1. 各业务模块不再各自解析 token，统一在此处解析
 *   2. 饲养员权限以服务端记录的 lastMode 为准，**不接受前端传入的身份参数**。
 *      身份切换时立即写库更新 lastMode，因此 lastMode 即当前工作模式，
 *      客户端无法通过伪造参数越过权限校验。
 *
 * token 说明：当前 token 即 openid（user-login 返回），二期保持兼容。
 * 后续若升级为正式 session/token，只需修改这里的解析实现，不影响业务模块。
 */

/**
 * 解析调用者
 * @param {string} token - 登录凭证（当前为 openid）
 * @param {Object} [db] - 数据库实例，缺省时内部获取
 * @returns {Promise<{ok: boolean, caller?: Object, openid?: string, familyId?: string, message?: string}>}
 */
async function resolveCaller(token, db) {
  if (!token) {
    return { ok: false, message: '未授权：缺少登录凭证' }
  }
  const database = db || uniCloud.database()
  const res = await database.collection('users').where({ openid: token }).get()
  if (res.data.length === 0) {
    return { ok: false, message: '用户记录不存在' }
  }
  const caller = res.data[0]
  return {
    ok: true,
    caller,
    openid: caller.openid,
    familyId: caller.familyId || ''
  }
}

/**
 * 校验调用者当前是否为饲养员模式
 * 干饭人模式不展示配置与制作入口，后端也必须同步拦截
 * @param {string} token - 登录凭证
 * @param {Object} [db] - 数据库实例
 * @returns {Promise<{ok: boolean, caller?: Object, familyId?: string, message?: string}>}
 */
async function requireCook(token, db) {
  const res = await resolveCaller(token, db)
  if (!res.ok) return res
  if (res.caller.lastMode !== 'cook') {
    return { ok: false, message: '无权限：请先切换到饲养员身份' }
  }
  return res
}

module.exports = {
  resolveCaller,
  requireCook
}
