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
exports.cloudFileUrl = cloudFileUrl;
exports.imgUrl = imgUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/image.js.map
