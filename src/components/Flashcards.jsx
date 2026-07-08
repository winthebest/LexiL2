import { useMemo, useState } from 'react'
import { getCached } from '../lib/cache.js'
import { listSaved } from '../lib/saved.js'
import { grade, getSrs, isDue } from '../lib/srs.js'
import { say } from '../lib/speech.js'
import { Caption, ConnotationDot, RegisterChip } from './ui.jsx'

const GRADES = [
  { key: 'Quên', q: 2, color: 'var(--color-miss)' },
  { key: 'Khó', q: 3, color: 'var(--color-neg)' },
  { key: 'Tạm', q: 4, color: 'var(--color-neu)' },
  { key: 'Dễ', q: 5, color: 'var(--color-ok)' },
]

function shuffle(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function loadCards(onlyDue) {
  const cards = listSaved()
    .map((entry) => getCached(entry.word))
    .filter(Boolean)
  return onlyDue ? cards.filter((card) => isDue(card.word)) : cards
}

function EmptyState({ onlyDue, totalSaved, onShowAll }) {
  if (totalSaved === 0) {
    return (
      <div className="rounded-card border border-rule bg-surface/88 p-8 text-center shadow-card">
        <Caption>flashcard</Caption>
        <p className="mt-3 font-display text-[28px] font-semibold leading-tight text-ink">
          Chưa có từ để lật thẻ.
        </p>
        <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">
          Lưu vài từ trong WordCard rồi quay lại đây để học nhanh.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-rule bg-surface/88 p-8 text-center shadow-card">
      <Caption>flashcard</Caption>
      <p className="mt-3 font-display text-[28px] font-semibold leading-tight text-ink">
        Không có thẻ đến hạn.
      </p>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">
        Bạn có thể lật sớm toàn bộ bảng từ để xem lại nhẹ nhàng.
      </p>
      {onlyDue && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-5 rounded-full border border-accent px-5 py-2.5 text-[14px] font-semibold text-accent transition hover:bg-accent-soft"
        >
          Xem tất cả ({totalSaved})
        </button>
      )}
    </div>
  )
}

function ExampleList({ examples }) {
  if (!examples?.length) return null
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <Caption>ví dụ</Caption>
      <ul className="mt-2 space-y-2">
        {examples.slice(0, 2).map((example, index) => (
          <li key={index} className="text-[15px] leading-relaxed text-ink">
            <span className="italic">“{example.sentence}”</span>
            {example.why && <p className="mt-1 text-[13px] text-muted">{example.why}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CollocationPreview({ collocations }) {
  if (!collocations?.length) return null
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <Caption>collocations</Caption>
      <div className="mt-2 flex flex-wrap gap-2">
        {collocations.slice(0, 4).map((item, index) => (
          <span
            key={`${item.phrase || 'collocation'}-${index}`}
            className="rounded-full border border-rule bg-canvas/70 px-3 py-1 text-[13px] font-medium text-ink"
          >
            {item.phrase}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Flashcards() {
  const totalSaved = useMemo(() => listSaved().length, [])
  const [onlyDue, setOnlyDue] = useState(true)
  const [deck, setDeck] = useState(() => shuffle(loadCards(true)))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = deck[idx]
  const srs = card ? getSrs(card.word) : null
  const progress = deck.length ? Math.round(((idx + 1) / deck.length) * 100) : 0

  function rebuild(nextOnlyDue = onlyDue) {
    setOnlyDue(nextOnlyDue)
    setDeck(shuffle(loadCards(nextOnlyDue)))
    setIdx(0)
    setFlipped(false)
  }

  function next() {
    if (!deck.length) return
    setIdx((current) => Math.min(deck.length - 1, current + 1))
    setFlipped(false)
  }

  function prev() {
    if (!deck.length) return
    setIdx((current) => Math.max(0, current - 1))
    setFlipped(false)
  }

  function mark(q) {
    if (!card) return
    grade(card.word, q)
    next()
  }

  if (!card) {
    return (
      <EmptyState
        onlyDue={onlyDue}
        totalSaved={totalSaved}
        onShowAll={() => rebuild(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Caption>flashcard</Caption>
          <p className="mt-1 text-[14px] text-muted">
            {idx + 1}/{deck.length} thẻ · {onlyDue ? 'đến hạn' : 'tất cả'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => rebuild(!onlyDue)}
            className="rounded-full border border-rule bg-surface/80 px-3 py-2 text-[13px] font-medium text-muted transition hover:border-accent hover:text-ink"
          >
            {onlyDue ? 'Xem tất cả' : 'Chỉ đến hạn'}
          </button>
          <button
            type="button"
            onClick={() => rebuild(onlyDue)}
            className="rounded-full border border-rule bg-surface/80 px-3 py-2 text-[13px] font-medium text-muted transition hover:border-accent hover:text-ink"
          >
            Xáo trộn
          </button>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="min-h-[360px] w-full rounded-card border border-rule bg-surface/88 p-6 text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent focus-visible:border-accent sm:min-h-[420px] sm:p-8"
        aria-pressed={flipped}
      >
        {!flipped ? (
          <div className="flex min-h-[310px] flex-col sm:min-h-[360px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(card.part_of_speech || []).length > 0 && (
                  <span className="text-[14px] italic text-muted">
                    {card.part_of_speech.join(', ')}
                  </span>
                )}
                <RegisterChip value={card.register} />
                {card.connotation && <ConnotationDot value={card.connotation} />}
              </div>
              {srs && (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
                  mức {Math.min(5, (srs.n || 0) + 1)}/5
                </span>
              )}
            </div>

            <div className="grid flex-1 place-items-center py-10 text-center">
              <div>
                <h2 className="break-words font-display text-[58px] font-bold leading-none text-ink sm:text-[76px]">
                  {card.word}
                </h2>
                {card.ipa && <p className="ipa mt-5 text-[24px] text-muted">{card.ipa}</p>}
                {card.syllable_stress && (
                  <p className="mt-2 font-data text-[12px] text-muted">{card.syllable_stress}</p>
                )}
              </div>
            </div>

            <p className="text-center text-[13px] font-medium text-muted">Chạm để lật thẻ</p>
          </div>
        ) : (
          <div className="min-h-[310px] sm:min-h-[360px]">
            <Caption>nghĩa</Caption>
            <p className="mt-3 text-[22px] leading-relaxed text-ink">{card.core_meaning_en}</p>
            {card.vi_anchor && (
              <p className="mt-3 text-[18px] font-semibold text-accent">{card.vi_anchor}</p>
            )}

            <ExampleList examples={card.examples} />
            <CollocationPreview collocations={card.collocations} />
          </div>
        )}
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          className="rounded-full border border-rule bg-surface/80 px-4 py-3 text-[14px] font-medium text-muted transition hover:border-accent hover:text-ink disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={() => say(card.word)}
          className="rounded-full border border-accent bg-accent-soft px-4 py-3 text-[14px] font-semibold text-accent transition hover:bg-accent hover:text-[var(--color-canvas)]"
        >
          Nghe
        </button>
        <button
          type="button"
          onClick={next}
          disabled={idx === deck.length - 1}
          className="rounded-full border border-rule bg-surface/80 px-4 py-3 text-[14px] font-medium text-muted transition hover:border-accent hover:text-ink disabled:opacity-40"
        >
          Tiếp
        </button>
      </div>

      {flipped && (
        <div>
          <Caption>tự chấm SRS</Caption>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {GRADES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => mark(item.q)}
                className="rounded-2xl border border-rule bg-surface/84 px-2 py-3 text-[13px] font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-accent"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mb-1 block h-2.5 w-2.5 rounded-full"
                  style={{ background: item.color }}
                />
                {item.key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
