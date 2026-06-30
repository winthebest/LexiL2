// Pha 2b — ngân hàng đề + log chất lượng (kế hoạch Mục 10.9 / 10.10).
// Deliverable KHÔNG phải "máy sinh câu" mà là "ngân hàng đề ĐÃ kiểm chứng".
//   bank:   word → [ câu đã accept ]   (mỗi câu có cờ "đã gặp" để khỏi lặp y câu cũ)
//   rejects: log mọi lần verifier loại → dữ liệu tinh chỉnh prompt
//   tc:     metric #2 — độ chính xác Text Completion (đúng/sai khi tự làm)

import { normalizeWord } from './cache.js'
import { notifyLocalChange } from './cloudSync.js'

const BANK_KEY = 'gre-l2:bank'
const REJECT_KEY = 'gre-l2:bank-rejects'
const TC_KEY = 'gre-l2:tc-stats'

function read(key, fallback) {
  try {
    const o = JSON.parse(localStorage.getItem(key) || 'null')
    return o ?? fallback
  } catch {
    return fallback
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
    notifyLocalChange()
  } catch {
    // đầy / bị chặn → bỏ qua.
  }
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Thêm câu đã accept vào bank của từ. */
export function addToBank(word, question, verify) {
  const key = normalizeWord(word)
  const all = read(BANK_KEY, {})
  const list = all[key] || []
  list.push({ id: id(), question, verify, seen: false, createdAt: Date.now() })
  all[key] = list
  write(BANK_KEY, all)
}

export function getBank(word) {
  return read(BANK_KEY, {})[normalizeWord(word)] || []
}

export function bankCount(word) {
  return getBank(word).length
}

/** Một câu CHƯA gặp (kế hoạch 10.9: đừng lặp y câu cũ — test trí nhớ về từ, không phải câu). */
export function nextUnseen(word) {
  return getBank(word).find((e) => !e.seen) || null
}

export function markSeen(word, entryId) {
  const key = normalizeWord(word)
  const all = read(BANK_KEY, {})
  const list = all[key] || []
  const e = list.find((x) => x.id === entryId)
  if (e) {
    e.seen = true
    write(BANK_KEY, all)
  }
}

/** Bỏ một câu khỏi bank (khi bạn gắn cờ "câu rác" ở 10.10). */
export function removeFromBank(word, entryId) {
  const key = normalizeWord(word)
  const all = read(BANK_KEY, {})
  all[key] = (all[key] || []).filter((x) => x.id !== entryId)
  write(BANK_KEY, all)
}

/** Log mọi lần verifier loại — dữ liệu chỉnh prompt (10.7/10.10). */
export function logReject(word, question, verify) {
  const log = read(REJECT_KEY, [])
  log.push({
    word: normalizeWord(word),
    all_fitting: verify?.all_fitting,
    reasoning: verify?.reasoning,
    sentence: question?.sentence,
    at: Date.now(),
  })
  // giữ tối đa 200 bản ghi gần nhất.
  write(REJECT_KEY, log.slice(-200))
}

/** Cờ phản hồi chất lượng từ người dùng (10.10). */
export function logFeedback(word, entryId, flag) {
  const log = read(REJECT_KEY + ':fb', [])
  log.push({ word: normalizeWord(word), entryId, flag, at: Date.now() })
  write(REJECT_KEY + ':fb', log.slice(-200))
}

/** Metric #2: ghi 1 lần tự làm TC (đúng/sai). */
export function recordTc(correct) {
  const s = read(TC_KEY, { answered: 0, correct: 0 })
  s.answered += 1
  if (correct) s.correct += 1
  write(TC_KEY, s)
}

export function getTcStats() {
  const s = read(TC_KEY, { answered: 0, correct: 0 })
  return { ...s, accuracy: s.answered ? s.correct / s.answered : 0 }
}
