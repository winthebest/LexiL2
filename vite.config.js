import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  SYSTEM_PROMPT,
  PASSAGE_PROMPT,
  GENERATOR_PROMPT,
  VERIFIER_PROMPT,
} from './src/lib/prompt.js'

// Proxy dev: chạy server-side trong Node nên KHÔNG dính CORS, và key KHÔNG vào
// bundle trình duyệt (docs/adr.md ADR-0005). Frontend chỉ gọi POST /api/*.
function qwenProxy(env) {
  const apiKey = env.DASHSCOPE_API_KEY || env.VITE_DASHSCOPE_API_KEY
  const workspaceId = env.DASHSCOPE_WORKSPACE_ID || env.VITE_DASHSCOPE_WORKSPACE_ID
  const model = env.QWEN_MODEL || env.VITE_QWEN_MODEL || 'qwen3.7-plus'
  // Verifier dùng model khác/mạnh hơn generator để tránh "tự đóng dấu cho bài của
  // mình" (kế hoạch Mục 10.2). Cũng tách quota free (Mục 10.9).
  const verifierModel = env.QWEN_VERIFIER_MODEL || env.VITE_QWEN_VERIFIER_MODEL || 'qwen3.7-max'

  const endpoint = `https://${workspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions`

  // Gọi Qwen với (system, user) → trả về object JSON đã parse từ content.
  // opts.model: ghi đè model mặc định (verifier).
  async function callQwen(systemMsg, userMsg, opts = {}) {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || model,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
        // ADR-0004: JSON mode, KHÔNG max_tokens, tắt thinking.
        response_format: { type: 'json_object' },
        temperature: opts.temperature ?? 0.7,
        enable_thinking: false,
      }),
    })
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      const err = new Error(`Qwen trả lỗi ${upstream.status}: ${detail}`)
      err.status = upstream.status
      throw err
    }
    const payload = await upstream.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error('Qwen không trả về nội dung.')
    return JSON.parse(content)
  }

  // Bọc 1 handler: kiểm tra method/key, đọc body JSON, gọi fn(body) → {data}.
  function handler(fn) {
    return async (req, res) => {
      const send = (code, obj) => {
        res.statusCode = code
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(obj))
      }
      if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })
      if (!apiKey || !workspaceId) {
        return send(500, {
          error: 'Thiếu DASHSCOPE_API_KEY / DASHSCOPE_WORKSPACE_ID trong .env (xem .env.example).',
        })
      }
      let body
      try {
        let raw = ''
        for await (const chunk of req) raw += chunk
        body = JSON.parse(raw || '{}')
      } catch {
        return send(400, { error: 'Body không phải JSON hợp lệ.' })
      }
      try {
        const data = await fn(body, callQwen)
        return send(200, { data })
      } catch (e) {
        if (e.message?.startsWith('VALID:')) return send(400, { error: e.message.slice(6) })
        return send(e.status || 502, { error: e.message || 'Lỗi không rõ.' })
      }
    }
  }

  return {
    name: 'qwen-proxy',
    configureServer(server) {
      // Tra 1 từ → thẻ (docs/contract.md).
      server.middlewares.use(
        '/api/enrich',
        handler(async (body, call) => {
          const word = String(body.word || '').trim()
          if (!word) throw new Error('VALID:Thiếu "word".')
          return call(SYSTEM_PROMPT, word)
        }),
      )

      // Chế tạo đoạn văn ngữ cảnh từ danh sách từ (v2).
      server.middlewares.use(
        '/api/passage',
        handler(async (body, call) => {
          const words = Array.isArray(body.words)
            ? body.words.map((w) => String(w || '').trim()).filter(Boolean)
            : []
          const level = ['B1', 'B2', 'C1'].includes(body.level) ? body.level : 'B1'
          if (words.length < 2) throw new Error('VALID:Cần ít nhất 2 từ để tạo đoạn văn.')
          return call(PASSAGE_PROMPT, JSON.stringify({ level, target_words: words }))
        }),
      )

      // Pha 2b — sinh 1 câu TC (generator, model mặc định). docs/contract.md.
      server.middlewares.use(
        '/api/generate',
        handler(async (body, call) => {
          const word = String(body.word || '').trim()
          if (!word) throw new Error('VALID:Thiếu "word".')
          const input = {
            TARGET_WORD: word,
            TARGET_INFO: body.info || {},
            CLUSTER: Array.isArray(body.cluster) ? body.cluster : [],
            POOL: Array.isArray(body.pool) ? body.pool : [],
          }
          // temperature cao hơn chút để câu đa dạng (tránh lặp mẫu).
          return call(GENERATOR_PROMPT, JSON.stringify(input), { temperature: 0.9 })
        }),
      )

      // Pha 2b — verifier (call RIÊNG, context sạch, model mạnh hơn). KHÔNG nhận
      // intended_answer. temperature thấp để chấm ổn định.
      server.middlewares.use(
        '/api/verify',
        handler(async (body, call) => {
          const sentence = String(body.sentence || '').trim()
          const options = Array.isArray(body.options) ? body.options : []
          if (!sentence || options.length !== 5) {
            throw new Error('VALID:Cần "sentence" và đúng 5 "options".')
          }
          return call(VERIFIER_PROMPT, JSON.stringify({ sentence, options }), {
            model: verifierModel,
            temperature: 0,
          })
        }),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // prefix '' → nạp mọi biến (cả loại không có tiền tố VITE_) chỉ cho phía Node.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), qwenProxy(env)],
  }
})
