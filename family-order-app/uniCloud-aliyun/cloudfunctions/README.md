# 此目录用于存放 uniCloud 云函数

## 云函数列表

- `app-service/` - 统一业务云函数（9 个原独立云函数合并而来，通过 `event.module` 路由）

| module | 原函数名 | 职责 |
| --- | --- | --- |
| `user-login` | user-login | 微信登录（code 换 openid） |
| `user-update-profile` | user-update-profile | 更新昵称/头像 |
| `user-update-role` | user-update-role | 设置角色 |
| `categories-crud` | categories-crud | 分类 CRUD |
| `dishes-crud` | dishes-crud | 菜品 CRUD |
| `menu-list` | menu-list | 菜单/分类查询（点单页） |
| `home-data` | home-data | 首页聚合数据 |
| `orders-crud` | orders-crud | 订单 CRUD + 状态流转 |
| `subscribe-message` | subscribe-message | 微信订阅消息推送 |

前端统一调用方式：

```js
uniCloud.callFunction({
  name: 'app-service',
  data: { module: 'user-login', ...原函数参数 }
})
```

## 合并原因

阿里云 uniCloud 自 2026-03-16 起对云函数资源使用量（GBs）执行「单个函数 + 小时」最低消费规则：
某云函数在某一小时内只要运行过一次，该小时最少按 ~90GBs 计费。原 9 个独立云函数在低频使用下
会触发 9 倍最低消费，合并为 1 个函数后降到 1 倍。

## 部署注意事项

1. 在 HBuilderX 中右键 `app-service` 目录 →「上传部署」。
2. 在 uniCloud Web 控制台删除旧的 9 个云函数（user-login、user-update-profile、user-update-role、
   categories-crud、dishes-crud、menu-list、home-data、orders-crud、subscribe-message），
   避免残留函数继续产生最低消费计费。
3. **微信凭证必须通过云函数环境变量配置**（源码中已移除明文 secret）：
   - 在 uniCloud Web 控制台 → 云函数 `app-service` → 环境变量中配置：
     - `WX_APPID` = 小程序 AppID
     - `WX_SECRET` = 小程序 AppSecret
     - `WX_TPL_ORDER_NOTIFY` / `WX_TPL_COMPLETE_NOTIFY` / `WX_TPL_PICKUP_NOTIFY`（可选，不配置则使用 config.json 中的模板 ID）
   - `user-login` 与 `subscribe-message` 均优先读取环境变量；未配置环境变量时登录/订阅消息会返回错误。
   - `app-service/config.json` 仅保留非敏感的 appid 与订阅消息模板 ID。
4. `app-service` 依赖 `common/uni-config-center`（uni-id 配置中心，user-login 读取微信凭证使用），
   部署 `app-service` 前需先确保 `common/uni-config-center` 已上传。