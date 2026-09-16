'use strict'
const https = require('https')

/**
 * 用户微信登录云函数（不依赖 uni-id，直接调微信 jscode2session API）
 *
 * 流程：
 *   1. 接收前端「微信一键登录」按钮触发的 uni.login 所获取的 code
 *   2. 调用微信 jscode2session 接口换取 openid
 *   3. 查询 users 集合：无记录则创建，并同时创建默认家庭（单家庭场景）
 *   4. 返回 { code: 0, userInfo, token, isNewUser }
 *
 * 新用户默认值（引导页会覆盖 gender 与 lastMode；用户跳过引导则保持默认）：
 *   gender = 'male'、lastMode = 'diner'、onboardingCompleted = false
 *
 * 前端可直接从 userInfo 读取 gender / lastMode / onboardingCompleted 决定去向，
 * 无需登录后再调一次 getState。
 *
 * 配置：优先读取云函数环境变量 WX_APPID / WX_SECRET（推荐，避免 secret 进源码），
 *      其次读取 uni-config-center/uni-id/config.json 的 mp-weixin.oauth.weixin
 *
 * 说明：已移除 mock 兜底逻辑，无 code 或未配置微信凭证时直接报错，
 *      避免多用户共用固定 openid 造成账号串用。
 */

/**
 * 读取 uni-config-center 中的微信小程序配置
 * 返回 { appid, appsecret }，未配置则返回 null
 *
 * 注意：必须使用 require('uni-config-center') 方式读取。
 * 直接读取 ../common/... 文件路径在本地 HBuilderX 调试时可能有效，
 * 但 uniCloud 生产环境部署后，公共模块并不会以原文件结构存在，
 * 导致配置读取失败、登录报"服务端未配置微信小程序凭证"。
 */
function getWxConfig() {
  // 优先使用云函数环境变量（推荐生产使用，避免 secret 写入源码 / git）
  const envAppid = process.env.WX_APPID
  const envSecret = process.env.WX_SECRET
  if (envAppid && envSecret) {
    return { appid: envAppid, appsecret: envSecret }
  }
  try {
    const createConfig = require('uni-config-center')
    const uniIdConfig = createConfig({ pluginId: 'uni-id' })
    const config = uniIdConfig.config()
    const mpWeixin = config['mp-weixin'] || {}
    const oauth = mpWeixin.oauth || {}
    const weixin = oauth.weixin || {}
    if (weixin.appid && weixin.appsecret) {
      return { appid: weixin.appid, appsecret: weixin.appsecret }
    }
    console.error('[user-login] 未在 uni-id 配置中找到 mp-weixin.oauth.weixin.appid/appsecret')
    return null
  } catch (e) {
    console.error('[user-login] 读取微信配置失败', e)
    return null
  }
}

/**
 * 调用微信 jscode2session 接口
 * @param {string} code - 微信登录 code
 * @param {string} appid
 * @param {string} appsecret
 * @returns {Promise<{openid: string, session_key: string, unionid?: string}>}
 */
function code2Session(code, appid, appsecret) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${code}&grant_type=authorization_code`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.openid) {
            resolve({ openid: result.openid, session_key: result.session_key, unionid: result.unionid })
          } else {
            reject(new Error(result.errmsg || 'jscode2session 失败'))
          }
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', (e) => {
      reject(e)
    })
  })
}

/**
 * 确保当前家庭存在（单家庭场景）
 * 家庭名称不参与登录引导流程，入口在「我的」页面。
 * 首次登录时自动创建默认家庭，创建者即该用户（ownerId），后续仅该用户可改家庭名称。
 * @param {Object} db - 数据库实例
 * @param {string} ownerId - 首个登录用户的 _id
 * @returns {Promise<string>} 家庭 _id
 */
async function ensureFamily(db, ownerId) {
  const familyCol = db.collection('families')
  const famRes = await familyCol.limit(1).get()
  if (famRes.data.length > 0) {
    return famRes.data[0]._id
  }
  const now = Date.now()
  const addRes = await familyCol.add({
    name: '我的家庭',
    ownerId,
    createTime: now,
    updateTime: now
  })
  console.log('[user-login] 默认家庭创建成功, _id:', addRes.id, 'ownerId:', ownerId)
  return addRes.id
}

exports.main = async (event, context) => {
  const { code } = event

  // 无 code 直接报错，避免走 mock 造成账号串用
  if (!code) {
    console.error('[user-login] 缺少微信 code，无法登录')
    return { code: 4001, message: '未获取到微信登录凭证，请在小程序环境中重试' }
  }

  try {
    // 1. 读取微信小程序配置
    const wxConfig = getWxConfig()
    if (!wxConfig || !wxConfig.appid || !wxConfig.appsecret) {
      console.error('[user-login] 未配置微信 appid/secret，拒绝登录')
      return { code: 5001, message: '服务端未配置微信小程序凭证' }
    }

    // 2. 调用微信 jscode2session 换取 openid
    const sessionRes = await code2Session(code, wxConfig.appid, wxConfig.appsecret)
    const openid = sessionRes.openid
    if (!openid) {
      return { code: 1, message: '未获取到 openid' }
    }

    // 3. 查询 / 创建 users 集合记录
    const db = uniCloud.database()
    const userCol = db.collection('users')
    const queryRes = await userCol.where({ openid }).get()

    let userInfo
    let isNewUser = false
    if (queryRes.data.length === 0) {
      const now = Date.now()
      // 新用户：写入引导默认值，引导页完成后覆盖
      const newUser = {
        openid,
        nickname: '微信用户',
        avatar: '',
        gender: 'male',
        lastMode: 'diner',
        onboardingCompleted: false,
        familyId: '',
        createTime: now,
        updateTime: now
      }
      const addRes = await userCol.add(newUser)

      // 确保默认家庭存在，并把新用户挂到该家庭下
      const familyId = await ensureFamily(db, addRes.id)
      await userCol.doc(addRes.id).update({ familyId })

      userInfo = { _id: addRes.id, ...newUser, familyId }
      isNewUser = true
      console.log('[user-login] 新用户创建成功, openid:', openid, 'familyId:', familyId)
    } else {
      // 老用户：直接返回现有记录（含 gender / lastMode / onboardingCompleted）
      userInfo = queryRes.data[0]
      console.log('[user-login] 老用户登录, openid:', openid, 'lastMode:', userInfo.lastMode)
    }

    // 4. 返回登录信息（token 简化为 openid）
    return {
      code: 0,
      userInfo,
      token: openid,
      isNewUser
    }
  } catch (e) {
    console.error('[user-login] error', e)
    return { code: 500, message: '登录服务异常：' + (e.message || e) }
  }
}
