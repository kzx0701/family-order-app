'use strict'
const { resolveCaller } = require('../utils/auth.js')

/**
 * 家庭信息云函数
 *
 * 支持的 action：
 *   - get        读取当前家庭信息（名称、创建者）
 *   - updateName 修改家庭名称（仅家庭创建者 ownerId 可改）
 *
 * 说明：
 *   家庭名称不参与登录引导流程，入口在「我的」页面。
 *   单家庭场景下由首个登录的用户自动创建（见 user-login 的 ensureFamily）。
 *
 * 鉴权：token（openid）→ 定位 users 记录 → 取用户所属 familyId
 */

// 家庭名称长度上限（字符）
const MAX_NAME_LENGTH = 12

exports.main = async (event, context) => {
  const { action } = event
  switch (action) {
    case 'get':
      return getFamily(event)
    case 'updateName':
      return updateName(event)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}

/**
 * 读取当前用户所属家庭
 * 返回 isOwner 供前端决定是否展示编辑入口（后端仍会再校验一次）
 */
async function getFamily({ token }) {
  try {
    const authRes = await resolveCaller(token)
    if (!authRes.ok) {
      const code = authRes.message === '用户记录不存在' ? 404 : 401
      return { code, message: authRes.message }
    }

    if (!authRes.familyId) {
      return { code: 404, message: '当前用户尚未加入任何家庭' }
    }

    const res = await uniCloud.database().collection('families').doc(authRes.familyId).get()
    if (res.data.length === 0) {
      return { code: 404, message: '家庭记录不存在' }
    }

    const family = res.data[0]
    return {
      code: 0,
      family,
      isOwner: family.ownerId === authRes.caller._id
    }
  } catch (e) {
    console.error('[family-data] get error', e)
    return { code: 500, message: '家庭信息读取异常' }
  }
}

/**
 * 修改家庭名称
 * 仅最初创建该家庭的用户（ownerId）可修改
 * @param {string} name - 新家庭名称
 */
async function updateName({ token, name }) {
  const newName = String(name || '').trim()
  if (!newName) {
    return { code: 400, message: '家庭名称不能为空' }
  }
  if (newName.length > MAX_NAME_LENGTH) {
    return { code: 400, message: `家庭名称最多 ${MAX_NAME_LENGTH} 个字符` }
  }

  try {
    const authRes = await resolveCaller(token)
    if (!authRes.ok) {
      const code = authRes.message === '用户记录不存在' ? 404 : 401
      return { code, message: authRes.message }
    }
    if (!authRes.familyId) {
      return { code: 404, message: '当前用户尚未加入任何家庭' }
    }

    const familyCol = uniCloud.database().collection('families')
    const res = await familyCol.doc(authRes.familyId).get()
    if (res.data.length === 0) {
      return { code: 404, message: '家庭记录不存在' }
    }

    const family = res.data[0]
    if (family.ownerId !== authRes.caller._id) {
      return { code: 403, message: '无权限：仅家庭创建者可修改家庭名称' }
    }

    await familyCol.doc(authRes.familyId).update({
      name: newName,
      updateTime: Date.now()
    })

    console.log('[family-data] 家庭名称更新为', newName)
    return { code: 0, name: newName }
  } catch (e) {
    console.error('[family-data] updateName error', e)
    return { code: 500, message: '家庭名称修改异常' }
  }
}
