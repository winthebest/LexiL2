// IntensitySpectrum — phần tử SIGNATURE (phổ "nhẹ → gắt").
// Track gradient indigo→violet→hồng = thang cường độ; mỗi từ một chấm sắc thái;
// từ đang học nhấn bằng viên gradient. Đây là lời giải cho việc bản dịch tiếng
// Việt làm sụp đổ sắc thái đồng nghĩa.

import { CONNOTATION } from './ui.jsx'

function connOf(member) {
  const note = (member.note || '').toLowerCase()
  if (note.includes('tiêu cực')) return 'negative'
  if (note.includes('tích cực')) return 'positive'
  return 'neutral'
}

export default function IntensitySpectrum({ cluster, current }) {
  const members = cluster?.members
  if (!members?.length) return null

  const sorted = [...members].sort((a, b) => (a.intensity || 0) - (b.intensity || 0))
  const cur = (current || '').toLowerCase()

  return (
    <figure className="m-0 rounded-2xl border border-rule bg-canvas p-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-grad">
          Cụm “{cluster.theme_vi}”
        </span>
        <span className="font-data text-[12px] text-muted">nhẹ ◁——▷ gắt</span>
      </figcaption>

      {/* Track gradient = thang cường độ */}
      <div
        className="mt-3 h-3 w-full rounded-full"
        style={{
          background:
            'linear-gradient(90deg, #6366f1 0%, #8b5cf6 45%, #c026d3 75%, #f43f5e 100%)',
        }}
        aria-hidden="true"
      />

      <ul className="mt-3 flex list-none justify-between gap-1.5 p-0">
        {sorted.map((m, i) => {
          const isThis = (m.word || '').toLowerCase() === cur
          const conn = CONNOTATION[connOf(m)]
          return (
            <li
              key={i}
              title={m.note || ''}
              className="flex flex-1 flex-col items-center text-center"
            >
              <span
                className={`rounded-full px-2.5 py-1 font-display text-[15px] leading-tight ${
                  isThis
                    ? 'bg-grad font-bold text-white shadow-soft'
                    : 'font-semibold text-ink'
                }`}
              >
                {m.word}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: conn.color }}
                />
                <span className="text-[11px] font-medium text-muted">{conn.label}</span>
              </span>
              <span className="font-data text-[11px] text-muted">{m.register}</span>
              {isThis && (
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-accent">
                  đang học
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
