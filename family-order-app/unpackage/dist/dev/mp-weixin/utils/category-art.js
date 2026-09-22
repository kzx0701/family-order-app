"use strict";
const CATEGORY_ART = {
  // 「全部」不是菜系，但它同样占着分类行第一格。这一格**保留旧素材**：
  // 它是 2026-09-21 按主人要求补的（此前只有文字、在图标行里看着是空的），
  // 而新体系里没有「全部」这个分类、主人也没要求撤掉它。
  // ⚠️ 要给「全部」也换新图标的话，改这一行即可。
  全部: "/static/images/recipes/categories/all-v2.svg",
  // 「热菜」2026-09-22 新增：由 炒菜 / 蒸菜 / 烧菜 三类合并而来（分类体系收敛，见当日记忆）。
  // 新体系的第一个（也是目前唯一一个）实现：静态图是位图，选中态是云存储上的动图。
  // 静态图**仍放本地 `static/`** —— 只有 5.8KB，且是首屏可见的必需素材，本地是零请求零延迟；
  // 动图才放云存储（体积大、且"点选才看"，见 CATEGORY_ART_ACTIVE）。
  热菜: "/static/images/recipes/categories/heat-v2.png",
  // 「凉菜」2026-09-22 新增。⚠️ 它**没有铺满画布**（内容只占约 83%）—— 这是为动图让位的
  // 刻意结果，不是素材没裁干净：它的动图里食材会大幅飞起，若静态图铺满，点选瞬间就会
  // 掉到 83%（见文件头「新素材的尺度规则」）。放在 44rpx 的槽里与热菜图标视觉体量相当。
  凉菜: "/static/images/recipes/categories/cold-v2.png",
  // 「汤类」2026-09-22 新增。同凉菜那类：动图里整只碗在晃（含勺子摆动），静息态只占画布约 79%
  // → 静态图也跟着缩到 79%（见文件头「新素材的尺度规则」），不是素材没裁干净。
  汤类: "/static/images/recipes/categories/soup-v2.png",
  // 「主食」2026-09-22 新增。⚠️ 它和前三张不同：画面是**宽而扁**的（全幅度 249×195，不是方的），
  // 按长边（宽）铺满后竖向只占 63/80 = 79% —— 这是素材本身的横宽比决定的，不是没裁干净。
  // 静息态（端起盘子那部分）比全幅度小：宽 0.93、**高 0.84**（蒸汽散去后高度变化更明显），
  // 所以静态图同样缩到静息态尺寸。⚠️ 因横向富余为 0，脚本会把它在画布里**居中**（上下留白均衡），
  // 左上角对齐会让它在 44rpx 方槽里明显"浮在上方"。
  主食: "/static/images/recipes/categories/staple-v2.png",
  // 「小食」2026-09-22 新增，**分类图标体系就此齐全**（全部 + 五个 food 分类）。
  // 它与主食相反，是**竖长**的画面（全幅度 211×303）：按长边（高）铺满后**宽只占 56/80 = 70%**，
  // 静息态更只有 41×61（宽 51%、高 76%）。所以它在分类栏里**比其它四个窄**，但**高度与它们相当**
  // （61 vs 63~74）—— 一排图标"高度接近、宽度各异"其实很自然，属于素材横宽比决定的正常结果。
  小食: "/static/images/recipes/categories/snack-v2.png",
  // 「咖啡」2026-09-22 新增 —— ⚠️ 它是**唯一的 coffee 类型分类**（`categories` 集合里 type=coffee），
  // 其余五个都是 food。菜谱页的分类栏**本来就会列出它**：`loadRecipes` 并发查了 food 与 coffee 两类，
  // 分类也是两类合并（美食在前、咖啡在后），只是因为映射表里没有「咖啡」这个键、一直没图标。
  // 它是本套里最"标准"的一张：画面近方形（全幅度 235×231）、动幅度极小（静息态占 98%），
  // 所以静态图**铺满画布**（79×77），与热菜同档。
  咖啡: "/static/images/recipes/categories/coffee-v2.png"
};
const categoryArt = (name) => {
  const key = String(name === null || name === void 0 ? "" : name).trim();
  return CATEGORY_ART[key] || "";
};
const CATEGORY_ART_ACTIVE = {
  // 云存储路径：黑米咖啡/图片素材/图标/frying-pan-optimized.gif
  // —— 即**抠底压缩版**（80×80 / 68 帧 / 25fps / 108KB），由原图（640×640 / 135 帧 / 50fps / 1.6MB）
  //    抽帧降尺寸 + 四角 flood fill 抠白底而来；已核对与本地生成物**逐字节一致**。
  // ⚠️ 云上还留着一份 `frying-pan.gif`，那是**原图**（1.6MB，且**不透明白底**）—— **不要用它**：
  //    白底会在贴纸底色上露出一个白方块，而且首访多下 1.5MB。
  //    不需要了就在云存储里删掉它，避免以后有人挑错文件。
  // 再处理新素材的三步（抽帧并同比放大帧时长 / 四角 flood fill 抠白底 / 全幅度框与静息态框双框对齐）
  // 写在 `.workbuddy/memory/2026-09-22.md`，也可直接跑技能脚本
  // `~/.workbuddy/skills/miniprogram-static-to-gif-icon/scripts/make-icon.py <src.gif> <src.png>`，别从零摸。
  热菜: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/frying-pan-optimized.gif",
  // 云存储路径：黑米咖啡/图片素材/图标/salad-optimized.gif
  // —— 抠底压缩版（80×80 / 27 帧 / 60ms / 1.90s / 52KB）。源图是 640×640 / 53 帧 / 821KB 的**不透明白底**
  //    GIF（主人上传时说得对），已 flood fill 抠底；上传后已核对：**与本地产物逐字节相同、四角 alpha=0**。
  // 图形本身是「食材从碗里飞起再落回」，因此全幅度比静息态大 20% —— 尺度按文件头的规则处理
  // （全幅度铺满画布、静态图缩到静息态尺寸），所以 `cold-v2.png` 只占画布 83%，**这不是漏改**。
  凉菜: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/salad-optimized.gif",
  // 云存储路径：黑米咖啡/图片素材/图标/porridge-optimized.gif
  // —— 抠底压缩版（80×80 / 73 帧 / 3.60s / 177KB）。源图是 640×640 / 146 帧 / 2.4MB 的**不透明白底** GIF，
  //    已 flood fill 抠底；上传后已核对：**与本地产物逐字节相同、四角 alpha=0** ✓。
  // 图形是「整只碗在晃 + 勺子摆动」，全幅度比静息态大 25% → 静态图 `soup-v2.png` 占画布 79%（同上，非漏改）。
  汤类: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/porridge-optimized.gif",
  // 云存储路径：黑米咖啡/图片素材/图标/biryani-optimized.gif
  // —— 抠底压缩版（80×80 / 81 帧 / 3.50s / 118KB，平均 43ms≈23fps）。源图是 640×640 / 163 帧 / 856KB 的白底 GIF，
  //    已 flood fill 抠底；上传后已核对：**与本地产物逐字节相同、四角 alpha=0、总时长与源图一致** ✓。
  // 它是**宽而扁**的画面（全幅度 249×195，非方形）：按长边铺满后竖向只占 79%、静息态高仅 53/80=66%，
  // 所以在分类栏里**比其它四个略矮** —— 这是横宽比决定的正常结果（面积其实相当），
  // 要"撑高"只能让宽度溢出画布而被裁，不可取。详见 STYLE-RULES 的说明。
  主食: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/biryani-optimized.gif",
  // 云存储路径：黑米咖啡/图片素材/图标/french-fries-optimized.gif
  // —— 抠底压缩版（80×80 / 86 帧 / 3.60s / 141KB）。源图是 640×640 / 172 帧 / 2.7MB 的白底 GIF，
  //    已 flood fill 抠底；上传后已核对：**与本地产物逐字节相同、四角 alpha=0** ✓。
  // 竖长画面（全幅度 211×303）→ 铺满高度后**宽只占 70%**，静息态 41×61（宽 51%）——
  // 是本套图标里视觉最"瘦"的一个，**属素材横宽比 + 动幅度决定的正常结果**（详见 STYLE-RULES）。
  小食: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/french-fries-optimized.gif",
  // 云存储路径：黑米咖啡/图片素材/图标/coffee-cup-optimized.gif
  // —— 抠底压缩版（80×80 / 76 帧 / 3.02s / 178KB）。源图是 640×640 / 151 帧 / 1.27MB 的白底 GIF，
  //    已 flood fill 抠底；上传后已核对：**与本地产物逐字节相同、四角 alpha=0** ✓。
  // 本套里最"标准"的一张：画面近方形、动幅度极小（静息态占全幅度 98%，心形浮动 + 豆子晃动），
  // 静态图直接**铺满画布**（79×77），与热菜同档。
  咖啡: "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%9B%BE%E6%A0%87/coffee-cup-optimized.gif"
};
const categoryArtActive = (name) => {
  const key = String(name === null || name === void 0 ? "" : name).trim();
  return CATEGORY_ART_ACTIVE[key] || "";
};
exports.categoryArt = categoryArt;
exports.categoryArtActive = categoryArtActive;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/category-art.js.map
