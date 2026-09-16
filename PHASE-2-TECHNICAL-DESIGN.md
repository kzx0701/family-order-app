# 家庭点餐系统｜二期技术设计方案

> 状态：技术方案草案，基于已确认的二期需求整理
>
> 更新日期：2026-09-14
>
> 需求基线：[PHASE-2-REQUIREMENTS.md](./PHASE-2-REQUIREMENTS.md)

## 1. 设计目标

二期不是在现有页面上继续堆叠功能，而是围绕“家庭”重新组织应用结构：

```text
家庭
├── 家庭用户与身份模式
├── 菜谱内容源
├── 菜单发布层
├── 家庭点餐
└── 做饭协作
```

核心原则：

- 菜谱是内容源，菜单是可点单发布层，订单是历史快照。
- 干饭人和饲养员是可切换的工作模式，不是普通用户和管理员的产品概念。
- 两种身份共用首页、菜单、菜谱和我的页面。
- 只有饲养员可以配置菜单/菜谱，以及推进订单制作流程。
- 先完成数据和页面边界，再进行全局动漫手绘 UI 重做。

## 2. 当前架构基线

当前运行源码位于 `family-order-app/`，技术栈为：

- uni-app 3
- Vue 3 Composition API
- Pinia
- SCSS
- 微信小程序
- 阿里云 uniCloud 云函数、云数据库和云存储
- Lottie 小程序动画

当前后端通过一个 `app-service` 云函数按 `event.module` 路由业务模块。已有业务模块包括用户登录、用户资料、角色、分类、菜品、菜单查询、首页数据、订单和订阅消息。

二期需要重点调整的旧模型：

- `users.role` 当前承担了身份和管理员权限两个概念。
- `dishes` 当前同时承担菜品基础信息和菜单发布信息。
- `admin` 当前是底部 Tab，二期应改为饲养员模式下的配置入口。
- `record` 当前是底部 Tab，二期应收口到“我的”。
- 首页当前保留头像入口，二期应移除。

## 3. 目标页面架构

### 3.1 底部 Tab

两个身份共用：

```text
首页 / 菜单 / 菜谱 / 我的
```

不再保留底部“管理”Tab。

### 3.2 页面清单

```text
pages/
├── login/               微信一键登录
├── onboarding/          信息配置引导（性别 → 身份，可跳过）
├── home/                首页
├── menu/                统一点餐页面
├── recipe/              菜谱列表和详情
├── my/                  我的
├── order-record/        点单记录（二级页面）
├── menu-config/         饲养员菜单配置
├── recipe-config/       饲养员菜谱配置
├── dish-detail/         点餐场景下的菜品详情
├── order-detail/        订单详情与做饭流程
├── submit/              提交当前类型订单
└── order-success/       下单成功
```

`menu-config` 和 `recipe-config` 不进入底部导航，只能从饲养员模式下的菜单页或菜谱页进入。

## 4. 登录、引导和身份流程

### 4.1 登录页

```text
进入小程序
→ 恢复本地登录态
→ 有有效登录态：跳过登录页，直接判断引导状态
→ 无登录态：reLaunch 到 /pages/login/login
→ 用户点击“微信一键登录”
→ uni.login 取 code → 云函数 user-login
→ 登录成功：进入引导状态判断
```

要点：

- 登录页只提供微信一键登录，是进入小程序的唯一入口。
- 不调用 `getUserProfile`，不申请昵称、头像授权，只完成 openid 识别，避免多余的授权弹窗。
- 登录失败在页面内提示并提供重试，不用弹窗打断。
- 未登录时，所有页面跳转由守卫统一拦截回登录页。

### 4.2 信息配置引导

```text
登录成功
→ 判断 onboardingCompleted
→ 已完成：按 lastMode 恢复身份，进入首页
→ 未完成：进入 /pages/onboarding/onboarding
   步骤一 选择性别（男 / 女）
   步骤二 选择身份（干饭人 / 饲养员）
   → 完成：写入 gender + lastMode，onboardingCompleted = true
   → 跳过：gender = 'male'，lastMode = 'diner'，onboardingCompleted = true
→ 进入首页
```

要点：

- 两步放在同一个 onboarding 页面中，通过步骤状态切换，避免用户停在中间状态进入其他业务页面。
- 引导页整页可跳过；跳过后不再重复弹出。
- 跳过时按默认值落库（性别 `male`、身份 `diner`），因此 `gender` 与 `lastMode` 都不会出现空值，界面无需处理“未设置”分支。
- 性别与身份的补填入口保留在“我的”页面。

### 4.3 自动登录和重新登录

```text
自动登录/恢复登录态
→ 有 token 且 onboardingCompleted
→ 恢复 lastMode
→ 直接进入首页
```

```text
重新登录
→ 已有完整引导信息：按 lastMode 恢复进入
→ 引导信息不完整：进入信息配置引导
```

“我的”页面中的身份切换更新 `lastMode`，供下一次自动登录恢复。

### 4.4 建议的用户字段

```js
{
  _id,
  openid,
  nickname,
  avatar,
  gender: 'male' | 'female',         // 引导步骤一，跳过时为 'male'
  familyId,
  lastMode: 'diner' | 'cook',        // 引导步骤二，跳过时为 'diner'
  onboardingCompleted: true,         // 引导完成或已跳过，均置为 true
  createTime,
  updateTime
}
```

`gender` 的用途：决定默认头像，`male` 取男生素材、`female` 取女生素材。可在“我的”页面修改。由于跳过时为 `male`，该字段不会出现空值。

`onboardingCompleted` 的语义是“引导流程已处理完毕”，包含完成与跳过两种结果；守卫只判断这一个字段，不判断 `gender` 或 `lastMode` 是否为空。

产品文案统一使用“干饭人/饲养员”，代码内部建议使用稳定的 `diner/cook` 枚举。旧的 `orderer/admin` 只作为迁移兼容值，不再作为新功能的产品语义。

## 5. 数据模型

### 5.1 families

家庭成为数据隔离和业务聚合的核心单位：

```js
{
  _id,
  name: '我的家庭',
  ownerId,
  createTime,
  updateTime
}
```

`ownerId` 记录最初创建家庭名称的用户。家庭名称后续只能由该用户修改。

家庭名称不在登录引导流程中，入口位于“我的”页面的家庭信息卡。

单家庭场景下的创建时机：用户首次登录并创建 `users` 记录时，若 `familyId` 尚未指向任何家庭，则自动创建一条默认家庭记录（`name = '我的家庭'`，`ownerId = 该用户`），并把 `users.familyId` 指向它。因此单家庭场景下，首个登录的用户即家庭创建者。

二期第一阶段可以继续兼容当前单家庭场景，但所有新数据和接口都保留 `familyId` 边界，为后续家庭邀请、加入家庭或多家庭扩展留出空间。家庭加入/邀请流程不在当前已确认范围内。

### 5.2 recipes

菜谱是家庭菜品内容源：

```js
{
  _id,
  familyId,
  name,
  image,
  description,
  type: 'food' | 'coffee',
  servings,
  prepTime,
  difficulty,
  status: 'draft' | 'ready',
  ingredients: [
    {
      id,
      name,
      image,
      amount,
      unit,
      optional,
      visibleWhen,
      amountByOption
    }
  ],
  optionGroups: [
    {
      key,
      name,
      options: [
        { value, label }
      ]
    }
  ],
  steps: [
    {
      id,
      order,
      title,
      description,
      image,
      duration
    }
  ],
  createTime,
  updateTime
}
```

只有 `status='ready'` 的菜谱可以被选择加入菜单。菜谱名称、配料、步骤和口味规则都由菜谱管理功能维护。

### 5.3 menu_items

菜单是菜谱的发布层：

```js
{
  _id,
  familyId,
  recipeId,
  type: 'food' | 'coffee',
  categoryId,
  isOnSale,
  isRecommended,
  sortOrder,
  createTime,
  updateTime
}
```

菜单层只维护展示和发布属性：

- 是否加入菜单
- 菜单类型
- 分类
- 是否上架
- 是否推荐
- 展示顺序

菜品名称、图片和制作做法的权威来源是 `recipes`，避免菜单和菜谱内容长期分叉。

### 5.4 orders

订单仍然保存下单时的快照：

```js
{
  _id,
  familyId,
  userId,
  userName,
  orderType: 'food' | 'coffee',
  items: [
    {
      recipeId,
      menuItemId,
      name,
      image,
      type,
      quantity,
      options
    }
  ],
  reservationType,
  reservationTime,
  note,
  status: 'pending' | 'preparing' | 'completed' | 'cancelled',
  createTime,
  updateTime
}
```

菜谱口味选择必须同步到订单的 `options` 快照中，订单详情和做饭流程需要展示用户选择的口味。为避免菜谱后续修改影响历史订单，后续可同时保存下单时解析出的配料快照。

### 5.5 现有数据策略

现有数据不做迁移。二期按新的 `families`、`recipes`、`menu_items` 和 `orders` 数据模型重新初始化，旧 `dishes` 数据不作为二期业务数据继续承接。

重新初始化前需要完成：

1. 确认当前数据已备份或明确不需要保留。
2. 初始化默认家庭及其创建者信息。
3. 使用新菜谱数据配置菜单。
4. 确认点餐接口只读取新菜单发布数据。

## 6. 权限设计

### 6.1 读取权限

已登录且属于当前家庭的用户可以：

- 查看菜单
- 查看菜谱
- 查看自己的点单记录
- 查看首页当前家庭的全部最近点单记录
- 查看订单详情

### 6.2 饲养员操作权限

当前身份为饲养员时，可以：

- 配置菜谱
- 配置菜单
- 开始制作订单
- 标记订单完成
- 发送取餐提醒

干饭人模式不展示上述配置和制作操作入口。

后端接口必须同步校验当前用户身份和 `familyId`，不能只依赖前端是否显示按钮。由于身份允许随时切换，这里是“当前工作模式权限”；如果未来需要限制为某一个固定家庭成员，再新增独立的 `canConfigure` 能力字段。

身份校验以服务端用户记录的 `lastMode` 为准，**不接受前端传入的身份参数**。切换身份时立即写库更新 `lastMode`，因此 `lastMode` 就代表当前工作模式；这样客户端无法通过伪造参数越过饲养员权限校验。现有 `home-data` 中“前端传 role、服务端仅做一致性校验”的写法需要按此调整。

### 6.3 身份实现建议

当前 `token=openid` 的实现可以在二期先保持兼容，但所有新接口应统一封装鉴权和家庭校验，避免每个模块重复解析 token。后续如升级为正式 session/token，不应影响页面业务接口。

## 7. 云函数模块设计

继续使用 `app-service` 统一入口，新增或调整以下 module：

```text
user-login
└── login                  点击一键登录后调用，返回用户记录与引导状态

user-identity
├── getState               读取 gender / lastMode / onboardingCompleted
├── completeOnboarding     提交引导结果（性别 + 身份），支持跳过
└── switchMode             切换身份并更新 lastMode，允许反复切换

family-data
├── get                    读取当前家庭信息
└── updateName             修改家庭名称（仅家庭创建者）

recipes-crud
├── list
├── detail
├── create
├── update
├── delete
└── markReady

menu-crud
├── list
├── addFromRecipe
├── update
├── remove
└── sort

orders-crud
├── create
├── list
├── get
├── cancel
├── updateStatus
├── pickup
└── delete
```

模块调整说明：

- 原 `user-update-role` 由 `user-identity` 取代。原实现“角色一经选择不可更改”（已有非空身份则返回 403）与二期的可切换身份直接冲突，需一并移除该限制。
- `user-login` 在返回 `userInfo` / `token` 时一并带回 `gender`、`lastMode`、`onboardingCompleted`，让前端在登录响应里即可决定去向，避免首屏多一次请求。
- 身份与权限校验统一在 `app-service` 入口封装：解析 token 得到用户与 `familyId`，各业务模块只消费结果，不再各自解析 token。

现有 `menu-list` 可以在过渡期保留，但最终应从“查询 dishes”调整为“查询已上架 menu_items 并关联 recipes”。

订单创建接口必须由服务端校验：

- 当前菜单项存在且属于当前家庭。
- 菜单项处于上架状态。
- 关联菜谱处于 ready 状态。
- 当前请求的 `orderType` 与菜单类型一致。
- items 只来自当前类型购物车。

## 8. 前端状态设计

### 8.1 user Store

```js
{
  userInfo,
  token,
  family,                          // { _id, name, ownerId } 或 null
  gender: 'male' | 'female',      // 默认头像依据，跳过时为 'male'
  currentMode: 'diner' | 'cook',   // 跳过后默认 'diner'，不会为空
  onboardingCompleted
}
```

负责：

- 恢复登录态；未登录时把用户引向登录页
- 调用登录、提交引导结果、切换身份
- 保存家庭信息与家庭名称
- 保存性别，供默认头像使用
- 处理首次登录引导状态
- 提供 `isCook`、`isDiner` 等 getter

主要 action：`login` / `logout` / `restore` / `persist` / `completeOnboarding` / `switchMode` / `updateProfile`（含 `gender`） / `loadFamily` / `updateFamilyName`。

### 8.2 cart Store

继续使用现有分桶基础：

```js
{
  carts: {
    food: [],
    coffee: []
  },
  activeType: 'food' | 'coffee'
}
```

统一点餐页面只读取 `activeType` 对应的购物车。提交订单时只读取当前类型，提交成功后只清空当前类型，不能清空另一类购物车。

### 8.3 recipe Store 或页面状态

第一阶段不强制新增全局 recipe Store。菜谱列表、详情和配置表单可以采用页面级状态，只有以下内容需要稳定管理：

- 当前菜谱
- 当前选项值
- 动态解析后的配料列表
- 编辑中的草稿

## 9. 页面交互方案

### 9.1 首页

```text
顶部：家庭氛围与页面标题
中部：干饭 / 咖啡两个入口
下方：最近点单记录
底部：统一 TabBar
```

首页不再显示右上角个人头像。

首页最近点单记录显示当前家庭的全部订单，不限定为当前用户。

点击入口：

- 干饭：进入菜单页并激活菜品 Tab。
- 咖啡：进入菜单页并激活咖啡 Tab。

### 9.2 统一菜单页

```text
页面标题
菜品 / 咖啡 Tab
分类导航
菜单卡片
当前类型购物车
```

饲养员模式在右上角增加配置按钮，干饭人模式隐藏。

菜单卡片可以展示：

- 菜谱图片
- 菜谱名称
- 简短描述
- 是否有菜谱
- 推荐状态
- 加入购物车操作

### 9.3 菜谱页

```text
菜谱列表
→ 菜谱详情
→ 选择口味
→ 动态配料更新
→ 查看制作步骤
```

饲养员模式增加菜谱配置按钮。

动态配料渲染应由纯函数完成：

```text
recipe + selectedOptions
→ resolveIngredients()
→ 当前配料列表
```

切换口味时只更新选择状态和解析结果，不直接修改原始菜谱数据。

### 9.4 我的页面

```text
个人信息
当前身份
身份切换
当前家庭
点单记录入口
```

身份切换成功后：

- 更新本地 `currentMode`
- 持久化 `lastMode`
- 刷新页面中与身份有关的配置入口和权限按钮

### 9.5 点单记录

从“我的”进入原有记录列表，保留：

- 日期分组
- 分页
- 下拉刷新
- 取消订单
- 删除订单
- 查看订单详情

记录列表不再作为底部一级 Tab。

## 10. 开发顺序

### 阶段 0：需求冻结

本阶段已完成。以下规则已经确认并写入需求基线：

- 菜谱口味必须同步进入订单。
- 首页最近订单显示当前家庭的全部订单。
- 家庭名称只能由最初创建家庭名称的用户修改，入口在“我的”页面。
- 登录使用独立登录页，只提供微信一键登录。
- 信息配置引导固定两步：先选性别，再选身份；整页可跳过，跳过时性别默认男、身份默认干饭人。
- 现有数据不迁移，二期重新初始化。

### 阶段 1：视觉与应用壳

完成：

- 动漫手绘视觉基线
- 新版 TabBar
- 页面背景和基础组件
- 食材素材规范
- 页面容器、弹窗、按钮、空状态和加载状态

验收：新旧页面不混用旧主题变量，四个 Tab 结构稳定。

### 阶段 2：登录、引导和我的

完成：

- 独立登录页（微信一键登录）
- 信息配置引导页：性别 → 身份，整页可跳过
- 引导状态落库与恢复（`onboardingCompleted` / `gender` / `lastMode`）
- 自动恢复上次身份
- 引导信息不完整时重新进入引导
- 干饭人/饲养员随时切换
- 性别与默认头像联动
- “我的”页面：性别、身份切换、家庭名称维护
- 移除首页头像

验收：登录页、首次引导、跳过引导、自动登录、重新登录和身份切换六条路径均可重复验证。

### 阶段 3：菜谱数据和管理

完成：

- recipes Schema
- 菜谱 CRUD
- 菜谱列表
- 菜谱详情
- 配料编辑
- 制作步骤编辑
- ready/draft 状态

验收：饲养员可以创建一份完整菜谱，干饭人可以正常浏览。

### 阶段 4：动态配料

完成：

- 口味选项组
- 条件显示
- 条件数量
- 辣度示例
- 配料解析纯函数
- 切换选项时的即时 UI 更新

验收：芹菜炒肉在不辣、微辣、中辣之间切换时，辣椒显示和数量正确，原始菜谱不被破坏。

### 阶段 5：菜单发布

完成：

- menu_items Schema
- 从 ready 菜谱加入菜单
- 菜单分类、排序、推荐和上架
- 饲养员菜单配置入口
- 无菜谱时引导去配置菜谱

验收：无法从未配置完成的菜谱创建可点菜单项。

### 阶段 6：统一点餐

完成：

- 菜品/咖啡统一页面
- 首页入口激活对应 Tab
- 独立购物车展示
- 当前类型独立提交
- 当前类型独立清空
- 订单 `orderType`
- 菜品详情到菜谱详情入口

验收：菜品和咖啡加购、切换、下单、回切恢复全部互不干扰。

### 阶段 7：做饭流程和通知

完成：

- 饲养员订单状态操作
- 开始制作
- 标记完成
- 取餐提醒
- 服务端身份校验
- 原有订阅消息适配新身份和家庭边界

验收：干饭人看不到制作操作，饲养员可以完整推进订单状态。

### 阶段 8：全局视觉打磨与回归

完成：

- 首页
- 菜单
- 菜谱
- 我的
- 订单详情
- 下单成功
- 所有加载、空状态、错误状态
- 动效和安全区域适配

验收：完成首次登录、切换身份、配置菜谱、加入菜单、分别点菜/点咖啡、处理订单的完整回归。

## 11. 风险与控制

### 数据初始化风险

二期不迁移现有 `dishes` 数据。初始化前需要确认旧数据已备份或明确不需要保留，并确保新点餐接口只读取新菜单发布数据。

### 身份与权限风险

身份可随时切换意味着“饲养员”是工作模式，而不是固定账号权限。后端必须明确这是产品规则；若未来需要固定权限，要新增独立能力字段。

### 订单隔离风险

统一页面很容易误把两个购物车合并。购物车、提交参数、订单类型和订单清空必须在 Store、页面和云函数三层同时校验。

### 视觉重做风险

不能只替换颜色。应先确定新的组件、卡片、插画和动效语言，再逐页迁移，避免新旧风格长期混杂。

## 12. 当前建议的下一步

需求关键决策已经完成。下一步进入阶段 1：动漫手绘视觉方案和应用壳重构。
