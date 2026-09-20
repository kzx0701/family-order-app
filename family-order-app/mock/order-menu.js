// Independent preview menu. Never feeds the live cart or order APIs.
const art = body => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 150" fill="none"><g stroke="#765540" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + body + '</g></svg>')
export const bowlArt = art('<path d="M33 69q-8-19 13-23 2-22 26-12 16-20 33-1 23-2 23 22l-3 20" fill="#fffdf7"/><path d="m117 47 20-33m-9 40 22-33"/><path d="M22 72q3 53 57 58 48 0 59-55-55 13-116-3Z" fill="#f3d880"/><path d="m51 94 3 2m45-2 3-1m-36 16q12 11 22-1"/><path d="m51 55 8 3m24-15 6 2m12 16 5-4" stroke="#8ca572"/><path d="m30 130 14 2m67-4 14-3" stroke="#d1ba98"/>')
const latteArt = art('<path d="M40 122q43 17 82-3" stroke="#c9af91"/><path d="M116 57q32-4 25 24-4 14-24 10" fill="#f8c1b4"/><path d="M30 48q-2 66 44 71 43 0 45-68" fill="#f8c1b4"/><ellipse cx="75" cy="49" rx="45" ry="17" fill="#c19a70"/><path d="M54 46q4-12 20-2 15-13 23-1 1 10-22 18-24-8-21-15Z" fill="#fff1d3" stroke="none"/><path d="M63 26q-7-7 1-15m21 16q8-8 0-16" stroke="#baa181"/><path d="m42 78 3 10" stroke="#fff0df"/>')
const americanoArt = art('<path d="M39 35 47 127q30 9 66-2l12-90" fill="#e4eff0"/><path d="m42 62 8 59q26 9 60-1l10-59" fill="#a57c55"/><ellipse cx="81" cy="35" rx="43" ry="12" fill="#d0e4e5"/><path d="m69 22 33-17m-3 2-21 76" stroke="#b78b60"/><path d="m52 62 21-4 4 20-19 4Z" fill="#d4e1d7"/><path d="m87 58 20 7-5 21-20-6Z" fill="#d4e1d7"/><path d="m54 98 2 16" stroke="#fff3dc"/>')
const coconutArt = art('<path d="M41 33 49 126q30 10 61-1l13-90" fill="#fff4d9"/><path d="m45 67 72 1-5 26-65-2Z" fill="#c8a881"/><ellipse cx="82" cy="34" rx="41" ry="13" fill="#efddb6"/><path d="m79 36 18-28 18 2" stroke="#8ba57a"/><path d="M91 111q15-20 36-7 17 12 5 25-23 20-44 3Z" fill="#ac8b64"/><path d="M95 113q13-14 30-5 12 10 3 20-19 12-32 1Z" fill="#fff7e7"/><path d="m59 61 2 20" stroke="#fffdf4"/>')
const img = name => '/static/images/recipes/dishes/' + name + '-v1.png'
// `spicy` = 这道菜的辣度，**来自菜谱、用户不可改**（点单抽屉里只读展示，不给选项）。
// 取值沿用 utils/spicy.js 的四档（none/mild/medium/hot），与菜谱页、详情页同一套枚举 ——
// 别在这里另存一份中文映射，那是「同一批分类两处各存一份」踩过的坑。
// `options` 只装**用户能选的东西**：温度、甜度、口味。辣度不是选项，所以不出现在这里。
export const menuItems = [
  { id:'tomato-eggs', recipeId:'tomato-eggs', type:'food', name:'番茄炒蛋', subtitle:'酸酸甜甜，拌饭刚刚好', image:img('tomato-eggs'), category:'home', tag:'下饭担当', tone:'yellow', minutes:12, signature:true, spicy:'none', description:'嫩嫩的鸡蛋裹着番茄汁，是家里怎么吃都不腻的味道。留一点汤汁，拌饭更香。', options:[], defaults:[] },
  { id:'potato-chicken', recipeId:'potato-chicken', type:'food', name:'土豆焖鸡', subtitle:'软糯土豆，承包一碗饭', image:img('potato-chicken'), category:'home', tag:'家的拿手菜', tone:'coral', minutes:35, signature:true, spicy:'mild', description:'鸡肉慢慢焖入味，土豆吸饱酱汁。喜欢软糯口感的话，可以在备注里告诉做饭人。', options:[], defaults:[] },
  { id:'garlic-greens', recipeId:'garlic-greens', type:'food', name:'蒜蓉小青菜', subtitle:'清清爽爽，给餐桌添点绿', image:img('garlic-bok-choy'), category:'greens', tag:'清爽搭档', tone:'green', minutes:8, signature:false, description:'新鲜小青菜配上一点蒜香，大火快炒。简单的一盘，也要认认真真做好。', options:[{name:'口味',values:['蒜香','清淡']}], defaults:['蒜香'] },
  { id:'corn-soup', recipeId:'corn-soup', type:'food', name:'玉米排骨汤', subtitle:'咕嘟咕嘟，暖到心里', image:img('corn-rib-soup'), category:'soup', tag:'暖胃小幸福', tone:'blue', minutes:60, signature:false, description:'玉米的清甜慢慢煮进汤里，胡萝卜和排骨软软的。盛一碗，把今天的疲惫也暖一暖。', options:[{name:'口味',values:['原味','少盐']}], defaults:['原味'] },
  { id:'latte', recipeId:'latte', type:'coffee', name:'暖暖拿铁', subtitle:'奶香和咖啡，刚好抱个满怀', image:latteArt, category:'milky', tag:'温柔一杯', tone:'coral', minutes:5, signature:true, description:'浓缩咖啡与绵密牛奶的日常搭配。冷热和甜度都可以按你的心情来。', options:[{name:'温度',values:['热','冰']},{name:'甜度',values:['无糖','微甜','正常甜']}], defaults:['热','无糖'] },
  { id:'americano', recipeId:'americano', type:'coffee', name:'清醒美式', subtitle:'轻轻一口，唤醒今天的你', image:americanoArt, category:'black', tag:'清醒搭子', tone:'blue', minutes:3, signature:false, description:'浓缩咖啡加水，保留纯粹的咖啡香。冰一点或热一点，都是元气的开始。', options:[{name:'温度',values:['冰','热']}], defaults:['冰'] },
  { id:'coconut', recipeId:'coconut', type:'coffee', name:'椰香拿铁', subtitle:'椰风吹进杯子，快乐加一点', image:coconutArt, category:'milky', tag:'今日小偏爱', tone:'green', minutes:5, signature:true, description:'浓郁椰香与咖啡交织的一杯小快乐。椰乳自带甜味，可以额外选择甜度。', options:[{name:'温度',values:['冰','热']},{name:'甜度',values:['不加糖','微甜']}], defaults:['冰','不加糖'] }
]
export const menuCategories = {
  food:[{id:'all',name:'全部'},{id:'signature',name:'拿手菜'},{id:'home',name:'家常菜'},{id:'greens',name:'清爽蔬菜'},{id:'soup',name:'暖心汤'}],
  coffee:[{id:'all',name:'全部'},{id:'signature',name:'偏爱推荐'},{id:'milky',name:'奶咖'},{id:'black',name:'黑咖啡'}]
}
/**
 * 清单行的 key：**只由菜品 id 决定**
 *
 * 2026-09-20 定稿：同一个菜品在清单里**只占一条**，不支持多份。
 * 改口味是「更新这一条」，不是「再开一条」—— 原先 key 里带着 options，
 * 同一道菜选两种口味就各占一行、数量还会各自累加，与「一道菜就是一道菜」的直觉不符。
 */
export const cartKey = id => String(id)

/**
 * 加入清单 / 更新已在清单里的那一条
 *
 * 重复加入同一个菜品**不新增、不累加**：口味与备注都以最后一次为准。
 * 因此不再有 quantity 字段（每条的份数恒为 1），也不再需要「最多 20 份」的拦截。
 *
 * note 是**这一道菜单独的**备注（60 字以内），与确认页那张整单「小纸条」是两层东西。
 */
export function addToCart(lines, item, options = item.defaults, note = '') {
  const key = cartKey(item.id)
  const line = lines.find(value => value.key === key)
  const trimmed = String(note || '').trim()
  if (line) {
    line.options = [...options]
    line.note = trimmed
    return
  }
  lines.push({ key, id:item.id, recipeId:item.recipeId, name:item.name, image:item.image, options:[...options], note: trimmed })
}

/** 从清单里移除一条。份数恒为 1，所以「减」就是「删」，直接摘掉整行。 */
export function removeLine(lines, key) {
  const index = lines.findIndex(item => item.key === key)
  if (index >= 0) lines.splice(index, 1)
}
