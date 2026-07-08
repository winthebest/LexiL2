import { useMemo, useState } from 'react'
import { getCached } from '../lib/cache.js'
import { Caption, RegisterChip } from './ui.jsx'

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function collectCollocations(items) {
  return items.flatMap((entry) => {
    const card = getCached(entry.word)
    const collocations = Array.isArray(card?.collocations) ? card.collocations : []
    return collocations.map((c, index) => ({
      id: `${entry.word}:${index}:${c.phrase || ''}`,
      sourceWord: entry.word,
      sourceDisplay: card?.word || entry.display || entry.word,
      sourceVi: card?.vi_anchor || entry.vi_anchor || '',
      difficulty: card?.difficulty ?? entry.difficulty ?? null,
      phrase: c.phrase || '',
      pattern: c.pattern || '',
      vi: c.vi || '',
      example: c.example || '',
      note: c.note || '',
      register: c.register || '',
    }))
  })
}

function Highlight({ text, needle }) {
  if (!text || !needle) return text || null
  const safeNeedle = String(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = String(text).split(new RegExp(`(${safeNeedle})`, 'i'))
  return parts.map((part, i) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={i} className="rounded bg-accent-soft px-0.5 font-semibold text-accent">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function SelectFilter({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 sm:min-w-[140px] sm:flex-1">
      <Caption>{label}</Caption>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-2xl border border-rule bg-surface px-3 text-[13px] font-semibold text-ink outline-none focus:border-accent sm:text-[14px]"
      >
        <option value="all">Tất cả</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function EmptyState({ hasSavedWords, hasCollocations }) {
  const title = !hasSavedWords
    ? 'Chưa có từ đã lưu.'
    : !hasCollocations
      ? 'Chưa có collocations trong các từ đã lưu.'
      : 'Không có cụm khớp bộ lọc.'
  const body = !hasSavedWords
    ? 'Lưu vài WordCard trước, rồi quay lại đây để xem bảng cụm.'
    : !hasCollocations
      ? 'Các thẻ cũ có thể chưa có field mới; tra lại từ hoặc dùng thẻ mới để bổ sung.'
      : 'Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.'

  return (
    <div className="rounded-card border border-rule bg-surface p-8 text-center shadow-card">
      <p className="font-display text-[20px] font-medium text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-muted">{body}</p>
    </div>
  )
}

export default function CollocationBank({ items, onViewWord }) {
  const [q, setQ] = useState('')
  const [pattern, setPattern] = useState('all')
  const [register, setRegister] = useState('all')
  const [sourceWord, setSourceWord] = useState('all')
  const [openWords, setOpenWords] = useState(() => new Set())

  const rows = useMemo(() => collectCollocations(items), [items])
  const patterns = useMemo(() => uniq(rows.map((r) => r.pattern)), [rows])
  const registers = useMemo(() => uniq(rows.map((r) => r.register)), [rows])
  const sourceWords = useMemo(() => uniq(rows.map((r) => r.sourceDisplay)), [rows])

  const filtered = useMemo(() => {
    const needle = normalizeText(q)
    return rows.filter((row) => {
      if (pattern !== 'all' && row.pattern !== pattern) return false
      if (register !== 'all' && row.register !== register) return false
      if (sourceWord !== 'all' && row.sourceDisplay !== sourceWord) return false
      if (!needle) return true
      return [
        row.phrase,
        row.pattern,
        row.vi,
        row.example,
        row.note,
        row.sourceDisplay,
        row.sourceVi,
      ].some((value) => normalizeText(value).includes(needle))
    })
  }, [rows, q, pattern, register, sourceWord])

  const groups = useMemo(() => {
    const map = new Map()
    for (const row of filtered) {
      const key = row.sourceWord
      if (!map.has(key)) {
        map.set(key, {
          sourceWord: row.sourceWord,
          sourceDisplay: row.sourceDisplay,
          sourceVi: row.sourceVi,
          difficulty: row.difficulty,
          rows: [],
        })
      }
      map.get(key).rows.push(row)
    }
    return [...map.values()].sort((a, b) => a.sourceDisplay.localeCompare(b.sourceDisplay))
  }, [filtered])

  const hasSavedWords = items.length > 0
  const hasCollocations = rows.length > 0

  function resetFilters() {
    setQ('')
    setPattern('all')
    setRegister('all')
    setSourceWord('all')
  }

  function toggleWord(word) {
    setOpenWords((current) => {
      const next = new Set(current)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  return (
    <div>
      <div className="rounded-card border border-rule bg-surface p-4 shadow-card sm:p-5">
        <div className="grid gap-3">
          <div>
            <Caption>Tìm cụm</Caption>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm cụm, nghĩa, ví dụ…"
              className="mt-1 h-11 w-full rounded-2xl border border-rule bg-canvas px-4 text-[15px] text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <SelectFilter label="Pattern" value={pattern} options={patterns} onChange={setPattern} />
            <SelectFilter label="Register" value={register} options={registers} onChange={setRegister} />
            <label className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 sm:min-w-[140px] sm:flex-1">
              <Caption>Từ gốc</Caption>
              <select
                value={sourceWord}
                onChange={(e) => setSourceWord(e.target.value)}
                className="h-10 w-full rounded-2xl border border-rule bg-surface px-3 text-[13px] font-semibold text-ink outline-none focus:border-accent sm:text-[14px]"
              >
                <option value="all">Tất cả</option>
                {sourceWords.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="col-span-2 h-10 rounded-2xl border border-rule px-4 text-[14px] font-semibold text-muted transition hover:bg-canvas hover:text-ink sm:col-span-1"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-bold text-accent">
            {filtered.length}/{rows.length} cụm
          </span>
          <span className="text-[13px] text-muted">
            {items.length} từ đã lưu · {patterns.length} pattern
          </span>
        </div>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState hasSavedWords={hasSavedWords} hasCollocations={hasCollocations} />
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => {
              const open = openWords.has(group.sourceWord)
              return (
              <li
                key={group.sourceWord}
                className="rounded-card border border-rule bg-surface p-3.5 shadow-card sm:p-4"
              >
                <div className="grid gap-3 sm:flex sm:items-start">
                  <button
                    type="button"
                    onClick={() => toggleWord(group.sourceWord)}
                    aria-expanded={open}
                    className="min-w-0 text-left sm:flex-1"
                  >
                    <p className="break-words font-display text-[21px] font-semibold leading-snug text-ink sm:text-[22px]">
                      <Highlight text={group.sourceDisplay} needle={q.trim()} />
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">
                        {group.rows.length} cụm
                      </span>
                      {typeof group.difficulty === 'number' && (
                        <span className="text-[12px] font-semibold text-muted">
                          khó {group.difficulty}/5
                        </span>
                      )}
                      {group.sourceVi && (
                        <span className="text-[13px] text-muted">{group.sourceVi}</span>
                      )}
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleWord(group.sourceWord)}
                      className="min-h-10 rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent transition hover:bg-grad hover:text-white sm:min-h-0 sm:py-1.5"
                    >
                      {open ? 'Ẩn cụm' : 'Xem cụm'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewWord?.(group.sourceWord)}
                      className="min-h-10 rounded-full border border-rule px-3 py-2 text-[13px] font-semibold text-ink transition hover:bg-canvas hover:text-accent sm:min-h-0 sm:py-1.5"
                    >
                      Mở thẻ
                    </button>
                  </div>
                </div>

                {open && (
                  <ul className="mt-3 space-y-2.5 border-t border-rule pt-3 sm:mt-4 sm:pt-4">
                    {group.rows.map((row) => (
                      <li key={row.id} className="rounded-2xl bg-canvas p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words font-display text-[16px] font-medium text-ink sm:text-[17px]">
                            <Highlight text={row.phrase} needle={q.trim()} />
                          </p>
                          {row.pattern && (
                            <span className="rounded-full bg-accent-soft px-2.5 py-1 font-data text-[12px] font-semibold text-accent">
                              {row.pattern}
                            </span>
                          )}
                          <RegisterChip value={row.register} />
                        </div>

                        {row.vi && (
                          <p className="mt-2 text-[15px] font-medium text-muted">{row.vi}</p>
                        )}
                        {row.example && (
                          <p className="mt-2 text-[15px] italic leading-relaxed text-ink">
                            “<Highlight text={row.example} needle={q.trim()} />”
                          </p>
                        )}
                        {row.note && <p className="mt-1.5 text-[14px] text-muted">{row.note}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
