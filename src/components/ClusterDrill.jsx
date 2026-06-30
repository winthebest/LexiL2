// Pha 2a — drill phân biệt cụm đồng nghĩa (kế hoạch Mục 0.5 + pain #3).
// Tái dùng `synonym_cluster` đã có trong cache — KHÔNG gọi API. Đánh đúng điểm
// yếu L2: dịch tiếng Việt làm sụp sắc thái/register. Câu hỏi: cho một từ trong
// cụm → chọn đúng GHI CHÚ sắc thái của nó giữa các thành viên khác.

import { useMemo, useState } from 'react'
import { listSaved } from '../lib/saved.js'
import { getCached } from '../lib/cache.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Mọi cụm (≥3 thành viên có ghi chú) lấy từ các từ đã lưu còn thẻ trong cache.
function clusters() {
  const seen = new Set()
  const out = []
  for (const e of listSaved()) {
    const c = getCached(e.word)
    const cl = c?.synonym_cluster
    const members = (cl?.members || []).filter((m) => m?.word && m?.note)
    if (members.length < 3) continue
    const key = members.map((m) => m.word.toLowerCase()).sort().join('|')
    if (seen.has(key)) continue // tránh trùng cụm từ nhiều từ cùng họ
    seen.add(key)
    out.push({ theme: cl.theme_vi || '', members })
  }
  return out
}

// Một câu hỏi: target + các lựa chọn ghi chú (xáo trộn).
function buildQuestions() {
  const qs = []
  for (const cl of clusters()) {
    for (const target of cl.members) {
      qs.push({
        theme: cl.theme,
        target,
        options: shuffle(cl.members),
      })
    }
  }
  return shuffle(qs)
}

export default function ClusterDrill() {
  const initial = useMemo(buildQuestions, [])
  const [queue] = useState(initial)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null) // word của ghi chú đã chọn
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })

  const q = queue[idx]
  const done = idx >= queue.length

  if (queue.length === 0) {
    return (
      <p className="text-center text-slate-400">
        Chưa có cụm đồng nghĩa nào để luyện. Lưu vài từ có “cụm đồng nghĩa” (vd
        loquacious, terse, candid) rồi quay lại.
      </p>
    )
  }

  if (done) {
    const pct = queue.length ? Math.round((stats.correct / queue.length) * 100) : 0
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
        <p className="text-lg font-semibold">Xong drill sắc thái 🎯</p>
        <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {stats.correct}/{queue.length}
        </p>
        <p className="text-sm text-slate-500">đúng ({pct}%)</p>
        <button
          onClick={() => {
            setIdx(0)
            setPicked(null)
            setStats({ correct: 0, wrong: 0 })
          }}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Làm lại (xáo trộn)
        </button>
      </div>
    )
  }

  function pick(word) {
    if (picked) return
    setPicked(word)
    const ok = word === q.target.word
    setStats((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      wrong: s.wrong + (ok ? 0 : 1),
    }))
  }

  function next() {
    setIdx((i) => i + 1)
    setPicked(null)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>Câu {idx + 1}/{queue.length}</span>
        <span>✅ {stats.correct} · ❌ {stats.wrong}</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(idx / queue.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <p className="text-sm text-slate-400">Cụm: {q.theme || '(không tên)'}</p>
        <p className="mt-1 text-lg">
          Sắc thái nào đúng với{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{q.target.word}</span>?
        </p>

        <ul className="mt-4 space-y-2">
          {q.options.map((m) => {
            const isTarget = m.word === q.target.word
            const isPicked = picked === m.word
            let cls =
              'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            if (picked) {
              if (isTarget) cls = 'border-green-400 bg-green-50 dark:bg-green-950/40'
              else if (isPicked) cls = 'border-red-400 bg-red-50 dark:bg-red-950/40'
              else cls = 'border-slate-200 dark:border-slate-700 opacity-60'
            }
            return (
              <li key={m.word}>
                <button
                  onClick={() => pick(m.word)}
                  disabled={!!picked}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${cls}`}
                >
                  <span className="text-slate-700 dark:text-slate-200">{m.note}</span>
                  <span className="ml-2 text-xs text-slate-400">({m.register})</span>
                  {picked && isTarget && (
                    <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                      ← {m.word}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {picked && (
          <button
            onClick={next}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Tiếp →
          </button>
        )}
      </div>
    </div>
  )
}
