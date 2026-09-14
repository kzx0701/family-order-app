'use strict'

const https = require('https')

/**
 * 微信订阅消息推送云函数（双向通知）
 *
 * 支持的 action：
 *   - sendOrderNotify      下单后通知管理员（商品名称、订单数量、操作备注、提交人）
 *   - sendCompleteNotify   完成后通知下单人（商品名称、订单状态、温馨提示）
 *   - sendPickupNotify     取餐提醒通知下单人（商品名、取餐方式、温馨提示）
 *
 * 凭证来源：
 *   优先从环境变量读取（生产环境推荐，uniCloud 控制台配置），
 *   回退到 config.json 配置文件（开发/部署时直接填入）。
 *   secret 不进入前端代码，仅在云函数侧使用。
 *
 * access_token 缓存：
 *   使用云数据库集合 wx_access_token 缓存（key=default），
 *   有效期约 2 小时，提前 5 分钟视为过期，避免微信限流。
 *   云函数使用 admin 数据库 API，无需 DB Schema 即可读写。
 *
 * 错误处理：
 *   - 推送失败不抛错，记录日志后返回，确保不阻塞订单主流程
 *   - 单个管理员 openid 发送失败不影响其他管理员
 */

/* ============ 配置读取 ============ */

// 尝试加载同目录 config.json（云函数部署时填入真实值）
let fileConfig = {}
try {
  fileConfig = require('../config.json')
} catch (e) {
  console.warn('[subscribe-message] config.json 不存在或解析失败，将仅使用环境变量')
}

const CFG = {
  appid: process.env.WX_APPID || fileConfig.appid || '',
  secret: process.env.WX_SECRET || fileConfig.secret || '',
  templates: {
    orderNotify:
      process.env.WX_TPL_ORDER_NOTIFY ||
      (fileConfig.templates && fileConfig.templates.orderNotify) ||
      '',
    completeNotify:
      process.env.WX_TPL_COMPLETE_NOTIFY ||
      (fileConfig.templates && fileConfig.templates.completeNotify) ||
      '',
    pickupNotify:
      process.env.WX_TPL_PICKUP_NOTIFY ||
      (fileConfig.templates && fileConfig.templates.pickupNotify) ||
      ''
  }
}

exports.main = async (event, context) => {
  const { action } = event

  // 校验微信凭证是否已配置
  if (!CFG.appid || !CFG.secret) {
    console.error('[subscribe-message] 未配置 WX_APPID / WX_SECRET，请在 config.json 或云函数环境变量中填入')
    return { code: 1, message: '微信凭证未配置' }
  }

  switch (action) {
    case 'sendOrderNotify':
      return await sendOrderNotify(event)
    case 'sendCompleteNotify':
      return await sendCompleteNotify(event)
    case 'sendPickupNotify':
      return await sendPickupNotify(event)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}

/* ============ access_token 获取与缓存 ============ */

/**
 * 获取微信 access_token
 * 优先读云数据库缓存（wx_access_token 集合，key=default），过期则调用微信 API 刷新
 * @returns {Promise<string|null>}
 */
async function getAccessToken() {
  const db = uniCloud.database()
  const cacheCol = db.collection('wx_access_token')

  // 1. 查询缓存
  try {
    const cacheRes = await cacheCol.where({ key: 'default' }).limit(1).get()
    if (cacheRes.data.length > 0) {
      const cache = cacheRes.data[0]
      // 提前 5 分钟视为过期，避免边界失效
      if (cache.expiresAt > Date.now() + 5 * 60 * 1000) {
        return cache.token
      }
    }
  } catch (e) {
    console.warn('[subscribe-message] 读取 access_token 缓存失败', e)
  }

  // 2. 调用微信 API 获取新 token
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${CFG.appid}&secret=${CFG.secret}`
  const data = await httpGetJson(url)
  if (!data || !data.access_token) {
    console.error('[subscribe-message] 获取 access_token 失败', data)
    return null
  }

  const token = data.access_token
  const expiresAt = Date.now() + (data.expires_in || 7200) * 1000

  // 3. 写入缓存（upsert：存在则更新，不存在则新增）
  try {
    const existing = await cacheCol.where({ key: 'default' }).limit(1).get()
    if (existing.data.length > 0) {
      await cacheCol.doc(existing.data[0]._id).update({
        token,
        expiresAt,
        updateTime: Date.now()
      })
    } else {
      await cacheCol.add({
        key: 'default',
        token,
        expiresAt,
        updateTime: Date.now()
      })
    }
  } catch (e) {
    console.warn('[subscribe-message] 写入 access_token 缓存失败', e)
  }

  return token
}

/* ============ 微信订阅消息发送 ============ */

/**
 * 调用微信 subscribeMessage.send API 发送订阅消息
 * @param {string} openid - 接收用户 openid
 * @param {string} templateId - 模板 ID
 * @param {Object} data - 模板参数 { 字段名: { value: 'xxx' } }
 * @param {string} [page] - 点击跳转的小程序页面路径
 * @returns {Promise<boolean>} 是否发送成功
 */
async function sendSubscribeMessage(openid, templateId, data, page) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    console.error('[subscribe-message] access_token 获取失败，跳过发送')
    return false
  }
  if (!templateId) {
    console.error('[subscribe-message] 模板 ID 为空，跳过发送')
    return false
  }

  const body = {
    touser: openid,
    template_id: templateId,
    data,
    miniprogram_state: 'formal', // formal 正式版 / trial 体验版 / developer 开发版
    lang: 'zh_CN'
  }
  if (page) body.page = page

  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`
  const res = await httpPostJson(url, body)
  if (!res || res.errcode !== 0) {
    console.error('[subscribe-message] 发送订阅消息失败', { openid, templateId, res })
    return false
  }
  return true
}

/* ============ action: sendOrderNotify ============ */

/**
 * 下单后通知管理员
 * 入参：orderId、userId、userName、items、note
 * 查询所有 role=admin 的用户 openid 并逐个发送
 * 模板参数：商品名称(thing6)、订单数量(number11)、操作备注(thing5)、提交人(name3)
 * 返回：{ code: 0, sent: N }
 */
async function sendOrderNotify({
  orderId,
  userId,
  userName,
  items,
  note
} = {}) {
  if (!orderId || !Array.isArray(items)) {
    return { code: 400, message: '缺少 orderId 或 items' }
  }

  // 查询所有管理员用户（兼容多管理员场景）
  const db = uniCloud.database()
  const adminRes = await db.collection('users').where({ role: 'admin' }).get()
  const admins = adminRes.data.filter((u) => u.openid)
  if (admins.length === 0) {
    console.warn('[subscribe-message] 无管理员用户或管理员无 openid，跳过 sendOrderNotify')
    return { code: 0, sent: 0 }
  }

  // 构造模板数据
  const dishSummary = buildDishSummary(items)
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const noteText = truncate(note || '无', 20)

  const templateData = {
    thing6: { value: dishSummary },       // 商品名称
    number11: { value: totalQty },        // 订单数量
    thing5: { value: noteText },          // 操作备注
    name3: { value: truncate(userName || '下单人', 20) } // 提交人
  }

  const page = `pages/order-detail/order-detail?id=${orderId}`

  // 逐个管理员发送，单个失败不影响其他
  let sent = 0
  for (const admin of admins) {
    try {
      const ok = await sendSubscribeMessage(
        admin.openid,
        CFG.templates.orderNotify,
        templateData,
        page
      )
      if (ok) sent += 1
    } catch (e) {
      console.error('[subscribe-message] 发送给管理员失败', { openid: admin.openid, error: e })
    }
  }

  return { code: 0, sent }
}

/* ============ action: sendCompleteNotify ============ */

/**
 * 完成后通知下单人
 * 入参：orderId、userId、items
 * userId/items 缺失时回查订单详情补全
 * 模板参数：商品名称(thing2)、订单状态(phrase4)、温馨提示(thing3)
 * 返回：{ code: 0, sent: 1 }（发送成功 sent=1，失败/无 openid sent=0）
 */
async function sendCompleteNotify({ orderId, userId, items } = {}) {
  if (!orderId) {
    return { code: 400, message: '缺少 orderId' }
  }

  const db = uniCloud.database()

  // 优先使用入参的 userId 和 items；缺失时回查订单
  let orderUserId = userId
  let orderItems = items
  if (!orderUserId || !Array.isArray(orderItems)) {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (orderRes.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }
    const order = orderRes.data[0]
    orderUserId = orderUserId || order.userId
    orderItems = orderItems || order.items
  }

  if (!orderUserId) {
    return { code: 400, message: '缺少下单人 userId' }
  }

  // 查询下单人 openid
  const userRes = await db.collection('users').doc(orderUserId).get()
  if (userRes.data.length === 0) {
    console.warn('[subscribe-message] 下单人用户不存在', orderUserId)
    return { code: 0, sent: 0 }
  }
  const orderer = userRes.data[0]
  if (!orderer.openid) {
    console.warn('[subscribe-message] 下单人无 openid', orderUserId)
    return { code: 0, sent: 0 }
  }

  // 构造模板数据
  const dishSummary = buildDishSummary(orderItems || [])

  const templateData = {
    thing2: { value: dishSummary },                  // 商品名称
    phrase4: { value: '已完成' },                     // 订单状态
    thing3: { value: '餐品已完成，请尽快领取' }        // 温馨提示
  }

  const page = `pages/order-detail/order-detail?id=${orderId}`

  let sent = 0
  try {
    const ok = await sendSubscribeMessage(
      orderer.openid,
      CFG.templates.completeNotify,
      templateData,
      page
    )
    if (ok) sent = 1
  } catch (e) {
    console.error('[subscribe-message] 发送给下单人失败', { openid: orderer.openid, error: e })
  }

  return { code: 0, sent }
}

/* ============ action: sendPickupNotify ============ */

/**
 * 取餐提醒通知下单人
 * 入参：orderId、userId、items、pickupMethod、pickupTip
 * userId/items 缺失时回查订单详情补全
 * 模板参数：商品名(thing15)、取餐方式(thing14)、温馨提示(thing11)
 * 返回：{ code: 0, sent: 1 }
 */
async function sendPickupNotify({ orderId, userId, items, pickupMethod, pickupTip } = {}) {
  if (!orderId) {
    return { code: 400, message: '缺少 orderId' }
  }

  const db = uniCloud.database()

  // 优先使用入参的 userId 和 items；缺失时回查订单
  let orderUserId = userId
  let orderItems = items
  if (!orderUserId || !Array.isArray(orderItems)) {
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (orderRes.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }
    const order = orderRes.data[0]
    orderUserId = orderUserId || order.userId
    orderItems = orderItems || order.items
  }

  if (!orderUserId) {
    return { code: 400, message: '缺少下单人 userId' }
  }

  // 查询下单人 openid
  const userRes = await db.collection('users').doc(orderUserId).get()
  if (userRes.data.length === 0) {
    console.warn('[subscribe-message] 下单人用户不存在', orderUserId)
    return { code: 0, sent: 0 }
  }
  const orderer = userRes.data[0]
  if (!orderer.openid) {
    console.warn('[subscribe-message] 下单人无 openid', orderUserId)
    return { code: 0, sent: 0 }
  }

  // 构造模板数据
  const dishSummary = buildDishSummary(orderItems || [])

  const templateData = {
    thing15: { value: dishSummary },                        // 商品名
    thing14: { value: truncate(pickupMethod || '请到前台取餐', 20) }, // 取餐方式
    thing11: { value: truncate(pickupTip || '餐品已完成，请尽快领取', 20) } // 温馨提示
  }

  const page = `pages/order-detail/order-detail?id=${orderId}`

  let sent = 0
  try {
    const ok = await sendSubscribeMessage(
      orderer.openid,
      CFG.templates.pickupNotify,
      templateData,
      page
    )
    if (ok) sent = 1
  } catch (e) {
    console.error('[subscribe-message] 取餐提醒发送失败', { openid: orderer.openid, error: e })
  }

  return { code: 0, sent }
}

/**
 * 构造菜品摘要（拼接「菜品名 x 数量」，超长截断）
 * 微信订阅消息 thing 字段上限 20 字符
 * @param {Array} items - [{ name, quantity }, ...]
 * @returns {string}
 */
function buildDishSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return '无菜品'
  const parts = items.map((it) => `${it.name}x${it.quantity}`)
  let summary = parts.join('、')
  if (summary.length > 20) {
    summary = summary.slice(0, 19) + '…'
  }
  return summary
}

/**
 * 截断字符串到指定长度
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(str, maxLen) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

/* ============ HTTP 请求封装 ============ */

/**
 * HTTPS GET 请求，返回解析后的 JSON
 * 失败返回 null（不抛错，由调用方处理）
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
function httpGetJson(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            console.error('[subscribe-message] GET 响应 JSON 解析失败', e)
            resolve(null)
          }
        })
      })
      .on('error', (e) => {
        console.error('[subscribe-message] HTTP GET 错误', e)
        resolve(null)
      })
  })
}

/**
 * HTTPS POST 请求（JSON body），返回解析后的 JSON
 * 失败返回 null（不抛错，由调用方处理）
 * @param {string} url
 * @param {Object} bodyObj - 请求体对象
 * @returns {Promise<Object|null>}
 */
function httpPostJson(url, bodyObj) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    const postData = JSON.stringify(bodyObj)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          console.error('[subscribe-message] POST 响应 JSON 解析失败', e)
          resolve(null)
        }
      })
    })
    req.on('error', (e) => {
      console.error('[subscribe-message] HTTP POST 错误', e)
      resolve(null)
    })
    req.write(postData)
    req.end()
  })
}
