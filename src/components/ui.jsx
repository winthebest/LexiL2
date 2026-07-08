// Phần tử dùng chung — giữ giao diện nhất quán giữa các màn.
// Quy tắc a11y xuyên suốt: KHÔNG bao giờ chỉ dùng màu → chấm/diamond luôn kèm chữ.

export const CONNOTATION = {
  positive: { color: 'var(--color-pos)', label: 'tích cực' },
  negative: { color: 'var(--color-neg)', label: 'tiêu cực' },
  neutral: { color: 'var(--color-neu)', label: 'trung tính' },
}

/** Nhãn caption: chữ nhỏ, in hoa, giãn chữ. */
export function Caption({ children, className = '' }) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-muted ${className}`}
    >
      {children}
    </span>
  )
}

/** Chấm sắc thái + chữ (connotation). */
export function ConnotationDot({ value, showLabel = true }) {
  const c = CONNOTATION[value] || CONNOTATION.neutral
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: c.color }}
      />
      {showLabel && <span className="text-[13px] font-medium text-muted">{c.label}</span>}
    </span>
  )
}

/** Nhãn register (formal/literary…) — pill viền nhạt. */
export function RegisterChip({ value }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-accent-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent">
      {value}
    </span>
  )
}

/** Chip trung tính (loại từ, trái nghĩa…). */
export function Chip({ children }) {
  return (
    <span className="inline-block rounded-full border border-rule bg-surface px-3 py-1 text-[14px] font-medium text-ink">
      {children}
    </span>
  )
}

/* --- Icon (SVG, không emoji cho phần tử cấu trúc) --- */

export function SpeakerIcon({ playing = false, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {playing ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function BookmarkIcon({ filled = false, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 4h12v16l-6-4-6 4V4Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ExternalIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M6 3h7v7M13 3 7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
