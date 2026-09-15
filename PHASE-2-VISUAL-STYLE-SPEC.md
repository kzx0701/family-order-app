# 家庭点餐系统｜二期图片视觉生成规范

> 版本：v1.0
>
> 状态：已确认，作为二期图片素材的默认视觉基准
>
> 更新日期：2026-09-14

## 1. 规范定位

二期所有新生成的角色、食材、菜谱装饰、页面氛围插画和空状态图片，默认遵循本规范。

本规范的核心不是“卡通化”或“Q版化”，而是：

```text
真实的手绘线条感
+ 清新可爱
+ 简约低负担
```

如果新素材与本规范冲突，优先保证手绘线条、简洁构图和统一质感，而不是增加更多细节或装饰。

## 2. 已确认的视觉参考

以下三张图片是二期视觉基准参考，不直接作为小程序运行资源：

- [character-pair-v1.png](./design-references/phase-2-visual/character-pair-v1.png)：干饭人/饲养员角色方向
- [ingredient-sheet-v1.png](./design-references/phase-2-visual/ingredient-sheet-v1.png)：公共食材素材方向
- [home-hero-v1.png](./design-references/phase-2-visual/home-hero-v1.png)：首页家庭点餐氛围方向

后续生成时，应将对应参考图作为风格参考输入，保持同一套线条、上色、比例和留白语言。

## 3. 核心风格关键词

### 必须保留

- 手绘绘本感
- 铅笔和彩色蜡笔线条
- 线条粗细和压力自然变化
- 轻微断线、重复线和不完全闭合
- 颜色边缘有轻微手工痕迹
- 简单、清楚、易识别的轮廓
- 适度夸张的可爱表情
- 清新、温暖、轻松的家庭气质

### 明确避免

- 光滑矢量图
- 统一粗细的数字描边
- 典型 Q 版贴纸质感
- 过度精致的商业插画
- 文艺静物画和过于安静的杂志插画
- 写实摄影或写实食材渲染
- 复杂室内背景
- 过多高光、反射和细碎纹理
- 通过堆叠装饰制造可爱感
- 图片内文字、Logo、水印和伪造标签

## 4. 线条规范

线条是本套风格最重要的识别特征。

- 主轮廓使用深棕、石墨或暖灰，不使用纯黑。
- 轮廓应有轻微摇摆和压力变化，不能像 SVG 描边。
- 局部可以出现二次起稿线，但不能让主体变脏。
- 内部结构使用更轻、更短的手绘线。
- 颜色可以轻微越过轮廓或留下未完全填满的边缘。
- 线条纹理要在缩小到移动端尺寸后仍能感受到，但不能变成噪点。

建议线条质感：

```text
graphite pencil / colored pencil / wax crayon / rough ink
```

不建议使用：

```text
clean vector / smooth outline / glossy sticker / 3D render
```

## 5. 色彩规范

使用低饱和、明亮但不刺眼的有限色板：

| 色彩角色 | 建议方向 | 示例 |
| --- | --- | --- |
| 纸张底色 | 暖奶油 | `#FFF8EA` |
| 主线条 | 可可棕/石墨棕 | `#6F4B35` |
| 活泼强调 | 柔和珊瑚 | `#E97768` |
| 植物与清新感 | 薄荷绿/叶绿 | `#8EAD78` |
| 温暖点缀 | 黄油黄 | `#F1C35A` |
| 辅助冷色 | 淡雾蓝 | `#A6C5CC` |

规则：

- 单张图尽量控制在 4～6 个主色以内。
- 不使用霓虹色和高纯度大面积色块。
- 通过珊瑚、叶绿和黄油黄提供可爱感，不依赖大量装饰。
- 允许不同素材有主题色差异，但线条和纸张质感必须统一。

## 6. 细节密度与构图

### 6.1 细节密度

- 一个素材只保留最必要的识别细节。
- 角色重点表现脸部、动作和身份道具，不刻画复杂服装纹理。
- 食材重点表现形状、颜色和轮廓，不刻画真实表面反射。
- 氛围插画保留 1 个主场景、1～3 个辅助点缀即可。
- 细节服务识别和情绪，不服务炫技。

### 6.2 留白

- 画面必须保留呼吸空间。
- 首页横幅优先保留一侧留白，供 UI 文案或入口卡片使用。
- 单个食材周围保留足够安全边距，方便后续裁切。
- 不用边角装饰填满空白区域。

### 6.3 移动端检查

生成后必须在小尺寸预览：

- 角色缩小后仍能看清身份和表情。
- 食材缩小后仍能快速识别。
- 线条纹理不能变成脏点。
- 首页插画不能抢过标题、入口和订单列表。

## 7. 各类素材规范

### 7.1 角色素材

- 干饭人和饲养员保持同一比例、同一线条和同一色彩语言。
- 通过碗筷、围裙、锅铲等少量道具表达身份。
- 表情应开朗、亲切、带轻微脸红或眼神变化。
- 动作可以有一点夸张，但不要过度幼儿化。
- 需要单独用于卡片时，优先生成真实透明背景，并检查文件 alpha。

### 7.2 食材素材

- 优先生成单个食材或规则素材表，便于裁切和复用。
- 每个食材保持清晰轮廓和适度手绘纹理。
- 食材图应更接近“手绘素材贴纸”，但不能变成光滑数字贴纸。
- 不给所有食材强行添加表情；可爱感主要来自轮廓、色彩和线条。
- 正式运行资源应使用真实透明背景，不能保留生成器的棋盘格背景。

### 7.3 首页/场景插画

- 使用少量大形状表达家庭、食物和咖啡。
- 背景保持轻，避免复杂家具和室内细节。
- 主体可以偏向一侧，给文字和按钮预留空间。
- 场景插画应服务页面层级，不能替代页面信息结构。

## 8. 图片生成提示词模板

后续使用 ImageGen 时，默认采用以下结构：

```text
Use case: stylized-concept or illustration-story
Asset type: <具体使用位置>
Input images: <对应的二期视觉参考图，作为风格参考>
Primary request: <主体和用途>
Scene/backdrop: <简洁背景或透明背景>
Subject: <主体内容>
Style/medium: hand-drawn colored-pencil and wax-crayon illustration,
uneven graphite-brown contour, variable line pressure, broken strokes,
rough handmade color edges, simple cute anime-inspired drawing
Composition/framing: <构图、留白和尺寸方向>
Lighting/mood: bright, fresh, cozy, playful, restrained
Color palette: limited low-saturation cream, coral, leaf green, cocoa, butter yellow
Materials/textures: subtle paper grain and visible hand pressure marks
Text (verbatim): none
Constraints: simple, cute, handmade, low visual density, no text, no logo, no watermark
Avoid: polished vector, uniform digital outline, glossy Q-version sticker,
photorealism, literary still life, excessive micro-detail, clutter
```

## 9. 生成验收清单

每张新图片在进入项目前检查：

- 是否一眼能看出手绘线条，而不是只有卡通比例。
- 是否保持清新、可爱、简约。
- 是否比参考图更复杂；若更复杂，需要重新生成或简化。
- 是否出现文艺静物、写实摄影或精致商业插画倾向。
- 是否出现光滑统一描边或 Q 版贴纸感。
- 是否有文字、Logo、水印或不可控标签。
- 透明素材是否真的包含 alpha 通道，不能把棋盘格当成透明。
- 缩小到实际 UI 尺寸后，主体、线条和情绪是否仍然清楚。

## 10. 文件管理规则

- `design-references/phase-2-visual/` 保存已确认的风格参考图，不自动打包进小程序。
- 正式运行素材后续放入 `family-order-app/static/images/` 对应目录。
- 参考图使用版本号，例如 `character-pair-v1.png`、`character-pair-v2.png`。
- 未经确认的实验图不覆盖已确认参考图。
- 任何正式素材接入前，先完成视觉验收，再更新页面引用。
