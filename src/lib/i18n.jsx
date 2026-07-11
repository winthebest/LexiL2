import { createContext, useContext, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'gre-l2:language:v1'
const LanguageContext = createContext(null)

// Từ điển giao diện cũ. Các component mới có thể dùng tr(vi, en) trực tiếp;
// lớp localizer bên dưới giúp toàn bộ màn hình hiện có đổi ngôn ngữ đồng bộ.
const EN = {
  'Bảng từ': 'Word list',
  'Ôn tập': 'Review',
  'Tra từ': 'Look up',
  'Cụm từ': 'Collocations',
  'Đoạn văn': 'Passage',
  'Drill nghe': 'Listening drill',
  'Đồng bộ': 'Sync',
  'Phân biệt': 'Contrast',
  'Ngân hàng đề': 'Question bank',
  'Bảng IPA': 'IPA chart',
  'Thêm': 'More',
  'Đóng': 'Close',
  'Gõ một từ → AI dựng thẻ từ tươi mới, tối ưu cho người Việt.': 'Type a word → AI creates a fresh vocabulary card.',
  'Sang nền sáng': 'Switch to light theme',
  'Sang nền tối': 'Switch to dark theme',
  'Đổi nền sáng/tối': 'Toggle light/dark theme',
  'Gõ một từ GRE…  (vd: loquacious)': 'Type a GRE word…  (e.g. loquacious)',
  'Đang tra…': 'Looking up…',
  'Xem thẻ mẫu (offline)': 'View sample card (offline)',
  'màn trống': 'empty state',
  'Gõ một từ GRE để xem thẻ.': 'Type a GRE word to view its card.',
  'Nhấn / để nhảy vào ô nhập.': 'Press / to focus the search field.',
  'Không tạo được thẻ.': 'Could not create the card.',
  'Thử lại': 'Try again',
  'bảng từ': 'word list',
  'Bảng từ còn trống.': 'Your word list is empty.',
  'Sang Tra từ, gõ một từ GRE rồi lưu vào bảng để bắt đầu ôn.': 'Go to Look up, enter a GRE word, then save it to start reviewing.',
  'Sang': 'Go to',
  ', gõ một từ GRE rồi': ', enter a GRE word, then',
  ', gõ một từ GRE rồi lưu vào bảng để bắt đầu ôn.': ', enter a GRE word, then save it to the list to start reviewing.',
  'lưu vào bảng để bắt đầu ôn.': 'save it to the list to start reviewing.',
  'hôm nay': 'today',
  'Không còn từ đến hạn': 'No words due',
  'Bạn đã xử lý xong lịch hôm nay. Có thể tra thêm từ mới hoặc quay lại sau.': 'You have finished today’s schedule. Look up more words or come back later.',
  'Không có từ đến hạn — quay lại sau': 'No words due — come back later',
  'Nhớ lần đầu': 'First-try recall',
  'Đúng TC': 'TC accuracy',
  'Tất cả': 'All',
  'Đến hạn': 'Due',
  'Hay quên ⚑': 'Leeches ⚑',
  'Khó': 'Hard',
  'Tìm…': 'Search…',
  'Xuất Anki': 'Export Anki',
  'hay quên': 'leech',
  'đến hạn': 'due',
  'đã ôn': 'reviewed',
  'xóa': 'remove',
  'Không có từ khớp bộ lọc.': 'No words match this filter.',
  'Chưa có dữ liệu': 'No data yet',
  'Chưa có từ để ôn.': 'No words to review yet.',
  'Lưu vài từ (dấu trang trên thẻ) rồi quay lại đây.': 'Save a few words using the bookmark, then return here.',
  'Không có từ đến hạn hôm nay.': 'No words are due today.',
  'Lịch SM-2 sẽ tự gọi lại từng từ đúng lúc.': 'The SM-2 schedule will bring each word back at the right time.',
  'xong phiên': 'session complete',
  'Ôn lại (xáo trộn)': 'Review again (shuffle)',
  'Về bảng từ': 'Back to word list',
  'ôn sớm': 'early review',
  'Esc thoát': 'Esc to exit',
  'nghĩa': 'meaning',
  'Gõ lại từ': 'Type the word',
  'Từ này là gì? Gõ lại…': 'What is this word? Type it…',
  'Hiện đáp án ⏎': 'Reveal answer ⏎',
  'bạn đã hé lộ mà chưa gõ': 'revealed without typing',
  'Nhớ tới đâu? (chấm thật thà)': 'How well did you recall it? (be honest)',
  'Quên': 'Forgot',
  'Tạm': 'Okay',
  'Dễ': 'Easy',
  'Chưa có từ để nghe. Lưu vài từ (bấm ☆ trên thẻ) rồi quay lại đây.': 'No words to listen to. Save a few words with ☆, then return here.',
  'Xong drill nghe 🎧': 'Listening drill complete 🎧',
  'nhớ được': 'remembered',
  'Làm lại': 'Restart',
  'Nghe và đoán nghĩa…': 'Listen and guess the meaning…',
  'Hiện đáp án': 'Reveal answer',
  'Chưa nhớ': 'Not yet',
  'Nhớ rồi': 'Got it',
  'Chưa có từ nào. Lưu vài từ (bấm ☆ trên thẻ) rồi quay lại đây.': 'No words yet. Save a few words with ☆, then return here.',
  'Trình độ:': 'Level:',
  'Tạo đoạn văn': 'Create passage',
  'Đang viết…': 'Writing…',
  'Có lỗi xảy ra': 'Something went wrong',
  'cặp tối thiểu': 'minimal pair',
  'Chạm để nghe': 'Tap to listen',
  'Xem hướng dẫn phát âm →': 'View pronunciation guide →',
  'phòng luyện phát âm': 'pronunciation lab',
  'Bảng IPA tương tác': 'Interactive IPA chart',
  'Chọn một âm để nghe, xem khẩu hình và luyện với từ thực tế. Gồm 44 âm tiếng Anh phổ biến.': 'Choose a sound to hear it, study articulation, and practise with real words. Includes 44 common English sounds.',
  'âm đã học': 'sounds learned',
  'Bảng âm': 'Sound chart',
  'Cặp dễ nhầm': 'Common contrasts',
  'Nguyên âm đơn': 'Monophthongs',
  'Nguyên âm đôi': 'Diphthongs',
  'Phụ âm': 'Consonants',
  'âm đang học': 'current sound',
  'Nghe âm gốc': 'Play isolated sound',
  'Nghe': 'Play',
  'Đánh dấu đã học': 'Mark as learned',
  '✓ Đã học': '✓ Learned',
  'cách phát âm': 'how to articulate',
  'Dễ nhầm với': 'Often confused with',
  'Nghe luân phiên để nhận ra độ dài và khẩu hình.': 'Alternate the sounds to notice their length and articulation.',
  'nghe âm trong từ': 'hear it in words',
  'Âm gốc dùng bản ghi ngữ âm từ': 'Isolated sounds use phonetic recordings from',
  '; từ ví dụ dùng giọng đọc có sẵn trên thiết bị.': '; example words use the voice available on your device.',
  'Audio được tạo bởi giọng đọc có sẵn trên thiết bị; chất giọng có thể khác nhau giữa các trình duyệt.': 'Audio uses the voice available on your device and may vary by browser.',
  'Chưa có': 'Not available',
  'Đã lưu': 'Saved',
  'Lưu': 'Save',
  'Đẩy lên': 'Push',
  'Kéo về': 'Pull',
  'Bật sync': 'Enable sync',
  'Tự đẩy/kéo': 'Auto push/pull',
  'chưa có': 'none',
  'Local:': 'Local:',
  'Đẩy gần nhất:': 'Last push:',
  'Kéo gần nhất:': 'Last pull:',
  'Câu tiếp →': 'Next question →',
  'Tạo câu mới': 'Create new question',
  'Đang dựng…': 'Building…',
  'Đang dựng câu…': 'Building question…',
  'Chính xác': 'Correct',
  'Vì sao:': 'Why:',
  'Câu này có vấn đề? (lọc khỏi bank + chỉnh prompt)': 'Problem with this question? (remove it and improve the prompt)',
  'tích cực': 'positive',
  'tiêu cực': 'negative',
  'trung tính': 'neutral',
}

const REPLACEMENTS = [
  [/^(\d+) âm$/, '$1 sounds'],
  [/^Câu (\d+)\/(\d+)$/, 'Question $1/$2'],
  [/^đã chọn (\d+)$/, '$1 selected'],
  [/^trong bank: (\d+) câu$/, '$1 questions in bank'],
  [/^Ôn (\d+) từ đến hạn$/, 'Review $1 due words'],
  [/^(\d+) từ đang chờ trong lịch SRS\. Làm một phiên ngắn là đủ\.$/, '$1 words are waiting in your SRS schedule. A short session is enough.'],
  [/^Ôn sớm tất cả \((\d+)\)$/, 'Review all early ($1)'],
  [/^đến hạn (\d+) \/ (\d+)$/, 'due $1 / $2'],
  [/^nhớ ngay lần đầu phiên này: (\d+)% · trung bình mọi phiên: (\d+)%$/, 'first-try recall this session: $1% · all-time average: $2%'],
  [/^bạn gõ: “(.+)” — đúng$/, 'you typed: “$1” — correct'],
  [/^bạn gõ: “(.+)” — chưa khớp$/, 'you typed: “$1” — not a match'],
  [/^Đã học (\d+) trên 44 âm$/, '$1 of 44 sounds learned'],
  [/^Nghe âm gốc \/(.+)\/$/, 'Play isolated /$1/'],
  [/^Nghe \/(.+)\/$/, 'Play /$1/'],
  [/^Nghe từ (.+)$/, 'Play the word $1'],
  [/^Xóa (.+)$/, 'Remove $1'],
  [/^phím (\d+)$/, 'key $1'],
]

function translateCore(value) {
  if (EN[value]) return EN[value]
  for (const [pattern, replacement] of REPLACEMENTS) {
    if (pattern.test(value)) return value.replace(pattern, replacement)
  }
  return value
}

function translatePreservingWhitespace(value) {
  const leading = value.match(/^\s*/)?.[0] || ''
  const trailing = value.match(/\s*$/)?.[0] || ''
  const core = value.trim()
  if (!core) return value
  return `${leading}${translateCore(core)}${trailing}`
}

function shouldSkip(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
  return Boolean(element?.closest?.('[data-i18n-skip]'))
}

function AutoLocalize({ language }) {
  const languageRef = useRef(language)
  const textState = useRef(new WeakMap())
  const attrState = useRef(new WeakMap())

  useEffect(() => {
    languageRef.current = language
    const root = document.getElementById('root')
    if (!root) return undefined

    function localizeText(node) {
      if (shouldSkip(node)) return
      const current = node.nodeValue || ''
      let state = textState.current.get(node)
      if (!state) state = { source: current, rendered: current }
      else if (current !== state.rendered && current !== state.source) state.source = current
      const rendered = languageRef.current === 'en' ? translatePreservingWhitespace(state.source) : state.source
      state.rendered = rendered
      textState.current.set(node, state)
      if (current !== rendered) node.nodeValue = rendered
    }

    function localizeAttributes(element) {
      if (shouldSkip(element)) return
      const names = ['aria-label', 'title', 'placeholder']
      let states = attrState.current.get(element)
      if (!states) states = new Map()
      for (const name of names) {
        if (!element.hasAttribute(name)) continue
        const current = element.getAttribute(name) || ''
        let state = states.get(name)
        if (!state) state = { source: current, rendered: current }
        else if (current !== state.rendered && current !== state.source) state.source = current
        const rendered = languageRef.current === 'en' ? translateCore(state.source) : state.source
        state.rendered = rendered
        states.set(name, state)
        if (current !== rendered) element.setAttribute(name, rendered)
      }
      attrState.current.set(element, states)
    }

    function scan(target) {
      if (target.nodeType === Node.TEXT_NODE) {
        localizeText(target)
        return
      }
      if (target.nodeType !== Node.ELEMENT_NODE || shouldSkip(target)) return
      localizeAttributes(target)
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
      let node = walker.nextNode()
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) localizeText(node)
        else localizeAttributes(node)
        node = walker.nextNode()
      }
    }

    scan(root)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') localizeText(mutation.target)
        else if (mutation.type === 'attributes') localizeAttributes(mutation.target)
        else mutation.addedNodes.forEach(scan)
      }
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'placeholder'],
    })
    return () => observer.disconnect()
  }, [language])

  return null
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'vi'
    } catch {
      return 'vi'
    }
  })

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Ngôn ngữ vẫn hoạt động trong phiên hiện tại.
    }
  }, [language])

  const value = {
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((current) => (current === 'vi' ? 'en' : 'vi')),
    tr: (vi, en) => (language === 'en' ? en : vi),
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <AutoLocalize language={language} />
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
