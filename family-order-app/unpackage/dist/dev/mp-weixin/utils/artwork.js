"use strict";
const utils_image = require("./image.js");
const CDN_ROOT = "https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90";
const CDN = `${CDN_ROOT}/%E5%A4%B4%E5%83%8F`;
const CDN_UI = `${CDN_ROOT}/%E7%95%8C%E9%9D%A2`;
const AVATAR_ART = {
  male: `${CDN}/exec-d967c2fb-634c-4c95-824c-01f66fbade17.png`,
  female: `${CDN}/exec-46cec787-28a0-42be-ae7e-f686fa273b85.png`
};
const AVATAR_ART_WIDTH = 240;
const OB_GENDER_ART_WIDTH = 400;
const OB_ROLE_ART_WIDTH = 480;
const OB_CARD_BG_WIDTH = 1080;
const OB_CARD_BG_QUALITY = 80;
const ONBOARDING_ART = {
  /** 性别卡人物：复用默认头像素材，按卡片尺寸输出更大宽度 */
  gender: {
    female: utils_image.imgUrl(AVATAR_ART.female, { w: OB_GENDER_ART_WIDTH }),
    male: utils_image.imgUrl(AVATAR_ART.male, { w: OB_GENDER_ART_WIDTH })
  },
  /** 身份卡人物插画：干饭人 / 饲养员 */
  role: {
    diner: utils_image.imgUrl(`${CDN}/exec-2ded22a0-aa85-4c5b-998d-7698c43421a4.png`, { w: OB_ROLE_ART_WIDTH }),
    cook: utils_image.imgUrl(`${CDN}/exec-c8b750dd-f6ae-412a-9a27-27e1e489818c.png`, { w: OB_ROLE_ART_WIDTH })
  },
  /** 卡片背景（蜡笔涂鸦），四张卡各一张 */
  bg: {
    female: utils_image.imgUrl(`${CDN_UI}/exec-79fd56c8-73b1-4f33-8fb9-6224f06d3e48.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    male: utils_image.imgUrl(`${CDN_UI}/exec-0ef5a4be-7dd3-46e6-a638-8d939f9c8aba.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    diner: utils_image.imgUrl(`${CDN_UI}/exec-4e70c4a6-75e9-4619-ae25-316ccf8e2368.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    cook: utils_image.imgUrl(`${CDN_UI}/exec-df221cce-3e89-49a0-9d41-2eb9163488de.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    })
  }
};
const ONBOARDING_IMAGE_LIST = [
  ...Object.values(ONBOARDING_ART.gender),
  ...Object.values(ONBOARDING_ART.role),
  ...Object.values(ONBOARDING_ART.bg)
];
exports.AVATAR_ART = AVATAR_ART;
exports.AVATAR_ART_WIDTH = AVATAR_ART_WIDTH;
exports.ONBOARDING_ART = ONBOARDING_ART;
exports.ONBOARDING_IMAGE_LIST = ONBOARDING_IMAGE_LIST;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/artwork.js.map
