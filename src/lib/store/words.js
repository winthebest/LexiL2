// Thêm / sửa / vòng đời từ + cache enrich (thiet-ke... Mục 6 & 7).
// Nguyên tắc sống còn: re-enrich GHI ĐÈ `card` nhưng GIỮ NGUYÊN `mine`
// (Mục 7.3 + Anti-pattern: "Đừng để mine bị card ghi đè").

import { db, normalizeId, makeWordRecord, toCardLayer, recordToCard } from './db.js'

/**
 * Hàm enrich mặc định: gọi lib/enrichWord.js (proxy /api/enrich).
 * Tách qua dynamic import để store dùng được cả khi không có mạng/proxy
 * (truyền card sẵn qua opts.card) và để không phụ thuộc cứng lúc test.
 */
async function defaultEnrich(headword, { useCache = false } = {}) {
  const { enrichWord } = await import('../enrichWord.js')
  const { data } = await enrichWord(headword, { useCache })
  return data
}

export async function getWord(id) {
  return (await db.words.get(normalizeId(id))) || null
}

export async function hasWord(id) {
  return (await db.words.get(normalizeId(id))) != null
}

// ── Cache token (Mục 7.2): store ĐÃ enrich CHÍNH LÀ cache. ──
/** Trả về WordData phẳng nếu từ đã có thẻ; null nếu chưa → cần gọi API. */
export async function cacheGet(word) {
  const rec = await getWord(word)
  return rec ? recordToCard(rec) : null
}

/** Lưu/đổi `card` từ WordData; KHÔNG đụng `mine`. Tạo mới nếu chưa có. */
export async function cacheSet(word, data, meta = {}) {
  const id = normalizeId(word)
  if (!id) return null
  const existing = await db.words.get(id)
  if (existing) {
    existing.card = toCardLayer(data)
    existing.meta.enrichedAt = Date.now()
    if (meta.model) existing.meta.model = meta.model
    await db.words.put(existing)
    return existing
  }
  const rec = makeWordRecord(data, meta)
  await db.words.put(rec)
  return rec
}

/**
 * Thêm từ (Mục 6). Kiểm trùng trước; nếu chưa có thì enrich (kiểm cache) → lưu.
 * @returns {{ record, duplicate:boolean, enriched:boolean }}
 *   duplicate=true → từ đã tồn tại; gọi reEnrich() nếu muốn làm mới.
 */
export async function addWord(headword, opts = {}) {
  const id = normalizeId(headword)
  if (!id) throw new Error('Hãy nhập một từ.')

  const existing = await db.words.get(id)
  if (existing && !existing.state.archived) {
    return { record: existing, duplicate: true, enriched: false }
  }

  // Có card sẵn (bulkImport / test / khôi phục) thì khỏi gọi API.
  const data = opts.card ?? (await (opts.enrich || defaultEnrich)(id))
  if (!data) throw new Error('Không lấy được dữ liệu thẻ.')

  const rec = makeWordRecord(
    { ...data, word: data.word || headword },
    { source: opts.source, model: opts.model, status: opts.status },
  )
  // Nếu trước đó bị archive: hồi sinh nhưng giữ mine/state cũ.
  if (existing) {
    rec.mine = existing.mine
    rec.state = { ...existing.state, archived: false }
    rec.meta.addedAt = existing.meta.addedAt
  }
  await db.words.put(rec)
  return { record: rec, duplicate: false, enriched: !opts.card }
}

/**
 * Vá một bản ghi. Gộp THEO LỚP để không xóa nhầm nhánh khác.
 * patch ví dụ: { mine: { mnemonic }, state: { status:'known' } }.
 */
export async function updateWord(id, patch = {}) {
  const key = normalizeId(id)
  const rec = await db.words.get(key)
  if (!rec) return null
  if (patch.headword) rec.headword = patch.headword
  if (patch.card) rec.card = { ...rec.card, ...patch.card }
  if (patch.meta) rec.meta = { ...rec.meta, ...patch.meta }
  if (patch.mine) rec.mine = { ...rec.mine, ...patch.mine }
  if (patch.state) rec.state = { ...rec.state, ...patch.state }
  await db.words.put(rec)
  return rec
}

/** Xóa MỀM (Mục 7.5): library mặc định ẩn archived, vẫn khôi phục được. */
export async function archiveWord(id) {
  return updateWord(id, { state: { archived: true } })
}

export async function unarchiveWord(id) {
  return updateWord(id, { state: { archived: false } })
}

/**
 * Re-enrich an toàn (Mục 7.3): gọi model lại → GHI ĐÈ `card`, GIỮ `mine`,
 * tăng meta.enrichVersion. Không bao giờ mất đồ tự chế.
 */
export async function reEnrich(id, opts = {}) {
  const key = normalizeId(id)
  const rec = await db.words.get(key)
  if (!rec) return null
  const data = opts.card ?? (await (opts.enrich || defaultEnrich)(key, { useCache: false }))
  if (!data) throw new Error('Không lấy được dữ liệu thẻ mới.')

  rec.card = toCardLayer(data) // mine KHÔNG đụng tới
  rec.meta.enrichVersion = (rec.meta.enrichVersion || 1) + 1
  rec.meta.enrichedAt = Date.now()
  if (opts.model) rec.meta.model = opts.model
  await db.words.put(rec)
  return rec
}

/** Đánh dấu "đã đối chiếu etymonline" (Mục 7.8). */
export async function setEtymologyVerified(id, value = true) {
  return updateWord(id, { meta: { etymologyVerified: value } })
}

/**
 * Nhập cả một deck (Mục 7.9). words = ['loquacious', ...] hoặc
 * [{ headword, source, card }]. Enrich theo lô, kiểm cache, chống trùng.
 * @param {(p:{done,total,headword,status})=>void} [onProgress]
 */
export async function bulkImport(list, { source, enrich, onProgress } = {}) {
  const items = (list || []).map((x) => (typeof x === 'string' ? { headword: x } : x))
  const total = items.length
  const result = { added: 0, skipped: 0, failed: 0, errors: [] }

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    let status = 'added'
    try {
      const r = await addWord(it.headword, {
        source: it.source ?? source,
        card: it.card,
        enrich,
      })
      if (r.duplicate) {
        result.skipped += 1
        status = 'skipped'
      } else {
        result.added += 1
      }
    } catch (e) {
      result.failed += 1
      result.errors.push({ headword: it.headword, message: e.message || String(e) })
      status = 'failed'
    }
    onProgress?.({ done: i + 1, total, headword: it.headword, status })
  }
  return result
}
