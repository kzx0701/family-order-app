'use strict'
const https = require('https')

/**
 * 用户微信登录云函数（不依赖 uni-id，直接调微信 jscode2session API）
 *
 * 流程：
 *   1. 接收前端 uni.login 获取的微信 code
 *   2. 调用微信 jscode2session 接口换取 openid
 *   3. 查询 users 集合：无记录则创建（role 留空待选择），有记录则直接返回
 *   4. 返回 { code: 0, userInfo, token }
 *
 * 配置：需在 uni-config-center/uni-id/config.json 的 mp-weixin.oauth.weixin 填入 appid 与 appsecret
 *
 * 开发环境兼容：
 *   H5 / 未配置微信凭证时，code 为空，自动走 mock 流程（固定测试用户，保留角色记录）。
 */

/**
 * 读取 uni-config-center 中的微信小程序配置
 * 返回 { appid, appsecret }，未配置则返回 null
 */
function getWxConfig() {
  try {
    const path = require('path')
    const fs = require('fs')
    // 尝试从 uni-config-center 公共模块读取配置
    const configPath = path.join(__dirname, '../common/uni-config-center/uni-id/config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      const mpWeixin = config['mp-weixin'] || {}
      const oauth = mpWeixin.oauth || {}
      const weixin = oauth.weixin || {}
      if (weixin.appid && weixin.appsecret) {
        return { appid: weixin.appid, appsecret: weixin.appsecret }
      }
    }
    return null
  } catch (e) {
    console.warn('[user-login] 读取微信配置失败', e)
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

exports.main = async (event, context) => {
  const { code } = event

  // 开发环境兼容：无 code 时走 mock 流程
  if (!code) {
    return await mockLogin()
  }

  try {
    // 1. 读取微信小程序配置
    const wxConfig = getWxConfig()
    if (!wxConfig || !wxConfig.appid || !wxConfig.appsecret) {
      console.warn('[user-login] 未配置微信 appid/secret，走 mock 流程')
      return await mockLogin()
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
    if (queryRes.data.length === 0) {
      // 新用户：创建记录，role 留空待选择
      const newUser = {
        openid,
        nickname: '微信用户',
        avatar: '',
        role: '',
        familyId: 'default',
        createTime: Date.now()
      }
      const addRes = await userCol.add(newUser)
      userInfo = { _id: addRes.id, ...newUser }
    } else {
      // 老用户：直接返回现有记录（含已有 role）
      userInfo = queryRes.data[0]
    }

    // 4. 返回登录信息（token 简化为 openid）
    return {
      code: 0,
      userInfo,
      token: openid
    }
  } catch (e) {
    console.error('[user-login] error', e)
    return { code: 500, message: '登录服务异常：' + (e.message || e) }
  }
}

/**
 * 开发环境 mock 登录
 * 使用固定 openid，保留角色记录，避免每次登录重复创建用户
 */
async function mockLogin() {
  const db = uniCloud.database()
  const userCol = db.collection('users')
  const mockOpenid = 'dev_mock_openid'

  const queryRes = await userCol.where({ openid: mockOpenid }).get()
  let userInfo
  if (queryRes.data.length > 0) {
    userInfo = queryRes.data[0]
  } else {
    const newUser = {
      openid: mockOpenid,
      nickname: '微信用户',
      avatar: '',
      role: '',
      familyId: 'default',
      createTime: Date.now()
    }
    const addRes = await userCol.add(newUser)
    userInfo = { _id: addRes.id, ...newUser }
  }

  return {
    code: 0,
    userInfo,
    token: mockOpenid
  }
}
