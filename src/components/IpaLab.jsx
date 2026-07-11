import { useEffect, useMemo, useState } from 'react'
import { Caption, SpeakerIcon } from './ui.jsx'
import { CONTRAST_PAIRS, findSound, IPA_GROUPS, IPA_SOUNDS } from '../data/ipa.js'
import { playRootSound } from '../lib/ipaAudio.js'

const STORAGE_KEY = 'gre-l2:ipa-learned:v1'

function speak(text, rate = 0.82) {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

function SoundButton({ sound, active, learned, onSelect }) {
  return (
    <button
      onClick={() => onSelect(sound)}
      aria-pressed={active}
      className={`group relative min-h-[86px] rounded-2xl border p-3 text-left transition sm:min-h-[94px] ${
        active
          ? 'border-accent bg-accent-soft shadow-soft'
          : 'border-rule bg-surface hover:-translate-y-0.5 hover:border-accent hover:shadow-card'
      }`}
    >
      {learned && (
        <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-ok text-[11px] font-bold text-white" aria-label="Đã học">
          ✓
        </span>
      )}
      <span className="ipa block text-[29px] font-semibold leading-none text-ink">/{sound.symbol}/</span>
      <span className="mt-2 block truncate text-[12px] font-medium text-muted">{sound.keyword}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <SpeakerIcon className="h-3.5 w-3.5" /> Nghe
      </span>
    </button>
  )
}

function SoundDetail({ sound, learned, onToggleLearned }) {
  if (!sound) return null
  return (
    <section className="rounded-card border border-rule bg-surface p-5 shadow-card sm:p-7" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Caption>âm đang học</Caption>
          <div className="mt-2 flex items-end gap-3">
            <h3 className="ipa text-[52px] font-semibold leading-none text-ink">/{sound.symbol}/</h3>
            <button
              onClick={() => playRootSound(sound)}
              className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-accent text-canvas transition hover:opacity-90"
              aria-label={`Nghe âm gốc /${sound.symbol}/`}
              title="Nghe âm gốc"
            >
              <SpeakerIcon />
            </button>
          </div>
          <button
            onClick={() => playRootSound(sound)}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-accent bg-accent-soft px-4 text-[13px] font-semibold text-accent transition hover:bg-accent hover:text-canvas"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] text-canvas">1</span>
            Nghe âm gốc /{sound.symbol}/
          </button>
        </div>
        <button
          onClick={() => onToggleLearned(sound.symbol)}
          className={`shrink-0 rounded-full border px-3 py-2 text-[12px] font-semibold transition ${
            learned ? 'border-ok bg-ok/10 text-ok' : 'border-rule text-muted hover:border-accent hover:text-accent'
          }`}
        >
          {learned ? '✓ Đã học' : 'Đánh dấu đã học'}
        </button>
      </div>

      <div className="mt-6 border-t border-rule pt-5">
        <Caption>cách phát âm</Caption>
        <p className="mt-2 text-[14px] leading-7 text-ink">{sound.guide}</p>
      </div>

      {sound.pair && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-rule bg-canvas/50 p-3.5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted">Dễ nhầm với</p>
            <p className="mt-1 text-[13px] text-muted">Nghe luân phiên để nhận ra độ dài và khẩu hình.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {[sound, findSound(sound.pair)].filter(Boolean).map((item) => (
              <button
                key={item.symbol}
                onClick={() => playRootSound(item)}
                className="ipa min-h-11 min-w-12 rounded-xl border border-rule bg-surface px-3 text-[19px] font-semibold text-ink hover:border-accent"
                aria-label={`Nghe /${item.symbol}/`}
              >
                /{item.symbol}/
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-rule text-[11px] font-bold text-muted">2</span>
          <Caption>nghe âm trong từ</Caption>
        </div>
        <div className="mt-3 divide-y divide-rule overflow-hidden rounded-2xl border border-rule">
          {sound.examples.map((example) => (
            <button
              key={example.word}
              onClick={() => speak(example.word)}
              className="flex min-h-[62px] w-full items-center gap-3 bg-canvas/35 px-4 text-left transition hover:bg-accent-soft"
              aria-label={`Nghe từ ${example.word}`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rule bg-surface text-accent">
                <SpeakerIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{example.word}</span>
                <span className="ipa block text-[13px] text-muted">{example.ipa}</span>
              </span>
              <span className="text-right text-[12px] text-muted">{example.meaning}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function PairPractice({ onChoose }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CONTRAST_PAIRS.map(([left, right, leftWord, rightWord]) => (
        <article key={`${left}-${right}`} className="rounded-card border border-rule bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <Caption>cặp tối thiểu</Caption>
            <span className="text-[11px] text-muted">Chạm để nghe</span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
            {[
              [left, leftWord],
              [right, rightWord],
            ].map(([symbol, word], index) => (
              <div key={symbol} className="contents">
                {index === 1 && <span className="self-center text-[12px] font-semibold text-muted">vs</span>}
                <button
                  onClick={() => speak(word, 0.7)}
                  className="rounded-2xl border border-rule bg-canvas/40 px-2 py-4 text-center transition hover:border-accent hover:bg-accent-soft"
                >
                  <span className="ipa block text-[27px] font-semibold text-ink">/{symbol}/</span>
                  <span className="mt-1 block text-[13px] font-medium text-muted">{word}</span>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onChoose(findSound(left))}
            className="mt-3 w-full text-center text-[12px] font-semibold text-accent hover:underline"
          >
            Xem hướng dẫn phát âm →
          </button>
        </article>
      ))}
    </div>
  )
}

export default function IpaLab() {
  const [mode, setMode] = useState('chart')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(() => IPA_SOUNDS[0])
  const [learned, setLearned] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(learned))
    } catch {
      // Tiến độ vẫn hoạt động trong phiên nếu trình duyệt chặn localStorage.
    }
  }, [learned])

  const shownGroups = useMemo(
    () => IPA_GROUPS.filter((group) => filter === 'all' || group.id === filter),
    [filter],
  )

  function choose(sound) {
    if (!sound) return
    setSelected(sound)
    playRootSound(sound)
    window.setTimeout(() => document.getElementById('ipa-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function toggleLearned(symbol) {
    setLearned((items) => (items.includes(symbol) ? items.filter((item) => item !== symbol) : [...items, symbol]))
  }

  return (
    <div>
      <section className="overflow-hidden rounded-card border border-rule bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Caption>phòng luyện phát âm</Caption>
            <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink">Bảng IPA tương tác</h2>
            <p className="mt-2 max-w-[480px] text-[14px] leading-6 text-muted">
              Chọn một âm để nghe, xem khẩu hình và luyện với từ thực tế. Gồm 44 âm tiếng Anh phổ biến.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-rule bg-canvas/45 px-4 py-3">
            <p className="font-data text-[19px] font-semibold text-ink">{learned.length}/44</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted">âm đã học</p>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-rule" aria-label={`Đã học ${learned.length} trên 44 âm`}>
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(learned.length / 44) * 100}%` }} />
        </div>
      </section>

      <div className="mt-5 flex rounded-2xl border border-rule bg-surface p-1 shadow-card">
        {[
          ['chart', 'Bảng âm'],
          ['pairs', 'Cặp dễ nhầm'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`min-h-11 flex-1 rounded-xl px-3 text-[13px] font-semibold transition ${mode === id ? 'bg-accent text-canvas shadow-card' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'chart' ? (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilter('all')} className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold ${filter === 'all' ? 'border-accent bg-accent-soft text-accent' : 'border-rule bg-surface text-muted'}`}>Tất cả</button>
            {IPA_GROUPS.map((group) => (
              <button key={group.id} onClick={() => setFilter(group.id)} className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold ${filter === group.id ? 'border-accent bg-accent-soft text-accent' : 'border-rule bg-surface text-muted'}`}>
                {group.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-7">
            {shownGroups.map((group) => (
              <section key={group.id}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-display text-[20px] font-semibold text-ink">{group.label}</h3>
                  <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted">{group.description}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {IPA_SOUNDS.filter((sound) => sound.type === group.id).map((sound) => (
                    <SoundButton key={sound.symbol} sound={sound} active={selected.symbol === sound.symbol} learned={learned.includes(sound.symbol)} onSelect={choose} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <p className="mb-4 text-[13px] leading-6 text-muted">Nghe hai từ liên tiếp và tập trung vào đúng một âm khác biệt. Hãy lặp lại mỗi từ ba lần.</p>
          <PairPractice onChoose={(sound) => { setMode('chart'); setFilter(sound.type); choose(sound) }} />
        </div>
      )}

      <div id="ipa-detail" className="mt-7 scroll-mt-5">
        <SoundDetail sound={selected} learned={learned.includes(selected.symbol)} onToggleLearned={toggleLearned} />
      </div>
      <p className="mt-3 text-center text-[11px] leading-5 text-muted">
        Âm gốc dùng bản ghi ngữ âm từ{' '}
        <a
          href="https://commons.wikimedia.org/wiki/Category:Audio_files_of_phonetic_samples"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-accent hover:underline"
        >
          Wikimedia Commons
        </a>
        ; từ ví dụ dùng giọng đọc có sẵn trên thiết bị.
      </p>
    </div>
  )
}
