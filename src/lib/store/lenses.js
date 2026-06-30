// "Coi lại thuận tiện" — các lens & truy vấn (thiet-ke... Mục 5).
// Đây là lý do store tồn tại: 6 cách VÀO LẠI dữ liệu.
// clusterIndex / rootIndex là DẪN XUẤT (Mục 3): tính khi cần từ chính `words`,
// không lưu thành store riêng → lens luôn đầy đủ, không cần "bảo trì liên kết".

import { db, normalizeId } from './db.js'

/** Mọi từ (mặc định ẩn archived — Mục 7.5). */
export async function allWords({ includeArchived = false } = {}) {
  const rows = await db.words.toArray()
  return includeArchived ? rows : rows.filter((r) => !r.state.archived)
}

/** Các gốc (root/prefix/suffix) của một từ — để search & rootIndex. */
function morphemesOf(rec) {
  return (rec.card?.etymology?.breakdown || [])
    .map((b) => String(b.part || '').toLowerCase().replace(/-/g, ''))
    .filter(Boolean)
}

// ── 1. Library list: tìm ──
/** Tìm theo headword | core_meaning_en | vi_anchor | gốc từ (Mục 5.1 / 6). */
export async function searchWords(query, opts = {}) {
  const needle = String(query || '').trim().toLowerCase()
  const rows = await allWords(opts)
  if (!needle) return rows
  return rows.filter((r) => {
    if (r.headword.toLowerCase().includes(needle)) return true
    if ((r.card?.core_meaning_en || '').toLowerCase().includes(needle)) return true
    if ((r.card?.vi_anchor || '').toLowerCase().includes(needle)) return true
    return morphemesOf(r).some((m) => m.includes(needle))
  })
}

// ── 1. Library list: lọc ──
/**
 * Lọc đa tiêu chí (Mục 5.1 / 6). Tham số nào undefined thì bỏ qua.
 * { status, source, connotation, register, difficulty, isLeech, hasMine, tag, addedAfter }
 */
export async function filterWords(f = {}) {
  const rows = await allWords({ includeArchived: f.includeArchived })
  return rows.filter((r) => {
    if (f.status && r.state.status !== f.status) return false
    if (f.source && r.meta.source !== f.source) return false
    if (f.connotation && r.card?.connotation !== f.connotation) return false
    if (f.register && r.card?.register !== f.register) return false
    if (f.difficulty != null && r.card?.difficulty !== f.difficulty) return false
    if (f.isLeech === true && !r.state.isLeech) return false
    if (f.hasMine === true && !hasMine(r)) return false
    if (f.tag && !(r.mine?.tags || []).includes(f.tag)) return false
    if (f.addedAfter != null && (r.meta.addedAt || 0) < f.addedAfter) return false
    return true
  })
}

function hasMine(r) {
  const m = r.mine || {}
  return Boolean(
    m.mnemonic ||
      (m.examples || []).length ||
      m.notes ||
      (m.confusedWith || []).length ||
      (m.tags || []).length,
  )
}

// ── 1. Library list: sắp xếp ──
const SORTERS = {
  az: (a, b) => a.headword.localeCompare(b.headword),
  added: (a, b) => (b.meta.addedAt || 0) - (a.meta.addedAt || 0), // mới thêm trước
  difficulty: (a, b) => (b.card?.difficulty || 0) - (a.card?.difficulty || 0),
  forgotten: (a, b) => (b.state.recall.incorrect || 0) - (a.state.recall.incorrect || 0),
  recent: (a, b) => (b.state.lastReviewedAt || 0) - (a.state.lastReviewedAt || 0),
}

/** Sắp xếp một danh sách (Mục 5.1). by ∈ az|added|difficulty|forgotten|recent. */
export function sortWords(list, by = 'added') {
  return [...list].sort(SORTERS[by] || SORTERS.added)
}

// ── 3. Cluster lens ★ (theme đồng nghĩa) ──
/** Tất cả cụm: theme_vi → { theme, wordIds[], count }. */
export async function listClusters(opts = {}) {
  const rows = await allWords(opts)
  const map = new Map()
  for (const r of rows) {
    const theme = r.card?.synonym_cluster?.theme_vi
    if (!theme) continue
    if (!map.has(theme)) map.set(theme, { theme, wordIds: [], count: 0 })
    const e = map.get(theme)
    e.wordIds.push(r.id)
    e.count += 1
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

/** Các từ thuộc một cụm theme (Mục 5.3). */
export async function getCluster(theme, opts = {}) {
  const rows = await allWords(opts)
  return rows.filter((r) => r.card?.synonym_cluster?.theme_vi === theme)
}

// ── 4. Family / root lens (họ từ cùng gốc) ──
/** Tất cả gốc: root → { root, wordIds[], count }. Chỉ tính phần type=root. */
export async function listRoots(opts = {}) {
  const rows = await allWords(opts)
  const map = new Map()
  for (const r of rows) {
    for (const b of r.card?.etymology?.breakdown || []) {
      if (b.type !== 'root') continue
      const root = String(b.part || '').toLowerCase().replace(/-/g, '')
      if (!root) continue
      if (!map.has(root)) map.set(root, { root, meaning: b.meaning, wordIds: [], count: 0 })
      const e = map.get(root)
      e.wordIds.push(r.id)
      e.count += 1
    }
  }
  return [...map.values()].filter((e) => e.count > 0).sort((a, b) => b.count - a.count)
}

/** Các từ cùng một gốc (Mục 5.4): mở `loqu` → loquacious, eloquent... */
export async function getFamily(root, opts = {}) {
  const target = String(root || '').toLowerCase().replace(/-/g, '')
  const rows = await allWords(opts)
  return rows.filter((r) =>
    (r.card?.etymology?.breakdown || []).some(
      (b) => b.type === 'root' && String(b.part || '').toLowerCase().replace(/-/g, '') === target,
    ),
  )
}

// ── 5. Leech list ──
// Lưu ý: IndexedDB KHÔNG index được giá trị boolean, nên index 'state.isLeech'
// chỉ mang tính khai báo — ở đây quét trực tiếp (vài trăm–nghìn từ là tức thì).
/** Chỉ những từ isLeech, để mã hóa lại (Mục 5.5 / 7.6). */
export async function getLeeches() {
  const rows = await allWords()
  return rows.filter((r) => r.state.isLeech)
}

// ── 6. Surfacing ngẫu nhiên / "từ hôm nay" ──
export async function randomWords(n = 5) {
  const rows = await allWords()
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  return rows.slice(0, n)
}

export { normalizeId }
