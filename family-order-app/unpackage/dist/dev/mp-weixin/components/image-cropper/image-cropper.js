"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const RATIO_43 = 4 / 3;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const _sfc_main = {
  __name: "image-cropper",
  props: {
    // 是否显示
    visible: { type: Boolean, default: false },
    // 待裁剪图片（本地临时路径或远程 URL；远程 URL 需先下载为本地文件）
    imageSrc: { type: String, default: "" },
    // 裁剪框宽高比（宽/高）：1 = 方形，4/3 = 横版
    ratio: { type: Number, default: 1 },
    // 导出图片最长边（px）
    outputSize: { type: Number, default: 800 }
  },
  emits: ["confirm", "cancel"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const instance = common_vendor.getCurrentInstance();
    const noop = () => {
    };
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const show = common_vendor.ref(false);
    const displaySrc = common_vendor.ref("");
    const imgW = common_vendor.ref(0);
    const imgH = common_vendor.ref(0);
    const viewportW = common_vendor.ref(300);
    const viewportH = common_vendor.ref(300);
    const viewportRect = { left: 0, top: 0 };
    const ratio = common_vendor.ref(props.ratio);
    const baseScale = common_vendor.ref(1);
    const scale = common_vendor.ref(1);
    const offsetX = common_vendor.ref(0);
    const offsetY = common_vendor.ref(0);
    const exporting = common_vendor.ref(false);
    const dispW = common_vendor.computed(() => imgW.value * baseScale.value * scale.value);
    const dispH = common_vendor.computed(() => imgH.value * baseScale.value * scale.value);
    const imageStyle = common_vendor.computed(() => ({
      width: dispW.value + "px",
      height: dispH.value + "px",
      transform: `translate(${offsetX.value}px, ${offsetY.value}px)`
    }));
    const zoomPercent = common_vendor.computed(
      () => Math.round((scale.value - MIN_SCALE) / (MAX_SCALE - MIN_SCALE) * 100)
    );
    common_vendor.watch(
      () => props.visible,
      async (val) => {
        if (val) {
          ratio.value = props.ratio;
          displaySrc.value = props.imageSrc || "";
          exporting.value = false;
          await common_vendor.nextTick$1();
          measureViewport();
          show.value = true;
          setTimeout(() => measureViewport(), 350);
          if (displaySrc.value)
            loadImage();
        } else {
          show.value = false;
        }
      },
      { immediate: true }
    );
    const sys = common_vendor.index.getSystemInfoSync();
    const initViewportW = Math.min(320, (sys.windowWidth || 375) - 40);
    viewportW.value = initViewportW;
    viewportH.value = initViewportW / ratio.value;
    const measureViewport = () => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.select(".crop-viewport").boundingClientRect((rect) => {
        if (rect) {
          viewportW.value = rect.width;
          viewportH.value = rect.height;
          viewportRect.left = rect.left;
          viewportRect.top = rect.top;
        }
      }).exec();
    };
    const loadImage = () => {
      common_vendor.index.getImageInfo({
        src: displaySrc.value,
        success: (res) => {
          imgW.value = res.width || 1;
          imgH.value = res.height || 1;
          resetTransform();
        },
        fail: () => {
          common_vendor.index.showToast({ title: "图片加载失败", icon: "none" });
        }
      });
    };
    const resetTransform = () => {
      if (!imgW.value || !imgH.value)
        return;
      const w = viewportW.value;
      const h = viewportH.value;
      baseScale.value = Math.max(w / imgW.value, h / imgH.value);
      scale.value = MIN_SCALE;
      offsetX.value = (w - imgW.value * baseScale.value) / 2;
      offsetY.value = (h - imgH.value * baseScale.value) / 2;
    };
    const clampOffsets = () => {
      const w = viewportW.value;
      const h = viewportH.value;
      const dw = dispW.value;
      const dh = dispH.value;
      offsetX.value = Math.min(0, Math.max(w - dw, offsetX.value));
      offsetY.value = Math.min(0, Math.max(h - dh, offsetY.value));
    };
    const applyZoom = (nextScale, anchorX, anchorY) => {
      const k = nextScale / scale.value;
      offsetX.value = anchorX - (anchorX - offsetX.value) * k;
      offsetY.value = anchorY - (anchorY - offsetY.value) * k;
      scale.value = nextScale;
      clampOffsets();
    };
    const touches = /* @__PURE__ */ new Map();
    let lastPoint = { x: 0, y: 0 };
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    const onTouchStart = (e) => {
      const list = e.touches || [];
      touches.clear();
      list.forEach((t) => touches.set(t.identifier, t));
      if (touches.size === 1) {
        const p = touches.values().next().value;
        lastPoint = { x: p.clientX, y: p.clientY };
      } else if (touches.size >= 2) {
        const pts = [...touches.values()].slice(0, 2);
        pinchStartDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        pinchStartScale = scale.value;
      }
    };
    const onTouchMove = (e) => {
      const list = e.touches || [];
      touches.clear();
      list.forEach((t) => touches.set(t.identifier, t));
      if (touches.size === 1) {
        const p = touches.values().next().value;
        offsetX.value += p.clientX - lastPoint.x;
        offsetY.value += p.clientY - lastPoint.y;
        lastPoint = { x: p.clientX, y: p.clientY };
        clampOffsets();
      } else if (touches.size >= 2) {
        const pts = [...touches.values()].slice(0, 2);
        const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const mid = {
          x: (pts[0].clientX + pts[1].clientX) / 2,
          y: (pts[0].clientY + pts[1].clientY) / 2
        };
        if (pinchStartDist > 0) {
          const nextScale = clamp(
            pinchStartScale * (dist / pinchStartDist),
            MIN_SCALE,
            MAX_SCALE
          );
          applyZoom(nextScale, mid.x - viewportRect.left, mid.y - viewportRect.top);
        }
      }
    };
    const onTouchEnd = () => {
      touches.clear();
    };
    const zoomStep = (dir) => {
      const next = clamp(scale.value * (dir > 0 ? 1.2 : 1 / 1.2), MIN_SCALE, MAX_SCALE);
      applyZoom(next, viewportW.value / 2, viewportH.value / 2);
    };
    const setZoomFromPercent = (p) => {
      const next = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * p / 100;
      applyZoom(next, viewportW.value / 2, viewportH.value / 2);
    };
    const onSliderChanging = (e) => setZoomFromPercent(e.detail.value);
    const onSliderChange = (e) => setZoomFromPercent(e.detail.value);
    const setRatio = (r) => {
      if (ratio.value === r)
        return;
      ratio.value = r;
      viewportH.value = viewportW.value / r;
      measureViewport();
      resetTransform();
    };
    const onCancel = () => {
      if (exporting.value)
        return;
      emit("cancel");
    };
    const onConfirm = () => {
      if (exporting.value || !displaySrc.value)
        return;
      exporting.value = true;
      common_vendor.index.showLoading({ title: "生成中...", mask: true });
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.select("#crop-export-canvas").fields({ node: true, size: true }).exec((res) => {
        const canvas = res && res[0] && res[0].node;
        if (!canvas || !canvas.getContext) {
          common_vendor.index.hideLoading();
          exporting.value = false;
          common_vendor.index.showToast({ title: "裁剪导出失败，请重试", icon: "none" });
          return;
        }
        const outW = Math.round(props.outputSize);
        const outH = Math.max(1, Math.round(props.outputSize / ratio.value));
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        const img = canvas.createImage();
        img.onload = () => {
          const bs = baseScale.value * scale.value;
          const srcX = -offsetX.value / bs;
          const srcY = -offsetY.value / bs;
          const srcW = viewportW.value / bs;
          const srcH = viewportH.value / bs;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
          common_vendor.index.canvasToTempFilePath({
            canvas,
            fileType: "jpg",
            quality: 0.9,
            success: (r) => {
              common_vendor.index.hideLoading();
              exporting.value = false;
              emit("confirm", r.tempFilePath);
            },
            fail: () => {
              common_vendor.index.hideLoading();
              exporting.value = false;
              common_vendor.index.showToast({ title: "导出失败，请重试", icon: "none" });
            }
          });
        };
        img.onerror = () => {
          common_vendor.index.hideLoading();
          exporting.value = false;
          common_vendor.index.showToast({ title: "图片处理失败，请重试", icon: "none" });
        };
        img.src = displaySrc.value;
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: show.value ? 1 : "",
        c: common_vendor.o(onCancel, "9f"),
        d: common_vendor.o(noop, "8e"),
        e: common_vendor.o(onCancel, "a5"),
        f: common_vendor.o(onConfirm, "d4"),
        g: displaySrc.value
      }, displaySrc.value ? {
        h: displaySrc.value,
        i: common_vendor.s(imageStyle.value)
      } : {}, {
        j: viewportW.value + "px",
        k: viewportH.value + "px",
        l: common_vendor.o(onTouchStart, "43"),
        m: common_vendor.o(onTouchMove, "1c"),
        n: common_vendor.o(onTouchEnd, "75"),
        o: common_vendor.o(onTouchEnd, "fa"),
        p: ratio.value === 1 ? 1 : "",
        q: common_vendor.o(($event) => setRatio(1), "75"),
        r: ratio.value === RATIO_43 ? 1 : "",
        s: common_vendor.o(($event) => setRatio(RATIO_43), "83"),
        t: common_vendor.p({
          name: "minus",
          size: 14
        }),
        v: common_vendor.o(($event) => zoomStep(-1), "37"),
        w: zoomPercent.value,
        x: common_vendor.o(onSliderChanging, "0d"),
        y: common_vendor.o(onSliderChange, "7d"),
        z: common_vendor.p({
          name: "plus",
          size: 14
        }),
        A: common_vendor.o(($event) => zoomStep(1), "b8"),
        B: show.value ? 1 : ""
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d0be24ff"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/image-cropper/image-cropper.js.map
