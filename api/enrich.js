import { apiHandler, prompts } from '../server/qwen.js'

export default apiHandler(async (body, call) => {
  const word = String(body.word || '').trim()
  if (!word) throw new Error('VALID:Thiếu "word".')
  return call(prompts.SYSTEM_PROMPT, word)
})
