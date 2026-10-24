import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StarBackground from '../Components/StarBackground'

/* ------------------------------------------------------------------
   EDIT THIS SECTION ONLY.
   - Put photos in  /public/achievements/  and list the file names below.
     Each event can have 1 to any number of photos. The first three go
     in the collage, the rest open in the gallery ("+N" on the third).
   - Every number, date, venue and highlight is a PLACEHOLDER.
     Replace them with your real data.
   - To add an event, copy one object and paste it into the right list.
   - period, venue and highlights are optional. Delete them if unused.
------------------------------------------------------------------- */

const ON_CAMPUS = [
  {
    id: 'igc-mun',
    name: 'IGC MUN',
    tagline: 'Our flagship Model United Nations conference.',
    description:
      'IGC MUN is a simulation of the United Nations where students step into the role of delegates, debate global issues in committees, negotiate resolutions and defend their country’s position. It builds public speaking, research and diplomacy, and brings schools and colleges together for several days of debate.',
    period: 'Nov 2025',
    venue: 'LPU Campus',
    highlights: [
      'Delegates from schools and colleges',
      'Multiple committees, one resolution each',
      'Awards for best delegate and best delegation',
    ],
    images: ['igc-mun-1.jpg', 'igc-mun-2.jpg', 'igc-mun-3.jpg'],
    stats: [
      { value: '500+', label: 'Delegates' },
      { value: '15', label: 'Committees' },
      { value: '40+', label: 'Institutions' },
      { value: '3', label: 'Days' },
    ],
  },
  {
    id: 'achievers-meet',
    name: 'Achievers Meet',
    tagline: 'Recognition for students who went further.',
    description:
      'Achievers Meet brings together students who have won awards, led projects or represented the society outside campus. It is a chance to celebrate their work, hear their stories and inspire the next batch of members.',
    period: 'Apr 2026',
    venue: 'LPU Campus',
    highlights: [
      'Awards and recognition on stage',
      'Stories from students who led projects',
      'Guests of honour and mentors',
    ],
    images: ['achievers-1.jpg', 'achievers-2.jpg', 'achievers-3.jpg'],
    stats: [
      { value: '60+', label: 'Achievers honoured' },
      { value: '20', label: 'Awards' },
      { value: '5', label: 'Guests of honour' },
      { value: '200+', label: 'Attendees' },
    ],
  },
  {
    id: 'coke-studio',
    name: 'Coke Studio',
    tagline: 'Live music, right on our campus.',
    description:
      'Coke Studio is a live music evening on campus where student artists perform, collaborate with other musicians and reach a wider audience. Our members take part as performers, volunteers and organisers.',
    period: 'Sep 2025',
    venue: 'LPU Campus',
    highlights: [
      'Student artists performing live',
      'Collaborations with other musicians',
      'Members as performers and organisers',
    ],
    images: ['coke-studio-1.jpg', 'coke-studio-2.jpg', 'coke-studio-3.jpg'],
    stats: [
      { value: '15', label: 'Artists' },
      { value: '3', label: 'Performances' },
      { value: '1,000+', label: 'Audience' },
      { value: '2', label: 'Collaborations' },
    ],
  },
]

const OFF_CAMPUS = [
  {
    id: 'hackathons',
    name: 'Hackathons',
    tagline: 'Where our members build under pressure.',
    description:
      'A hackathon is a timed event, usually 24 to 48 hours, where teams design and build a working product, app or prototype to solve a real problem. Our members take part in hackathons at other colleges and companies, working with new teammates and presenting to judges.',
    period: '2024 – 2026',
    venue: 'Partner colleges and companies',
    highlights: [
      'Teams built and shipped in 24 to 48 hours',
      'Pitched live to industry judges',
      'Several podium finishes',
    ],
    images: ['hackathon-1.jpg', 'hackathon-2.jpg', 'hackathon-3.jpg'],
    stats: [
      { value: '8', label: 'Hackathons attended' },
      { value: '40+', label: 'Participants' },
      { value: '5', label: 'Podium finishes' },
      { value: '24h', label: 'Longest build' },
    ],
  },
]

const ALL_EVENTS = [...ON_CAMPUS, ...OFF_CAMPUS]

// The strip at the bottom of the hero. Placeholders too.
const HIGHLIGHTS = [
  { value: String(ALL_EVENTS.length), label: 'Events featured' },
  { value: '5,000+', label: 'Students reached' },
  { value: '50+', label: 'Awards won' },
  { value: '40+', label: 'Colleges involved' },
]

// The words that rotate under the headline.
const WORDS = ['storytellers', 'stage builders', 'problem solvers', 'late-night hackers', 'crowd starters']

// "Our journey" timeline. Placeholders. Add or remove rows freely.
const MILESTONES = [
  { year: '2023', title: 'The society begins', text: 'The first batch of members, the first meeting and the first small event on campus.' },
  { year: '2024', title: 'First big stage', text: 'Our first large event is hosted and the first hackathon teams travel off campus.' },
  { year: '2025', title: 'Growing across colleges', text: 'More institutions join our events and members start winning at outside competitions.' },
  { year: '2026', title: 'Recognised beyond campus', text: 'Awards, guests of honour and a bigger audience for everything we run.' },
]

const FILTERS = [
  { id: 'all', label: 'All', count: ALL_EVENTS.length },
  { id: 'on', label: 'On campus', count: ON_CAMPUS.length },
  { id: 'off', label: 'Off campus', count: OFF_CAMPUS.length },
]

/* ------------------------------------------------------------------ */

const glow = '0 0 30px rgba(239,68,68,0.45)'
const outline = (px, color) => ({ WebkitTextStroke: `${px}px ${color}`, color: 'transparent' })

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Collage layouts for 1, 2 or 3 photos (percent of the collage box).
// x, y = position, w, h = size, r = tilt in degrees, d = mouse parallax depth.
const LAYOUT = {
  1: [{ x: 8, y: 4, w: 84, h: 90, r: -2, d: 8 }],
  2: [
    { x: 0, y: 0, w: 62, h: 78, r: -3, d: 10 },
    { x: 48, y: 30, w: 52, h: 70, r: 3, d: 20 },
  ],
  3: [
    { x: 0, y: 0, w: 60, h: 62, r: -3, d: 8 },
    { x: 54, y: 10, w: 46, h: 52, r: 3, d: 16 },
    { x: 16, y: 54, w: 60, h: 46, r: -1, d: 24 },
  ],
}

const CONFETTI = ['#ef4444', '#f97316', '#ffffff', '#fca5a5', '#dc2626']

// Small burst of red confetti from the element that was clicked.
const burst = (e) => {
  if (reducedMotion()) return
  const r = e.currentTarget.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const layer = document.createElement('div')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden'
  document.body.appendChild(layer)

  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span')
    const size = 4 + Math.random() * 7
    s.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:${
      Math.random() > 0.5 ? '50%' : '2px'
    };background:${CONFETTI[i % CONFETTI.length]}`
    layer.appendChild(s)
    const angle = Math.random() * Math.PI * 2
    const dist = 120 + Math.random() * 280
    s.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 90}px) scale(.3) rotate(${
            Math.random() * 720
          }deg)`,
          opacity: 0,
        },
      ],
      { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' }
    )
  }
  window.setTimeout(() => layer.remove(), 1800)
}

// Fires once when the element scrolls into view.
const useRevealOnView = (options = {}) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.3, ...options }
    )

    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, inView]
}

// Writes a CSS variable on the element that follows the page scroll.
// compute(rect, viewportHeight) must return a number. `still` is used for reduced motion.
const centreOffset = (r, vh) =>
  Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)))
const drawProgress = (r, vh) => Math.max(0, Math.min(1, (vh * 0.65 - r.top) / r.height))
const exitProgress = (r, vh) => Math.max(0, Math.min(1, -r.top / (vh * 0.7)))

const useScrollVar = (name, compute, still = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reducedMotion()) {
      node.style.setProperty(name, String(still))
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const value = compute(node.getBoundingClientRect(), window.innerHeight)
      node.style.setProperty(name, value.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [name, compute, still])

  return ref
}

// Slides and fades its children in the first time they appear.
const Reveal = ({ as: Tag = 'div', from = 'up', delay = 0, className = '', children, ...rest }) => {
  const [ref, inView] = useRevealOnView({ threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
  return (
    <Tag
      ref={ref}
      data-from={from}
      data-in={inView}
      style={{ '--rd': `${delay}ms` }}
      className={`ach-reveal ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// Counts up to the number inside strings like "500+", "2,000+" or "24h".
const CountUp = ({ value, duration = 1600 }) => {
  const [ref, inView] = useRevealOnView({ threshold: 0.5 })
  const match = String(value).match(/^(\D*)([\d,]+)(.*)$/)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView || !match) return
    const target = Number(match[2].replace(/,/g, ''))

    if (reducedMotion()) {
      setDisplay(target)
      return
    }

    let raf
    let start
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min((t - start) / duration, 1)
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  if (!match) return <span ref={ref}>{value}</span>

  const shown = match[2].includes(',') ? display.toLocaleString('en-US') : display
  return (
    <span ref={ref}>
      {match[1]}
      {shown}
      {match[3]}
    </span>
  )
}

// Thin red bar at the very top that fills as you read down the page.
const ScrollProgress = () => {
  const bar = useRef(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        ref={bar}
        className="h-full origin-left bg-linear-to-r from-red-800 via-red-500 to-orange-400"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

// One headline word with a solid full stop (outlined text makes hollow dots).
const Word = ({ text, delay, k, style, dot = '#ffffff' }) => (
  <span className="ach-rise ach-depth inline-block" style={{ '--k': k, animationDelay: `${delay}ms` }}>
    <span style={style}>{text}</span>
    <span style={{ color: dot }}>.</span>
  </span>
)

// "We are the ___" with a word that swaps every couple of seconds.
const Rotator = () => {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reducedMotion()) return
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="ach-rise mt-8 flex flex-col items-center" style={{ animationDelay: '600ms' }} aria-live="off">
      <span className="text-xs uppercase tracking-[0.35em] text-gray-400">We are the</span>
      <span className="mt-2 block h-10 overflow-hidden md:h-12">
        <span
          key={i}
          className="ach-swap ach-font block bg-linear-to-r from-white to-red-400 bg-clip-text text-2xl uppercase leading-[1.3] text-transparent md:text-3xl"
        >
          {WORDS[i]}
        </span>
      </span>
    </div>
  )
}

// One photo in the collage. Shows a placeholder until the file exists.
const Photo = ({ file, label, slot, z, extra = 0, onOpen }) => {
  const [failed, setFailed] = useState(false)
  const missing = !file || failed

  return (
    <button
      type="button"
      disabled={missing}
      onClick={onOpen}
      aria-label={`View ${label}`}
      className={`ach-photo group absolute overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:border-red-500/60 focus-visible:outline-2 focus-visible:outline-red-400 ${
        missing ? 'cursor-default' : 'cursor-zoom-in'
      }`}
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${slot.w}%`,
        height: `${slot.h}%`,
        '--r': `${slot.r}deg`,
        '--depth': slot.d,
        '--z': z,
      }}
    >
      {missing ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-linear-to-br from-red-950/70 via-black to-black p-3 text-center">
          <svg className="h-7 w-7 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5 4 4 3-3 6 6M3 5h18v14H3z" />
          </svg>
          <span className="text-[11px] text-gray-500">
            {file ? `Add /public/achievements/${file}` : 'Add a photo in /public/achievements/'}
          </span>
        </div>
      ) : (
        <>
          <img
            src={`/achievements/${file}`}
            alt={label}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="pointer-events-none absolute bottom-2 left-3 text-xs text-white/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            Click to enlarge
          </span>
          {extra > 0 && (
            <span className="ach-font absolute inset-0 grid place-items-center bg-black/60 text-4xl text-white backdrop-blur-[1px]">
              +{extra}
            </span>
          )}
        </>
      )}
    </button>
  )
}

// Full screen gallery: arrows, keyboard, swipe, thumbnails.
const Lightbox = ({ state, onClose, onStep, onGo }) => {
  const open = Boolean(state)
  const items = state ? state.items : []
  const index = state ? state.index : 0
  const item = items[index]

  const [failed, setFailed] = useState({})
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const touchX = useRef(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (closeRef.current) closeRef.current.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onStep(1)
      else if (e.key === 'ArrowLeft') onStep(-1)
      else if (e.key === 'Tab' && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll('button')
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previousFocus && previousFocus.focus) previousFocus.focus()
    }
  }, [open, onClose, onStep])

  // Warm the neighbours so arrows feel instant.
  useEffect(() => {
    if (!open || items.length < 2) return
    ;[index - 1, index + 1].forEach((i) => {
      const n = items[(i + items.length) % items.length]
      if (n) new Image().src = `/achievements/${n.file}`
    })
  }, [open, index, items])

  if (!open || !item) return null

  const many = items.length > 1
  const markFailed = (file) => setFailed((f) => ({ ...f, [file]: true }))

  const arrow =
    'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-xl text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black'

  return (
    <div
      ref={dialogRef}
      className="ach-fade fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
    >
      <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={onClose} />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black"
      >
        ✕
      </button>

      {many && (
        <>
          <button type="button" onClick={() => onStep(-1)} aria-label="Previous photo" className={`${arrow} left-3 md:left-6`}>
            ‹
          </button>
          <button type="button" onClick={() => onStep(1)} aria-label="Next photo" className={`${arrow} right-3 md:right-6`}>
            ›
          </button>
        </>
      )}

      <div
        className="relative flex max-h-[72vh] w-full items-center justify-center"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1)
        }}
      >
        {failed[item.file] ? (
          <div className="flex h-[50vh] w-[min(90vw,40rem)] flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-linear-to-br from-red-950/60 via-black to-black text-center">
            <span className="text-sm text-gray-400">Photo not found</span>
            <span className="text-xs text-gray-500">Add /public/achievements/{item.file}</span>
          </div>
        ) : (
          <img
            key={item.file}
            src={`/achievements/${item.file}`}
            alt={item.label}
            onError={() => markFailed(item.file)}
            className="ach-fade max-h-[72vh] max-w-[92vw] rounded-2xl border border-white/10 object-contain shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
          />
        )}
      </div>

      <div className="relative z-10 mt-4 text-center">
        <p className="text-sm text-gray-200">{item.label}</p>
        {many && (
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gray-500">
            {index + 1} / {items.length}
          </p>
        )}
      </div>

      {many && (
        <div className="relative z-10 mt-4 flex max-w-full gap-2 overflow-x-auto px-2 pb-1">
          {items.map((it, i) => (
            <button
              key={it.file}
              type="button"
              onClick={() => onGo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                i === index ? 'border-red-500 opacity-100' : 'border-white/15 opacity-50 hover:opacity-90'
              }`}
            >
              {failed[it.file] ? (
                <span className="grid h-full w-full place-items-center bg-neutral-900 text-[10px] text-gray-500">{i + 1}</span>
              ) : (
                <img src={`/achievements/${it.file}`} alt="" onError={() => markFailed(it.file)} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Scrolling outlined text that introduces each group.
const MarqueeBand = ({ text, reverse = false }) => {
  const items = Array.from({ length: 8 })
  const fade = 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-red-500/20 bg-black/30 py-5 backdrop-blur-sm"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <div className={`ach-marquee ${reverse ? 'ach-marquee-rev' : ''} flex w-max items-center gap-10`}>
        {[...items, ...items].map((_, i) => (
          <span
            key={i}
            className="ach-font flex items-center gap-10 whitespace-nowrap text-[9vw] uppercase leading-none md:text-[4.5vw]"
          >
            <span style={outline(1, 'rgba(255,255,255,0.75)')}>{text}</span>
            <span className="ach-spin text-[4vw] text-red-500 md:text-[2.2vw]">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const Check = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
  </svg>
)

// A stat tile: light follows the cursor, click to replay the count.
const StatCard = ({ stat, delay }) => {
  const [run, setRun] = useState(0)

  const onGlow = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`)
  }

  return (
    <Reveal
      from="zoom"
      delay={delay}
      onPointerMove={onGlow}
      onClick={() => setRun((n) => n + 1)}
      title="Click to replay"
      className="group relative flex cursor-pointer flex-col-reverse overflow-hidden bg-black/70 px-6 py-8 text-center backdrop-blur-sm transition-colors duration-500 hover:bg-red-950/30"
    >
      <dt className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">{stat.label}</dt>
      <dd className="ach-font text-3xl text-white md:text-4xl" style={{ textShadow: glow }}>
        <CountUp key={run} value={stat.value} />
      </dd>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(180px circle at var(--gx, 50%) var(--gy, 50%), rgba(239,68,68,0.24), transparent 70%)',
        }}
      />
      <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-red-500 transition-transform duration-700 group-hover:scale-x-100" />
    </Reveal>
  )
}

const EventBlock = ({ event, index, tag, flip, onOpen }) => {
  const wordRef = useScrollVar('--p', centreOffset)
  const [shift, setShift] = useState(0)
  const images = event.images || []
  const shown = images.slice(0, 3)
  const slots = LAYOUT[Math.max(1, shown.length)]
  const items = images.map((file, i) => ({ file, label: `${event.name} photo ${i + 1}` }))

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onLeave = (e) => {
    e.currentTarget.style.setProperty('--mx', '0')
    e.currentTarget.style.setProperty('--my', '0')
  }

  return (
    <article id={event.id} className="relative scroll-mt-28 py-20 md:py-28">
      {/* giant outlined name that drifts sideways as you scroll */}
      <div
        ref={wordRef}
        aria-hidden="true"
        className="ach-font pointer-events-none absolute left-0 top-10 w-full select-none overflow-hidden whitespace-nowrap text-[12vw] uppercase leading-none md:text-[6.5vw]"
      >
        <span className="ach-bgword inline-block" style={outline(1, 'rgba(239,68,68,0.28)')}>
          {event.name}
        </span>
      </div>

      <div className="relative z-10 grid items-center gap-12 pt-[12vw] md:pt-[8vw] lg:grid-cols-12 lg:gap-16">
        {/* Text */}
        <Reveal from={flip ? 'right' : 'left'} className={`lg:col-span-5 ${flip ? 'lg:order-2' : ''}`}>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em]">
            <span className="ach-font text-base text-red-500">{String(index + 1).padStart(2, '0')}</span>
            <span className="h-px w-10 bg-red-500/60" />
            <span className="text-gray-400">{tag}</span>
          </div>

          <h3 className="ach-font mt-4 text-3xl uppercase leading-tight text-white md:text-4xl">{event.name}</h3>
          <p className="mt-4 text-lg text-red-400">{event.tagline}</p>

          {(event.period || event.venue) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {event.period && (
                <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-gray-300">
                  {event.period}
                </span>
              )}
              {event.venue && (
                <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-gray-300">
                  {event.venue}
                </span>
              )}
            </div>
          )}

          <p className="mt-5 max-w-prose leading-relaxed text-gray-300">{event.description}</p>

          {event.highlights && event.highlights.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {event.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-gray-300">
                  <Check />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* Photo collage: moves with the mouse, hover to straighten, click to enlarge, shuffle to reorder */}
        <Reveal from={flip ? 'left' : 'right'} delay={120} className="lg:col-span-7">
          <div
            className="relative h-[22rem] sm:h-[28rem] lg:h-[32rem]"
            onPointerMove={onMove}
            onPointerLeave={onLeave}
          >
            {(shown.length ? shown : [undefined]).map((file, i) => {
              const slotIndex = (i + shift) % slots.length
              return (
                <Photo
                  key={file || 'empty'}
                  file={file}
                  label={`${event.name} photo ${i + 1}`}
                  slot={slots[slotIndex]}
                  z={10 * (slotIndex + 1)}
                  extra={slotIndex === 2 ? images.length - 3 : 0}
                  onOpen={() => onOpen(items, i)}
                />
              )
            })}
          </div>

          {images.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => onOpen(items, 0)}
                className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400"
              >
                View all {images.length} photo{images.length > 1 ? 's' : ''}
                <span aria-hidden="true">→</span>
              </button>
              {shown.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShift((s) => (s + 1) % slots.length)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-gray-300 transition-colors hover:border-red-400 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400"
                >
                  <span aria-hidden="true">⟳</span> Shuffle
                </button>
              )}
            </div>
          )}
        </Reveal>
      </div>

      {/* Stats */}
      <dl className="relative z-10 mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/20 md:grid-cols-4">
        {event.stats.map((s, i) => (
          <StatCard key={s.label} stat={s} delay={i * 90} />
        ))}
      </dl>
    </article>
  )
}

const Group = ({ id, title, bandText, intro, events, startIndex, tag, reverse, onOpen }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 pt-12">
    <h2 id={`${id}-title`} className="sr-only">
      {title}
    </h2>
    <MarqueeBand text={bandText} reverse={reverse} />
    <Reveal>
      <p className="mx-auto mt-10 max-w-xl px-6 text-center text-lg text-gray-300">{intro}</p>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-red-500/80">
        {events.length} {events.length === 1 ? 'event' : 'events'}
      </p>
    </Reveal>

    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      {events.map((event, i) => (
        <EventBlock key={event.id} event={event} index={startIndex + i} tag={tag} flip={i % 2 === 1} onOpen={onOpen} />
      ))}
    </div>
  </section>
)

// All / On campus / Off campus switch with a sliding pill.
const FilterTabs = ({ value, onChange }) => {
  const idx = FILTERS.findIndex((f) => f.id === value)

  return (
    <div
      role="group"
      aria-label="Filter events"
      className="relative mx-auto inline-grid grid-cols-3 rounded-full border border-red-500/30 bg-black/50 p-1 backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-red-600 shadow-[0_0_24px_rgba(239,68,68,0.5)] transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${idx * 100}%)` }}
      />
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          aria-pressed={value === f.id}
          onClick={() => onChange(f.id)}
          className={`relative z-10 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-red-400 sm:px-8 sm:text-sm ${
            value === f.id ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {f.label}
          <span className="ml-2 text-xs opacity-60">{f.count}</span>
        </button>
      ))}
    </div>
  )
}

// Vertical timeline whose red line draws itself as you scroll.
const Timeline = () => {
  const ref = useScrollVar('--tp', drawProgress, 1)

  return (
    <section aria-labelledby="journey-title" className="mx-auto max-w-5xl px-5 py-24 sm:px-8 md:py-32">
      <Reveal className="text-center">
        <p className="text-sm uppercase tracking-widest text-red-600">Our journey</p>
        <h2 id="journey-title" className="ach-font mt-3 text-3xl uppercase leading-tight text-white md:text-5xl">
          How we got here
        </h2>
      </Reveal>

      <div ref={ref} className="relative mt-16">
        <div aria-hidden="true" className="absolute bottom-0 left-4 top-0 w-px -translate-x-1/2 bg-white/10 md:left-1/2">
          <div
            className="absolute inset-0 origin-top bg-linear-to-b from-red-600 via-red-500 to-orange-400 shadow-[0_0_14px_rgba(239,68,68,0.8)]"
            style={{ transform: 'scaleY(var(--tp, 0))' }}
          />
        </div>

        <ol className="space-y-14">
          {MILESTONES.map((m, i) => {
            const left = i % 2 === 0
            return (
              <li key={m.year + m.title} className="relative pl-12 md:grid md:grid-cols-2 md:gap-x-20 md:pl-0">
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-red-500 bg-black shadow-[0_0_16px_rgba(239,68,68,0.9)] md:left-1/2"
                />
                <Reveal
                  from={left ? 'left' : 'right'}
                  className={left ? 'md:col-start-1 md:text-right' : 'md:col-start-2'}
                >
                  <p className="ach-font text-4xl leading-none md:text-5xl" style={outline(1.5, 'rgba(239,68,68,0.85)')}>
                    {m.year}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{m.title}</h3>
                  <p className="mt-2 leading-relaxed text-gray-400">{m.text}</p>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// Small dot rail on the right edge (wide screens only) showing which event you are on.
const SideRail = ({ events, activeId }) => (
  <nav
    aria-label="Event navigation"
    className={`fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 transition-opacity duration-500 xl:flex ${
      activeId ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`}
  >
    {events.map((e) => {
      const active = activeId === e.id
      return (
        <a
          key={e.id}
          href={`#${e.id}`}
          aria-label={e.name}
          aria-current={active ? 'true' : undefined}
          className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-red-400"
        >
          <span className="rounded-full bg-black/80 px-3 py-1 text-xs text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {e.name}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              active
                ? 'h-3 w-3 bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]'
                : 'h-2 w-2 bg-white/30 group-hover:bg-white/70'
            }`}
          />
        </a>
      )
    })}
  </nav>
)

const Achievements = () => {
  const [lightbox, setLightbox] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [filter, setFilter] = useState('all')
  const heroRef = useScrollVar('--hp', exitProgress)

  const openLightbox = useCallback((items, index) => setLightbox({ items, index }), [])
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const stepLightbox = useCallback(
    (d) => setLightbox((s) => (s ? { ...s, index: (s.index + d + s.items.length) % s.items.length } : s)),
    []
  )
  const goLightbox = useCallback((i) => setLightbox((s) => (s ? { ...s, index: i } : s)), [])

  const railEvents = filter === 'on' ? ON_CAMPUS : filter === 'off' ? OFF_CAMPUS : ALL_EVENTS

  // Which event is under the middle of the screen, for the dot rail.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const live = new Set()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => (en.isIntersecting ? live.add(en.target.id) : live.delete(en.target.id)))
        const found = ALL_EVENTS.find((e) => live.has(e.id))
        setActiveId(found ? found.id : null)
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    ALL_EVENTS.forEach((e) => {
      const node = document.getElementById(e.id)
      if (node) io.observe(node)
    })
    return () => io.disconnect()
  }, [filter])

  const onHeroMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--sx', `${e.clientX - r.left}px`)
    el.style.setProperty('--sy', `${e.clientY - r.top}px`)
    el.style.setProperty('--hx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    el.style.setProperty('--hy', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onHeroLeave = (e) => {
    e.currentTarget.style.setProperty('--hx', '0')
    e.currentTarget.style.setProperty('--hy', '0')
  }

  // Chips in the hero: show everything first, then glide to the event.
  const jumpTo = (e, id) => {
    e.preventDefault()
    setFilter('all')
    window.setTimeout(() => {
      const node = document.getElementById(id)
      if (node) node.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }, 60)
  }

  const registerClass =
    'bg-red-600 text-white font-bold uppercase text-sm px-10 py-4 rounded-full hover:bg-red-500 transition-colors'

  return (
    <main className="ach-root relative bg-black text-gray-300">
      {/* same fixed star field as the rest of the site */}
      <StarBackground />
      <ScrollProgress />
      <SideRail events={railEvents} activeId={activeId} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        html { scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: #dc2626 #0a0a0a; }

        /* ---------- type ---------- */
        .ach-root { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .ach-root ::selection { background: #ef4444; color: #000; }
        .ach-root [class*="tracking-"] { font-family: 'Space Mono', ui-monospace, monospace; }
        .ach-root .ach-font { font-family: 'Unbounded', 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: -0.01em; }

        /* ---------- atmosphere ---------- */
        .ach-root::before {
          content: ''; position: fixed; inset: -20%; z-index: 1; pointer-events: none;
          background:
            radial-gradient(40% 35% at 18% 22%, rgba(239,68,68,.20), transparent 70%),
            radial-gradient(35% 30% at 85% 30%, rgba(249,115,22,.14), transparent 70%),
            radial-gradient(45% 40% at 55% 90%, rgba(190,24,93,.16), transparent 70%);
          animation: ach-aurora 22s ease-in-out infinite alternate;
        }
        @keyframes ach-aurora {
          from { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1); }
          to { transform: translate3d(4%, 3%, 0) rotate(8deg) scale(1.12); }
        }
        .ach-root::after {
          content: ''; position: fixed; inset: 0; z-index: 55; pointer-events: none; opacity: .07; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .ach-root header::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(ellipse 60% 55% at 50% 45%, #000 20%, transparent 75%);
          mask-image: radial-gradient(ellipse 60% 55% at 50% 45%, #000 20%, transparent 75%);
        }

        /* ---------- glow, tiles, frames ---------- */
        .ach-flare { animation: ach-flare 3s ease-in-out infinite; }
        @keyframes ach-flare {
          0%, 100% { text-shadow: 0 0 24px rgba(220,38,38,.55), 0 0 60px rgba(220,38,38,.25); }
          50% { text-shadow: 0 0 36px rgba(249,115,22,.85), 0 0 90px rgba(220,38,38,.5); }
        }
        .ach-root dl { box-shadow: 0 0 70px rgba(239,68,68,.12), inset 0 1px 0 rgba(255,255,255,.08); }
        .ach-root dl > * { background-image: linear-gradient(180deg, rgba(255,255,255,.05), transparent 60%); }

        .ach-photo { outline: 1px solid rgba(255,255,255,.1); outline-offset: -9px; }
        .ach-photo::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; transform: translateX(-120%) skewX(-18deg);
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%);
          transition: transform 1s cubic-bezier(.2,.8,.2,1);
        }
        .ach-photo:hover::after { transform: translateX(120%) skewX(-18deg); }

        /* ---------- motion ---------- */
        @keyframes ach-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ach-marquee { animation: ach-marquee 38s linear infinite; }
        .ach-marquee-rev { animation-direction: reverse; }

        @keyframes ach-rise {
          from { opacity: 0; transform: translateY(45%) scale(.98); filter: blur(10px); }
          to { opacity: 1; transform: none; filter: blur(0); }
        }
        .ach-rise { opacity: 0; animation: ach-rise 1s cubic-bezier(.2,.8,.2,1) forwards; }

        @keyframes ach-swap {
          from { opacity: 0; transform: translateY(70%); filter: blur(6px); }
          to { opacity: 1; transform: none; filter: blur(0); }
        }
        .ach-swap { animation: ach-swap .55s cubic-bezier(.2,.8,.2,1) both; }

        @keyframes ach-fade { from { opacity: 0; } to { opacity: 1; } }
        .ach-fade { animation: ach-fade .35s ease both; }

        @keyframes ach-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.7); }
          50% { box-shadow: 0 0 0 9px rgba(239,68,68,0); }
        }
        .ach-pulse { animation: ach-pulse 2s ease-out infinite; }

        @keyframes ach-spin { to { transform: rotate(360deg); } }
        .ach-spin { display: inline-block; animation: ach-spin 8s linear infinite; }

        @keyframes ach-scroll-cue {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
        .ach-cue { animation: ach-scroll-cue 2s ease-in-out infinite; }

        .ach-reveal {
          opacity: 0;
          transition: opacity .8s ease, transform .9s cubic-bezier(.2,.8,.2,1), background-color .5s;
          transition-delay: var(--rd, 0ms);
        }
        .ach-reveal[data-from="up"] { transform: translateY(36px); }
        .ach-reveal[data-from="left"] { transform: translateX(-52px); }
        .ach-reveal[data-from="right"] { transform: translateX(52px); }
        .ach-reveal[data-from="zoom"] { transform: scale(.92); }
        .ach-reveal[data-in="true"] { opacity: 1; transform: none; }

        .ach-photo {
          rotate: var(--r, 0deg);
          z-index: var(--z, 10);
          translate: calc(var(--mx, 0) * var(--depth, 10) * 2px) calc(var(--my, 0) * var(--depth, 10) * 2px);
          transition: translate .3s ease-out, rotate .6s cubic-bezier(.2,.8,.2,1), scale .6s cubic-bezier(.2,.8,.2,1),
            left .8s cubic-bezier(.2,.8,.2,1), top .8s cubic-bezier(.2,.8,.2,1),
            width .8s cubic-bezier(.2,.8,.2,1), height .8s cubic-bezier(.2,.8,.2,1),
            border-color .3s, box-shadow .3s;
        }
        .ach-photo:hover, .ach-photo:focus-visible {
          rotate: 0deg;
          scale: 1.04;
          z-index: 40;
          box-shadow: 0 30px 80px rgba(239,68,68,.25), 0 20px 60px rgba(0,0,0,.7);
        }
        .ach-photo img { transition: transform .9s cubic-bezier(.2,.8,.2,1); }
        .ach-photo:hover img { transform: scale(1.08); }

        .ach-bgword { transform: translate3d(calc(var(--p, 0) * 7vw), 0, 0); will-change: transform; }

        .ach-hero { transform: translate3d(0, calc(var(--hp, 0) * 70px), 0); opacity: calc(1 - var(--hp, 0) * .9); will-change: transform, opacity; }

        .ach-depth {
          translate: calc(var(--hx, 0) * var(--k, 10) * 2px) calc(var(--hy, 0) * var(--k, 10) * 1.2px);
          transition: translate .35s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .ach-root::before, .ach-flare { animation: none; }
          .ach-marquee, .ach-pulse, .ach-spin, .ach-cue { animation: none; }
          .ach-rise, .ach-swap { animation: none; opacity: 1; }
          .ach-reveal { opacity: 1; transform: none !important; transition: none; }
          .ach-photo { translate: none; transition: none; }
          .ach-photo img { transition: none; }
          .ach-photo::after { transition: none; }
          .ach-depth { translate: none; }
          .ach-bgword, .ach-hero { transform: none; opacity: 1; }
        }
      `}</style>

      {/* Hero */}
      <header
        ref={heroRef}
        onPointerMove={onHeroMove}
        onPointerLeave={onHeroLeave}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center"
      >
        {/* soft light that follows the cursor */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(520px circle at var(--sx, 50%) var(--sy, 35%), rgba(239,68,68,0.14), transparent 60%)',
          }}
        />

        <div className="ach-hero relative flex flex-col items-center">
          <p
            className="ach-rise mb-6 flex items-center gap-3 text-sm uppercase tracking-widest text-red-600"
            style={{ animationDelay: '50ms' }}
          >
            <span className="ach-pulse h-2 w-2 rounded-full bg-red-500" />
            Achievements
          </p>

          <h1 className="ach-font flex flex-wrap items-baseline justify-center gap-x-[2vw] text-[9.5vw] uppercase leading-[1.05] md:text-[4vw]">
            <Word text="Dream" delay={150} k={10} style={{ color: '#ffffff' }} />
            <Word text="Deliver" delay={300} k={18} style={outline(2, '#ffffff')} />
            <button
              type="button"
              onClick={burst}
              title="Go on, click it"
              aria-label="Dominate. Click for a burst of confetti"
              className="ach-rise ach-depth ach-flare inline-block cursor-pointer uppercase text-red-600 focus-visible:outline-2 focus-visible:outline-red-400"
              style={{ '--k': 28, animationDelay: '450ms' }}
            >
              Dominate.
            </button>
          </h1>

          <Rotator />

          <p
            className="ach-rise mt-6 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg"
            style={{ animationDelay: '750ms' }}
          >
            Every fest we hosted, every hackathon we crashed, every trophy we carried home.
            This is the scoreboard.
          </p>

          <nav
            aria-label="Jump to an event"
            className="ach-rise mt-8 flex max-w-3xl flex-wrap justify-center gap-2"
            style={{ animationDelay: '850ms' }}
          >
            {ALL_EVENTS.map((e) => (
              <a
                key={e.id}
                href={`#${e.id}`}
                onClick={(ev) => jumpTo(ev, e.id)}
                className="rounded-full border border-red-500/30 bg-black/40 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-red-400 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400"
              >
                {e.name}
              </a>
            ))}
          </nav>

          <dl
            className="ach-rise mt-10 grid w-full max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/20 md:grid-cols-4"
            style={{ animationDelay: '1000ms' }}
          >
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex flex-col-reverse bg-black/70 px-4 py-6 backdrop-blur-sm">
                <dt className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{h.label}</dt>
                <dd className="ach-font text-2xl text-white md:text-3xl" style={{ textShadow: glow }}>
                  <CountUp value={h.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* scroll cue */}
        <div aria-hidden="true" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Scroll</span>
          <span className="ach-cue block h-10 w-px bg-linear-to-b from-red-500 to-transparent" />
        </div>
      </header>

      <div className="relative z-10">
        {/* Filter */}
        <section className="px-6 pb-2 pt-4 text-center">
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-gray-500">Show me</p>
            <FilterTabs value={filter} onChange={setFilter} />
          </Reveal>
        </section>

        {filter !== 'off' && (
          <Group
            key="on"
            id="on-campus"
            title="On-campus events"
            bandText="On campus"
            intro="Events our team plans, runs and hosts for students and guests."
            events={ON_CAMPUS}
            startIndex={0}
            tag="On campus"
            onOpen={openLightbox}
          />
        )}

        {filter !== 'on' && (
          <Group
            key="off"
            id="off-campus"
            title="Off-campus events"
            bandText="Off campus"
            intro="Where our members take part, perform and compete beyond the campus."
            events={OFF_CAMPUS}
            startIndex={ON_CAMPUS.length}
            tag="Off campus"
            reverse
            onOpen={openLightbox}
          />
        )}

        <Timeline />

        {/* Closing call to action, same pattern as the event pages */}
        <section className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden px-6 py-32 text-center">
          <Reveal
            aria-hidden="true"
            className="ach-font pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[16vw] uppercase leading-none"
            style={outline(1, 'rgba(239,68,68,0.18)')}
          >
            Your turn
          </Reveal>

          <Reveal className="relative">
            <p className="mb-4 text-sm uppercase tracking-widest text-white">Next up</p>
            <h2 className="ach-font mb-10 text-[6vw] uppercase leading-tight text-white md:text-[2.2vw]">
              Want to be part of the next one?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/join" className={registerClass}>
                Join Us
              </Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-semibold uppercase text-gray-300 transition-colors hover:border-red-400 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400"
              >
                Back to top
              </button>
            </div>
          </Reveal>
        </section>
      </div>

      <Lightbox state={lightbox} onClose={closeLightbox} onStep={stepLightbox} onGo={goLightbox} />
    </main>
  )
}

export default Achievements