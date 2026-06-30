// Máy chế tạo đoạn văn ngữ cảnh (docs/scope.md O4, docs/prd.md v2).
// Chọn vài từ đã lưu → Qwen viết 1 đoạn văn nhồi đủ các từ → tô sáng từ đích.

import { useMemo, useState } from 'react'
import { listSaved } from '../lib/saved.js'
import { isDue } from '../lib/srs.js'
import { generatePassage } from '../lib/passage.js'

const MAX_DEFAULT = 4

// Tách đoạn văn theo dấu [[...]] để tô sáng từ đích.
function renderPassage(text) {
  const parts = String(text || '').split(/(\[\[.*?\]\])/g)
  return parts.map((p, i) => {
    const m = p.match(/^\[\[(.*?)\]\]$/)
    if (m) {
      return (
        <mark
          key={i}
          className="rounded bg-yellow-200 px-0.5 font-medium text-slate-900 dark:bg-yellow-500/40 dark:text-yellow-100"
        >
          {m[1]}
        </mark>
      )
    }
    return <span key={i}>{p}</span>
  })
}

export default function PassageMaker() {
  const saved = useMemo(() => listSaved(), [])
  const [level, setLevel] = useState('B1')
  const [selected, setSelected] = useState(() => {
    const due = saved.filter((e) => isDue(e.word)).map((e) => e.word)
    const pick = (due.length ? due : saved.map((e) => e.word)).slice(0, MAX_DEFAULT)
    return new Set(pick)
  })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function toggle(word) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(word) ? next.delete(word) : next.add(word)
      return next
    })
  }

  async function run() {
    const words = [...selected]
    if (words.length < 2) return
    setStatus('loading')
    setError('')
    try {
      const data = await generatePassage(words, level)
      setResult(data)
      setStatus('success')
    } catch (e) {
      setError(e.message || String(e))
      setStatus('error')
    }
  }

  if (saved.length === 0) {
    return (
      <p className="text-center text-slate-400">
        Chưa có từ nào. Lưu vài từ (bấm ☆ trên thẻ) rồi quay lại đây.
      </p>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        Chọn từ (≥2) để AI viết một đoạn văn ngắn nhồi đủ các từ đó — củng cố từ hiếm trong ngữ cảnh.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {saved.map((e) => {
          const on = selected.has(e.word)
          return (
            <button
              key={e.word}
              onClick={() => toggle(e.word)}
              className={`rounded-full border px-3 py-1 text-sm ${
                on
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              {e.display || e.word}
              {isDue(e.word) && <span className="ml-1 text-xs opacity-70">•đến hạn</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-slate-500">Trình độ:</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
        >
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
        </select>
        <span className="text-sm text-slate-400">đã chọn {selected.size}</span>
        <button
          onClick={run}
          disabled={selected.size < 2 || status === 'loading'}
          className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Đang viết…' : 'Tạo đoạn văn'}
        </button>
      </div>

      <div className="mt-6">
        {status === 'error' && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">
            <p className="font-medium">Có lỗi xảy ra</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={run}
              className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && result && (
          <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            {result.title_vi && (
              <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
                {result.title_vi}
              </h3>
            )}
            <p className="leading-relaxed text-slate-700 dark:text-slate-200">
              {renderPassage(result.passage)}
            </p>
          </article>
        )}
      </div>
    </div>
  )
}
