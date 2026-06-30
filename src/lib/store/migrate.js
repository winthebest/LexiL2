// Nhập dữ liệu localStorage cũ → store Dexie (thiet-ke... — module song song).
// Đọc các key của app hiện tại và dựng WordRecord + questions tương ứng:
//   gre-l2:card:<word>  → WordData (lớp card)
//   gre-l2:saved        → đánh dấu status 'learning'
//   gre-l2:srs          → SM-2 { n, ef, interval, due } → suy ra status/leech
//   gre-l2:bank         → câu đã accept → questions (TC bank)
//
// An toàn & idempotent: nếu từ đã có trong store thì GIỮ NGUYÊN (không đè
// `card`/`mine`) — chạy lại nhiều lần không hỏng gì.

import { db, makeWordRecord, normalizeId } from './db.js'

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function readAllCards() {
  const out = []
  const PREFIX = 'gre-l2:card:'
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) {
      const data = readLS(k, null)
      if (data?.word) out.push(data)
    }
  }
  return out
}

/**
 * @returns {{ words:number, skipped:number, questions:number }}
 */
export async function migrateFromLocalStorage() {
  const cards = readAllCards()
  const saved = new Set((readLS('gre-l2:saved', []) || []).map((e) => normalizeId(e.word)))
  const srs = readLS('gre-l2:srs', {}) || {}
  const bank = readLS('gre-l2:bank', {}) || {}

  const result = { words: 0, skipped: 0, questions: 0 }

  for (const data of cards) {
    const id = normalizeId(data.word)
    if (await db.words.get(id)) {
      result.skipped += 1
      continue
    }
    const s = srs[id]
    // EF thấp (≤1.8) ở app cũ = hay quên → leech; có lịch SM-2 = learning.
    const isLeech = s ? s.ef <= 1.8 : false
    const status = saved.has(id) || s ? 'learning' : 'new'

    const rec = makeWordRecord(data, {
      source: 'localStorage',
      status,
      state: {
        isLeech,
        lastReviewedAt: s?.due ? s.due - (s.interval || 0) * 86400000 : undefined,
      },
    })
    await db.words.put(rec)
    result.words += 1

    // Bank cũ: { word: [{ id, question, verify, seen, createdAt }] }
    for (const entry of bank[id] || []) {
      const q = entry.question || {}
      await db.questions.put({
        id: entry.id || `${id}-${Math.random().toString(36).slice(2, 7)}`,
        wordId: id,
        sentence: q.sentence || '',
        options: q.options || [],
        answer: q.intended_answer || entry.verify?.best_answer || '',
        rationale: q.rationale || entry.verify?.reasoning || '',
        signalWords: q.signal_words || [],
        acceptedAt: entry.createdAt || Date.now(),
        seen: Boolean(entry.seen),
        flags: [],
      })
      result.questions += 1
    }
  }
  return result
}
