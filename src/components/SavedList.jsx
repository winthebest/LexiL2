// Bảng từ / Dashboard.
// Hành động chính = "Ôn ngay" (1 CTA lớn duy nhất). Chỉ 2 metric THẬT:
// nhớ lần đầu · đúng TC. Từ leech gắn cờ ⚑.

import { useMemo, useState } from 'react'
import { exportAnki } from '../lib/anki.js'
import { evalGate } from '../lib/gates.js'
import { getCached } from '../lib/cache.js'
import { getSrs, isDue } from '../lib/srs.js'
import { getProgress } from '../lib/progress.js'
import { getTcStats } from '../lib/bank.js'
import { Caption, ConnotationDot, RegisterChip } from './ui.jsx'

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'due', label: 'Đến hạn' },
  { key: 'leech', label: 'Hay quên ⚑' },
  { key: 'hard', label: 'Khó' },
]

function isLeech(word) {
  return getSrs(word).ef <= 1.8
}

function MetricCard({ label, value }) {
  return (
    <div className="flex-1 rounded-2xl border border-rule bg-surface p-4 shadow-card">
      <Caption>{label}</Caption>
      <p className="mt-1 font-display text-[28px] font-bold leading-none text-grad">{value}</p>
    </div>
  )
}

export default function SavedList({ items, onView, onRemove, onStartReview }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')

  const ankiGate = useMemo(() => evalGate('anki'), [items.length])
  const progress = useMemo(() => getProgress(), [items.length])
  const tc = useMemo(() => getTcStats(), [items.length])

  const enriched = useMemo(
    () =>
      items.map((e) => {
        const card = getCached(e.word)
        return {
          ...e,
          register: card?.register,
          connotation: card?.connotation,
          due: isDue(e.word),
          leech: isLeech(e.word),
        }
      }),
    [items],
  )

  const dueCount = enriched.filter((e) => e.due).length

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return enriched.filter((e) => {
      if (filter === 'due' && !e.due) return false
      if (filter === 'leech' && !e.leech) return false
      if (filter === 'hard' && !(e.difficulty >= 4)) return false
      if (!needle) return true
      return e.word.includes(needle) || (e.vi_anchor || '').toLowerCase().includes(needle)
    })
  }, [enriched, q, filter])

  function doExport() {
    const n = exportAnki()
    setToast(
      n > 0 ? `Đã xuất ${n} thẻ → mở Anki: File → Import.` : 'Chưa có thẻ nào còn dữ liệu để xuất.',
    )
    setTimeout(() => setToast(''), 4000)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-rule bg-surface p-10 text-center shadow-card">
        <p className="font-display text-[22px] font-bold text-ink">Bảng từ còn trống.</p>
        <p className="mt-1.5 text-[15px] text-muted">
          Sang <span className="font-semibold text-accent">Tra từ</span>, gõ một từ GRE rồi
          lưu vào bảng để bắt đầu ôn.
        </p>
      </div>
    )
  }

  const firstTry = Math.round(progress.firstTryAccuracy * 100)
  const tcPct = tc.answered ? Math.round(tc.accuracy * 100) : null

  return (
    <div>
      {/* ── 1 CTA lớn duy nhất ── */}
      <button
        onClick={() => onStartReview?.()}
        disabled={dueCount === 0}
        className="flex w-full items-center justify-center gap-3 rounded-card bg-grad px-6 py-5 text-[20px] font-bold text-white shadow-soft transition hover:opacity-95 disabled:bg-none disabled:bg-surface disabled:text-muted disabled:shadow-card disabled:[border:1px_solid_var(--color-rule)]"
      >
        {dueCount > 0 ? (
          <>
            Ôn {dueCount} từ đến hạn <span className="font-data text-[15px] opacity-80">⏎</span>
          </>
        ) : (
          'Không có từ đến hạn — quay lại sau'
        )}
      </button>

      {/* ── 2 metric THẬT ── */}
      <div className="mt-3.5 flex gap-3">
        <MetricCard label="Nhớ lần đầu" value={progress.totalReviews ? `${firstTry}%` : '—'} />
        <MetricCard label="Đúng TC" value={tcPct != null ? `${tcPct}%` : '—'} />
      </div>

      {/* ── Lọc ── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
              filter === f.key
                ? 'bg-grad text-white shadow-soft'
                : 'border border-rule text-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm…"
            className="w-32 rounded-full border border-rule bg-surface px-3.5 py-1.5 text-[14px] text-ink outline-none focus:border-accent"
          />
          {ankiGate.unlocked ? (
            <button
              onClick={doExport}
              title="Xuất ra file Anki import được"
              className="shrink-0 rounded-full border border-rule px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:bg-canvas"
            >
              Xuất Anki
            </button>
          ) : (
            <span
              title={`Cần ≥ ${ankiGate.items[0].need} từ đã lưu`}
              className="shrink-0 rounded-full border border-rule px-3.5 py-1.5 text-[13px] text-muted"
            >
              Xuất Anki ({ankiGate.items[0].have}/{ankiGate.items[0].need})
            </span>
          )}
        </div>
      </div>

      {toast && (
        <p className="mt-3 rounded-2xl border border-rule bg-accent-soft px-4 py-2.5 text-[14px] font-medium text-accent">
          {toast}
        </p>
      )}

      {/* ── Danh sách ── */}
      <ul className="mt-3 space-y-2">
        {filtered.map((e) => (
          <li
            key={e.word}
            className="flex items-center gap-3 rounded-2xl border border-rule bg-surface px-4 py-3 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 truncate">
                <span className="font-display text-[18px] font-semibold text-ink">
                  {e.display || e.word}
                </span>
                {(e.part_of_speech || []).length > 0 && (
                  <span className="font-display text-[13px] italic text-muted">
                    {e.part_of_speech.join(', ')}
                  </span>
                )}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <RegisterChip value={e.register} />
                {e.connotation && <ConnotationDot value={e.connotation} />}
                {e.vi_anchor && (
                  <span className="truncate text-[13px] text-muted">{e.vi_anchor}</span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              {e.leech ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
                  style={{ background: 'var(--color-neg)' }}
                >
                  ⚑ hay quên
                </span>
              ) : e.due ? (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">
                  đến hạn
                </span>
              ) : (
                <span className="text-[12px] text-muted">đã ôn</span>
              )}
            </div>

            <button
              onClick={() => onView(e.word)}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-accent hover:bg-accent-soft"
            >
              xem
            </button>
            <button
              onClick={() => onRemove(e.word)}
              aria-label={`Xóa ${e.word}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted hover:text-[var(--color-miss)]"
            >
              xóa
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-5 text-center text-[14px] text-muted">Không có từ khớp bộ lọc.</li>
        )}
      </ul>
    </div>
  )
}
