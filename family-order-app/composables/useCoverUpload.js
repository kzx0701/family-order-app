import { ref } from 'vue'
import { cloudFileUrl } from '@/utils/image.js'

/**
 * 菜品封面图上传：选图 → 裁剪 → 上传云存储 → 归一成可访问链接
 *
 * 管理页（pages/admin）与菜谱编辑页（pages/recipe-detail）共用同一份逻辑 ——
 * 这两处原本是各写一遍，差异只有 cloudPath 的目录和「链接写到哪个字段」，
 * 都收进参数里，其余（选图降级、裁剪器开关、进度、失败提示）只有一份实现。
 *
 * 三个踩过的坑，写在这里以免再犯：
 * - 支付宝云 uploadFile 的进度回调名是 **onUploadProgress**，回调参数是 `{ loaded, total }`。
 *   写成 onProgressCall / 读 p.progress 都不会报错，只是进度永远停在 0（原先就是这样）。
 * - uploadFile 返回的 fileID 是 `cloud://` 内部协议地址，落库前必须经 cloudFileUrl() 换成链接，
 *   否则后续 <image> 展示与 OSS 缩略图都会失效。
 * - **云存储文件后缀必须跟裁剪器给出的实际格式一致**（本函数的 ext 参数）：
 *   透明底素材导出的是 PNG、照片导出的是 JPEG，后缀写死 `.jpg` 会让 CDN 按错误的后缀
 *   返回 Content-Type（原先就是写死的 `.jpg`）。
 *
 * @param {object} [options]
 * @param {string} [options.cloudDir='dishes'] - 云存储目录（cloudPath 前缀，菜品图统一放 dishes/）
 * @param {(url: string) => void} [options.onUploaded] - 上传成功回调，参数为可长期使用的 https 链接
 */
export function useCoverUpload({ cloudDir = 'dishes', onUploaded } = {}) {
  const cropperVisible = ref(false)
  const cropperSrc = ref('')
  const uploading = ref(false)
  const uploadProgress = ref(0)

  const openCropper = (src) => {
    cropperSrc.value = src
    cropperVisible.value = true
  }

  const cancelCrop = () => {
    cropperVisible.value = false
  }

  /**
   * 选图：优先 chooseMedia（新基础库），老版本降级 chooseImage
   * 选完先进裁剪器 —— 菜品图在列表与详情里都是定宽定比的框，先裁好构图比自己猜更稳
   */
  const chooseImage = () => {
    if (uploading.value) return
    const pick = (tempPath) => {
      if (tempPath) openCropper(tempPath)
    }
    // 用户取消不是失败，只有真出错才打日志
    const onFail = (err) => {
      if (String(err.errMsg || '').indexOf('cancel') === -1) {
        console.error('[cover] 选择图片失败', err)
      }
    }
    if (uni.chooseMedia) {
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => pick(res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath),
        fail: onFail
      })
    } else {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => pick(res.tempFilePaths && res.tempFilePaths[0]),
        fail: onFail
      })
    }
  }

  /**
   * 远程链接转本地临时路径
   * 裁剪器用 canvas 导出，只能吃本地文件；已是本地路径则原样返回
   */
  const getLocalPath = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return reject(new Error('图片为空'))
      if (!/^https?:\/\//.test(src)) return resolve(src)
      uni.downloadFile({
        url: src,
        success: (res) => {
          if (res.statusCode === 200) resolve(res.tempFilePath)
          else reject(new Error('下载失败：' + res.statusCode))
        },
        fail: reject
      })
    })

  /** 重新裁剪已上传的图：先把远程图下载成本地文件，再进裁剪器 */
  const adjustImage = (url) => {
    if (uploading.value || !url) return
    getLocalPath(url)
      .then(openCropper)
      .catch((e) => {
        console.error('[cover] 图片下载失败', e)
        uni.showToast({ title: '图片下载失败，请检查网络', icon: 'none' })
      })
  }

  /**
   * 上传裁剪结果，成功后把链接交给调用方
   *
   * ext 由裁剪器给出（`png` / `jpg`）：透明底素材导出的是 PNG，照片导出的是 JPEG。
   * **后缀必须与真实内容一致** —— 内容与后缀不符时 CDN 会按后缀给出错误的 Content-Type。
   */
  const uploadCropped = async (filePath, ext = 'jpg') => {
    const cloudPath = `${cloudDir}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
    uploading.value = true
    uploadProgress.value = 0
    try {
      const res = await uniCloud.uploadFile({
        filePath,
        cloudPath,
        onUploadProgress: (e) => {
          const total = e && e.total
          if (total) uploadProgress.value = Math.min(100, Math.round((e.loaded / total) * 100))
        }
      })
      if (!res || !res.fileID) throw new Error('上传未返回 fileID')
      const url = cloudFileUrl(res.fileID)
      if (typeof onUploaded === 'function') onUploaded(url)
      uni.showToast({ title: '上传成功', icon: 'success' })
    } catch (e) {
      console.error('[cover] 上传失败', e)
      uni.showToast({ title: '上传失败，请重试', icon: 'none' })
    } finally {
      uploading.value = false
    }
  }

  /** 裁剪器确认：先关面板再上传（面板有自己的导出 loading，不能叠两个） */
  const confirmCrop = (tempPath, ext = 'jpg') => {
    cropperVisible.value = false
    uploadCropped(tempPath, ext)
  }

  return {
    cropperVisible,
    cropperSrc,
    uploading,
    uploadProgress,
    chooseImage,
    cancelCrop,
    confirmCrop,
    adjustImage
  }
}
