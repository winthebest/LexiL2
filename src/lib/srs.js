// Lịch ôn theo SM-2 (docs/scope.md O3, docs/prd.md v2).
// Mỗi từ giữ trạng thái { n, ef, interval, due } trong localStorage:
//   n        = số lần ôn đúng liên tiếp
//   ef       = easiness factor (>=1.3, mặc định 2.5) — từ dễ thì giãn nhanh hơn
//   interval = khoảng cách (ngày) tới lần ôn kế
//   due      = mốc thời gian (ms) tới hạn ôn; 0 = từ mới, đến hạn ngay
// Chất lượng trả lời q: 0..5. Sai = 2; Đúng: Khó=3, Tốt=4, Dễ=5.

import { normalizeWord } from './cache.js'
import { notifyLocalChange } from './cloudSync.js'

const KEY = 'gre-l2:srs'
const DAY = 86400000

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

function writeAll(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj))
    notifyLocalChange()
  } catch {
    // đầy / bị chặn → bỏ qua.
  }
}

function fresh() {
  return { n: 0, ef: 2.5, interval: 0, due: 0 }
}

export function getSrs(word) {
  return readAll()[normalizeWord(word)] || fresh()
}

export function isDue(word, now = Date.now()) {
  return (getSrs(word).due || 0) <= now
}

/** Chấm điểm 1 từ với chất lượng q (0..5), cập nhật lịch. Trả về trạng thái mới. */
export function grade(word, q, now = Date.now()) {
  const key = normalizeWord(word)
  if (!key) return fresh()
  const all = readAll()
  const s = all[key] || fresh()
  let { n, ef, interval } = s

  if (q < 3) {
    // Sai → đặt lại, ôn lại sau 1 ngày.
    n = 0
    interval = 1
  } else {
    if (n === 0) interval = 1
    else if (n === 1) interval = 6
    else interval = Math.round(interval * ef)
    n += 1
  }

  // Cập nhật EF theo công thức SM-2.
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ef < 1.3) ef = 1.3

  const next = { n, ef: Math.round(ef * 100) / 100, interval, due: now + interval * DAY }
  all[key] = next
  writeAll(all)
  return next
}

export function removeSrs(word) {
  const all = readAll()
  delete all[normalizeWord(word)]
  writeAll(all)
}

/** Mô tả khoảng cách cho người dùng. */
export function intervalText(days) {
  if (!days || days < 1) return 'hôm nay'
  if (days === 1) return '1 ngày'
  if (days < 30) return `${days} ngày`
  const m = Math.round(days / 30)
  return m === 1 ? '1 tháng' : `${m} tháng`
}
