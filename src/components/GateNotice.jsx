// Banner "cổng điều kiện" tái dùng (kế hoạch Mục 0.5).
// - Đủ điều kiện → render thẳng tính năng (children).
// - Chưa đủ → hiện checklist have/need + lý do, KHÓA tính năng; vẫn cho "Xem thử"
//   (bỏ qua điều kiện) — giống nút "Xem thẻ mẫu" — để bạn xem được cái mình vừa
//   build, nhưng kèm cảnh báo rõ là đang đi trước lộ trình.

import { useState } from 'react'

function Bar({ have, need }) {
  const pct = Math.min(100, Math.round((have / need) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-rule">
      <div
        className={`h-full transition-all ${have >= need ? 'bg-[var(--color-ok)]' : 'bg-accent'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function GateNotice({ gate, children }) {
  const [preview, setPreview] = useState(false)

  if (gate.unlocked || preview) {
    return (
      <>
        {!gate.unlocked && preview && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <span>⚠ Đang xem thử khi <b>chưa mở khóa</b> — bạn đang đi trước lộ trình.</span>
            <button
              onClick={() => setPreview(false)}
              className="shrink-0 rounded px-2 py-0.5 font-medium hover:bg-amber-100 dark:hover:bg-amber-900"
            >
              khóa lại
            </button>
          </div>
        )}
        {children}
      </>
    )
  }

  return (
    <div className="rounded-card border border-rule bg-surface p-6 shadow-card">
      <p className="text-lg font-semibold">🔒 {gate.label} — chưa mở khóa</p>
      {gate.why && <p className="mt-1 text-sm text-slate-500">{gate.why}</p>}

      <ul className="mt-4 space-y-3">
        {gate.items.map((it) => (
          <li key={it.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                {it.ok ? '✅' : '⏳'} {it.label}
              </span>
              <span className={it.ok ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}>
                {it.have}/{it.need} {it.unit}
              </span>
            </div>
            <Bar have={it.have} need={it.need} />
          </li>
        ))}
      </ul>

      <button
        onClick={() => setPreview(true)}
        className="mt-5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        Xem thử (bỏ qua điều kiện) →
      </button>
    </div>
  )
}
