'use strict'

/**
 * 更新用户资料云函数
 *
 * 接收参数：
 *   - nickname: 昵称（可选）
 *   - avatar: 头像 URL（可选，预留扩展）
 *   - token: 用户登录凭证（user-login 返回的 openid）
 *
 * 鉴权：
 *   通过 token(=openid) 定位当前用户，更新其 profile 字段。
 *   家庭应用无支付风险，简化鉴权；生产环境可增强为 uni-id token 校验。
 *
 * 返回：{ code: 0, userInfo }
 */
exports.main = async (event, context) => {
  const { nickname, avatar, token } = event

  // 鉴权：token 即 openid（由 user-login 返回）
  const openid = token
  if (!openid) {
    return { code: 401, message: '未授权：缺少登录凭证' }
  }

  // 至少传一个待更新字段
  if (nickname === undefined && avatar === undefined) {
    return { code: 400, message: '缺少待更新字段' }
  }

  // 组装更新数据，只更新提供的字段
  const updateData = {}
  if (nickname !== undefined) {
    const name = String(nickname || '').trim()
    if (name.length === 0) {
      return { code: 400, message: '昵称不能为空' }
    }
    if (name.length > 20) {
      return { code: 400, message: '昵称最多 20 个字符' }
    }
    updateData.nickname = name
  }
  if (avatar !== undefined) {
    updateData.avatar = String(avatar || '')
  }

  try {
    const db = uniCloud.database()
    const userCol = db.collection('users')

    // 更新指定字段
    const updateRes = await userCol.where({ openid }).update(updateData)
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
    console.error('[user-update-profile] error', e)
    return { code: 500, message: '资料更新异常' }
  }
}
