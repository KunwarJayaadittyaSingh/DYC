import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import StarBackground from '../Components/StarBackground'
import Footer from './Footer'

/* ──────────────────────────────────────────────────────────────
   PAGE SWITCH
   true  = Gallery page is open
   false = anyone visiting this page (navbar click or typed URL) is sent to Home
   ────────────────────────────────────────────────────────────── */
const GALLERY_PAGE_OPEN = true

/* ──────────────────────────────────────────────────────────────
   DATA — edit freely
   ────────────────────────────────────────────────────────────── */
const EVENT_ORDER = ['Youthvibe', 'Magnitude', 'Concoction', 'FTS', 'TEDx', 'Hult Prize']

const PHOTOS_BY_EVENT = {
  Youthvibe: [
    { src: '/images/youthvibe-2.jpg', caption: 'Youthvibe — The Community' },
    { src: '/images/youthvibe-onstage.jpg', caption: 'Youthvibe — On Stage' },
    { src: '/images/FTS_Group_image.jpg', caption: 'Youthvibe — Behind The Scenes' },
    { src: '/images/youthvibe-9.jpg', caption: 'Youthvibe — The Crew' },
    { src: '/images/youthvibe-11.jpg', caption: 'Youthvibe — Highlights' },
    { src: '/images/youthvibe-closing.jpg', caption: 'Youthvibe — Closing Moment' },
  ],
  Magnitude: [
    { src: '/images/magnitude-2.jpg', caption: 'Magnitude — Opening Night' },
    { src: '/images/MAGNITUDE.jpg', caption: 'Magnitude — Main Stage' },
    { src: '/images/magnitude-10.jpg', caption: 'Magnitude — Crowd' },
    { src: '/images/magnitude-12.jpg', caption: 'Magnitude — Finale' },
    { src: '/images/magnitude-3.jpg', caption: 'Magnitude — Backstage' },
  ],
  Concoction: [
    { src: '/images/MAGNITUDE.jpg', caption: 'Concoction — The Mix' },
    { src: '/images/FTS_Group_image.jpg', caption: 'Concoction — Collaborators' },
    { src: '/images/MAGNITUDE.jpg', caption: 'Concoction — Live Session' },
  ],
  FTS: [
    { src: '/images/FTS_Group_image.jpg', caption: 'FTS — The Lineup' },
    { src: '/images/MAGNITUDE.jpg', caption: 'FTS — Winners' },
    { src: '/images/FTS_Group_image.jpg', caption: 'FTS — Green Room' },
  ],
  TEDx: [
    { src: '/images/tedx-coming-soon.jpg', caption: 'TEDx ' },
    { src: '/images/tedx-bg.jpg', caption: 'TEDx — Group image ' },
  ],
  'Hult Prize': [
    { src: '/images/hultprize-coming-soon.jpg', caption: 'Hult Prize' },
    { src: '/images/FTS_Group_image.jpg', caption: 'Hult Prize — Coming Soon' },
  ],
}

// the photo that opens the page as the big featured shot
const FEATURED = { ...PHOTOS_BY_EVENT.Youthvibe[1], event: 'Youthvibe' }

const INSTAGRAM = 'https://www.instagram.com/youthvibe.lpu/'

// words on the sticky note pinned to the memory wall (desktop only)
const STICKY_NOTE = 'hover to straighten, tap to open ♥'

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const pad2 = (n) => String(n).padStart(2, '0')
// "Youthvibe — On Stage" -> "On Stage"
const titleOf = (p) => p.caption.split('—').pop().trim() || p.event

// steady "random" numbers: the same photo always hangs the same way (no flicker between renders)
const rand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)

// each event's own list, with the same image never repeated inside one event
const withEvent = (event) => {
  const seen = new Set()
  return PHOTOS_BY_EVENT[event]
    .filter((p) => !seen.has(p.src) && seen.add(p.src))
    .map((p) => ({ ...p, event }))
}
const EVENT_PHOTOS = Object.fromEntries(EVENT_ORDER.map((e) => [e, withEvent(e)]))

// "All" shows each image file once, so reused placeholder photos don't repeat
const ALL_RAW = (() => {
  const seen = new Set()
  return EVENT_ORDER.flatMap((e) => EVENT_PHOTOS[e]).filter((p) => !seen.has(p.src) && seen.add(p.src))
})()

const useInView = (threshold = 0.1, rootMargin = '0px 0px -40px 0px') => {
  const ref = useRef(null)
  const [seen, setSeen] = useState(REDUCED)
  useEffect(() => {
    if (REDUCED) return
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [threshold, rootMargin])
  return [ref, seen]
}

/* ──────────────────────────────────────────────────────────────
   SMALL PIECES
   ────────────────────────────────────────────────────────────── */

/* fade + rise when scrolled into view */
const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, seen] = useInView(0.08)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'none' : 'translateY(28px)',
        transition: `opacity .9s ease ${delay}ms, transform 1s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const Eyebrow = ({ children }) => (
  <p className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-red-500">
    <span className="h-px w-10 bg-linear-to-r from-transparent to-red-500/70 md:w-16" />
    {children}
    <span className="h-px w-10 bg-linear-to-l from-transparent to-red-500/70 md:w-16" />
  </p>
)

/* headline: each word slides up from behind a mask, one after another */
const SlideHeadline = ({ lines }) => {
  const [ref, seen] = useInView(0.2, '0px')
  let index = 0
  return (
    <h1
      ref={ref}
      className="font-[font7] uppercase leading-[0.9] tracking-tight"
      style={{ fontSize: 'clamp(2.8rem, 9.5vw, 8rem)' }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((word, wi) => {
            const delay = index++ * 130
            return (
              <span key={word.t}>
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span
                    className={`dyc-word inline-block ${word.accent ? 'dyc-shimmer' : ''}`}
                    style={{
                      transform: seen ? 'translateY(0)' : 'translateY(115%)',
                      transition: `transform 1s cubic-bezier(.22,1,.36,1) ${delay}ms`,
                    }}
                  >
                    {word.t}
                  </span>
                </span>
                {wi < line.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

const CountUp = ({ to, duration = 1600 }) => {
  const [ref, seen] = useInView(0.5, '0px')
  const [value, setValue] = useState(REDUCED ? to : 0)
  useEffect(() => {
    if (!seen || REDUCED) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return <span ref={ref}>{value}</span>
}

/* ──────────────────────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────────────────────── */
const Hero = ({ photos, events }) => (
  <header className="mx-auto max-w-5xl px-5 text-center">
    <Reveal>
      <Eyebrow>Gallery</Eyebrow>
    </Reveal>

    <div className="mt-6">
      <SlideHeadline
        lines={[
          [{ t: 'Moments' }, { t: 'that' }],
          [{ t: 'made', accent: true }, { t: 'us', accent: true }],
        ]}
      />
    </div>

    <Reveal delay={250}>
      <p className="mx-auto mt-8 max-w-xl text-base font-light leading-relaxed text-white/60 md:text-xl">
        A look back at the stages, crowds and people behind DYC events.
      </p>
    </Reveal>

    <Reveal delay={350}>
      <dl className="mx-auto mt-12 flex max-w-xs items-start justify-center divide-x divide-white/10">
        {[
          { v: photos, l: 'Photos' },
          { v: events, l: 'Events' },
        ].map((s) => (
          <div key={s.l} className="flex flex-1 flex-col-reverse items-center px-6">
            <dt className="mt-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/45">{s.l}</dt>
            <dd className="font-[font7] text-4xl leading-none tabular-nums text-white md:text-5xl">
              <CountUp to={s.v} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>

    <Reveal delay={450}>
      <div className="mt-14 flex flex-col items-center gap-3 text-white/40" aria-hidden="true">
        <span className="text-[10px] font-medium uppercase tracking-[0.35em]">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <span className="dyc-cue absolute inset-x-0 top-0 h-1/2 bg-red-500" />
        </span>
      </div>
    </Reveal>
  </header>
)

/* ──────────────────────────────────────────────────────────────
   FEATURED — big photo with gentle parallax
   ────────────────────────────────────────────────────────────── */
const Featured = ({ onOpen, onBroken }) => {
  const wrap = useRef(null)
  const img = useRef(null)

  useEffect(() => {
    if (REDUCED) return
    let raf = 0
    const update = () => {
      raf = 0
      const w = wrap.current
      if (!w || !img.current) return
      const r = w.getBoundingClientRect()
      const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1)
      img.current.style.transform = `translate3d(0,${(p - 0.5) * -70}px,0) scale(1.14)`
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
    <Reveal className="mx-auto mt-20 max-w-7xl px-5 md:px-8">
      <button
        ref={wrap}
        type="button"
        onClick={onOpen}
        className="group relative block h-[56vh] w-full overflow-hidden rounded-3xl bg-white/5 text-left ring-1 ring-white/10 transition-shadow duration-500 hover:shadow-[0_30px_100px_rgba(239,68,68,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 md:h-[74vh]"
      >
        <div className="absolute inset-0 transition-transform duration-1600 ease-out group-hover:scale-105">
          <img
            ref={img}
            src={FEATURED.src}
            alt={FEATURED.caption}
            onError={() => onBroken(FEATURED.src)}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />

        <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md md:left-8 md:top-8">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Featured
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-12">
          <div>
            <p className="text-sm text-red-400">{FEATURED.event}</p>
            <h2 className="mt-2 font-[font7] text-4xl uppercase leading-none md:text-7xl">{titleOf(FEATURED)}</h2>
          </div>
          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm backdrop-blur-sm transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black sm:flex">
            View photo <span aria-hidden="true">↗</span>
          </span>
        </div>
      </button>
    </Reveal>
  )
}

/* ──────────────────────────────────────────────────────────────
   MARQUEE — slow endless line of event names
   ────────────────────────────────────────────────────────────── */
const Marquee = () => {
  const loop = [...EVENT_ORDER, ...EVENT_ORDER]
  return (
    <div className="dyc-edge mt-20 overflow-hidden md:mt-28" aria-hidden="true">
      <div className="dyc-slide flex w-max items-center whitespace-nowrap">
        {loop.map((w, i) => (
          <span key={`${w}-${i}`} className="flex items-center">
            <span
              className="px-8 font-[font7] uppercase text-transparent md:px-12"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 4.75rem)', WebkitTextStroke: '1px rgba(255,255,255,0.28)' }}
            >
              {w}
            </span>
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500/80" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   FILTER — pill tabs with a sliding highlight
   ────────────────────────────────────────────────────────────── */
const FilterBar = ({ filters, counts, active, onChange }) => {
  const scroller = useRef(null)
  const refs = useRef({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const measure = useCallback(() => {
    const el = refs.current[active]
    const sc = scroller.current
    if (!el || !sc) return
    setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
    sc.scrollTo({ left: el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])

  useLayoutEffect(() => {
    measure()
  }, [measure, filters.length])

  useEffect(() => {
    window.addEventListener('resize', measure)
    document.fonts?.ready?.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  return (
    <div className="flex justify-center px-5">
      <div
        ref={scroller}
        role="group"
        aria-label="Filter photos by event"
        className="max-w-full overflow-x-auto rounded-full border border-white/10 bg-white/4 p-1.5 backdrop-blur-md scrollbar-none"
      >
        <div className="relative flex w-max gap-1">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 rounded-full bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)] transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ left: pill.left, width: pill.width, opacity: pill.ready ? 1 : 0 }}
          />
          {filters.map((f) => {
            const on = active === f
            return (
              <button
                key={f}
                ref={(el) => (refs.current[f] = el)}
                type="button"
                onClick={() => onChange(f)}
                aria-pressed={on}
                className={`relative z-10 shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  on ? 'text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                {f}
                <sup className={`ml-1 text-[10px] transition-colors duration-300 ${on ? 'text-black/55' : 'text-white/35'}`}>
                  {counts[f]}
                </sup>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PHOTO TILE — keeps the photo's own proportions, fades in once loaded
   ────────────────────────────────────────────────────────────── */
const Tile = ({ photo, index, dimmed, onHover, onOpen, onBroken }) => {
  const imgRef = useRef(null)
  const [ratio, setRatio] = useState(null)

  const done = (el) => {
    if (el.naturalWidth) setRatio(clamp(el.naturalWidth / el.naturalHeight, 0.62, 1.6))
  }

  // a cached image can finish loading before React attaches onLoad
  useEffect(() => {
    const el = imgRef.current
    if (el?.complete && el.naturalWidth) done(el)
  }, [])

  return (
    <Reveal delay={(index % 3) * 90} className="mb-3 break-inside-avoid md:mb-5">
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={onHover}
        onFocus={onHover}
        aria-label={`Open photo: ${photo.event} — ${titleOf(photo)}`}
        className="group relative block w-full overflow-hidden rounded-2xl bg-white/5 text-left ring-1 ring-white/10 transition-[box-shadow,filter] duration-500 hover:shadow-[0_24px_70px_rgba(239,68,68,0.22)] hover:ring-red-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        style={{ aspectRatio: ratio ?? 0.8, filter: dimmed ? 'brightness(.5)' : 'none' }}
      >
        {ratio === null && <span className="dyc-skeleton absolute inset-0" aria-hidden="true" />}

        <img
          ref={imgRef}
          src={photo.src}
          alt=""
          loading="lazy"
          draggable="false"
          onLoad={(e) => done(e.currentTarget)}
          onError={() => onBroken(photo.src)}
          className="absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-900 ease-out group-hover:scale-[1.06]"
          style={{ opacity: ratio === null ? 0 : 1 }}
        />

        <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />

        <span className="pointer-events-none absolute right-3 top-3 flex h-10 w-10 -translate-y-1 scale-75 items-center justify-center rounded-full bg-white text-sm text-black opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100">
          ↗
        </span>

        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <span className="block text-xs text-red-400">{photo.event}</span>
          <span className="mt-0.5 block text-sm text-white">{titleOf(photo)}</span>
        </span>
      </button>
    </Reveal>
  )
}

/* ──────────────────────────────────────────────────────────────
   MEMORY WALL — polaroids stuck on a plaster wall under string lights
   ────────────────────────────────────────────────────────────── */

const PIN_COLORS = ['#ef4444', '#facc15', '#60a5fa', '#34d399']
const TAPE = 'bg-amber-100/60 shadow-[0_2px_4px_rgba(0,0,0,0.25)] [clip-path:polygon(2%_0,98%_0,100%_50%,98%_100%,2%_100%,0_50%)]'

/* how one polaroid hangs: tilt, nudge, size and how it is stuck on. Same photo, same look every time. */
const hang = (i) => {
  let rot = (rand(i + 1) * 2 - 1) * 6.5
  if (Math.abs(rot) < 1.5) rot = rot < 0 ? -1.5 : 1.5
  return {
    rot,
    dx: Math.round((rand(i + 9) * 2 - 1) * 10),
    dy: Math.round(rand(i + 17) * 26),
    scale: 0.95 + rand(i + 25) * 0.1,
    dur: 4 + rand(i + 33) * 3,
    del: -rand(i + 41) * 4,
    kind: ['pin', 'tape', 'tapes', 'pin'][(i * 7 + 3) % 4],
    color: PIN_COLORS[i % PIN_COLORS.length],
  }
}

const Pin = ({ color }) => (
  <span className="pointer-events-none absolute -top-2.5 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
    <span
      className="block h-4 w-4 rounded-full shadow-[0_5px_7px_rgba(0,0,0,0.5)]"
      style={{ background: `radial-gradient(circle at 32% 30%, #ffffffcc 0 12%, ${color} 42%, #00000066 130%)` }}
    />
  </span>
)

const Decor = ({ kind, color }) => {
  if (kind === 'pin') return <Pin color={color} />
  if (kind === 'tape')
    return <span aria-hidden="true" className={`pointer-events-none absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 ${TAPE}`} />
  return (
    <>
      <span aria-hidden="true" className={`pointer-events-none absolute -left-5 top-0 z-10 h-5 w-16 rotate-[-38deg] ${TAPE}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute -right-5 top-0 z-10 h-5 w-16 rotate-38 ${TAPE}`} />
    </>
  )
}

/* drops onto the wall (with a tiny bounce) when it scrolls into view */
const Pinned = ({ index, children }) => {
  const [ref, seen] = useInView(0.12, '0px 0px -30px 0px')
  const delay = (index % 4) * 90 + Math.floor(index / 4) * 50
  return (
    <div
      ref={ref}
      className="relative hover:z-40 focus-within:z-40"
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'none' : 'translateY(-48px) scale(1.12)',
        transition: `opacity .6s ease ${delay}ms, transform .95s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const Polaroid = ({ photo, index, onOpen, onBroken }) => {
  const h = hang(index)
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = imgRef.current
    if (el?.complete && el.naturalWidth) setLoaded(true)
  }, [])

  return (
    <div style={{ marginTop: h.dy, marginLeft: h.dx }}>
      <Pinned index={index}>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open photo: ${photo.event} — ${titleOf(photo)}`}
          className="dyc-pol group relative block w-full bg-[#f6f2ea] p-2.5 pb-0 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/70 md:p-3 md:pb-0"
          style={{ '--rot': `${h.rot}deg`, '--s': h.scale, '--dur': `${h.dur}s`, '--del': `${h.del}s` }}
        >
          <Decor kind={h.kind} color={h.color} />

          <span className="relative block aspect-square overflow-hidden bg-neutral-800 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]">
            {!loaded && <span className="dyc-skeleton absolute inset-0" aria-hidden="true" />}
            <img
              ref={imgRef}
              src={photo.src}
              alt=""
              loading="lazy"
              draggable="false"
              onLoad={() => setLoaded(true)}
              onError={() => onBroken(photo.src)}
              className="absolute inset-0 h-full w-full object-cover object-[50%_30%] transition-[transform,opacity] duration-700 ease-out filter-[saturate(1.08)_contrast(1.05)] group-hover:scale-[1.05]"
              style={{ opacity: loaded ? 1 : 0 }}
            />
            {/* glossy print sheen */}
            <span className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/25 via-transparent to-black/10" />
          </span>

          <span className="dyc-hand flex h-16 flex-col items-center justify-center px-1 leading-none text-[#2a2420] md:h-18">
            <span className="max-w-full truncate text-[1.45rem] md:text-[1.7rem]">{titleOf(photo)}</span>
            <span className="mt-0.5 max-w-full truncate text-sm text-[#2a2420]/55">{photo.event}</span>
          </span>
        </button>
      </Pinned>
    </div>
  )
}

/* the last space on the wall is an open invitation */
const EmptySlot = ({ index }) => {
  const h = hang(index)
  return (
    <div style={{ marginTop: h.dy, marginLeft: h.dx }}>
      <Pinned index={index}>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tag us on Instagram to get your photo on the wall"
          className="dyc-pol group relative block w-full bg-[#f6f2ea]/6 p-2.5 pb-0 outline-dashed outline-2 -outline-offset-4 outline-white/25 transition-colors hover:bg-[#f6f2ea]/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/70 md:p-3 md:pb-0"
          style={{ '--rot': `${h.rot}deg`, '--s': h.scale, '--dur': `${h.dur}s`, '--del': `${h.del}s` }}
        >
          <Decor kind="tape" color={h.color} />
          <span className="flex aspect-square flex-col items-center justify-center gap-3 text-white/55 transition-colors group-hover:text-white">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-current text-3xl leading-none">+</span>
            <span className="dyc-hand text-2xl">your moment here</span>
          </span>
          <span className="dyc-hand flex h-16 items-center justify-center text-xl text-red-300 md:h-18 md:text-2xl">tag us on Instagram ↗</span>
        </a>
      </Pinned>
    </div>
  )
}

/* a drooping wire with little glowing bulbs, along the top of the wall */
const SWAGS = 4
const BULB_COLORS = ['#fde68a', '#fca5a5', '#ffffff', '#fdba74']
const bulbs = Array.from({ length: SWAGS * 3 }, (_, n) => {
  const k = Math.floor(n / 3)
  const t = [0.25, 0.5, 0.75][n % 3]
  const y = 2 * ((1 - t) ** 2 + t ** 2) + 60 * t * (1 - t) // same curve as the wire below
  return {
    left: ((k * 100 + t * 100) / (SWAGS * 100)) * 100,
    top: (y / 30) * 100,
    color: BULB_COLORS[n % BULB_COLORS.length],
    delay: -((n * 0.37) % 2.6),
  }
})
const WIRE = `M0,2 ${Array.from({ length: SWAGS }, (_, k) => `Q${k * 100 + 50},30 ${(k + 1) * 100},2`).join(' ')}`

const StringLights = () => (
  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-11 md:h-14" aria-hidden="true">
    <svg viewBox={`0 0 ${SWAGS * 100} 30`} preserveAspectRatio="none" className="h-full w-full">
      <path d={WIRE} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
    {bulbs.map((b, i) => (
      <span
        key={i}
        className="dyc-twinkle absolute h-2 w-2 -translate-x-1/2 rounded-full"
        style={{
          left: `${b.left}%`,
          top: `calc(${b.top}% + 2px)`,
          background: b.color,
          boxShadow: `0 0 14px 4px ${b.color}88`,
          animationDelay: `${b.delay}s`,
        }}
      />
    ))}
  </div>
)

const MemoryWall = ({ photos, onOpen, onBroken }) => {
  // a steady shuffle, so the wall never looks like the grid above it
  const wall = useMemo(() => [...photos].sort((a, b) => rand(hash(a.src)) - rand(hash(b.src))), [photos])

  return (
    <section aria-labelledby="wall-title" className="mx-auto mt-28 max-w-7xl px-5 md:mt-40 md:px-8">
      <Reveal>
        <div className="dyc-wall relative overflow-hidden rounded-4xl ring-1 ring-white/10">
          <StringLights />

          {/* sticky note, desktop only */}
          <div className="dyc-hand absolute right-10 top-24 z-20 hidden w-40 rotate-6 bg-amber-200 p-4 pt-6 text-2xl leading-tight text-neutral-800 shadow-[0_14px_26px_rgba(0,0,0,0.45)] lg:block">
            <span aria-hidden="true" className={`absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-2 ${TAPE}`} />
            {STICKY_NOTE}
          </div>

          <div className="relative z-10 px-5 pb-16 pt-24 md:px-12 md:pb-24 md:pt-32">
            <div className="text-center">
              <Eyebrow>The wall</Eyebrow>
              <h2 id="wall-title" className="mt-5 font-[font7] text-4xl uppercase leading-none md:text-7xl">
                Pinned <span className="text-red-500">forever</span>
              </h2>
              <p className="dyc-hand mx-auto mt-4 max-w-md -rotate-1 text-2xl text-amber-200/80 md:text-3xl">
                every photo, every story, stuck right here
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-x-5 gap-y-12 md:mt-20 md:grid-cols-3 md:gap-x-8 md:gap-y-14 lg:grid-cols-4">
              {wall.map((p, i) => (
                <Polaroid key={p.src} photo={p} index={i} onOpen={() => onOpen(wall, i)} onBroken={onBroken} />
              ))}
              <EmptySlot index={wall.length} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   LIGHTBOX — blurred backdrop, arrows, swipe, thumbnail strip
   ────────────────────────────────────────────────────────────── */
const Lightbox = ({ list, index, onClose, onGo, onSet }) => {
  const photo = list[index]
  const panel = useRef(null)
  const closeBtn = useRef(null)
  const strip = useRef(null)
  const touchX = useRef(null)
  const handlers = useRef({ onClose, onGo })
  handlers.current = { onClose, onGo }

  useEffect(() => {
    const previous = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') handlers.current.onClose()
      else if (e.key === 'ArrowLeft') handlers.current.onGo(-1)
      else if (e.key === 'ArrowRight') handlers.current.onGo(1)
      else if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('button:not([disabled])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
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
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [])

  // warm up the neighbours so arrows feel instant
  useEffect(() => {
    ;[-1, 1].forEach((d) => {
      const n = list[(index + d + list.length) % list.length]
      if (n) new Image().src = n.src
    })
  }, [index, list])

  // keep the active thumbnail centred
  useEffect(() => {
    const s = strip.current
    const el = s?.children[index]
    if (!s || !el) return
    s.scrollTo({ left: el.offsetLeft - (s.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [index])

  if (!photo) return null

  const arrow =
    'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-2xl text-white/70 backdrop-blur-md transition-colors hover:border-white/60 hover:text-white md:flex'

  return (
    <div
      ref={panel}
      className="fixed inset-0 z-100 flex flex-col"
      style={{ animation: 'dyc-fade .3s ease' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.event} — ${titleOf(photo)}`}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) onGo(dx < 0 ? 1 : -1)
      }}
    >
      {/* the current photo, blurred, as an ambient backdrop */}
      <img
        key={`bg-${photo.src}`}
        src={photo.src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* top bar */}
      <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 text-sm text-white/60">
          <span className="tabular-nums">
            {pad2(index + 1)} / {pad2(list.length)}
          </span>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl leading-none text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black"
          >
            ×
          </button>
        </div>
        <div className="h-px w-full bg-white/10">
          <div
            className="h-full bg-red-500 transition-[width] duration-500 ease-out"
            style={{ width: `${((index + 1) / list.length) * 100}%` }}
          />
        </div>
      </div>

      {/* photo */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-4 md:px-24">
        <button type="button" onClick={(e) => { e.stopPropagation(); onGo(-1) }} className={`${arrow} left-6`} aria-label="Previous photo">
          ‹
        </button>
        <img
          key={photo.src}
          src={photo.src}
          alt={`${photo.event} — ${titleOf(photo)}`}
          draggable="false"
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain shadow-[0_30px_120px_rgba(0,0,0,0.6)]"
          style={{ animation: 'dyc-zoom .5s cubic-bezier(.22,1,.36,1)' }}
        />
        <button type="button" onClick={(e) => { e.stopPropagation(); onGo(1) }} className={`${arrow} right-6`} aria-label="Next photo">
          ›
        </button>
      </div>

      {/* caption + thumbnails */}
      <div className="relative z-10 pb-5" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pb-4 text-center">
          <p className="text-sm text-red-400">{photo.event}</p>
          <p className="mt-1 text-lg">{titleOf(photo)}</p>
        </div>

        {list.length > 1 && (
          <div
            ref={strip}
            className="relative mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 py-1 scrollbar-none"
          >
            {list.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => onSet(i)}
                aria-label={`Show photo ${i + 1}: ${titleOf(p)}`}
                aria-current={i === index ? 'true' : undefined}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg transition duration-300 md:h-16 md:w-16 ${
                  i === index ? 'scale-105 opacity-100 ring-2 ring-red-500' : 'opacity-45 hover:opacity-90'
                }`}
              >
                <img src={p.src} alt="" loading="lazy" draggable="false" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */
const GalleryPage = () => {
  const [target, setTarget] = useState('All') // the pill the visitor just chose
  const [filter, setFilter] = useState('All') // what the grid is showing
  const [phase, setPhase] = useState('in') // grid fades out, swaps, fades back in
  const [hovered, setHovered] = useState(null)
  const [box, setBox] = useState(null) // { list, index }
  const [broken, setBroken] = useState(() => new Set()) // missing image files drop out quietly
  const bar = useRef(null)
  const swap = useRef(0)

  useEffect(() => () => clearTimeout(swap.current), [])

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const d = document.documentElement
      const max = d.scrollHeight - d.clientHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
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

  const markBroken = useCallback((src) => {
    setBroken((prev) => (prev.has(src) ? prev : new Set(prev).add(src)))
  }, [])

  const all = useMemo(() => ALL_RAW.filter((p) => !broken.has(p.src)), [broken])
  const counts = useMemo(() => {
    const c = { All: all.length }
    EVENT_ORDER.forEach((e) => (c[e] = EVENT_PHOTOS[e].filter((p) => !broken.has(p.src)).length))
    return c
  }, [all, broken])
  const filters = useMemo(() => ['All', ...EVENT_ORDER.filter((e) => counts[e] > 0)], [counts])
  const photos = useMemo(
    () => (filter === 'All' ? all : EVENT_PHOTOS[filter].filter((p) => !broken.has(p.src))),
    [filter, all, broken]
  )

  const changeFilter = useCallback(
    (f) => {
      if (f === target) return
      clearTimeout(swap.current)
      setTarget(f)
      setPhase('out')
      swap.current = setTimeout(
        () => {
          setFilter(f)
          setHovered(null)
          setPhase('in')
        },
        REDUCED ? 0 : 240
      )
    },
    [target]
  )

  const open = useCallback((list, index) => setBox({ list, index }), [])
  const close = useCallback(() => setBox(null), [])
  const go = useCallback(
    (d) => setBox((b) => (b ? { ...b, index: (b.index + d + b.list.length) % b.list.length } : b)),
    []
  )
  const setIndex = useCallback((i) => setBox((b) => (b ? { ...b, index: i } : b)), [])

  const featuredOk = !broken.has(FEATURED.src)

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-black text-white">
      {/* reading progress */}
      <div className="fixed left-0 top-0 z-60 h-px w-full bg-white/5">
        <div ref={bar} className="h-full origin-left bg-red-500" style={{ transform: 'scaleX(0)' }} />
      </div>

      <StarBackground />
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-black via-red-950/20 to-black" />
      <div className="dyc-blob pointer-events-none fixed left-[8%] top-[18%] z-0 h-105 w-105 rounded-full bg-red-600/10 blur-[140px]" />
      <div className="dyc-blob dyc-blob-b pointer-events-none fixed bottom-[8%] right-[6%] z-0 h-90 w-90 rounded-full bg-purple-600/10 blur-[140px]" />

      <Link
        to="/"
        className="group fixed left-6 top-4 z-50 flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back
      </Link>

      <main className="relative z-10 pb-8 pt-28 md:pt-36">
        <Hero photos={all.length} events={filters.length - 1} />

        {featuredOk && (
          <Featured
            onOpen={() => open(all, Math.max(0, all.findIndex((p) => p.src === FEATURED.src)))}
            onBroken={markBroken}
          />
        )}

        <Marquee />

        {/* archive */}
        <section id="archive" className="mt-24 scroll-mt-10 md:mt-32">
          <Reveal className="px-5 text-center">
            <Eyebrow>The archive</Eyebrow>
            <h2 className="mt-5 font-[font7] text-3xl uppercase leading-none md:text-5xl">Browse by event</h2>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <FilterBar filters={filters} counts={counts} active={target} onChange={changeFilter} />
          </Reveal>

          <p className="mt-6 text-center text-xs uppercase tracking-[0.25em] text-white/40" aria-live="polite">
            {pad2(photos.length)} {photos.length === 1 ? 'photo' : 'photos'}
            {filter !== 'All' && <> · {filter}</>}
          </p>

          <div
            className="mx-auto mt-10 max-w-7xl px-5 md:px-8"
            style={{
              opacity: phase === 'in' ? 1 : 0,
              transform: phase === 'in' ? 'none' : 'translateY(14px)',
              transition: 'opacity .24s ease, transform .24s ease',
            }}
            onMouseLeave={() => setHovered(null)}
          >
            {photos.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/3 p-12 text-center text-gray-400">
                No photos here yet. Check back soon.
              </div>
            ) : (
              <div key={filter} className="columns-2 gap-3 md:gap-5 lg:columns-3">
                {photos.map((p, i) => (
                  <Tile
                    key={p.src}
                    photo={p}
                    index={i}
                    dimmed={hovered !== null && hovered !== i}
                    onHover={() => setHovered(i)}
                    onOpen={() => open(photos, i)}
                    onBroken={markBroken}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* memory wall */}
        {all.length > 0 && <MemoryWall photos={all} onOpen={open} onBroken={markBroken} />}

        {/* closing call to action */}
        <Reveal className="mx-auto mt-28 max-w-4xl px-5 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/3 px-6 py-14 text-center backdrop-blur-md md:px-16 md:py-20">
            <Eyebrow>Your turn</Eyebrow>
            <h2 className="mt-6 font-[font7] text-3xl uppercase leading-[0.95] md:text-6xl">
              Were you there? <span className="text-red-500">Get featured.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-white/60">
              Tag us in your event photos and the best ones land in this gallery.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 px-8 py-3.5 text-sm font-medium transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                Tag us on Instagram ↗
              </a>
              <Link
                to="/join"
                className="rounded-full bg-red-500 px-8 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]"
              >
                Join the team ↗
              </Link>
            </div>
          </div>
        </Reveal>
      </main>

      {box && <Lightbox list={box.list} index={box.index} onClose={close} onGo={go} onSet={setIndex} />}

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');

        @keyframes dyc-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dyc-zoom { from { opacity: 0; transform: scale(.95) } to { opacity: 1; transform: none } }

        /* red shimmer sweeping across the accent words */
        .dyc-shimmer {
          background-image: linear-gradient(100deg, #ef4444 0%, #ef4444 40%, #fecaca 50%, #ef4444 60%, #ef4444 100%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: dyc-shine 4.5s linear infinite;
        }
        @keyframes dyc-shine {
          from { background-position: 150% 0 }
          to { background-position: -50% 0 }
        }

        /* scroll cue */
        .dyc-cue { animation: dyc-cue 1.8s ease-in-out infinite }
        @keyframes dyc-cue {
          0% { transform: translateY(-100%) }
          100% { transform: translateY(200%) }
        }

        /* endless event-name line: two identical halves, slide by exactly 50% */
        .dyc-edge {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .dyc-slide { animation: dyc-slide 55s linear infinite }
        .dyc-edge:hover .dyc-slide { animation-play-state: paused }
        @keyframes dyc-slide {
          from { transform: translateX(0) }
          to { transform: translateX(-50%) }
        }

        /* soft placeholder while a photo loads */
        .dyc-skeleton {
          background: linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 70%);
          background-size: 200% 100%;
          animation: dyc-skeleton 1.4s linear infinite;
        }
        @keyframes dyc-skeleton {
          from { background-position: 200% 0 }
          to { background-position: -200% 0 }
        }

        /* slow ambient glow drifting behind the page */
        .dyc-blob { animation: dyc-drift 26s ease-in-out infinite alternate }
        .dyc-blob-b { animation-duration: 32s; animation-direction: alternate-reverse }
        @keyframes dyc-drift {
          from { transform: translate3d(0, 0, 0) }
          to { transform: translate3d(60px, 40px, 0) }
        }

        /* handwriting for everything pinned to the wall */
        .dyc-hand { font-family: 'Caveat', 'Bradley Hand', 'Segoe Print', cursive; font-weight: 700; }

        /* the plaster wall: warm lamp light from the top, red glow from the bottom, grain and dark corners */
        .dyc-wall {
          background:
            radial-gradient(60% 38% at 50% 0%, rgba(255, 214, 150, 0.16), transparent 72%),
            radial-gradient(80% 55% at 50% 100%, rgba(239, 68, 68, 0.12), transparent 72%),
            linear-gradient(180deg, #1b1514, #110c0c);
          box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.7), 0 30px 100px rgba(239, 68, 68, 0.12);
        }
        .dyc-wall::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.2;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
        }

        /* a polaroid: hangs at its own angle, sways a touch, then straightens and lifts on hover */
        .dyc-pol {
          rotate: var(--rot);
          transform: scale(var(--s));
          transform-origin: 50% 6%;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.55), 0 2px 5px rgba(0, 0, 0, 0.4);
          transition: transform .55s cubic-bezier(.22, 1, .36, 1), rotate .55s cubic-bezier(.22, 1, .36, 1), box-shadow .55s ease;
          animation: dyc-sway var(--dur) ease-in-out var(--del) infinite alternate;
        }
        .dyc-pol:hover, .dyc-pol:focus-visible {
          animation: none;
          rotate: 0deg;
          transform: translateY(-10px) scale(1.1);
          box-shadow: 0 34px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(239, 68, 68, 0.18);
        }
        @keyframes dyc-sway {
          from { rotate: calc(var(--rot) - 0.9deg) }
          to { rotate: calc(var(--rot) + 0.9deg) }
        }

        /* string-light bulbs flicker gently */
        .dyc-twinkle { animation: dyc-twinkle 2.6s ease-in-out infinite alternate }
        @keyframes dyc-twinkle {
          from { opacity: .45; transform: translateX(-50%) scale(.85) }
          to { opacity: 1; transform: translateX(-50%) scale(1.1) }
        }

        @media (prefers-reduced-motion: reduce) {
          .dyc-shimmer, .dyc-cue, .dyc-slide, .dyc-skeleton, .dyc-blob, .dyc-pol, .dyc-twinkle { animation: none !important }
          .dyc-word { transform: none !important; transition: none !important }
          .dyc-edge { overflow-x: auto }
        }
      `}</style>
    </div>
  )
}

// Gatekeeper: while GALLERY_PAGE_OPEN is false, this page redirects to Home.
const Gallery = () => {
  if (!GALLERY_PAGE_OPEN) return <Navigate to="/" replace />
  return <GalleryPage />
}

export default Gallery