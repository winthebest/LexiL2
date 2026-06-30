// Theo dõi hoạt động ôn tập (docs/scope.md — north star Mục 0.5).
// Mục đích kép:
//   (a) Đo 2 metric THẬT của kế hoạch: #1 % gọi-ra-đúng ngay lần đầu khi tới hạn
//       (ở đây); #2 độ chính xác TC (ghi riêng trong lib/bank.js).
//   (b) Làm dữ liệu MỞ KHÓA các pha sau (lib/gates.js) — "recall đều ~2 tuần"
//       là cổng chặn của kế hoạch trước Pha 2a/2b.
//
// Lưu trong localStorage theo NGÀY để đếm được "số ngày đã ôn" (proxy cho thói quen):
//   { days: { 'YYYY-MM-DD': { reviews, firstCorrect } } }

import { notifyLocalChange } from './cloudSync.js'

const KEY = 'gre-l2:progress'

function today() {
  // Ngày địa phương dạng YYYY-MM-DD (đủ để đếm chuỗi ngày, không cần chính xác TZ).
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

function read() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}')
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

function write(o) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o))
    notifyLocalChange()
  } catch {
    // đầy / bị chặn → bỏ qua.
  }
}

/**
 * Ghi một lượt ôn từ vựng.
 * @param {boolean} correctFirstTry  đúng ngay lần gõ đầu (metric #1) hay không.
 */
export function recordReview(correctFirstTry) {
  const o = read()
  o.days = o.days || {}
  const d = today()
  const day = o.days[d] || { reviews: 0, firstCorrect: 0 }
  day.reviews += 1
  if (correctFirstTry) day.firstCorrect += 1
  o.days[d] = day
  write(o)
}

/** Tổng hợp tiến độ học để hiển thị + chấm cổng điều kiện. */
export function getProgress() {
  const o = read()
  const days = o.days || {}
  const keys = Object.keys(days)
  let totalReviews = 0
  let totalFirstCorrect = 0
  for (const k of keys) {
    totalReviews += days[k].reviews || 0
    totalFirstCorrect += days[k].firstCorrect || 0
  }
  return {
    distinctDays: keys.length,
    totalReviews,
    firstTryAccuracy: totalReviews ? totalFirstCorrect / totalReviews : 0,
    todayReviews: days[today()]?.reviews || 0,
  }
}
