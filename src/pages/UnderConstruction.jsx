import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const LINES = [
  'Laying the foundation...',
  'Wiring up the lights...',
  'Polishing every detail...',
  'Rehearsing opening night...',
]

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Types a line, holds it, deletes it, then moves to the next.
const useTypewriter = (lines) => {
  const [text, setText] = useState('')
  useEffect(() => {
    if (reduced()) {
      setText(lines[0])
      return
    }
    let li = 0
    let ci = 0
    let dir = 1
    let t
    const tick = () => {
      const line = lines[li]
      ci += dir
      setText(line.slice(0, ci))
      let wait = dir === 1 ? 55 : 28
      if (dir === 1 && ci === line.length) {
        dir = -1
        wait = 1400
      } else if (dir === -1 && ci === 0) {
        dir = 1
        li = (li + 1) % lines.length
        wait = 400
      }
      t = setTimeout(tick, wait)
    }
    t = setTimeout(tick, 500)
    return () => clearTimeout(t)
  }, [lines])
  return text
}

// Climbs fast, slows down, and stops just short of done.
const useProgress = () => {
  const [p, setP] = useState(reduced() ? 72 : 0)
  useEffect(() => {
    if (reduced()) return
    const i = setInterval(() => setP((v) => (v >= 94 ? v : v + (v < 60 ? 2 : 1))), 120)
    return () => clearInterval(i)
  }, [])
  return p
}

// Scrolling hazard-tape ribbon.
const Ribbon = ({ reverse = false, className = '' }) => {
  const row = Array.from({ length: 8 })
  return (
    <div aria-hidden="true" className={`uc-ribbon ${className}`}>
      <div className={`uc-track ${reverse ? 'uc-track-rev' : ''}`}>
        {[...row, ...row].map((_, i) => (
          <span key={i} className="uc-tape-item">
            Under construction <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  )
}

const Gear = ({ className = '', reverse = false }) => (
  <svg
    viewBox="0 0 100 100"
    aria-hidden="true"
    className={`uc-gear ${reverse ? 'uc-gear-rev' : ''} ${className}`}
    fill="none"
    stroke="currentColor"
  >
    <circle cx="50" cy="50" r="38" strokeWidth="14" strokeDasharray="9 9.9" />
    <circle cx="50" cy="50" r="30" strokeWidth="5" />
    <circle cx="50" cy="50" r="10" strokeWidth="5" />
  </svg>
)

const UnderConstruction = ({ page = 'This page' }) => {
  const spot = useRef(null)
  const typed = useTypewriter(LINES)
  const progress = useProgress()

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !spot.current) return
    spot.current.style.setProperty('--sx', `${e.clientX}px`)
    spot.current.style.setProperty('--sy', `${e.clientY}px`)
  }

  return (
    <div
      onPointerMove={onMove}
      className="uc-root relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#070606] px-5 py-32 text-white"
    >
      {/* blueprint grid + glow + cursor light */}
      <div aria-hidden="true" className="uc-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_50%,rgba(220,38,38,0.22),transparent_70%)]"
      />
      <div ref={spot} aria-hidden="true" className="uc-spot pointer-events-none absolute inset-0" />

      {/* hazard tape crossing the screen */}
      <Ribbon className="uc-ribbon-a" />
      <Ribbon reverse className="uc-ribbon-b" />

      {/* turning gears */}
      <Gear className="absolute -left-10 bottom-10 h-44 w-44 text-red-500/20 md:left-16 md:h-64 md:w-64" />
      <Gear reverse className="absolute -right-8 top-28 h-36 w-36 text-white/10 md:right-20 md:h-52 md:w-52" />

      <main className="relative z-10 w-full max-w-4xl text-center">
        <p className="uc-rise mb-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.35em] text-red-400">
          <span className="h-px w-10 bg-red-500" />
          {page} · coming soon
          <span className="h-px w-10 bg-red-500" />
        </p>

        <h1 className="uc-font uc-rise uppercase leading-[0.95]" style={{ animationDelay: '120ms' }}>
          <span className="uc-outline block text-[clamp(2.6rem,10vw,7rem)]">Under</span>
          <span className="uc-red block whitespace-nowrap text-[clamp(1.7rem,8.2vw,6.2rem)]">Construction</span>
        </h1>

        <p
          className="uc-rise mx-auto mt-8 max-w-md text-base leading-relaxed text-gray-400 md:text-lg"
          style={{ animationDelay: '260ms' }}
        >
          We are building something worth the wait. The {page.toLowerCase()} page is getting a fresh set of lights,
          and it will be back on stage soon.
        </p>

        {/* progress bar */}
        <div className="uc-rise mx-auto mt-10 max-w-md" style={{ animationDelay: '380ms' }}>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gray-500">
            <span>Build progress</span>
            <span className="tabular-nums text-red-400">{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Build progress"
            className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/5"
          >
            <div className="uc-fill h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* terminal status line */}
        <p
          className="uc-rise mt-8 h-6 text-sm tracking-[0.15em] text-gray-300"
          style={{ animationDelay: '500ms' }}
          aria-live="off"
        >
          <span className="text-red-500">&gt;</span> {typed}
          <span className="uc-caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-red-500" />
        </p>

        <div className="uc-rise mt-12" style={{ animationDelay: '620ms' }}>
          <Link
            to="/"
            className="uc-btn relative inline-block rounded-full bg-red-600 px-10 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-white"
          >
            Back to home
          </Link>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .uc-root { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .uc-root ::selection { background: #ef4444; color: #000; }
        .uc-root [class*="tracking-"] { font-family: 'Space Mono', ui-monospace, monospace; }
        .uc-font { font-family: 'Unbounded', 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: -0.03em; }

        .uc-outline { -webkit-text-stroke: 1.5px rgba(255,255,255,.85); color: transparent; }
        .uc-red {
          color: #ff2d2d;
          text-shadow: 0 0 50px rgba(255,45,45,.55);
          animation: uc-glitch 7s steps(1, end) infinite;
        }
        @keyframes uc-glitch {
          0%, 91%, 100% { transform: none; text-shadow: 0 0 50px rgba(255,45,45,.55); }
          92% { transform: translate(-3px, 1px) skewX(-5deg); text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; }
          94% { transform: translate(3px, -1px) skewX(4deg); text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; }
          96% { transform: translate(-1px, 0); text-shadow: 2px 0 #22d3ee, -2px 0 #e879f9; }
        }

        .uc-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 80%);
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 80%);
        }
        .uc-spot {
          background: radial-gradient(380px circle at var(--sx, 50%) var(--sy, 40%), rgba(255,60,60,.12), transparent 70%);
          mix-blend-mode: screen;
        }
        @media (hover: none) { .uc-spot { display: none; } }

        /* hazard tape */
        .uc-ribbon {
          position: absolute;
          left: -10%;
          width: 120%;
          overflow: hidden;
          background: #facc15;
          color: #111;
          border-top: 3px solid #111;
          border-bottom: 3px solid #111;
          opacity: .88;
          pointer-events: none;
          box-shadow: 0 10px 40px rgba(0,0,0,.5);
        }
        .uc-ribbon-a { top: 14%; transform: rotate(-5deg); }
        .uc-ribbon-b { bottom: 12%; transform: rotate(4deg); }
        .uc-track { display: flex; width: max-content; animation: uc-scroll 32s linear infinite; }
        .uc-track-rev { animation-direction: reverse; }
        .uc-tape-item {
          white-space: nowrap;
          padding: .5rem 1.5rem;
          font-family: 'Space Mono', ui-monospace, monospace;
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .3em;
          text-transform: uppercase;
        }
        .uc-tape-item i { font-style: normal; margin-left: 1.5rem; color: #b91c1c; }
        @keyframes uc-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* gears */
        .uc-gear { animation: uc-spin 26s linear infinite; }
        .uc-gear-rev { animation-direction: reverse; animation-duration: 34s; }
        @keyframes uc-spin { to { transform: rotate(360deg); } }

        /* progress bar fill with moving stripes */
        .uc-fill {
          background:
            repeating-linear-gradient(-45deg, rgba(255,255,255,.2) 0 8px, transparent 8px 16px),
            linear-gradient(90deg, #b91c1c, #ef4444, #fb923c);
          background-size: 32px 32px, 100% 100%;
          box-shadow: 0 0 18px rgba(239,68,68,.7);
          transition: width .2s linear;
          animation: uc-stripe 1s linear infinite;
        }
        @keyframes uc-stripe { from { background-position: 0 0, 0 0; } to { background-position: 32px 0, 0 0; } }

        /* blinking caret */
        .uc-caret { animation: uc-blink 1s steps(1) infinite; }
        @keyframes uc-blink { 50% { opacity: 0; } }

        /* entrance */
        .uc-rise { opacity: 0; animation: uc-rise .9s cubic-bezier(.2,.8,.2,1) forwards; }
        @keyframes uc-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }

        /* button pulse ring */
        .uc-btn::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          border: 2px solid rgba(239,68,68,.6);
          animation: uc-ring 2.2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes uc-ring {
          0% { transform: scale(1); opacity: .8; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .uc-red, .uc-track, .uc-gear, .uc-fill, .uc-caret, .uc-btn::after { animation: none; }
          .uc-rise { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default UnderConstruction