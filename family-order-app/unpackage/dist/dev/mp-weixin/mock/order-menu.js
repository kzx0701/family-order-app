"use strict";
const cartKey = (id) => String(id);
function addToCart(lines, item, note = "") {
  const key = cartKey(item.id);
  const line = lines.find((value) => value.key === key);
  const trimmed = String(note || "").trim();
  if (line) {
    line.note = trimmed;
    return;
  }
  lines.push({ key, id: item.id, name: item.name, image: item.image, note: trimmed });
}
function removeLine(lines, key) {
  const index = lines.findIndex((item) => item.key === key);
  if (index >= 0)
    lines.splice(index, 1);
}
exports.addToCart = addToCart;
exports.removeLine = removeLine;
//# sourceMappingURL=../../.sourcemap/mp-weixin/mock/order-menu.js.map
