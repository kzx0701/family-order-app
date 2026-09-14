'use strict'

/**
 * 设置用户角色云函数（仅首次选择）
 *
 * 接收参数：
 *   - role: 'orderer' | 'admin'
 *   - token: 用户登录凭证（user-login 返回的 openid）
 *
 * 鉴权：
 *   通过 token(=openid) 定位当前用户，设置其 role 字段。
 *
 * 业务规则：
 *   角色一经选择不可更改。若用户已有非空 role 且与请求 role 不同，拒绝。
 *   仅允许首次设置（当前 role 为空时）或重复设置相同角色。
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

    // 查询当前用户记录
    const queryRes = await userCol.where({ openid }).get()
    if (queryRes.data.length === 0) {
      return { code: 404, message: '用户记录不存在' }
    }

    const existingUser = queryRes.data[0]
    const currentRole = existingUser.role || ''

    // 角色不可更改：已有非空 role 且与请求不同则拒绝
    if (currentRole && currentRole !== role) {
      return { code: 403, message: '角色一经选择不可更改' }
    }

    // 首次设置或重复设置相同角色，写入 role 字段
    await userCol.where({ openid }).update({ role })

    // 返回更新后的 userInfo
    const finalRes = await userCol.where({ openid }).get()
    return {
      code: 0,
      userInfo: finalRes.data[0]
    }
  } catch (e) {
    console.error('[user-update-role] error', e)
    return { code: 500, message: '角色设置异常' }
  }
}
