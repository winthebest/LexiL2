// Thanh điều hướng dưới đáy kiểu iOS — chỉ hiện trên mobile (sm:hidden).
// Thiết kế cho iPhone 12 Pro Max (430×932): target chạm ≥ 44px, tôn trọng
// safe-area (home indicator), 4 tab chính + "Thêm" mở bottom sheet cho phần dư.
// Desktop/tablet vẫn dùng thanh pill ở trên (App.jsx) → hai cách, không trùng.

import { useEffect, useState } from 'react'

/* ── Icon (SVG, stroke theo currentColor) ── */
function LibraryIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 4h5v16H5zM14 4h5v16h-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}
function SearchIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function ReviewIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 11a8 8 0 0 1 13.7-5.3L20 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v4h-4M20 13a8 8 0 0 1-13.7 5.3L4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function FlashcardIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 9h7M8.5 12.5H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.5 17.5 19 15l-2.5-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ScaleIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 5a3 3 0 0 0 5 0L5 8ZM19 8l-2.5 5a3 3 0 0 0 5 0L19 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="4.5" r="1.4" fill="currentColor" />
    </svg>
  )
}
function MoreIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
    </svg>
  )
}
function BankIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function CollocationIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 8.5h5.5a3.5 3.5 0 0 1 0 7H11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 8.5h-1.5a3.5 3.5 0 0 0 0 7H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function PassageIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4h7l4 4v12H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 4v4h4M9.5 13h5M9.5 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function ListenIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 5 6 8.5H3.5v7H6L10 19V5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14 9.5a3.5 3.5 0 0 1 0 5M16.5 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function SyncIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 11a7 7 0 0 1 11.9-5L18 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4v4h-4M20 13a7 7 0 0 1-11.9 5L6 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 20v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IpaIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5.5h14v13H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 9h3M9.5 9v6M14 9.5c2.5 0 2.5 4 0 4h-1.5M16.5 9.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PRIMARY = [
  { id: 'saved', label: 'Bảng từ', Icon: LibraryIcon },
  { id: 'review', label: 'Ôn tập', Icon: ReviewIcon },
  { id: 'flashcards', label: 'Flashcard', Icon: FlashcardIcon },
  { id: 'enricher', label: 'Tra từ', Icon: SearchIcon },
]

const MORE = [
  { id: 'cluster', label: 'Phân biệt', Icon: ScaleIcon, lockKey: 'cluster' },
  { id: 'collocations', label: 'Cụm từ', Icon: CollocationIcon },
  { id: 'bank', label: 'Ngân hàng đề', Icon: BankIcon, lockKey: 'bank' },
  { id: 'passage', label: 'Đoạn văn', Icon: PassageIcon },
  { id: 'listen', label: 'Drill nghe', Icon: ListenIcon },
  { id: 'ipa', label: 'Bảng IPA', Icon: IpaIcon },
  { id: 'sync', label: 'Đồng bộ', Icon: SyncIcon },
]

function TabButton({ active, label, Icon, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 transition ${
        active ? 'text-accent' : 'text-muted active:bg-canvas'
      }`}
    >
      <span className="relative">
        <Icon />
        {locked && (
          <span className="absolute -right-3 -top-1 rounded-full border border-rule bg-surface px-1 text-[8px] font-semibold uppercase leading-tight text-muted">
            Pro
          </span>
        )}
      </span>
      <span className="text-[10.5px] font-medium leading-none">{label}</span>
    </button>
  )
}

export default function MobileTabBar({ view, setView, locks = {} }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = MORE.some((m) => m.id === view)

  // Khóa cuộn nền khi sheet mở.
  useEffect(() => {
    if (!moreOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [moreOpen])

  function go(id) {
    setView(id)
    setMoreOpen(false)
  }

  return (
    <div className="sm:hidden">
      {/* ── Bottom sheet "Thêm" ── */}
      {moreOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            aria-label="Đóng"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <div className="inset-bottom absolute inset-x-0 bottom-0 rounded-t-card border-t border-rule bg-surface p-3 shadow-soft">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-rule" />
            <p className="px-2 pb-1 pt-1 text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">
              Thêm
            </p>
            <div className="grid gap-1">
              {MORE.map(({ id, label, Icon, lockKey }) => {
                const active = view === id
                const locked = lockKey ? locks[lockKey] : false
                return (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-4 text-left transition ${
                      active ? 'bg-accent-soft text-accent' : 'text-ink active:bg-canvas'
                    }`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span className="flex-1 text-[16px] font-semibold">{label}</span>
                    {locked && (
                      <span className="rounded-full border border-rule px-2 py-0.5 text-[11px] font-semibold uppercase text-muted">
                        Pro
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Thanh tab cố định đáy ── */}
      <nav className="inset-bottom fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/96 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-[660px] items-stretch gap-0.5 px-1.5 pt-1">
          {PRIMARY.map(({ id, label, Icon, lockKey }) => (
            <TabButton
              key={id}
              active={view === id}
              label={label}
              Icon={Icon}
              locked={lockKey ? locks[lockKey] : false}
              onClick={() => go(id)}
            />
          ))}
          <TabButton
            active={moreActive}
            label="Thêm"
            Icon={MoreIcon}
            onClick={() => setMoreOpen((v) => !v)}
          />
        </div>
      </nav>
    </div>
  )
}
