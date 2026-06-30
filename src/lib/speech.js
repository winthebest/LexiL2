// TTS dùng sẵn của trình duyệt (docs/prd.md FR-4).

export function say(word) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export function youglishUrl(word) {
  return `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`
}
