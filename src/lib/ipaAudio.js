// Bản ghi âm vị độc lập từ Wikimedia Commons. Dùng URL redirect ổn định để
// tránh gắn cứng đường dẫn upload có hash. Nếu mạng lỗi, playRootSound sẽ dùng
// một từ độc lập ngắn làm phương án dự phòng cho đúng âm cần nghe.
const COMMONS_FILE = {
  'iː': 'Close front unrounded vowel.ogg',
  'ɪ': 'Near-close near-front unrounded vowel.ogg',
  e: 'Close-mid front unrounded vowel.ogg',
  æ: 'Near-open front unrounded vowel.ogg',
  'ɑː': 'Open back unrounded vowel.ogg',
  'ɒ': 'Open back rounded vowel.ogg',
  'ɔː': 'Open-mid back rounded vowel.ogg',
  'ʊ': 'Near-close near-back rounded vowel.ogg',
  'uː': 'Close back rounded vowel.ogg',
  'ʌ': 'Open-mid back unrounded vowel.ogg',
  'ɜː': 'Open-mid central unrounded vowel.ogg',
  'ə': 'Mid-central vowel.ogg',
  'aʊ': 'LL-Q1860 (eng)-Pvanp7-aʊ (diphthong).wav',
  'eə': 'LL-Q1860 (eng)-Pvanp7-ɛə (diphthong).wav',
  'ʊə': 'LL-Q1860 (eng)-Pvanp7-ʊə (diphthong).wav',
  p: 'Voiceless bilabial plosive.ogg',
  b: 'Voiced bilabial plosive.ogg',
  t: 'Voiceless alveolar plosive.ogg',
  d: 'Voiced alveolar plosive.ogg',
  k: 'Voiceless velar plosive.ogg',
  'ɡ': 'Voiced velar plosive.ogg',
  f: 'Voiceless labiodental fricative.ogg',
  v: 'Voiced labiodental fricative.ogg',
  'θ': 'Voiceless dental fricative.ogg',
  'ð': 'Voiced dental fricative.ogg',
  s: 'Voiceless alveolar sibilant.ogg',
  z: 'Voiced alveolar sibilant.ogg',
  'ʃ': 'Voiceless postalveolar fricative.ogg',
  'ʒ': 'Voiced postalveolar fricative.ogg',
  h: 'Voiceless glottal fricative.ogg',
  'tʃ': 'Voiceless palato-alveolar affricate.ogg',
  'dʒ': 'Voiced postalveolar affricate.ogg',
  m: 'Bilabial nasal.ogg',
  n: 'Alveolar nasal.ogg',
  'ŋ': 'Velar nasal.ogg',
  l: 'Alveolar lateral approximant.ogg',
  r: 'Alveolar approximant.ogg',
  j: 'Palatal approximant.ogg',
  w: 'Voiced labio-velar approximant.ogg',
}

// Các từ này bản thân chỉ gồm nguyên âm/nguyên âm đôi cần luyện, không ghép
// thêm phụ âm đầu-cuối. Chỉ dùng khi chưa có bản ghi độc lập hoặc tải audio lỗi.
const ROOT_PROMPT = {
  'eɪ': 'A',
  'aɪ': 'I',
  'ɔɪ': 'oy',
  'oʊ': 'O',
  'ɪə': 'ear',
  'aʊ': 'ow',
  'eə': 'air',
  'ʊə': 'ewer',
}

let activeAudio = null

function tts(text) {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = 0.72
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function rootAudioUrl(symbol) {
  const file = COMMONS_FILE[symbol]
  return file
    ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`
    : ''
}

export function playRootSound(sound) {
  if (!sound) return
  window.speechSynthesis?.cancel()
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
  }

  const url = rootAudioUrl(sound.symbol)
  const fallback = ROOT_PROMPT[sound.symbol] || sound.keyword
  if (!url) {
    tts(fallback)
    return
  }

  const audio = new Audio(url)
  activeAudio = audio
  audio.preload = 'auto'
  audio.addEventListener('error', () => tts(fallback), { once: true })
  audio.play().catch(() => tts(fallback))
}
