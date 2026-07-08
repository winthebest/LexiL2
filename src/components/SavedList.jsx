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
  const empty = value == null
  const display = empty ? 'Chưa có dữ liệu' : value
  const pct = empty ? 0 : Math.max(0, Math.min(100, Number(String(value).replace('%', '')) || 0))

  return (
    <div className="flex-1 rounded-card border border-rule bg-surface/85 p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Caption>{label}</Caption>
          <p
            className={`mt-1 leading-none ${
              empty
                ? 'text-[13px] font-medium text-muted'
                : 'font-display text-[32px] font-semibold text-ink'
            }`}
          >
            {display}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-accent"
          style={{
            background: `conic-gradient(var(--color-accent) ${pct * 3.6}deg, var(--color-rule) 0deg)`,
          }}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface">
            {empty ? '0' : pct}
          </span>
        </span>
      </div>
    </div>
  )
}

function EmptySavedState() {
  return (
    <div className="rounded-card border border-rule bg-surface/88 p-8 text-center shadow-card sm:p-10">
      <Caption>bảng từ</Caption>
      <p className="mt-3 font-display text-[28px] font-semibold leading-tight text-ink">
        Bảng từ còn trống.
      </p>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">
        Sang <span className="font-semibold text-accent">Tra từ</span>, gõ một từ GRE rồi
        lưu vào bảng để bắt đầu ôn.
      </p>
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
          srs: getSrs(e.word),
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

  if (items.length === 0) return <EmptySavedState />

  const firstTry = Math.round(progress.firstTryAccuracy * 100)
  const tcPct = tc.answered ? Math.round(tc.accuracy * 100) : null
  const dueLabel = dueCount === 1 ? 'Ôn 1 từ đến hạn' : `Ôn ${dueCount} từ đến hạn`

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-card border border-rule bg-surface/88 shadow-card">
        <div className="p-5 sm:p-6">
          <Caption>hôm nay</Caption>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-[34px] font-semibold leading-tight text-ink sm:text-[40px]">
                {dueCount > 0 ? dueLabel : 'Không còn từ đến hạn'}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {dueCount > 0
                  ? `${dueCount} từ đang chờ trong lịch SRS. Làm một phiên ngắn là đủ.`
                  : 'Bạn đã xử lý xong lịch hôm nay. Có thể tra thêm từ mới hoặc quay lại sau.'}
              </p>
            </div>
            <button
              onClick={() => {
                if (dueCount > 0) onStartReview?.()
              }}
              className={`min-h-12 rounded-full px-5 py-3 text-[15px] font-semibold shadow-soft transition ${
                dueCount > 0
                  ? 'bg-grad text-[var(--color-canvas)] hover:translate-y-[-1px] hover:opacity-95'
                  : 'border border-rule bg-canvas text-muted'
              }`}
            >
              {dueCount > 0 ? (
                <>
                  {dueLabel} <span className="ml-1 font-data opacity-80">⏎</span>
                </>
              ) : (
                'Không có từ đến hạn — quay lại sau'
              )}
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-rule">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(100, Math.max(8, (dueCount / Math.max(1, items.length)) * 100))}%` }}
          />
        </div>
      </section>

      {/* ── 2 metric THẬT ── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Nhớ lần đầu" value={progress.totalReviews ? `${firstTry}%` : null} />
        <MetricCard label="Đúng TC" value={tcPct != null ? `${tcPct}%` : null} />
      </div>

      {/* ── Lọc ── */}
      <section className="rounded-card border border-rule bg-surface/70 p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-9 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                filter === f.key
                  ? 'border border-accent bg-accent text-[var(--color-canvas)]'
                  : 'border border-rule bg-canvas/70 text-muted hover:border-accent hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:flex sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm…"
            className="min-h-10 flex-1 rounded-full border border-rule bg-canvas/70 px-4 text-[14px] text-ink outline-none transition focus:border-accent"
          />
          {ankiGate.unlocked ? (
            <button
              onClick={doExport}
              title="Xuất ra file Anki import được"
              className="min-h-10 shrink-0 rounded-full border border-rule px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:border-accent hover:bg-accent-soft"
            >
              Xuất Anki
            </button>
          ) : (
            <span
              title={`Cần ≥ ${ankiGate.items[0].need} từ đã lưu`}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-rule px-3.5 py-1.5 text-[13px] text-muted"
            >
              Xuất Anki ({ankiGate.items[0].have}/{ankiGate.items[0].need})
            </span>
          )}
        </div>
      </section>

      {toast && (
        <p className="mt-3 rounded-2xl border border-rule bg-accent-soft px-4 py-2.5 text-[14px] font-medium text-accent">
          {toast}
        </p>
      )}

      {/* ── Danh sách ── */}
      <ul className="space-y-3">
        {filtered.map((e) => (
          <li
            key={e.word}
            className="group rounded-card border border-rule bg-surface/84 p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent focus-within:border-accent sm:p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-[25px] font-semibold leading-tight text-ink">
                    {e.display || e.word}
                  </span>
                  {(e.part_of_speech || []).length > 0 && (
                    <span className="text-[13px] italic text-muted">
                      {e.part_of_speech.join(', ')}
                    </span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <RegisterChip value={e.register} />
                  {e.connotation && <ConnotationDot value={e.connotation} />}
                  {e.vi_anchor && (
                    <span className="text-[14px] leading-relaxed text-muted">{e.vi_anchor}</span>
                  )}
                </div>
                <div className="mt-3 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-rule">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, Math.max(8, (e.srs.n || 0) * 24))}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {e.leech ? (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[12px] font-semibold"
                    style={{ borderColor: 'var(--color-neg)', color: 'var(--color-neg)' }}
                  >
                    ⚑ hay quên
                  </span>
                ) : e.due ? (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold text-[var(--color-canvas)]">
                    đến hạn
                  </span>
                ) : (
                  <span className="rounded-full border border-rule px-2.5 py-1 text-[12px] text-muted">
                    đã ôn
                  </span>
                )}

                <button
                  onClick={() => onView(e.word)}
                  className="min-h-9 shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent transition hover:bg-accent hover:text-[var(--color-canvas)]"
                >
                  xem
                </button>
                <button
                  onClick={() => onRemove(e.word)}
                  aria-label={`Xóa ${e.word}`}
                  className="min-h-9 shrink-0 rounded-full border border-rule px-3 py-1.5 text-[13px] font-medium text-muted transition hover:border-[var(--color-miss)] hover:text-[var(--color-miss)]"
                >
                  xóa
                </button>
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-card border border-dashed border-rule bg-surface/70 px-5 py-8 text-center text-[14px] text-muted">
            Không có từ khớp bộ lọc.
          </li>
        )}
      </ul>
    </div>
  )
}
