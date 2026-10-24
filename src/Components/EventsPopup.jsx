import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { REGISTRATIONS, POPUP, getStatus } from '../data/registrations'

const pad = (n) => String(n).padStart(2, '0')

const countdown = (to, now) => {
  const ms = new Date(to) - now
  if (ms <= 0) return '00h 00m 00s'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}h ${pad(m)}m ${pad(s)}s`
}

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// ONLY events whose registration is open right now (link set, not closed)
const getOpen = (now) =>
  REGISTRATIONS.filter((e) => e.showInPopup !== false && getStatus(e, now) === 'open').sort(
    (a, b) => new Date(a.closesAt || '2999-01-01') - new Date(b.closesAt || '2999-01-01')
  )

const signature = (list) => list.map((e) => e.path).join('|')

const ActionButton = ({ url, onClick }) => {
  const cls =
    'shrink-0 rounded-full bg-red-500 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]'
  return url.startsWith('/') ? (
    <Link to={url} onClick={onClick} className={cls}>
      Register ↗
    </Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>
      Register ↗
    </a>
  )
}

export default function EventsPopup() {
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const closeRef = useRef(null)
  const storeKey = `events-popup:${POPUP.version}`

  // decide whether to show (runs once per page load)
  useEffect(() => {
    if (!POPUP.enabled) return
    const open = getOpen(new Date())
    if (!open.length) return // nothing open → no popup, website stays as it is
    try {
      // already dismissed this visit? only show again if a different event opened
      if (POPUP.repeat === 'session' && sessionStorage.getItem(storeKey) === signature(open)) return
    } catch {
      /* storage blocked: just show it */
    }
    const t = setTimeout(() => setVisible(true), POPUP.delayMs)
    return () => clearTimeout(t)
  }, [storeKey])

  // live countdown while visible
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [visible])

  const open = getOpen(now)

  const close = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(storeKey, signature(getOpen(new Date())))
    } catch {
      /* ignore */
    }
  }

  // if the last open event closes while the popup is showing, hide it
  useEffect(() => {
    if (visible && !open.length) setVisible(false)
  }, [visible, open.length])

  // Esc to close, lock scroll, focus the close button
  useEffect(() => {
    if (!visible) return
    const onKey = (e) => e.key === 'Escape' && close()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!POPUP.enabled || !visible || !open.length) return null

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="events-popup-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={close} />

      <div
        className="events-pop relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-red-500/40 bg-neutral-950 text-white"
        style={{ boxShadow: '0 30px 100px rgba(239,68,68,0.35)' }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-red-600/30 blur-[80px]" />

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-red-500 hover:bg-red-500 hover:text-black"
        >
          ✕
        </button>

        <div className="relative px-7 pb-4 pt-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-400">Registrations open</p>
          <h2
            id="events-popup-title"
            className="mt-3 text-4xl font-extrabold uppercase tracking-tight"
            style={{ textShadow: '0 0 40px rgba(239,68,68,0.6)' }}
          >
            {POPUP.title}
          </h2>
        </div>

        <ul className="relative space-y-3 overflow-y-auto px-5 pb-5">
          {open.map((e) => (
            <li key={e.path} className="rounded-2xl border border-white/10 bg-white/4 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                    Open now
                  </span>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{e.name}</h3>
                  {e.tagline && <p className="mt-1 text-sm text-gray-400">{e.tagline}</p>}
                  {e.date && <p className="mt-1 text-xs text-gray-500">{e.date}</p>}
                  {e.closesAt && (
                    <p className="mt-3 text-sm">
                      <span className="font-bold tabular-nums text-red-400">Closes in {countdown(e.closesAt, now)}</span>
                      <span className="block text-xs text-gray-500">{fmt(e.closesAt)}</span>
                    </p>
                  )}
                </div>
                <ActionButton url={e.registrationLink} onClick={close} />
              </div>
            </li>
          ))}
        </ul>

        <div className="relative border-t border-white/10 px-5 py-4 text-center">
          <button
            type="button"
            onClick={close}
            className="text-xs uppercase tracking-[0.2em] text-white/40 transition hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        .events-pop { animation: eventsPop 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes eventsPop {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) { .events-pop { animation: none; } }
      `}</style>
    </div>
  )
}