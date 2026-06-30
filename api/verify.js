import { apiHandler, prompts } from '../server/qwen.js'

export default apiHandler(async (body, call, cfg) => {
  const sentence = String(body.sentence || '').trim()
  const options = Array.isArray(body.options) ? body.options : []
  if (!sentence || options.length !== 5) {
    throw new Error('VALID:Cần "sentence" và đúng 5 "options".')
  }
  return call(prompts.VERIFIER_PROMPT, JSON.stringify({ sentence, options }), {
    model: cfg.verifierModel,
    temperature: 0,
  })
})
