import { defineStore } from 'pinia'

/**
 * 购物车 Store
 * 管理点单页的已选菜品，咖啡/美食各自独立分桶互不影响
 * 约束：无价格字段、无支付逻辑，仅追踪件数
 *
 * 数据结构：
 *   state.carts = { coffee: [...], food: [...] }
 *   state.activeType = 'coffee' | 'food'  当前点单页正在使用的类型
 *
 * 模板/computed 通过 activeItems / totalCount 读取当前类型购物车，
 * 切换 activeType 即可瞬间切换到对应类型的购物车内容
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    // 按类型分桶存储，互不影响
    carts: {
      coffee: [],
      food: []
    },
    // 当前激活的类型（由点单页 onLoad/onShow 设置）
    activeType: 'coffee',
    // 待进入点单页时使用的类型（coffee/food）
    // 由首页双入口卡片设置，点单页 onShow 时消费一次
    // 因 switchTab 不支持 query 参数，故用 store 字段中转
    pendingType: ''
  }),

  getters: {
    /**
     * 当前类型购物车的菜品列表
     */
    activeItems(state) {
      return state.carts[state.activeType] || []
    },

    /**
     * 当前类型购物车总件数
     */
    totalCount(state) {
      const items = state.carts[state.activeType] || []
      return items.reduce((sum, item) => sum + item.quantity, 0)
    },

    /**
     * 当前类型购物车总种类数
     */
    totalKinds(state) {
      return (state.carts[state.activeType] || []).length
    },

    /**
     * 当前类型购物车是否为空
     */
    isEmpty(state) {
      return (state.carts[state.activeType] || []).length === 0
    }
  },

  actions: {
    /**
     * 切换当前激活的购物车类型
     * @param {string} type - 'coffee' | 'food'
     */
    setActiveType(type) {
      if (!['coffee', 'food'].includes(type)) return
      this.activeType = type
    },

    /**
     * 加入当前类型购物车（已存在则数量累加）
     * @param {Object} dish - 菜品信息 { dishId, name, image, type, description }
     * @param {number} quantity - 加入数量，默认 1
     */
    addItem(dish, quantity = 1) {
      const items = this.carts[this.activeType]
      const existing = items.find((i) => i.dishId === dish.dishId)
      if (existing) {
        existing.quantity += quantity
      } else {
        items.push({
          dishId: dish.dishId,
          name: dish.name,
          image: dish.image,
          type: dish.type,
          description: dish.description || '',
          quantity
        })
      }
    },

    /**
     * 更新某菜品数量（当前类型购物车）
     * 数量 <= 0 时自动移除
     */
    updateQuantity(dishId, quantity) {
      if (quantity <= 0) {
        this.removeItem(dishId)
        return
      }
      const item = this.carts[this.activeType].find((i) => i.dishId === dishId)
      if (item) {
        item.quantity = quantity
      }
    },

    /**
     * 数量 +1（当前类型购物车）
     */
    increment(dishId) {
      const item = this.carts[this.activeType].find((i) => i.dishId === dishId)
      if (item) {
        item.quantity += 1
      }
    },

    /**
     * 数量 -1，减到 0 自动移除（当前类型购物车）
     */
    decrement(dishId) {
      const item = this.carts[this.activeType].find((i) => i.dishId === dishId)
      if (!item) return
      if (item.quantity <= 1) {
        this.removeItem(dishId)
      } else {
        item.quantity -= 1
      }
    },

    /**
     * 移除某菜品（当前类型购物车）
     */
    removeItem(dishId) {
      const items = this.carts[this.activeType]
      const idx = items.findIndex((i) => i.dishId === dishId)
      if (idx > -1) {
        items.splice(idx, 1)
      }
    },

    /**
     * 清空当前类型购物车（订单提交成功后调用）
     */
    clearCart() {
      this.carts[this.activeType] = []
    },

    /**
     * 获取某菜品在当前类型购物车中的数量
     */
    getQuantity(dishId) {
      const item = this.carts[this.activeType].find((i) => i.dishId === dishId)
      return item ? item.quantity : 0
    },

    /**
     * 设置待进入点单页时的点单类型（首页双入口卡片调用）
     * @param {string} type - 'coffee' | 'food'
     */
    setPendingType(type) {
      this.pendingType = type
    },

    /**
     * 消费 pendingType：读取并清空
     * 点单页 onShow 时调用一次，拿到首页传入的类型并切主题
     * @returns {string} 类型字符串，可能为空
     */
    consumePendingType() {
      const t = this.pendingType
      this.pendingType = ''
      return t
    }
  }
})
