/**
 * 点单页的装饰插画（内联 SVG，不发网络请求）
 *
 * 为什么内联而不放 `static/`：这两幅是**纯装饰**、各约 1KB，内联省一次请求；
 * 而菜品图是业务数据，必须走云存储 + `imgUrl()`。
 *
 * 2026-09-20 从 `mock/order-menu.js` 搬到这里：那一份的**数据**（menuItems / menuCategories）
 * 已按主人要求清掉、点单页改读云端 `menu-list` 接口，但插画不属于数据，单独归到 utils。
 */

const art = body => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 150" fill="none"><g stroke="#765540" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + body + '</g></svg>')

/** 「一碗饭」：点单页美食模式的头部插画，也用作两个模式的列表空态 */
export const bowlArt = art('<path d="M33 69q-8-19 13-23 2-22 26-12 16-20 33-1 23-2 23 22l-3 20" fill="#fffdf7"/><path d="m117 47 20-33m-9 40 22-33"/><path d="M22 72q3 53 57 58 48 0 59-55-55 13-116-3Z" fill="#f3d880"/><path d="m51 94 3 2m45-2 3-1m-36 16q12 11 22-1"/><path d="m51 55 8 3m24-15 6 2m12 16 5-4" stroke="#8ca572"/><path d="m30 130 14 2m67-4 14-3" stroke="#d1ba98"/>')

/** 「一杯拿铁」：点单页咖啡模式的头部插画（原先借的是菜单数据里第 5 项的图，属于对 mock 的耦合） */
export const coffeeArt = art('<path d="M40 122q43 17 82-3" stroke="#c9af91"/><path d="M116 57q32-4 25 24-4 14-24 10" fill="#f8c1b4"/><path d="M30 48q-2 66 44 71 43 0 45-68" fill="#f8c1b4"/><ellipse cx="75" cy="49" rx="45" ry="17" fill="#c19a70"/><path d="M54 46q4-12 20-2 15-13 23-1 1 10-22 18-24-8-21-15Z" fill="#fff1d3" stroke="none"/><path d="M63 26q-7-7 1-15m21 16q8-8 0-16" stroke="#baa181"/><path d="m42 78 3 10" stroke="#fff0df"/>')
