import { apiHandler, prompts } from '../server/qwen.js'

export default apiHandler(async (body, call) => {
  const words = Array.isArray(body.words)
    ? body.words.map((w) => String(w || '').trim()).filter(Boolean)
    : []
  const level = ['B1', 'B2', 'C1'].includes(body.level) ? body.level : 'B1'
  if (words.length < 2) throw new Error('VALID:Cần ít nhất 2 từ để tạo đoạn văn.')
  return call(prompts.PASSAGE_PROMPT, JSON.stringify({ level, target_words: words }))
})
