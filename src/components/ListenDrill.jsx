// Drill nghe (docs/scope.md O5, docs/prd.md v2): TTS đọc từ → bạn đoán nghĩa
// → hiện đáp án để gắn "dấu vết âm thanh" với nghĩa. Tự đánh giá nhớ/quên.

import { useEffect, useMemo, useState } from 'react'
import { listSaved } from '../lib/saved.js'
import { getCached } from '../lib/cache.js'
import { say } from '../lib/speech.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListenDrill() {
  const [queue] = useState(() =>
    shuffle(
      listSaved()
        .map((e) => getCached(e.word))
        .filter(Boolean),
    ),
  )
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState({ known: 0, unknown: 0 })

  const total = queue.length
  const card = queue[idx]
  const done = idx >= total

  // Tự đọc từ khi sang câu mới.
  useEffect(() => {
    if (card) say(card.word)
  }, [card])

  const summary = useMemo(() => {
    const seen = stats.known + stats.unknown
    return seen ? Math.round((stats.known / seen) * 100) : 0
  }, [stats])

  function mark(known) {
    setStats((s) => ({
      known: s.known + (known ? 1 : 0),
      unknown: s.unknown + (known ? 0 : 1),
    }))
    setIdx((i) => i + 1)
    setRevealed(false)
  }

  if (total === 0) {
    return (
      <p className="text-center text-slate-400">
        Chưa có từ để nghe. Lưu vài từ (bấm ☆ trên thẻ) rồi quay lại đây.
      </p>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
        <p className="text-lg font-semibold">Xong drill nghe 🎧</p>
        <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {stats.known}/{total}
        </p>
        <p className="text-sm text-slate-500">nhớ được ({summary}%)</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Làm lại
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>Câu {idx + 1}/{total}</span>
        <span>🙂 {stats.known} · 🤔 {stats.unknown}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
        <button
          onClick={() => say(card.word)}
          aria-label="Nghe lại"
          className="text-5xl transition-transform hover:scale-110"
        >
          🔊
        </button>
        <p className="mt-2 text-sm text-slate-400">Nghe và đoán nghĩa…</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Hiện đáp án
          </button>
        ) : (
          <div className="mt-5">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{card.word}</p>
            {card.ipa && <p className="font-mono text-sm text-slate-500">{card.ipa}</p>}
            <p className="mt-2 text-slate-700 dark:text-slate-200">{card.core_meaning_en}</p>
            {card.vi_anchor && <p className="text-sm text-slate-500">→ {card.vi_anchor}</p>}

            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => mark(false)}
                className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
              >
                🤔 Chưa nhớ
              </button>
              <button
                onClick={() => mark(true)}
                className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
              >
                🙂 Nhớ rồi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
