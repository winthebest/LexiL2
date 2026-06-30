// Ôn / metric + ngân hàng đề TC (thiet-ke... Mục 3, 6, 7.6, 7.10).
// Triết lý: ĐỪNG lưu metric cứng — chỉ append reviewLog rồi computeMetrics()
// dẫn xuất ra → số liệu luôn thật và truy được nguồn (Mục 7.10 / Anti-pattern).

import { db, normalizeId } from './db.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const LEECH_THRESHOLD = 3 // quên ≥ 3 lần → cần mã hóa lại (Mục 2 / 7.6)

/**
 * Ghi một lượt ôn (Mục 6). event = { wordId, mode, result, gradedAs? }
 *   mode   : 'recall' | 'tc' | 'synonym'
 *   result : 'correct' | 'incorrect'
 * Cập nhật state.recall|tc + seenCount + lastReviewedAt; tự bật isLeech khi
 * recall.incorrect ≥ 3 (Mục 7.6 — vòng phản hồi học quan trọng).
 */
export async function logReview(event) {
  const wordId = normalizeId(event.wordId)
  const ts = event.ts ?? Date.now()

  await db.reviewLog.add({
    ts,
    wordId,
    mode: event.mode,
    result: event.result,
    gradedAs: event.gradedAs,
  })

  const rec = await db.words.get(wordId)
  if (!rec) return null

  rec.state.seenCount = (rec.state.seenCount || 0) + 1
  rec.state.lastReviewedAt = ts

  // mode recall/synonym → chiều SẢN XUẤT (nghĩa→từ); tc → ngân hàng đề.
  const bucket = event.mode === 'tc' ? rec.state.tc : rec.state.recall
  if (event.result === 'correct') bucket.correct += 1
  else bucket.incorrect += 1

  if (rec.state.recall.incorrect >= LEECH_THRESHOLD) rec.state.isLeech = true
  // Lên 'learning' khi đã chạm tới; 'known' khi đúng nhiều & không còn leech.
  if (rec.state.status === 'new') rec.state.status = 'learning'

  await db.words.put(rec)
  return rec.state
}

/**
 * 2 metric THẬT (thiet-ke Mục 0.5 / file kế hoạch), dẫn xuất từ reviewLog:
 *   recallFirstTry : % đúng ở chiều gọi-ra (recall + synonym)
 *   tcAccuracy     : % đúng Text Completion
 * Trả về cả số đếm để hiển thị "—" khi chưa có dữ liệu.
 */
export async function computeMetrics() {
  const log = await db.reviewLog.toArray()
  let rC = 0
  let rN = 0
  let tC = 0
  let tN = 0
  for (const e of log) {
    if (e.mode === 'tc') {
      tN += 1
      if (e.result === 'correct') tC += 1
    } else {
      rN += 1
      if (e.result === 'correct') rC += 1
    }
  }
  return {
    recallFirstTry: rN ? rC / rN : null,
    recallCount: rN,
    tcAccuracy: tN ? tC / tN : null,
    tcCount: tN,
    totalReviews: log.length,
  }
}

// ── Ngân hàng đề TC (Mục 6) ──

/** Thêm câu đã verify vào bank của một từ. q = TCQuestion (thiếu id/ts thì tự gắn). */
export async function addQuestion(q) {
  const rec = {
    id: q.id || uid(),
    wordId: normalizeId(q.wordId),
    sentence: q.sentence,
    options: q.options || [],
    answer: q.answer,
    rationale: q.rationale || '',
    signalWords: q.signalWords || [],
    acceptedAt: q.acceptedAt ?? Date.now(),
    seen: q.seen ?? false,
    flags: q.flags || [],
  }
  await db.questions.put(rec)
  return rec
}

export async function getQuestionsFor(wordId) {
  return db.questions.where('wordId').equals(normalizeId(wordId)).toArray()
}

/** Một câu CHƯA gặp (đừng lặp y câu cũ — test trí nhớ về TỪ, không phải câu). */
export async function nextUnseenQuestion(wordId) {
  const list = await getQuestionsFor(wordId)
  return list.find((q) => !q.seen) || null
}

export async function markSeen(id) {
  const q = await db.questions.get(id)
  if (!q) return null
  q.seen = true
  await db.questions.put(q)
  return q
}

/** Gắn cờ chất lượng (Mục 3 / 7.8): two_answers | too_easy | wrong_key | awkward. */
export async function flagQuestion(id, flag) {
  const q = await db.questions.get(id)
  if (!q) return null
  q.flags = Array.from(new Set([...(q.flags || []), flag]))
  await db.questions.put(q)
  return q
}

export { LEECH_THRESHOLD }
