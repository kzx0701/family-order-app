# Tasks

- [x] Task 1: 项目初始化与基础设施搭建
  - [ ] SubTask 1.1: 使用 HBuilderX 创建 uniapp + Vue 3 项目，配置微信小程序运行环境（AppID、manifest.json，启用 Composition API）
  - [ ] SubTask 1.2: 创建 uniCloud 服务空间（阿里云或腾讯云），配置云数据库集合（users / dishes / categories / orders）
  - [ ] SubTask 1.3: 配置 DB Schema（dishes / categories 的 schema 定义与权限规则，自动生成 CRUD 接口）
  - [ ] SubTask 1.4: 落地项目基础设计 token，基于 colors_and_type.css 建立 SCSS 变量体系（双主题：咖啡棕 #6F4E37 / 美食绿 #16A34A，暖奶油底色 #FFFBF5）
  - [ ] SubTask 1.5: 集成 lottie-miniprogram 动画库，准备 Lottie 动画资源目录
  - [ ] SubTask 1.6: 创建 SVG 图标资源库（lucide 风格，含 home / utensils / clipboard-list / arrow-left / shopping-cart / plus / minus / check 等基础图标）
  - [ ] SubTask 1.7: 创建页面路由结构（首页、点单页、菜品详情页、提交详情页、下单成功页、记录页、管理 tab 页、角色选择页）
  - [ ] SubTask 1.8: 配置底部 tab 导航（下单人 3 tab / 管理员 4 tab 的差异化，通过角色动态渲染）
  - [ ] SubTask 1.9: 搭建 Pinia 状态管理（用户信息 store、角色 store、购物车 store）

- [x] Task 2: 用户与角色系统
  - [ ] SubTask 2.1: 实现 微信一键登录（uni.login + uniCloud uniID 用户体系）
  - [ ] SubTask 2.2: 创建 users 集合结构（openid、昵称、头像、role[orderer/admin]、familyId、createTime）
  - [ ] SubTask 2.3: 实现首次登录角色选择页（下单人/管理员），选择后持久化到 users 集合
  - [ ] SubTask 2.4: 实现角色识别与 tab 差异化展示逻辑（已选角色的用户直接进入对应界面）
  - [ ] SubTask 2.5: 编写云函数 user-login 处理登录与角色持久化

- [x] Task 3: 菜品与分类数据模型 + 管理端
  - [ ] SubTask 3.1: 创建 dishes 集合（_id、name、image、description、type[coffee/food]、categoryId、isOnSale、sortOrder、createTime、updateTime）
  - [ ] SubTask 3.2: 创建 categories 集合（_id、name、type[coffee/food]、sortOrder、createTime）
  - [ ] SubTask 3.3: 实现管理员菜单管理页：菜品列表（按类型筛选）+ 新增/编辑/删除菜品
  - [ ] SubTask 3.4: 实现菜品图片上传（uniCloud 云存储 uniCloud.uploadFile）
  - [ ] SubTask 3.5: 实现分类管理（新增/编辑/删除/排序，咖啡与美食各自独立）
  - [ ] SubTask 3.6: 实现菜品上下架开关
  - [ ] SubTask 3.7: 编写云函数 dishes-crud（查询/新增/编辑/删除，仅管理员可写）+ categories-crud

- [x] Task 4: 首页
  - [ ] SubTask 4.1: 实现首页顶部 header（趣味问候语 + 用户头像，少文字多图）
  - [ ] SubTask 4.2: 实现咖啡/美食双入口卡片（双主题渐变背景 + 趣味图标/插画）
  - [ ] SubTask 4.3: 实现"今日订单"区域（下单人：今日我的点单；管理员：今日待制作订单）
  - [ ] SubTask 4.4: 管理员今日订单支持直接操作状态（开始制作/完成）
  - [ ] SubTask 4.5: 编写云函数 home-data 返回首页所需聚合数据

- [x] Task 5: 点单页（咖啡/美食共用）
  - [ ] SubTask 5.1: 实现点单页框架（顶部 header + 左侧分类导航 + 右侧菜品列表 + 底部购物车条）
  - [ ] SubTask 5.2: 实现双主题切换（咖啡棕 / 美食绿，通过 props 或路由参数控制主题变量）
  - [ ] SubTask 5.3: 实现分类导航与菜品列表联动（点击分类滚动定位 + 当前分类高亮）
  - [ ] SubTask 5.4: 实现菜品列表项（图片 + 名称 + 描述 + "+"加购按钮）
  - [ ] SubTask 5.5: 实现列表直接加购逻辑（点击"+"加入购物车，购物车条更新 + 飞入动效）
  - [ ] SubTask 5.6: 编写云函数 menu-list 按 type 与 categoryId 查询上架菜品

- [x] Task 6: 菜品详情页
  - [ ] SubTask 6.1: 实现详情页布局（顶部大图 + 返回按钮 + 名称 + 描述 + 数量选择器 + 加入点单按钮）
  - [ ] SubTask 6.2: 实现数量选择器（+/- 调整，最小 1）
  - [ ] SubTask 6.3: 实现"加入点单"逻辑（加入购物车后返回点单页，购物车条更新）

- [x] Task 7: 购物车浮层
  - [ ] SubTask 7.1: 实现底部购物车条（件数 + 去下单按钮，空时置灰）
  - [ ] SubTask 7.2: 实现购物车浮层展开动效（点击购物车条丝滑展开/收起）
  - [ ] SubTask 7.3: 实现浮层内菜品列表（每项可 +/- 调整数量、删除）
  - [ ] SubTask 7.4: 购物车状态管理（Vuex/Pinia 跨页面共享购物车数据）

- [x] Task 8: 提交详情页
  - [ ] SubTask 8.1: 实现提交详情页布局（产品只读列表 + 预约时间 + 备注 + 提交按钮）
  - [ ] SubTask 8.2: 实现预约时间选择（"尽快" / "指定时间"二选一，指定时展开日期时间选择器）
  - [ ] SubTask 8.3: 实现备注输入框（限制 200 字）
  - [ ] SubTask 8.4: 实现提交按钮（创建订单 + 触发订阅消息 + 跳转成功页）
  - [ ] SubTask 8.5: 点单人默认当前登录用户

- [x] Task 9: 下单成功结果页
  - [ ] SubTask 9.1: 实现成功动效与趣味提示文案（区别于商业系统的活泼风格）
  - [ ] SubTask 9.2: 实现订单详情卡片（菜品列表、预约时间、备注、点单人、提交时间）
  - [ ] SubTask 9.3: 实现"返回首页"和"查看记录"按钮

- [x] Task 10: 订单状态流转
  - [ ] SubTask 10.1: 创建 orders 集合（_id、items[]、userId、userName、reservationType[asap/scheduled]、reservationTime、note、status[pending/preparing/completed/cancelled]、createTime、updateTime）
  - [ ] SubTask 10.2: 编写云函数 orders-crud（创建订单、查询列表、更新状态、取消订单）
  - [ ] SubTask 10.3: 实现状态流转逻辑：待制作 → 制作中 → 已完成（仅管理员可操作）
  - [ ] SubTask 10.4: 实现订单取消逻辑（仅 pending 状态可取消，下单人取消自己，管理员取消任何）

- [x] Task 11: 记录页
  - [ ] SubTask 11.1: 实现记录页布局（按日期分组倒序展示）
  - [ ] SubTask 11.2: 实现订单卡片（菜品摘要 + 状态标签 + 点单人 + 时间）
  - [ ] SubTask 11.3: 管理员点击订单卡片可操作状态变更（开始制作/完成/取消）
  - [ ] SubTask 11.4: 实现状态标签颜色区分（待制作/制作中/已完成/已取消）

- [x] Task 12: 管理员管理 tab
  - [ ] SubTask 12.1: 实现管理 tab 入口（仅管理员可见，下单人不显示该 tab）
  - [ ] SubTask 12.2: 实现菜单管理子页（菜品列表 + 增删改 + 上下架）
  - [ ] SubTask 12.3: 实现订单管理子页（订单列表 + 状态操作）
  - [ ] SubTask 12.4: 实现分类管理子页（新增/编辑/删除/排序）
  - [ ] SubTask 12.5: 管理员可在管理 tab 内切换角色（如需切换为下单人视角）

- [x] Task 13: 双向微信订阅消息
  - [ ] SubTask 13.1: 在微信公众平台配置订阅消息模板（下单通知、完成通知）
  - [ ] SubTask 13.2: 实现下单人授权订阅消息（提交前请求 wx.requestSubscribeMessage）
  - [ ] SubTask 13.3: 实现下单后向管理员推送订阅消息（云函数调用 subscribeMessage.send）
  - [ ] SubTask 13.4: 实现订单完成后向下单人推送订阅消息

- [x] Task 14: 视觉与动效打磨
  - [ ] SubTask 14.1: 落地双主题配色（咖啡棕系 #6F4E37 / 美食绿系 #16A34A），全局 SCSS 变量统一管理，支持主题切换
  - [ ] SubTask 14.2: 实现页面切换过渡动效（CSS transitions，避免生硬样式切换，符合用户偏好）
  - [ ] SubTask 14.3: 实现加购飞入动效（CSS transform 路径动画，菜品图飞入购物车）
  - [ ] SubTask 14.4: 实现状态变更动效（状态标签过渡、按钮反馈，CSS animations）
  - [ ] SubTask 14.5: 制作并集成 Lottie 动画（下单成功庆祝动画、首页装饰插画）
  - [ ] SubTask 14.6: 优化首页与各页面的趣味可爱视觉细节（少文字多图片素材）

- [x] Task 15: 测试与联调
  - [ ] SubTask 15.1: 测试完整下单流程（首页 → 点单 → 详情 → 加购 → 提交 → 成功）
  - [ ] SubTask 15.2: 测试管理员菜单管理流程（增删改菜品、上下架、分类管理）
  - [ ] SubTask 15.3: 测试订单状态流转与取消逻辑
  - [ ] SubTask 15.4: 测试订阅消息推送（双向）
  - [ ] SubTask 15.5: 测试角色差异化（下单人 3 tab、管理员 4 tab）
  - [ ] SubTask 15.6: 验证无任何价格字段、无支付逻辑

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2（需要管理员身份）
- Task 4 依赖 Task 2、Task 3
- Task 5 依赖 Task 3
- Task 6 依赖 Task 5
- Task 7 依赖 Task 5
- Task 8 依赖 Task 7
- Task 9 依赖 Task 8
- Task 10 依赖 Task 2、Task 8
- Task 11 依赖 Task 10
- Task 12 依赖 Task 3、Task 10
- Task 13 依赖 Task 10
- Task 14 可与各 Task 同步进行
- Task 15 依赖所有功能 Task
