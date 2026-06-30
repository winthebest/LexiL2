// App — vỏ chung + Enricher (ENCODE). Điều hướng giữa các màn theo pha.
// Triết lý: mỗi màn phải bắt người dùng NHỚ LẠI, không mời họ ĐỌC LẠI.

import { useEffect, useRef, useState } from 'react'
import WordCard from './components/WordCard.jsx'
import MobileTabBar from './components/MobileTabBar.jsx'
import SavedList from './components/SavedList.jsx'
import Review from './components/Review.jsx'
import PassageMaker from './components/PassageMaker.jsx'
import ListenDrill from './components/ListenDrill.jsx'
import ClusterDrill from './components/ClusterDrill.jsx'
import QuestionBank from './components/QuestionBank.jsx'
import GateNotice from './components/GateNotice.jsx'
import SyncSettings from './components/SyncSettings.jsx'
import { Caption } from './components/ui.jsx'
import { pullIfRemoteNewer } from './lib/cloudSync.js'
import { evalGate } from './lib/gates.js'
import { enrichWord } from './lib/enrichWord.js'
import { getCached } from './lib/cache.js'
import { listSaved, isSaved, toggleSaved, removeSaved as removeSavedWord } from './lib/saved.js'
import { removeSrs } from './lib/srs.js'
import loquaciousFixture from './fixtures/loquacious.json'

function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light',
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('gre-l2:theme', theme)
    } catch {
      /* bỏ qua */
    }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

function SunMoon({ theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="h-1.5 w-full bg-grad opacity-40" />
      <div className="p-7">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-rule" />
        <div className="mt-5 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-rule pt-4">
              <div className="h-4 w-36 animate-pulse rounded bg-rule" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('saved')
  const [word, setWord] = useState('')
  const [status, setStatus] = useState('idle')
  const [card, setCard] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(() => listSaved())
  const [theme, toggleTheme] = useTheme()
  const inputRef = useRef(null)

  const cardSaved = card ? isSaved(card.word) : false
  const clusterLocked = !evalGate('cluster').unlocked
  const bankLocked = !evalGate('bank').unlocked

  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && view === 'enricher' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  useEffect(() => {
    let cancelled = false
    async function pull() {
      try {
        const r = await pullIfRemoteNewer()
        if (!cancelled && r.pulled) window.location.reload()
      } catch (e) {
        console.warn('[gre-l2 sync] auto pull failed:', e)
      }
    }
    pull()
    function onVisible() {
      if (document.visibilityState === 'visible') pull()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  async function run(w) {
    const qq = (w ?? word).trim()
    if (!qq) return
    setStatus('loading')
    setError('')
    try {
      const { data, fromCache } = await enrichWord(qq)
      setCard(data)
      setFromCache(fromCache)
      setStatus('success')
    } catch (e) {
      setError(e.message || String(e))
      setStatus('error')
    }
  }

  function showDemo() {
    setWord(loquaciousFixture.word)
    setCard(loquaciousFixture)
    setFromCache(false)
    setError('')
    setStatus('success')
    setView('enricher')
  }

  function onToggleSave() {
    if (!card) return
    const { list } = toggleSaved(card)
    setSaved(list)
  }

  function viewSaved(w) {
    const cached = getCached(w)
    setView('enricher')
    if (cached) {
      setWord(cached.word)
      setCard(cached)
      setFromCache(true)
      setStatus('success')
    } else {
      setWord(w)
      run(w)
    }
  }

  function removeSaved(w) {
    removeSrs(w)
    setSaved(removeSavedWord(w))
  }

  const navBtn = (id, label, { locked = false } = {}) => (
    <button
      onClick={() => setView(id)}
      className={`rounded-full px-4 py-2 text-[14px] font-bold transition ${
        view === id
          ? 'bg-grad text-white shadow-soft'
          : 'text-muted hover:bg-accent-soft hover:text-accent'
      }`}
    >
      {locked && <span className="mr-1 text-[11px]">🔒</span>}
      {label}
    </button>
  )

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* pt-screen + pb-tabbar: chừa notch ở trên và thanh tab ở dưới (mobile);
          desktop/tablet override bằng sm:* về padding thường. */}
      <div className="mx-auto max-w-[660px] px-4 pt-screen pb-tabbar sm:px-6 sm:pt-9 sm:pb-9">
        {/* ── Đầu trang ── */}
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold tracking-tight sm:text-[28px]">
              <span className="text-grad">GRE</span>
              <span className="text-ink"> Vocab L2</span>
            </h1>
            <p className="mt-0.5 hidden text-[14px] text-muted sm:block">
              Gõ một từ → AI dựng thẻ từ tươi mới, tối ưu cho người Việt.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Sang nền sáng' : 'Sang nền tối'}
            title="Đổi nền sáng/tối"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rule bg-surface text-muted shadow-card hover:text-accent"
          >
            <SunMoon theme={theme} />
          </button>
        </header>

        {/* ── Điều hướng (desktop/tablet) — mobile dùng MobileTabBar dưới đáy ── */}
        <nav className="mt-7 hidden flex-wrap items-center gap-1.5 sm:flex">
          {navBtn('saved', `Bảng từ${saved.length ? ` (${saved.length})` : ''}`)}
          {navBtn('enricher', 'Tra từ')}
          {navBtn('review', 'Ôn tập')}
          <span className="mx-1 h-5 w-px bg-rule" />
          {navBtn('cluster', 'Phân biệt', { locked: clusterLocked })}
          {navBtn('bank', 'Ngân hàng đề', { locked: bankLocked })}
          {navBtn('passage', 'Đoạn văn')}
          {navBtn('listen', 'Drill nghe')}
          {navBtn('sync', 'Đồng bộ')}
        </nav>

        <main className="mt-8">
          {view === 'enricher' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run()
                }}
                className="flex gap-2.5"
              >
                <input
                  ref={inputRef}
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Gõ một từ GRE…  (vd: loquacious)"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="flex-1 rounded-2xl border-2 border-rule bg-surface px-4 py-3.5 font-display text-[18px] text-ink shadow-card outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !word.trim()}
                  className="rounded-2xl bg-grad px-6 py-3.5 text-[16px] font-bold text-white shadow-soft transition hover:opacity-95 disabled:opacity-40"
                >
                  {status === 'loading' ? 'Đang tra…' : 'Enrich ⏎'}
                </button>
              </form>

              <button
                onClick={showDemo}
                className="mt-2.5 text-[13px] font-semibold text-muted hover:text-accent"
              >
                Xem thẻ mẫu (offline)
              </button>

              <div className="mt-7">
                {status === 'idle' && (
                  <div className="rounded-card border-2 border-dashed border-rule bg-surface p-10 text-center">
                    <Caption>màn trống</Caption>
                    <p className="mt-2.5 font-display text-[20px] font-bold text-ink">
                      Gõ một từ GRE để xem thẻ.
                    </p>
                    <p className="mt-1.5 text-[14px] text-muted">
                      Nhấn <span className="font-data">/</span> để nhảy vào ô nhập.
                    </p>
                  </div>
                )}

                {status === 'loading' && <SkeletonCard />}

                {status === 'error' && (
                  <div className="rounded-card border border-rule bg-surface p-6 shadow-card">
                    <p className="text-[17px] font-bold text-ink">Không tạo được thẻ.</p>
                    <p className="mt-1 text-[14px] text-muted">{error}</p>
                    <button
                      onClick={() => run()}
                      className="mt-4 rounded-full border-2 border-accent px-4 py-2 text-[14px] font-bold text-accent hover:bg-accent-soft"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {status === 'success' && (
                  <WordCard
                    data={card}
                    fromCache={fromCache}
                    saved={cardSaved}
                    onToggleSave={onToggleSave}
                    mode="encode"
                  />
                )}
              </div>
            </>
          )}

          {view === 'saved' && (
            <SavedList
              items={saved}
              onView={viewSaved}
              onRemove={removeSaved}
              onStartReview={() => setView('review')}
            />
          )}

          {view === 'review' && <Review onExit={() => setView('saved')} />}

          {view === 'cluster' && (
            <GateNotice gate={evalGate('cluster')}>
              <ClusterDrill />
            </GateNotice>
          )}

          {view === 'bank' && (
            <GateNotice gate={evalGate('bank')}>
              <QuestionBank />
            </GateNotice>
          )}

          {view === 'passage' && <PassageMaker />}

          {view === 'listen' && <ListenDrill />}

          {view === 'sync' && <SyncSettings />}
        </main>
      </div>

      {/* ── Thanh điều hướng đáy (chỉ mobile) ── */}
      <MobileTabBar
        view={view}
        setView={setView}
        locks={{ cluster: clusterLocked, bank: bankLocked }}
      />
    </div>
  )
}
