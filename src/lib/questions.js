// Pha 2b — client gọi proxy generate→verify + vòng chấp nhận/loại (kế hoạch Mục 10).
// Nguyên tắc cốt lõi: KHÔNG BAO GIỜ tin đáp án generator tự gán → luôn verify ở
// call riêng, context sạch, model mạnh hơn; chỉ accept khi verifier độc lập đồng ý
// và xác nhận câu chỉ có ĐÚNG MỘT đáp án vừa.

import { logReject } from './bank.js'

async function post(url, body) {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
  if (!payload?.data) throw new Error('Proxy không trả về dữ liệu.')
  return payload.data
}

export const generateQuestion = (input) => post('/api/generate', input)
export const verifyQuestion = ({ sentence, options }) =>
  post('/api/verify', { sentence, options })

// Logic chấp nhận (kế hoạch Mục 10.7): đáp án verifier khớp intended_answer, và
// verifier chỉ thấy đúng MỘT đáp án vừa, và không "low confidence".
function isAccepted(q, v) {
  return (
    v.best_answer === q.intended_answer &&
    Array.isArray(v.all_fitting) &&
    v.all_fitting.length === 1 &&
    v.all_fitting[0] === q.intended_answer &&
    v.confidence !== 'low'
  )
}

/**
 * Sinh một câu ĐÃ KIỂM CHỨNG: generate → verify, lặp ≤ maxTries.
 * @param {object} input { word, info, cluster, pool }
 * @param {object} opts  { maxTries=3, onStep }
 * @returns {Promise<{ ok, question?, verify?, attempts }>}
 */
export async function makeVerifiedQuestion(input, { maxTries = 3, onStep } = {}) {
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    onStep?.({ phase: 'generate', attempt })
    const q = await generateQuestion(input)

    onStep?.({ phase: 'verify', attempt })
    const v = await verifyQuestion({ sentence: q.sentence, options: q.options })

    if (isAccepted(q, v)) {
      onStep?.({ phase: 'accept', attempt })
      return { ok: true, question: q, verify: v, attempts: attempt }
    }

    // LUÔN log mọi lần reject kèm all_fitting + reasoning → dữ liệu chỉnh prompt.
    onStep?.({ phase: 'reject', attempt, verify: v })
    logReject(input.word, q, v)
  }
  return { ok: false, attempts: maxTries }
}
