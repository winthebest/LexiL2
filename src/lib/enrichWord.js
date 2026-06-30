// enrichWord(word) — gọi proxy /api/enrich (Vite dev middleware), KHÔNG gọi
// thẳng DashScope từ trình duyệt → tránh CORS và không lộ key vào bundle.
// Proxy + hợp đồng request/response: vite.config.js + docs/contract.md, ADR-0005.

import { getCached, setCached, normalizeWord } from './cache.js'

/**
 * Tra một từ GRE → WordData (xem schema ở docs/contract.md mục 5).
 * @param {string} word
 * @param {{ useCache?: boolean }} [opts]
 * @returns {Promise<{ data: object, fromCache: boolean }>}
 */
export async function enrichWord(word, opts = {}) {
  const { useCache = true } = opts
  const key = normalizeWord(word)
  if (!key) throw new Error('Hãy nhập một từ.')

  if (useCache) {
    const cached = getCached(key)
    if (cached) return { data: cached, fromCache: true }
  }

  let res
  try {
    res = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: key }),
    })
  } catch (e) {
    throw new Error(`Lỗi mạng khi gọi proxy: ${e.message}.`)
  }

  let payload
  try {
    payload = await res.json()
  } catch {
    throw new Error('Proxy trả về không phải JSON (server dev có chạy không?).')
  }

  if (!res.ok) {
    throw new Error(payload?.error || `Proxy trả lỗi ${res.status}.`)
  }

  const data = payload?.data
  if (!data) throw new Error('Proxy không trả về dữ liệu thẻ.')

  setCached(key, data)
  return { data, fromCache: false }
}
