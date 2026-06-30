// Cache kết quả enrich theo từ chuẩn hóa (docs/adr.md ADR-0006).
// localStorage cho v0/v1; chuyển IndexedDB nếu cần ở v1+.

import { notifyLocalChange } from './cloudSync.js'

const PREFIX = 'gre-l2:card:'

export function normalizeWord(word) {
  return String(word || '').trim().toLowerCase()
}

export function getCached(word) {
  const key = normalizeWord(word)
  if (!key) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCached(word, data) {
  const key = normalizeWord(word)
  if (!key) return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
    notifyLocalChange()
  } catch {
    // localStorage đầy / bị chặn → bỏ qua, không làm vỡ app.
  }
}
