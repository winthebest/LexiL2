// Pha 2b — ngân hàng đề Text Completion (kế hoạch Mục 10).
// Chọn 1 từ đã lưu → generate→verify ra câu TC 1 chỗ trống đã kiểm chứng → tự làm.
// Sai một câu thì từ đó NỔI LẠI ở hàng ôn (grade q=2) và lần sau ra câu khác (10.12).

import { useMemo, useState } from 'react'
import { listSaved } from '../lib/saved.js'
import { getCached } from '../lib/cache.js'
import { grade } from '../lib/srs.js'
import { makeVerifiedQuestion } from '../lib/questions.js'
import {
  addToBank,
  bankCount,
  nextUnseen,
  markSeen,
  removeFromBank,
  logFeedback,
  recordTc,
} from '../lib/bank.js'

// Các từ đã lưu CÒN thẻ trong cache (cần nghĩa/register để ra đề).
function usableWords() {
  return listSaved()
    .map((e) => getCached(e.word))
    .filter((c) => c && c.core_meaning_en)
}

// POOL distractor: vài từ khác cùng độ khó ±1 (kế hoạch 10.8).
function poolFor(card, all) {
  const d = typeof card.difficulty === 'number' ? card.difficulty : 3
  return all
    .filter((c) => c.word !== card.word && Math.abs((c.difficulty ?? 3) - d) <= 1)
    .map((c) => c.word)
    .slice(0, 8)
}

const FLAGS = [
  ['two', 'Hai đáp án đúng'],
  ['easy', 'Quá dễ'],
  ['wrongkey', 'Sai đáp án'],
  ['awkward', 'Câu lủng củng'],
]

export default function QuestionBank() {
  const all = useMemo(usableWords, [])
  const [word, setWord] = useState(all[0]?.word || '')
  const [status, setStatus] = useState('idle') // idle | working | ready | error | failed
  const [step, setStep] = useState('')
  const [entry, setEntry] = useState(null) // { id?, question, verify }
  const [picked, setPicked] = useState(null)
  const [error, setError] = useState('')

  if (all.length === 0) {
    return (
      <p className="text-center text-muted">
        Chưa có từ nào đủ dữ liệu. Lưu vài từ (bấm ☆ trên thẻ) rồi quay lại.
      </p>
    )
  }

  const card = all.find((c) => c.word === word) || all[0]
  const inBank = bankCount(word)

  function reset() {
    setEntry(null)
    setPicked(null)
    setError('')
    setStep('')
  }

  function serveUnseen() {
    reset()
    const e = nextUnseen(word)
    if (e) {
      setEntry(e)
      setStatus('ready')
    } else {
      makeNew()
    }
  }

  async function makeNew() {
    reset()
    setStatus('working')
    const input = {
      word: card.word,
      info: {
        meaning: card.core_meaning_en,
        register: card.register,
        connotation: card.connotation,
      },
      cluster: (card.synonym_cluster?.members || []).map((m) => m.word).filter(Boolean),
      pool: poolFor(card, all),
    }
    try {
      const r = await makeVerifiedQuestion(input, {
        onStep: ({ phase, attempt }) => {
          const map = {
            generate: `Sinh câu (lần ${attempt})…`,
            verify: `Kiểm chứng độc lập (lần ${attempt})…`,
            reject: `Câu lủng — sinh lại (lần ${attempt})…`,
            accept: 'Đạt — câu chỉ có một đáp án.',
          }
          setStep(map[phase] || '')
        },
      })
      if (r.ok) {
        addToBank(word, r.question, r.verify)
        // entry vừa thêm là phần tử cuối trong bank.
        const fresh = nextUnseen(word) || { question: r.question, verify: r.verify }
        setEntry(fresh)
        setStatus('ready')
      } else {
        setStatus('failed')
      }
    } catch (e) {
      setError(e.message || String(e))
      setStatus('error')
    }
  }

  function answer(optId) {
    if (picked || !entry) return
    setPicked(optId)
    const correct = optId === entry.question.intended_answer
    recordTc(correct) // metric #2
    if (entry.id) markSeen(word, entry.id)
    if (!correct) grade(word, 2) // sai → từ nổi lại ở hàng ôn (10.12)
  }

  function flag(code) {
    if (entry?.id) {
      logFeedback(word, entry.id, code)
      // câu rác → loại khỏi bank (10.10).
      if (code === 'two' || code === 'wrongkey' || code === 'awkward') {
        removeFromBank(word, entry.id)
      }
    }
    serveUnseen()
  }

  const q = entry?.question
  const answered = picked != null

  return (
    <div>
      <p className="text-sm text-muted">
        Test khả năng <b>dùng</b> từ trong ngữ cảnh (TC 1 chỗ trống) — sinh rồi
        <b> kiểm chứng độc lập</b> để câu chỉ có đúng một đáp án.
      </p>

      {/* Chọn từ */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={word}
          onChange={(e) => {
            setWord(e.target.value)
            reset()
            setStatus('idle')
          }}
          className="rounded-lg border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
        >
          {all.map((c) => (
            <option key={c.word} value={c.word}>
              {c.word}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">trong bank: {inBank} câu</span>
        <button
          onClick={inBank > 0 ? serveUnseen : makeNew}
          disabled={status === 'working'}
          className="ml-auto rounded-full bg-grad px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {status === 'working' ? 'Đang dựng…' : inBank > 0 ? 'Câu chưa gặp' : 'Tạo câu (generate→verify)'}
        </button>
        <button
          onClick={makeNew}
          disabled={status === 'working'}
          className="rounded-full border border-rule px-3 py-2 text-sm text-ink hover:bg-canvas disabled:opacity-50"
        >
          Tạo câu mới
        </button>
      </div>

      {/* Trạng thái dựng */}
      {status === 'working' && (
        <div className="mt-5 rounded-card border border-rule bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3 text-muted">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
            {step || 'Đang dựng câu…'}
          </div>
          <p className="mt-2 text-xs text-muted">
            generator (qwen3.7-plus) → verifier (qwen3.7-max, context sạch). Có thể sinh lại tối đa 3 lần.
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-800 dark:text-amber-200">
          Sinh 3 lần vẫn chưa ra câu “một đáp án sạch” cho từ này. Bỏ qua trong lô —
          thử lại sau hoặc chọn từ khác (đã log để chỉnh prompt).
          <button onClick={makeNew} className="mt-2 block rounded bg-amber-600 px-3 py-1.5 text-sm text-white">
            Thử lại
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-5 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">
          <p className="font-medium">Có lỗi xảy ra</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Câu hỏi */}
      {status === 'ready' && q && (
        <div className="mt-5 rounded-card border border-rule bg-surface p-5 shadow-card">
          <p className="text-lg leading-relaxed text-ink">
            {q.sentence.split('____').map((seg, i, arr) => (
              <span key={i}>
                {seg}
                {i < arr.length - 1 && (
                  <span className="mx-1 inline-block min-w-16 border-b-2 border-accent text-center align-baseline">
                    {answered ? q.options.find((o) => o.id === q.intended_answer)?.word : '____'}
                  </span>
                )}
              </span>
            ))}
          </p>

          <ul className="mt-4 space-y-2">
            {q.options.map((o) => {
              const isKey = o.id === q.intended_answer
              const isPicked = picked === o.id
              let cls = 'border-rule hover:border-accent'
              if (answered) {
                if (isKey) cls = 'border-green-400 bg-green-50 dark:bg-green-950/40'
                else if (isPicked) cls = 'border-red-400 bg-red-50 dark:bg-red-950/40'
                else cls = 'border-rule opacity-60'
              }
              return (
                <li key={o.id}>
                  <button
                    onClick={() => answer(o.id)}
                    disabled={answered}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${cls}`}
                  >
                    <span className="mr-2 font-mono text-sm text-muted">{o.id}</span>
                    {o.word}
                  </button>
                </li>
              )
            })}
          </ul>

          {answered && (
            <div className="mt-4">
              <p
                className={`font-medium ${
                  picked === q.intended_answer
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {picked === q.intended_answer
                  ? '✅ Chính xác'
                  : `❌ Đáp án đúng: ${q.intended_answer} (${q.options.find((o) => o.id === q.intended_answer)?.word}). Từ này sẽ nổi lại ở hàng ôn.`}
              </p>
              {q.rationale && (
                <p className="mt-1 text-sm text-muted">Vì sao: {q.rationale}</p>
              )}

              {/* Phản hồi chất lượng (Mục 10.10) */}
              <p className="mt-4 text-xs text-muted">Câu này có vấn đề? (lọc khỏi bank + chỉnh prompt)</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {FLAGS.map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => flag(code)}
                    className="rounded-full border border-rule px-3 py-1 text-xs text-muted hover:bg-canvas"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={serveUnseen}
                  className="ml-auto rounded-full bg-grad px-3 py-1.5 text-sm text-white hover:opacity-95"
                >
                  Câu tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
