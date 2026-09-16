"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_image = require("../../utils/image.js");
const utils_artwork = require("../../utils/artwork.js");
const _sfc_main = {
  __name: "default-avatar",
  props: {
    // 'male' | 'female'
    gender: { type: String, default: "male" }
  },
  setup(__props) {
    const props = __props;
    const isMale = common_vendor.computed(() => props.gender !== "female");
    const artSrc = common_vendor.computed(
      () => utils_image.imgUrl(isMale.value ? utils_artwork.AVATAR_ART.male : utils_artwork.AVATAR_ART.female, { w: utils_artwork.AVATAR_ART_WIDTH })
    );
    return (_ctx, _cache) => {
      return {
        a: isMale.value ? 1 : "",
        b: artSrc.value
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-aac8b966"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/default-avatar/default-avatar.js.map
