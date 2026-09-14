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

本项目使用支付宝云服务空间。为减少家庭低频场景下的云函数管理和部署成本，多个业务模块
统一合并为一个 `app-service` 云函数，通过模块路由复用同一个入口。

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

## 微信配置填写位置

当前代码已经预留以下配置位。AppID 和模板 ID 已随项目代码保留；新服务空间只需要重新配置未进入 Git 的微信 AppSecret：

| 配置项 | 新空间是否必须填写 | 当前来源 |
| --- | --- | --- |
| `WX_APPID` | 否，已有回退配置；只有 AppID 变更时才需更新 | `manifest.json`、`utils/wx-config.js`、云函数配置 |
| `WX_SECRET` | 是，新空间不会继承旧空间的环境变量 | 微信公众平台获取后，填写支付宝云 `app-service` 环境变量 |
| `WX_TPL_ORDER_NOTIFY` | 否，模板 ID 未变化时无需重复配置 | `app-service/config.json` 和 `utils/wx-config.js` |
| `WX_TPL_COMPLETE_NOTIFY` | 否，模板 ID 未变化时无需重复配置 | `app-service/config.json` 和 `utils/wx-config.js` |
| `WX_TPL_PICKUP_NOTIFY` | 否，模板 ID 未变化时无需重复配置 | `app-service/config.json` 和 `utils/wx-config.js` |

说明：

- `WX_SECRET` 只放云函数环境变量，绝不写入前端或 Git。
- `WX_APPID` 和三个 `WX_TPL_*` 环境变量是可选覆盖项；不配置时，代码会回退到项目中已有的配置。
- 前端的公开 AppID 和模板 ID 位于 `utils/wx-config.js`，需要与微信公众平台和云函数配置保持一致。
- 截图、日志或提交代码时，不要暴露微信 AppSecret、支付宝云 AK/SK。
