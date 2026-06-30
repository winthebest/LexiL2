// Danh sách "Từ đã lưu" (docs/scope.md O1, docs/prd.md v1).
// Khác với cache: cache giữ MỌI từ đã tra (để khỏi gọi lại API); "saved" là
// những từ người dùng CHỦ ĐỘNG đánh dấu để ôn. Bản thân thẻ đầy đủ vẫn nằm
// trong cache (lib/cache.js) — ở đây chỉ lưu vài field tóm tắt để render nhanh.

import { normalizeWord } from './cache.js'
import { notifyLocalChange } from './cloudSync.js'

const KEY = 'gre-l2:saved'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    notifyLocalChange()
  } catch {
    // đầy / bị chặn → bỏ qua, không làm vỡ app.
  }
}

/** Danh sách đã lưu, mới lưu nhất lên đầu. */
export function listSaved() {
  return readAll().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
}

export function isSaved(word) {
  const key = normalizeWord(word)
  return readAll().some((e) => e.word === key)
}

/** Lưu từ data (WordData). Trả về danh sách mới. */
export function saveWord(data) {
  const key = normalizeWord(data?.word)
  if (!key) return readAll()
  const list = readAll().filter((e) => e.word !== key)
  list.push({
    word: key,
    display: data.word || key,
    vi_anchor: data.vi_anchor || '',
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : null,
    part_of_speech: data.part_of_speech || [],
    savedAt: Date.now(),
  })
  writeAll(list)
  return listSaved()
}

export function removeSaved(word) {
  const key = normalizeWord(word)
  writeAll(readAll().filter((e) => e.word !== key))
  return listSaved()
}

/** Bật/tắt trạng thái lưu. Trả về { saved, list }. */
export function toggleSaved(data) {
  const key = normalizeWord(data?.word)
  if (isSaved(key)) return { saved: false, list: removeSaved(key) }
  return { saved: true, list: saveWord(data) }
}
