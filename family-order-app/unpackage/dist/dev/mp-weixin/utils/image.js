"use strict";
const CLOUD_HOSTS = ["cloudstatic.cn"];
const FILE_ID_SCHEME = "cloud://";
const cloudFileUrl = (fileID) => {
  const raw = String(fileID || "");
  if (!raw.startsWith(FILE_ID_SCHEME))
    return raw;
  const rest = raw.slice(FILE_ID_SCHEME.length);
  const slash = rest.indexOf("/");
  if (slash <= 0 || slash === rest.length - 1)
    return raw;
  const spaceId = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  return `https://${spaceId}.normal.cloudstatic.cn/${encodeURI(path)}`;
};
const DEFAULT_QUALITY = 90;
const IMG_W = {
  // 菜谱列表卡片。卡片框宽 (750 − 页面 32×2 − 网格 gap 22) ÷ 2 = 332rpx、高 75% = 249rpx，
  // 图片是 aspectFit，所以要**按最不利的那一边**算：
  //   · 素材为 1:1（本项目裁剪器导出的规格）→ 受高度限制，显示 249rpx → 428px
  //   · 素材为 4:3 等横图（云端历史图有可能）→ 受宽度限制，显示 332rpx → 571px
  // 取 576 覆盖后一种情况；只按 1:1 算会得到 428，那种"刚好够"的档位在横向素材上会糊。
  dishCard: 576,
  // 菜谱详情封面 / 点单页菜品大图：框 500rpx 见方，两种素材比例下需求都 ≤860px → 取 960
  dishCover: 960,
  // 食材 / 调料卡片里的小图：100×96rpx 的框、aspectFit → 需求 172px 以内 → 取 176
  materialArt: 176,
  // 选择抽屉里的物料 / 分类格子：image 110rpx → 需求 189px → 取 192
  pickerArt: 192,
  // 编辑态分类行的前导小图：44rpx → 需求 76px → 取 96
  fieldArt: 96
};
const imgUrl = (fileID, { w, q = DEFAULT_QUALITY } = {}) => {
  const url = cloudFileUrl(fileID);
  if (!url)
    return "";
  if (url.includes("x-oss-process="))
    return url;
  if (!CLOUD_HOSTS.some((host) => url.includes(host)))
    return url;
  const ops = [];
  if (w)
    ops.push(`resize,w_${w}`);
  ops.push("format,webp");
  ops.push(`quality,q_${q}`);
  return `${url}?x-oss-process=image/${ops.join("/")}`;
};
exports.IMG_W = IMG_W;
exports.cloudFileUrl = cloudFileUrl;
exports.imgUrl = imgUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/image.js.map
