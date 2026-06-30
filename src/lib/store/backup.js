// Cache / xuất / nhập / backup + settings (thiet-ke... Mục 6, 7.4, 3, 8).
// "Backup là sống còn" (Mục 1.3): mất store = mất công sức không lấy lại được.

import { db } from './db.js'

const DAY = 86400000
const SETTINGS_KEY = 'app'
const SCHEMA = 1

const DEFAULT_SETTINGS = {
  model: '',
  dailyNewLimit: 15, // ~10–20 (chiến lược deck)
  theme: 'light',
  lastBackupAt: undefined,
  // ⚠️ KHÔNG lưu API key plaintext ở đây — xem Mục 8 (dùng .env / proxy).
}

export async function getSettings() {
  const row = await db.settings.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(row?.value || {}) }
}

export async function updateSettings(patch = {}) {
  const next = { ...(await getSettings()), ...patch }
  await db.settings.put({ key: SETTINGS_KEY, value: next })
  return next
}

/** Gom toàn bộ store thành một đối tượng JSON thuần (backup & test). */
export async function dumpAll() {
  const [words, questions, reviewLog, settings] = await Promise.all([
    db.words.toArray(),
    db.questions.toArray(),
    db.reviewLog.toArray(),
    db.settings.toArray(),
  ])
  return { schema: SCHEMA, exportedAt: Date.now(), words, questions, reviewLog, settings }
}

/** Tải toàn bộ thư viện về dạng .json (Mục 6 / 7.4). Trả số từ đã xuất. */
export async function exportJSON() {
  const data = await dumpAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `gre-l2-backup-${stamp()}.json`)
  return data.words.length
}

/**
 * Khôi phục từ file/đối tượng (Mục 6 / 7.4).
 * mode 'merge' (mặc định): GIỮ `mine` hiện có nếu bản nhập rỗng — tránh đè mất
 *   đồ tự chế (Anti-pattern). mode 'replace': xóa sạch rồi nạp lại y hệt.
 */
export async function importJSON(input, { mode = 'merge' } = {}) {
  const data = typeof input === 'string' ? JSON.parse(input) : input
  if (!data || !Array.isArray(data.words)) throw new Error('File backup không hợp lệ.')

  await db.transaction('rw', db.words, db.questions, db.reviewLog, db.settings, async () => {
    if (mode === 'replace') {
      await Promise.all([db.words.clear(), db.questions.clear(), db.reviewLog.clear()])
      await db.words.bulkPut(data.words)
    } else {
      for (const incoming of data.words) {
        const cur = await db.words.get(incoming.id)
        if (cur && hasMine(cur.mine) && !hasMine(incoming.mine)) {
          incoming.mine = cur.mine // bảo vệ đồ tự chế
        }
        await db.words.put(incoming)
      }
    }
    if (Array.isArray(data.questions)) await db.questions.bulkPut(data.questions)
    if (Array.isArray(data.reviewLog)) {
      // reviewLog auto-increment: bỏ seq cũ để khỏi đụng khóa.
      await db.reviewLog.bulkAdd(data.reviewLog.map(({ seq, ...e }) => e))
    }
    if (Array.isArray(data.settings)) await db.settings.bulkPut(data.settings)
  })
  return { words: data.words.length, mode }
}

function hasMine(m = {}) {
  return Boolean(
    m.mnemonic ||
      (m.examples || []).length ||
      m.notes ||
      (m.confusedWith || []).length ||
      (m.tags || []).length,
  )
}

/** Ghi snapshot + cập nhật lastBackupAt (Mục 6). */
export async function backupNow() {
  const n = await exportJSON()
  await updateSettings({ lastBackupAt: Date.now() })
  return n
}

/** Có nên nhắc backup? now - lastBackupAt > 7 ngày (Mục 7.4). */
export async function shouldRemindBackup(now = Date.now()) {
  const { lastBackupAt } = await getSettings()
  if (!lastBackupAt) return (await db.words.count()) > 0 // có dữ liệu mà chưa từng sao lưu
  return now - lastBackupAt > 7 * DAY
}

// ── Xuất Anki (Mục 6) — TSV 2 cột, đọc thẳng từ store; ưu tiên mine. ──
function esc(s) {
  return String(s ?? '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}

function backHtml(rec) {
  const c = rec.card
  const out = [`<div><b>${esc(c.core_meaning_en)}</b></div>`]
  if (c.vi_anchor) out.push(`<div>→ ${esc(c.vi_anchor)}</div>`)
  if (c.ipa) out.push(`<div style="color:#888">${esc(c.ipa)}</div>`)

  // Ưu tiên mnemonic CỦA BẠN rồi mới tới AI (Mục 2: đồ tự chế nhớ hơn).
  const mnem = rec.mine?.mnemonic || c.mnemonic_vi?.image
  if (mnem) out.push(`<div style="margin-top:6px"><i>🧠 ${esc(mnem)}</i></div>`)

  const ex = [...(rec.mine?.examples || []), ...(c.examples || []).map((e) => e.sentence)].filter(
    Boolean,
  )
  if (ex.length) {
    out.push('<div style="margin-top:6px">')
    for (const s of ex) out.push(`<div>“${esc(s)}”</div>`)
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

/** Dựng nội dung TSV từ các từ chưa archive. */
export async function buildAnkiTsv() {
  const rows = []
  const words = (await db.words.toArray()).filter((r) => !r.state.archived && r.card)
  for (const rec of words) rows.push(`${esc(rec.headword)}\t${backHtml(rec)}`)
  const header = ['#separator:tab', '#html:true', '#columns:Front\tBack'].join('\n')
  return { tsv: `${header}\n${rows.join('\n')}\n`, count: rows.length }
}

export async function exportAnki() {
  const { tsv, count } = await buildAnkiTsv()
  if (count === 0) return 0
  triggerDownload(
    new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' }),
    `gre-anki-${stamp()}.txt`,
  )
  return count
}

// ── tiện ích tải file ──
function stamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
