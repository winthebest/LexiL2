// Gọi proxy /api/passage để chế tạo đoạn văn ngữ cảnh (v2).
// Hợp đồng: vite.config.js + docs/contract.md.

export async function generatePassage(words, level = 'B1') {
  let res
  try {
    res = await fetch('/api/passage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, level }),
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
  if (!res.ok) throw new Error(payload?.error || `Proxy trả lỗi ${res.status}.`)
  if (!payload?.data) throw new Error('Proxy không trả về đoạn văn.')
  return payload.data // { passage, title_vi, targets_used }
}
