import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { REGISTRATIONS } from '../data/registrations'

const STORAGE_KEY = 'dyc-registration-popup-dismissed'
const DELAY_MS = 1200

const RegistrationPopup = () => {
  // only events whose registration link is filled in
  const openEvents = useMemo(() => REGISTRATIONS.filter((e) => e.registrationLink), [])
  const [visible, setVisible] = useState(false)
  const closeRef = useRef(null)

  const close = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* storage blocked: popup may show again on next visit */
    }
  }

  // show once per browser session, shortly after the page loads
  useEffect(() => {
    if (openEvents.length === 0) return
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [openEvents.length])

  // Esc closes, page behind doesn't scroll while the popup is open
  useEffect(() => {
    if (!visible) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-popup-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={close} />

      <div
        className="reg-pop relative max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-red-500/30 bg-neutral-950 p-6 md:p-8"
        style={{ boxShadow: '0 40px 120px rgba(239,68,68,0.28)' }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-red-600/30 blur-[80px]" />

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black"
        >
          ✕
        </button>

        <p className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Registrations open
        </p>

        <h2 id="reg-popup-title" className="relative mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white">
          Grab your <span className="text-red-500">spot.</span>
        </h2>

        <ul className="relative mt-6 space-y-3">
          {openEvents.map((e) => (
            <li
              key={e.path}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <Link
                to={e.path}
                onClick={close}
                className="min-w-0 truncate text-base font-bold text-white transition-colors hover:text-red-400"
              >
                {e.name}
              </Link>
              <a
                href={e.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                Register ↗
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={close}
          className="relative mt-6 w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          Maybe later
        </button>
      </div>

      <style>{`
        .reg-pop { animation: regPop 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes regPop {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) { .reg-pop { animation: none; } }
      `}</style>
    </div>
  )
}

export default RegistrationPopup