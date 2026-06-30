import {
  GENERATOR_PROMPT,
  PASSAGE_PROMPT,
  SYSTEM_PROMPT,
  VERIFIER_PROMPT,
} from '../src/lib/prompt.js'

function env(name) {
  return process.env[name] || ''
}

function json(res, code, body) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')

  let raw = ''
  for await (const chunk of req) raw += chunk
  return JSON.parse(raw || '{}')
}

function config() {
  const apiKey = env('DASHSCOPE_API_KEY') || env('VITE_DASHSCOPE_API_KEY')
  const workspaceId = env('DASHSCOPE_WORKSPACE_ID') || env('VITE_DASHSCOPE_WORKSPACE_ID')
  const model = env('QWEN_MODEL') || env('VITE_QWEN_MODEL') || 'qwen3.7-plus'
  const verifierModel =
    env('QWEN_VERIFIER_MODEL') || env('VITE_QWEN_VERIFIER_MODEL') || 'qwen3.7-max'
  return { apiKey, workspaceId, model, verifierModel }
}

async function callQwen(systemMsg, userMsg, opts = {}) {
  const { apiKey, workspaceId, model } = config()
  if (!apiKey || !workspaceId) {
    const e = new Error('Thiếu DASHSCOPE_API_KEY / DASHSCOPE_WORKSPACE_ID trong env deploy.')
    e.status = 500
    throw e
  }

  const endpoint = `https://${workspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions`
  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model || model,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: opts.temperature ?? 0.7,
      enable_thinking: false,
    }),
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    const e = new Error(`Qwen trả lỗi ${upstream.status}: ${detail}`)
    e.status = upstream.status
    throw e
  }

  const payload = await upstream.json()
  const content = payload?.choices?.[0]?.message?.content
  if (!content) throw new Error('Qwen không trả về nội dung.')
  return JSON.parse(content)
}

export function apiHandler(fn) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

    let body
    try {
      body = await readBody(req)
    } catch {
      return json(res, 400, { error: 'Body không phải JSON hợp lệ.' })
    }

    try {
      const data = await fn(body, callQwen, config())
      return json(res, 200, { data })
    } catch (e) {
      if (e.message?.startsWith('VALID:')) {
        return json(res, 400, { error: e.message.slice(6) })
      }
      return json(res, e.status || 502, { error: e.message || 'Lỗi không rõ.' })
    }
  }
}

export const prompts = {
  SYSTEM_PROMPT,
  PASSAGE_PROMPT,
  GENERATOR_PROMPT,
  VERIFIER_PROMPT,
}
