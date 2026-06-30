import { apiHandler, prompts } from '../server/qwen.js'

export default apiHandler(async (body, call) => {
  const word = String(body.word || '').trim()
  if (!word) throw new Error('VALID:Thiếu "word".')
  const input = {
    TARGET_WORD: word,
    TARGET_INFO: body.info || {},
    CLUSTER: Array.isArray(body.cluster) ? body.cluster : [],
    POOL: Array.isArray(body.pool) ? body.pool : [],
  }
  return call(prompts.GENERATOR_PROMPT, JSON.stringify(input), { temperature: 0.9 })
})
