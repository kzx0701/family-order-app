"use strict";
const common_vendor = require("../common/vendor.js");
const utils_image = require("../utils/image.js");
function useCoverUpload({ cloudDir = "dishes", onUploaded } = {}) {
  const cropperVisible = common_vendor.ref(false);
  const cropperSrc = common_vendor.ref("");
  const uploading = common_vendor.ref(false);
  const uploadProgress = common_vendor.ref(0);
  const openCropper = (src) => {
    cropperSrc.value = src;
    cropperVisible.value = true;
  };
  const cancelCrop = () => {
    cropperVisible.value = false;
  };
  const chooseImage = () => {
    if (uploading.value)
      return;
    const pick = (tempPath) => {
      if (tempPath)
        openCropper(tempPath);
    };
    const onFail = (err) => {
      if (String(err.errMsg || "").indexOf("cancel") === -1) {
        common_vendor.index.__f__("error", "at composables/useCoverUpload.js:51", "[cover] 选择图片失败", err);
      }
    };
    if (common_vendor.index.chooseMedia) {
      common_vendor.index.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        sizeType: ["compressed"],
        success: (res) => pick(res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath),
        fail: onFail
      });
    } else {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => pick(res.tempFilePaths && res.tempFilePaths[0]),
        fail: onFail
      });
    }
  };
  const getLocalPath = (src) => new Promise((resolve, reject) => {
    if (!src)
      return reject(new Error("图片为空"));
    if (!/^https?:\/\//.test(src))
      return resolve(src);
    common_vendor.index.downloadFile({
      url: src,
      success: (res) => {
        if (res.statusCode === 200)
          resolve(res.tempFilePath);
        else
          reject(new Error("下载失败：" + res.statusCode));
      },
      fail: reject
    });
  });
  const adjustImage = (url) => {
    if (uploading.value || !url)
      return;
    getLocalPath(url).then(openCropper).catch((e) => {
      common_vendor.index.__f__("error", "at composables/useCoverUpload.js:98", "[cover] 图片下载失败", e);
      common_vendor.index.showToast({ title: "图片下载失败，请检查网络", icon: "none" });
    });
  };
  const uploadCropped = async (filePath, ext = "jpg") => {
    const cloudPath = `${cloudDir}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
    uploading.value = true;
    uploadProgress.value = 0;
    try {
      const res = await common_vendor.Vs.uploadFile({
        filePath,
        cloudPath,
        onUploadProgress: (e) => {
          const total = e && e.total;
          if (total)
            uploadProgress.value = Math.min(100, Math.round(e.loaded / total * 100));
        }
      });
      if (!res || !res.fileID)
        throw new Error("上传未返回 fileID");
      const url = utils_image.cloudFileUrl(res.fileID);
      if (typeof onUploaded === "function")
        onUploaded(url);
      common_vendor.index.showToast({ title: "上传成功", icon: "success" });
    } catch (e) {
      common_vendor.index.__f__("error", "at composables/useCoverUpload.js:127", "[cover] 上传失败", e);
      common_vendor.index.showToast({ title: "上传失败，请重试", icon: "none" });
    } finally {
      uploading.value = false;
    }
  };
  const confirmCrop = (tempPath, ext = "jpg") => {
    cropperVisible.value = false;
    uploadCropped(tempPath, ext);
  };
  return {
    cropperVisible,
    cropperSrc,
    uploading,
    uploadProgress,
    chooseImage,
    cancelCrop,
    confirmCrop,
    adjustImage
  };
}
exports.useCoverUpload = useCoverUpload;
//# sourceMappingURL=../../.sourcemap/mp-weixin/composables/useCoverUpload.js.map
