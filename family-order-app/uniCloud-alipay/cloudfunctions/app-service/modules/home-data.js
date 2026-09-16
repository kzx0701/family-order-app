'use strict'

/**
 * 首页聚合数据云函数
 *
 * 入参：
 *   - token  用户登录凭证（user-login 返回的 openid），用于鉴权
 *
 * 鉴权与视图：
 *   通过 token(=openid) 查询 users 集合获取调用者信息。
 *   视图由服务端记录的 lastMode 决定，**不接受前端传入的身份参数**：
 *   身份切换时会立即写库更新 lastMode，因此 lastMode 即当前工作模式，客户端无法伪造。
 *   - 饲养员视图（lastMode = 'cook'）：查询今日所有 pending/preparing 订单
 *   - 干饭人视图（lastMode = 'diner'）：强制 where.userId = caller._id，无法查询他人订单
 *
 * "今日"定义：Asia/Shanghai 当天 00:00:00 ~ 23:59:59
 * uniCloud 部署在 UTC 时区，需手动加 8 小时偏移计算
 *
 * 返回订单列表，每条附加：
 *   - summary       菜品摘要字符串，形如 "焦糖拿铁 x1, 冰美式 x1"
 *   - summaryEmoji  根据首道菜名推断的 emoji，用于卡片视觉装饰
 */

exports.main = async (event, context) => {
  const { token } = event

  // 1. 鉴权：token 即 openid，查询 users 集合获取调用者信息
  if (!token) {
    return { code: 401, message: '未授权：请先登录' }
  }
  const db = uniCloud.database()
  const cmd = db.command
  const userCol = db.collection('users')
  const userRes = await userCol.where({ openid: token }).get()
  if (userRes.data.length === 0) {
    return { code: 401, message: '未授权：用户不存在' }
  }
  const caller = userRes.data[0]

  // 2. 视图选择：以服务端记录的 lastMode 为准，不接受前端传入的身份参数
  const viewMode = caller.lastMode === 'cook' ? 'cook' : 'diner'

  const orderCol = db.collection('orders')

  // 3. 今日 Asia/Shanghai 时间范围（毫秒时间戳）
  const { start, end } = getTodayRangeShanghai()

  const where = {
    createTime: cmd.gte(start).and(cmd.lte(end))
  }
  if (viewMode === 'cook') {
    // 饲养员：今日待制作 + 制作中（所有用户）
    where.status = cmd.in(['pending', 'preparing'])
  } else {
    // 干饭人：仅自己的订单（强制使用 caller._id，忽略前端传入的 userId）
    where.userId = caller._id
  }

  try {
    const res = await orderCol
      .where(where)
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    const list = res.data.map((o) => ({
      ...o,
      summary: buildSummary(o.items),
      summaryEmoji: pickEmoji(o.items)
    }))

    return { code: 0, list }
  } catch (e) {
    console.error('[home-data] query error', e)
    return { code: 500, message: '查询失败' }
  }
}

/**
 * 计算 Asia/Shanghai 当天的 00:00:00 ~ 23:59:59 毫秒时间戳
 * 思路：把当前 UTC 时间戳 +8h 得到 Shanghai 本地时间分量，
 *       再用 Date.UTC 反推 Shanghai 0:00 对应的 UTC 时间戳
 */
function getTodayRangeShanghai() {
  const SHANGHAI_OFFSET = 8 * 3600 * 1000
  const now = Date.now()
  const shanghaiNow = new Date(now + SHANGHAI_OFFSET)
  const y = shanghaiNow.getUTCFullYear()
  const m = shanghaiNow.getUTCMonth()
  const d = shanghaiNow.getUTCDate()
  // Shanghai 当天 0:00:00 对应的 UTC 时间戳
  const start = Date.UTC(y, m, d, 0, 0, 0) - SHANGHAI_OFFSET
  const end = start + 24 * 3600 * 1000 - 1
  return { start, end }
}

/**
 * 由订单 items 构建菜品摘要字符串
 * 形如 "焦糖拿铁 x1, 冰美式 x1"
 */
function buildSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ')
}

/**
 * 由首道菜名推断 emoji（仅用于首页视觉装饰）
 * 关键词命中即返回对应 emoji，未命中返回通用餐盘 emoji
 */
function pickEmoji(items) {
  if (!Array.isArray(items) || items.length === 0) return '🍽️'
  const name = String(items[0].name || '')
  if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name)) return '☕'
  if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name)) return '🥐'
  if (/面|粉|粥|拉面|乌冬|noodle/i.test(name)) return '🍜'
  if (/饭|炒饭|盖饭|咖喱|便当/i.test(name)) return '🍚'
  if (/沙律|沙拉|salad/i.test(name)) return '🥗'
  if (/汤|羹/i.test(name)) return '🍲'
  return '🍽️'
}
