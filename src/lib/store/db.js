// Lớp dữ liệu Dexie/IndexedDB cho "Thư viện từ vựng GRE L2".
// Triển khai trực tiếp thiết kế ở thiet-ke-storage-tu-vung-gre-l2.md:
//   • bản ghi WordRecord 4 lớp (card · meta · mine · state) — Mục 2
//   • các store phụ: questions (TC bank) · reviewLog · settings — Mục 3
//   • index trên `words` để truy vấn nhanh (Library list / lens) — Mục 4
//
// Đây là MODULE SONG SONG: localStorage cũ (lib/cache.js, saved.js, srs.js,
// bank.js) vẫn chạy nguyên; nhập dữ liệu cũ sang đây bằng store/migrate.js.

import Dexie from 'dexie'

export const DB_NAME = 'gre-l2'

export const db = new Dexie(DB_NAME)

// Index dùng keypath lồng nhau (Dexie hỗ trợ): khớp đúng "Đánh index trên
// `words`: status, source, card.difficulty, card.connotation, meta.addedAt,
// state.isLeech" ở Mục 4 của thiết kế.
db.version(1).stores({
  // Khóa chính `id` = headword chuẩn hóa (lowercase + trim) → chống trùng.
  words:
    'id, state.status, meta.source, card.difficulty, card.connotation, ' +
    'meta.addedAt, state.isLeech, state.archived',

  // Ngân hàng đề TC — khóa ngoài wordId tới words.id (Mục 3).
  questions: 'id, wordId, seen, acceptedAt',

  // Nhật ký ôn append-only — để DẪN XUẤT metric, đừng lưu metric cứng (Mục 3/7.10).
  reviewLog: '++seq, ts, wordId, mode',

  // Settings + snapshot backup, lưu dạng key-value cho gọn.
  settings: 'key',
})

/** Chuẩn hóa headword → id ổn định. Khớp lib/cache.js để cache tương thích. */
export function normalizeId(word) {
  return String(word || '').trim().toLowerCase()
}

/**
 * Bóc các trường thuộc LỚP `card` ra khỏi đối tượng WordData (do AI sinh,
 * schema = fixtures/loquacious.json). WordData có thêm field `word` ở gốc;
 * `card` không giữ `word` (đã có id/headword riêng).
 */
export function toCardLayer(data) {
  if (!data || typeof data !== 'object') return null
  const { word, ...rest } = data
  return {
    ipa: rest.ipa ?? '',
    syllable_stress: rest.syllable_stress ?? '',
    part_of_speech: rest.part_of_speech ?? [],
    register: rest.register ?? '',
    connotation: rest.connotation ?? 'neutral',
    core_meaning_en: rest.core_meaning_en ?? '',
    vi_anchor: rest.vi_anchor ?? '',
    etymology: rest.etymology ?? { breakdown: [], confidence: 'low', note: '' },
    word_family: rest.word_family ?? [],
    mnemonic_vi: rest.mnemonic_vi ?? { keyword: '', image: '' },
    examples: rest.examples ?? [],
    synonym_cluster: rest.synonym_cluster ?? null,
    tricky_senses: rest.tricky_senses ?? [],
    antonyms: rest.antonyms ?? [],
    difficulty: typeof rest.difficulty === 'number' ? rest.difficulty : 3,
  }
}

/**
 * Dựng một WordRecord 4 lớp đầy đủ từ WordData + xuất xứ.
 * `mine` để rỗng — chỉ người dùng mới đổ vào (giá trị cao nhất, Mục 2 lớp 3).
 */
export function makeWordRecord(data, meta = {}) {
  const id = normalizeId(data?.word)
  const now = Date.now()
  return {
    id,
    headword: data?.word || id,
    card: toCardLayer(data),
    meta: {
      addedAt: meta.addedAt ?? now,
      source: meta.source ?? undefined,
      model: meta.model ?? '',
      enrichVersion: meta.enrichVersion ?? 1,
      enrichedAt: meta.enrichedAt ?? now,
      etymologyVerified: meta.etymologyVerified ?? false,
    },
    mine: meta.mine ?? {},
    state: {
      status: meta.status ?? 'new',
      seenCount: 0,
      recall: { correct: 0, incorrect: 0 },
      tc: { correct: 0, incorrect: 0 },
      isLeech: false,
      lastReviewedAt: undefined,
      archived: false,
      ...(meta.state || {}),
    },
  }
}

/** WordRecord → WordData phẳng (cho WordCard / Anki / cache cũ). */
export function recordToCard(rec) {
  if (!rec?.card) return null
  return { word: rec.headword, ...rec.card }
}
