"use strict";
const CLOUD_HOSTS = ["cloudstatic.cn"];
const DEFAULT_QUALITY = 90;
const imgUrl = (fileID, { w, q = DEFAULT_QUALITY } = {}) => {
  const url = String(fileID || "");
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
exports.imgUrl = imgUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/image.js.map
