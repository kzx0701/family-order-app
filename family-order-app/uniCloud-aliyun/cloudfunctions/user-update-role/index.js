'use strict'

/**
 * 更新用户角色云函数
 *
 * 接收参数：
 *   - role: 'orderer' | 'admin'
 *   - token: 用户登录凭证（user-login 返回的 openid）
 *
 * 鉴权：
 *   通过 token(=openid) 定位当前用户，更新其 role 字段。
 *   家庭应用无支付风险，简化鉴权；生产环境可增强为 uni-id token 校验。
 *
 * 返回：{ code: 0, userInfo }
 */
exports.main = async (event, context) => {
  const { role, token } = event

  // 校验 role 参数
  if (!['orderer', 'admin'].includes(role)) {
    return { code: 400, message: '角色参数无效' }
  }

  // 鉴权：token 即 openid（由 user-login 返回）
  const openid = token
  if (!openid) {
    return { code: 401, message: '未授权：缺少登录凭证' }
  }

  try {
    const db = uniCloud.database()
    const userCol = db.collection('users')

    // 更新 role 字段
    const updateRes = await userCol.where({ openid }).update({ role })
    if (updateRes.updated === 0) {
      return { code: 404, message: '用户记录不存在' }
    }

    // 返回更新后的 userInfo
    const userRes = await userCol.where({ openid }).get()
    return {
      code: 0,
      userInfo: userRes.data[0]
    }
  } catch (e) {
    console.error('[user-update-role] error', e)
    return { code: 500, message: '角色更新异常' }
  }
}
