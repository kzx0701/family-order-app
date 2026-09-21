"use strict";
const art = (body) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 150" fill="none"><g stroke="#765540" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + body + "</g></svg>");
const bowlArt = art('<path d="M33 69q-8-19 13-23 2-22 26-12 16-20 33-1 23-2 23 22l-3 20" fill="#fffdf7"/><path d="m117 47 20-33m-9 40 22-33"/><path d="M22 72q3 53 57 58 48 0 59-55-55 13-116-3Z" fill="#f3d880"/><path d="m51 94 3 2m45-2 3-1m-36 16q12 11 22-1"/><path d="m51 55 8 3m24-15 6 2m12 16 5-4" stroke="#8ca572"/><path d="m30 130 14 2m67-4 14-3" stroke="#d1ba98"/>');
const coffeeArt = art('<path d="M40 122q43 17 82-3" stroke="#c9af91"/><path d="M116 57q32-4 25 24-4 14-24 10" fill="#f8c1b4"/><path d="M30 48q-2 66 44 71 43 0 45-68" fill="#f8c1b4"/><ellipse cx="75" cy="49" rx="45" ry="17" fill="#c19a70"/><path d="M54 46q4-12 20-2 15-13 23-1 1 10-22 18-24-8-21-15Z" fill="#fff1d3" stroke="none"/><path d="M63 26q-7-7 1-15m21 16q8-8 0-16" stroke="#baa181"/><path d="m42 78 3 10" stroke="#fff0df"/>');
exports.bowlArt = bowlArt;
exports.coffeeArt = coffeeArt;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/menu-art.js.map
