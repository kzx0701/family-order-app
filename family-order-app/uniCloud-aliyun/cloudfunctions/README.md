# 此目录用于存放 uniCloud 云函数

包含以下云函数：
- `user-login/` - 微信登录与角色鉴权
- `home-data/` - 首页聚合数据查询
- `menu-list/` - 菜单与分类查询
- `orders-crud/` - 订单状态流转
- `subscribe-message/` - 订阅消息推送（sendOrderNotify 通知管理员 / sendCompleteNotify 通知下单人）

部署 `subscribe-message` 前需在 `subscribe-message/config.json` 填入微信小程序 appid、secret 与订阅消息模板 ID。
