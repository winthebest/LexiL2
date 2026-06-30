// Cổng điều kiện mở khóa từng pha (north star — kế hoạch Mục 0.5).
//
// Vì sao có file này: kế hoạch nói thẳng "mỗi giờ code = một giờ KHÔNG cày recall",
// và đặt CỔNG CHẶN — chưa cày recall đều ~2 tuần thì chưa đủ dữ liệu để biết nên
// build/học gì tiếp. App tự ép kỷ luật đó: tính năng pha sau chỉ MỞ KHÓA khi đạt
// mốc học thật (số ngày ôn, tổng lượt ôn, số từ đã lưu), thay vì bấm là vào ngay.
//
// Ngưỡng = proxy cho lộ trình 4 pha:
//   anki    (Pha 1)  — cần có đủ từ để xuất.
//   cluster (Pha 2a) — "khi Pha 0–1 thành thói quen" → ~1 tuần ôn đều.
//   bank    (Pha 2b) — cổng chặn ~2 tuần recall đều (làm sau cùng, khó nhất).

import { getProgress } from './progress.js'
import { listSaved } from './saved.js'

export const GATES = {
  anki: {
    label: 'Xuất Anki (Pha 1)',
    why: 'Anki là nơi trí nhớ thật sự hình thành. Cần vài từ đã lưu thì xuất mới có nghĩa.',
    savedMin: 5,
  },
  cluster: {
    label: 'Drill phân biệt cụm đồng nghĩa (Pha 2a)',
    why: 'Chỉ làm “khi Pha 0–1 thành thói quen”. Phân biệt sắc thái là việc nâng cao — cày recall đều trước đã.',
    savedMin: 5,
    days: 7,
    reviews: 50,
  },
  bank: {
    label: 'Ngân hàng đề TC (Pha 2b)',
    why: 'Cổng chặn của kế hoạch: chưa cày recall đều ~2 tuần thì CHƯA đủ dữ liệu để biết phần này có giúp gì. Làm sau cùng.',
    savedMin: 10,
    days: 14,
    reviews: 100,
  },
}

function item(label, have, need, unit) {
  return { label, have, need, unit, ok: have >= need }
}

/**
 * Chấm một cổng → { unlocked, items[], progress }.
 * items: từng điều kiện kèm have/need để render checklist + thanh tiến độ.
 */
export function evalGate(name) {
  const g = GATES[name]
  if (!g) return { name, label: name, why: '', unlocked: true, items: [] }
  const p = getProgress()
  const savedCount = listSaved().length
  const items = []
  if (g.savedMin) items.push(item('Từ đã lưu', savedCount, g.savedMin, 'từ'))
  if (g.days) items.push(item('Số ngày đã ôn', p.distinctDays, g.days, 'ngày'))
  if (g.reviews) items.push(item('Tổng lượt ôn', p.totalReviews, g.reviews, 'lượt'))
  return {
    name,
    label: g.label,
    why: g.why,
    unlocked: items.every((i) => i.ok),
    items,
    progress: p,
  }
}
