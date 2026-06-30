// Xuất từ đã lưu ra file Anki-import được (Pha 1 — kế hoạch Mục 0.5).
// Kế hoạch: "đừng xây lại SRS — export sang Anki, nơi trí nhớ thật sự hình thành".
//
// Định dạng: TSV 2 cột (Front, Back) + header Anki 2.1.55+ hiểu được
// (#separator, #html, #columns). Import thẳng vào note "Basic". Back là HTML gói
// trọn thẻ (nghĩa B1, mnemonic, ví dụ, cụm đồng nghĩa, trái nghĩa).

import { listSaved } from './saved.js'
import { getCached } from './cache.js'

// Escape giá trị DỮ LIỆU (không phải tag của ta): chặn tab/newline làm vỡ TSV
// và < > làm vỡ HTML.
function esc(s) {
  return String(s ?? '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}

function backHtml(c) {
  const out = []
  out.push(`<div><b>${esc(c.core_meaning_en)}</b></div>`)
  if (c.vi_anchor) out.push(`<div>→ ${esc(c.vi_anchor)}</div>`)
  if (c.ipa) out.push(`<div style="color:#888">${esc(c.ipa)}</div>`)

  if (c.mnemonic_vi?.image) {
    out.push(`<div style="margin-top:6px"><i>🧠 ${esc(c.mnemonic_vi.image)}</i></div>`)
  }

  const ex = (c.examples || []).filter((e) => e?.sentence)
  if (ex.length) {
    out.push('<div style="margin-top:6px">')
    for (const e of ex) out.push(`<div>“${esc(e.sentence)}”</div>`)
    out.push('</div>')
  }

  const mem = c.synonym_cluster?.members || []
  if (mem.length) {
    const row = [...mem]
      .sort((a, b) => (a.intensity || 0) - (b.intensity || 0))
      .map((m) => `${esc(m.word)} (${m.intensity || 0}, ${esc(m.register)})`)
      .join(' · ')
    out.push(`<div style="margin-top:6px;color:#555">≈ ${row}</div>`)
  }

  if ((c.antonyms || []).length) {
    out.push(`<div style="margin-top:4px;color:#a00">≠ ${esc(c.antonyms.join(', '))}</div>`)
  }

  return out.join('')
}

/** Dựng nội dung file TSV từ các từ đã lưu (chỉ những từ còn thẻ trong cache). */
export function buildAnkiTsv() {
  const rows = []
  let count = 0
  for (const e of listSaved()) {
    const c = getCached(e.word)
    if (!c) continue
    const front = esc(c.word)
    const back = backHtml(c) // đã chứa HTML hợp lệ, không escape nữa
    rows.push(`${front}\t${back}`)
    count += 1
  }
  const header = ['#separator:tab', '#html:true', '#columns:Front\tBack'].join('\n')
  return { tsv: `${header}\n${rows.join('\n')}\n`, count }
}

/** Tải file .txt (TSV) về máy. Trả về số thẻ đã xuất. */
export function exportAnki() {
  const { tsv, count } = buildAnkiTsv()
  if (count === 0) return 0
  const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  a.href = url
  a.download = `gre-anki-${stamp}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return count
}
