// Phiên ôn — chế độ RECALL ★ màn quan trọng nhất.
// Recall trước, reveal sau: đáp án luôn bị che sau một hành động cố nhớ.
// Tự-chấm bằng 4 nút CÂN BẰNG — không "dụ" bấm Dễ. Điểm chấm feed SM-2.

import { useEffect, useMemo, useState } from 'react'
import { listSaved } from '../lib/saved.js'
import { getCached, normalizeWord } from '../lib/cache.js'
import { say } from '../lib/speech.js'
import { isDue, grade } from '../lib/srs.js'
import { recordReview, getProgress } from '../lib/progress.js'
import WordCard from './WordCard.jsx'
import { Caption } from './ui.jsx'

const GRADES = [
  { key: 'Quên', q: 2, color: 'var(--color-miss)', hint: '1' },
  { key: 'Khó', q: 3, color: 'var(--color-neg)', hint: '2' },
  { key: 'Tạm', q: 4, color: 'var(--color-neu)', hint: '3' },
  { key: 'Dễ', q: 5, color: 'var(--color-ok)', hint: '4' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function reviewable() {
  return listSaved()
    .map((e) => getCached(e.word))
    .filter(Boolean)
}

function buildQueue(includeAll) {
  const all = reviewable()
  return shuffle(includeAll ? all : all.filter((c) => isDue(c.word)))
}

export default function Review({ onExit }) {
  const [includeAll, setIncludeAll] = useState(false)
  const [queue, setQueue] = useState(() => buildQueue(false))
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [stats, setStats] = useState({ correct: 0, total: 0 })

  const total = queue.length
  const card = queue[idx]
  const done = idx >= total
  const totalReviewable = useMemo(() => reviewable().length, [])

  function restart(all) {
    setIncludeAll(all)
    setQueue(buildQueue(all))
    setIdx(0)
    setInput('')
    setRevealed(false)
    setCorrect(false)
    setStats({ correct: 0, total: 0 })
  }

  function reveal() {
    if (!card || revealed) return
    const ok = normalizeWord(input) === card.word
    say(card.word)
    recordReview(ok)
    setCorrect(ok)
    setStats((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    setRevealed(true)
  }

  function gradeCard(q) {
    if (!card) return
    grade(card.word, q)
    setIdx((i) => i + 1)
    setInput('')
    setRevealed(false)
    setCorrect(false)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') return onExit?.()
      if (done || !card) return
      if (!revealed) {
        if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault()
          say(card.word)
        }
        return
      }
      const g = GRADES.find((x) => x.hint === e.key)
      if (g) {
        e.preventDefault()
        gradeCard(g.q)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, done, card, onExit])

  // ── Trạng thái rỗng ──
  if (total === 0 && !done) {
    if (totalReviewable === 0) {
      return (
        <div className="rounded-card border border-rule bg-surface p-10 text-center shadow-card">
          <p className="text-[18px] font-bold text-ink">Chưa có từ để ôn.</p>
          <p className="mt-1.5 text-[14px] text-muted">
            Lưu vài từ (dấu trang trên thẻ) rồi quay lại đây.
          </p>
        </div>
      )
    }
    return (
      <div className="rounded-card border border-rule bg-surface p-10 text-center shadow-card">
        <p className="font-display text-[22px] font-bold text-ink">
          Không có từ đến hạn hôm nay.
        </p>
        <p className="mt-1.5 text-[14px] text-muted">
          Lịch SM-2 sẽ tự gọi lại từng từ đúng lúc.
        </p>
        <button
          onClick={() => restart(true)}
          className="mt-6 rounded-full border-2 border-accent px-5 py-2.5 text-[15px] font-bold text-accent hover:bg-accent-soft"
        >
          Ôn sớm tất cả ({totalReviewable})
        </button>
      </div>
    )
  }

  // ── Xong phiên ──
  if (done) {
    const sessionPct = total ? Math.round((stats.correct / total) * 100) : 0
    const firstTry = Math.round(getProgress().firstTryAccuracy * 100)
    return (
      <div className="overflow-hidden rounded-card border border-rule bg-surface text-center shadow-card">
        <div className="h-1.5 w-full bg-grad" />
        <div className="p-10">
          <Caption>xong phiên</Caption>
          <p className="mt-3 font-display text-[56px] font-bold leading-none text-grad">
            {stats.correct}/{total}
          </p>
          <p className="mt-3 text-[14px] text-muted">
            nhớ ngay lần đầu phiên này: {sessionPct}% · trung bình mọi phiên: {firstTry}%
          </p>
          <div className="mt-6 flex justify-center gap-2.5">
            <button
              onClick={() => restart(includeAll)}
              className="rounded-full border border-rule px-5 py-2.5 text-[15px] font-semibold text-ink hover:bg-canvas"
            >
              Ôn lại (xáo trộn)
            </button>
            <button
              onClick={() => onExit?.()}
              className="rounded-full bg-grad px-5 py-2.5 text-[15px] font-bold text-white shadow-soft hover:opacity-95"
            >
              Về bảng từ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Tiến độ */}
      <div className="mb-2.5 flex items-center justify-between">
        <Caption>
          đến hạn {idx + 1} / {total}
          {includeAll && ' · ôn sớm'}
        </Caption>
        <button
          onClick={() => onExit?.()}
          className="text-[13px] font-semibold text-muted hover:text-ink"
        >
          Esc thoát
        </button>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-grad transition-all"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>

      {/* ── BƯỚC 1: Hỏi ── */}
      {!revealed && (
        <div className="rounded-card border border-rule bg-surface p-7 shadow-card">
          <Caption>nghĩa</Caption>
          <p className="mt-2 font-display text-[24px] font-medium leading-snug text-ink">
            {card.core_meaning_en}
          </p>
          {card.vi_anchor && (
            <p className="mt-1.5 text-[16px] font-medium text-muted">
              <span className="font-data text-[11px]">vi</span> · {card.vi_anchor}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 text-[13px] text-muted">
            {(card.part_of_speech || []).length > 0 && (
              <span className="font-display italic">{card.part_of_speech.join(', ')}</span>
            )}
            {card.register && <span>· {card.register}</span>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              reveal()
            }}
            className="mt-6"
          >
            <label htmlFor="recall-input" className="sr-only">
              Gõ lại từ
            </label>
            <input
              id="recall-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Từ này là gì? Gõ lại…"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-2xl border-2 border-rule bg-canvas px-4 py-3.5 font-display text-[20px] text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-2xl bg-grad py-3.5 text-[16px] font-bold text-white shadow-soft hover:opacity-95"
            >
              Hiện đáp án ⏎
            </button>
          </form>
        </div>
      )}

      {/* ── BƯỚC 2: Hé lộ + tự chấm ── */}
      {revealed && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-full text-[15px] font-bold text-white"
              style={{ background: correct ? 'var(--color-ok)' : 'var(--color-miss)' }}
            >
              {correct ? '✓' : '✗'}
            </span>
            {input.trim() ? (
              <Caption>
                bạn gõ: “{input.trim()}” — {correct ? 'đúng' : 'chưa khớp'}
              </Caption>
            ) : (
              <Caption>bạn đã hé lộ mà chưa gõ</Caption>
            )}
          </div>

          <WordCard data={card} mode="recall" />

          {/* GradeBar — 4 nút cùng kích thước & độ nổi */}
          <div className="mt-5">
            <Caption>Nhớ tới đâu? (chấm thật thà)</Caption>
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {GRADES.map((g) => (
                <button
                  key={g.key}
                  onClick={() => gradeCard(g.q)}
                  aria-label={`${g.key} (phím ${g.hint})`}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-rule bg-surface py-3.5 text-[15px] font-bold text-ink shadow-card transition hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: g.color }}
                    />
                    {g.key}
                  </span>
                  <span className="font-data text-[11px] text-muted">{g.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">
              {GRADES.map((g) => g.key).join(' / ')} đều dễ bấm như nhau — chấm theo trí
              nhớ thật, lịch ôn tự điều chỉnh.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
