'use strict'

/**
 * 订单 CRUD + 状态流转云函数
 *
 * 支持的 action：
 *   - create       创建订单（任意登录用户）
 *   - list         查询订单列表（登录用户，单家庭共享所有订单）
 *   - get          查询单个订单
 *   - updateStatus 更新订单状态（admin 推进 / owner 或 admin 取消）
 *   - cancel       取消订单（便捷方法，等价于 updateStatus cancelled）
 *   - pickup       管理员提醒取餐，触发 sendPickupNotify 推送给下单人
 *   - delete       管理员删除订单记录（物理删除，任意状态可删）
 *
 * 鉴权方式：
 *   前端传入 token（user-login 返回的 openid），云函数查询 users 集合获取用户信息与角色。
 *   实际写操作由云函数严格校验，schema 仅作基础保护。
 *
 * 状态流转图：
 *   pending → preparing → completed
 *      ↓
 *   cancelled
 *   - pending → preparing    仅 admin
 *   - pending → cancelled    下单人本人 或 admin
 *   - preparing → completed  仅 admin
 *   - preparing → cancelled  不允许（已开始制作）
 *   - completed → 任意       不允许（终态）
 *   - cancelled → 任意       不允许（终态）
 *
 * 单家庭共享：所有登录用户可见所有订单，list 无需 familyId 筛选
 * 时区：Asia/Shanghai（处理"今日"等概念时按 +8 时区）
 */

// 合法的状态流转映射：当前状态 -> 可变更的目标状态列表
const VALID_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['completed'],
  completed: [],
  cancelled: []
}

exports.main = async (event, context) => {
  const { action, token, ...payload } = event
  const db = uniCloud.database()
  const cmd = db.command
  const orderCol = db.collection('orders')

  // 所有 action 均需登录，先获取调用者用户信息
  const caller = await getCallerUser(token, db)
  if (!caller) {
    return { code: 401, message: '未授权：请先登录' }
  }

  switch (action) {
    case 'create':
      return await createOrder(payload, caller, orderCol)
    case 'list':
      return await listOrders(payload, orderCol, cmd, caller)
    case 'get':
      return await getOrder(payload, orderCol)
    case 'updateStatus':
      return await updateOrderStatus(payload, caller, orderCol)
    case 'cancel':
      return await cancelOrder(payload, caller, orderCol)
    case 'pickup':
      return await pickupOrder(payload, caller, orderCol)
    case 'delete':
      return await deleteOrder(payload, caller, orderCol)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}

/* ============ 鉴权辅助函数 ============ */

/**
 * 获取调用者用户信息
 * token 即 openid（由 user-login 返回），查询 users 集合返回用户记录
 * @param {string} token - 调用者 openid
 * @param {Object} db - 数据库实例
 * @returns {Promise<Object|null>} 用户记录或 null（未登录/不存在）
 */
async function getCallerUser(token, db) {
  if (!token) return null
  const userCol = db.collection('users')
  const res = await userCol.where({ openid: token }).get()
  if (res.data.length === 0) return null
  return res.data[0]
}

/**
 * 校验是否为管理员
 * @param {Object} user - 调用者用户记录
 * @returns {Object} { ok: boolean, message?: string }
 */
function requireAdmin(user) {
  if (!user) return { ok: false, message: '未授权：请先登录' }
  if (user.role !== 'admin') return { ok: false, message: '无权限：仅管理员可操作' }
  return { ok: true }
}

/**
 * 校验是下单人或管理员
 * @param {Object} user - 调用者用户记录
 * @param {Object} order - 订单记录
 * @returns {Object} { ok: boolean, message?: string }
 */
function requireOwnerOrAdmin(user, order) {
  if (!user) return { ok: false, message: '未授权：请先登录' }
  if (user.role === 'admin') return { ok: true }
  if (order.userId === user._id) return { ok: true }
  return { ok: false, message: '无权限：仅下单人或管理员可操作' }
}

/* ============ 业务 action 实现 ============ */

/**
 * 创建订单
 * 入参：items、reservationType、reservationTime、note
 * 默认 status='pending'，createTime/updateTime 为当前时间
 * 触发订阅消息推送给管理员（subscribe-message 云函数 sendOrderNotify）
 */
async function createOrder({ items, reservationType, reservationTime, note } = {}, caller, orderCol) {
  // 校验 items
  if (!Array.isArray(items) || items.length === 0) {
    return { code: 400, message: '订单菜品不能为空' }
  }
  for (const it of items) {
    if (!it.dishId || !it.name || !Number.isFinite(Number(it.quantity)) || Number(it.quantity) < 1) {
      return { code: 400, message: '菜品信息不完整或数量非法' }
    }
  }
  // 校验 reservationType
  if (reservationType && !['asap', 'scheduled'].includes(reservationType)) {
    return { code: 400, message: '预约类型无效' }
  }
  const type = reservationType || 'asap'
  // 指定时间必须提供 reservationTime
  if (type === 'scheduled' && !reservationTime) {
    return { code: 400, message: '指定时间预约需提供 reservationTime' }
  }

  const now = Date.now()
  const doc = {
    items: items.map((it) => ({
      dishId: String(it.dishId),
      name: String(it.name),
      image: it.image || '',
      quantity: Number(it.quantity)
    })),
    userId: caller._id,
    userName: caller.nickname || '',
    reservationType: type,
    reservationTime: type === 'scheduled' ? Number(reservationTime) : 0,
    note: note ? String(note).trim().slice(0, 200) : '',
    status: 'pending',
    createTime: now,
    updateTime: now
  }

  const addRes = await orderCol.add(doc)
  const order = { _id: addRes.id, ...doc }

  // 触发订阅消息推送给管理员（subscribe-message 云函数）
  // 同进程调用订阅模块，await 确保推送完成（低流量家庭应用可接受 1~3s 等待）
  try {
    await require('./subscribe-message.js').main({
      action: 'sendOrderNotify',
      orderId: addRes.id,
      userId: caller._id,
      userName: doc.userName,
      items: doc.items,
      note: doc.note
    })
  } catch (e) {
    console.error('[orders-crud] sendOrderNotify error', e)
  }
  return { code: 0, orderId: addRes.id, order }
}

/**
 * 查询订单列表
 * 入参（可选）：status、userId、dateStart、dateEnd、page、pageSize
 * 单家庭共享：返回所有订单，默认按 createTime 倒序
 */
async function listOrders({ status, userId, dateStart, dateEnd, page, pageSize, scope } = {}, orderCol, cmd, caller) {
  const where = {}

  // 状态筛选：支持单值或数组（如 ['pending', 'preparing']）
  if (status) {
    if (Array.isArray(status)) {
      where.status = cmd.in(status)
    } else {
      where.status = status
    }
  }

  // 数据范围：scope='mine' 仅查本人订单（点单记录页），否则查全部（管理员）
  if (scope === 'mine') {
    where.userId = caller._id
  } else if (userId) {
    where.userId = userId
  }

  // 日期范围筛选（毫秒时间戳）
  if (dateStart && dateEnd) {
    where.createTime = cmd.gte(Number(dateStart)).and(cmd.lte(Number(dateEnd)))
  } else if (dateStart) {
    where.createTime = cmd.gte(Number(dateStart))
  } else if (dateEnd) {
    where.createTime = cmd.lte(Number(dateEnd))
  }

  // 分页参数（保护性边界）
  const p = Math.max(1, Number(page) || 1)
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20))

  // 查询总数（空 where 时直接 count 全表）
  const countQuery = Object.keys(where).length > 0 ? orderCol.where(where) : orderCol
  const countRes = await countQuery.count()
  const total = countRes.total

  // 分页查询列表
  const dataQuery = Object.keys(where).length > 0 ? orderCol.where(where) : orderCol
  const res = await dataQuery
    .orderBy('createTime', 'desc')
    .skip((p - 1) * ps)
    .limit(ps)
    .get()

  return {
    code: 0,
    list: res.data,
    total,
    page: p,
    pageSize: ps
  }
}

/**
 * 查询单个订单
 * 入参：_id
 */
async function getOrder({ _id } = {}, orderCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  const res = await orderCol.doc(_id).get()
  if (res.data.length === 0) {
    return { code: 404, message: '订单不存在' }
  }
  return { code: 0, order: res.data[0] }
}

/**
 * 更新订单状态
 * 入参：_id、status
 * 鉴权：
 *   - 状态推进（pending→preparing、preparing→completed）：仅 admin
 *   - 取消（pending→cancelled）：下单人本人 或 admin
 * 状态变为 completed 时触发订阅消息推送给下单人（subscribe-message 云函数 sendCompleteNotify）
 */
async function updateOrderStatus({ _id, status } = {}, caller, orderCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }
  if (!['pending', 'preparing', 'completed', 'cancelled'].includes(status)) {
    return { code: 400, message: '目标状态无效' }
  }

  // 查询原订单
  const originRes = await orderCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '订单不存在' }
  }
  const order = originRes.data[0]

  // 校验状态流转合法性
  const allowed = VALID_TRANSITIONS[order.status] || []
  if (!allowed.includes(status)) {
    return { code: 400, message: `状态不允许从 ${order.status} 变更为 ${status}` }
  }

  // 鉴权：取消需 owner 或 admin；状态推进需 admin
  if (status === 'cancelled') {
    const authRes = requireOwnerOrAdmin(caller, order)
    if (!authRes.ok) return { code: 403, message: authRes.message }
  } else {
    const authRes = requireAdmin(caller)
    if (!authRes.ok) return { code: 403, message: authRes.message }
  }

  const now = Date.now()
  const updateRes = await orderCol.doc(_id).update({
    status,
    updateTime: now
  })
  if (updateRes.updated === 0) {
    return { code: 404, message: '订单不存在' }
  }

  // 状态变为 completed 时触发订阅消息推送给下单人（subscribe-message 云函数）
  // 同进程调用订阅模块，await 确保推送完成（低流量家庭应用可接受 1~3s 等待）
  if (status === 'completed') {
    try {
      await require('./subscribe-message.js').main({
        action: 'sendCompleteNotify',
        orderId: _id,
        userId: order.userId,
        items: order.items
      })
    } catch (e) {
      console.error('[orders-crud] sendCompleteNotify error', e)
    }
  }
  return { code: 0, order: { ...order, status, updateTime: now } }
}

/**
 * 取消订单（便捷方法，等价于 updateStatus cancelled）
 * 入参：_id
 * 鉴权：下单人可取消自己 pending 订单，admin 可取消任何 pending 订单
 * 仅 pending 状态可取消
 */
async function cancelOrder({ _id } = {}, caller, orderCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  // 查询原订单
  const originRes = await orderCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '订单不存在' }
  }
  const order = originRes.data[0]

  // 仅 pending 状态可取消
  if (order.status !== 'pending') {
    return { code: 400, message: `当前状态 ${order.status} 不可取消，仅待制作订单可取消` }
  }

  // 鉴权：下单人本人 或 admin
  const authRes = requireOwnerOrAdmin(caller, order)
  if (!authRes.ok) return { code: 403, message: authRes.message }

  const updateRes = await orderCol.doc(_id).update({
    status: 'cancelled',
    updateTime: Date.now()
  })
  if (updateRes.updated === 0) {
    return { code: 404, message: '订单不存在' }
  }

  return { code: 0 }
}

/**
 * 取餐提醒（管理员向下单人发送取餐通知）
 * 入参：_id、pickupMethod、pickupTip
 * 鉴权：仅管理员可操作，且仅 completed 状态可提醒
 * 触发 subscribe-message 云函数 sendPickupNotify 推送给下单人
 */
async function pickupOrder({ _id, pickupMethod, pickupTip } = {}, caller, orderCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  const originRes = await orderCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '订单不存在' }
  }
  const order = originRes.data[0]

  // 鉴权：仅管理员可操作
  const authRes = requireAdmin(caller)
  if (!authRes.ok) return { code: 403, message: authRes.message }

  // 状态校验：仅 completed 可提醒取餐
  if (order.status !== 'completed') {
    return { code: 400, message: '仅已完成订单可提醒取餐' }
  }

  // 触发取餐提醒订阅消息推送给下单人
  // 同进程调用订阅模块，await 确保推送完成（低流量家庭应用可接受 1~3s 等待）
  try {
    await require('./subscribe-message.js').main({
      action: 'sendPickupNotify',
      orderId: _id,
      userId: order.userId,
      items: order.items,
      pickupMethod: pickupMethod || '',
      pickupTip: pickupTip || ''
    })
  } catch (e) {
    console.error('[orders-crud] sendPickupNotify error', e)
  }
  return { code: 0 }
}

/**
 * 删除订单记录（管理员）
 * 入参：_id
 * 鉴权：下单人本人 或 admin 可操作，任意状态均可删除
 * 物理删除订单文档，不可恢复
 */
async function deleteOrder({ _id } = {}, caller, orderCol) {
  if (!_id) {
    return { code: 400, message: '缺少 _id' }
  }

  // 查询原订单，鉴权：下单人本人 或 admin
  const originRes = await orderCol.doc(_id).get()
  if (originRes.data.length === 0) {
    return { code: 404, message: '订单不存在' }
  }
  const order = originRes.data[0]
  const authRes = requireOwnerOrAdmin(caller, order)
  if (!authRes.ok) return { code: 403, message: authRes.message }

  // 物理删除
  const deleteRes = await orderCol.doc(_id).remove()
  if (deleteRes.deleted === 0) {
    return { code: 404, message: '订单不存在' }
  }

  return { code: 0 }
}
