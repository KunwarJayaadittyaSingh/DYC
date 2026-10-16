import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import StarBackground from '../Components/StarBackground'
import Footer from './Footer'

// Event order drives every section below — Youthvibe first since it's
// our flagship event. Add real photos under each event's array whenever
// you have them; placeholders stay until then.
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

// Attach `event` to each photo and flatten in EVENT_ORDER — this is the
// single source of truth every section below reads from.
const MASTER = EVENT_ORDER.flatMap((event) =>
  PHOTOS_BY_EVENT[event].map((photo) => ({ ...photo, event }))
)

const EVENT_FILTERS = ['All', ...EVENT_ORDER]

// Takes up to `n` photos from each event, in EVENT_ORDER, so every
// section is guaranteed to represent every event — no magic slice
// indexes that quietly drop an event when the data changes.
const takePerEvent = (n) =>
  EVENT_ORDER.flatMap((event) => PHOTOS_BY_EVENT[event].slice(0, n).map((p) => ({ ...p, event })))

const FEATURED = MASTER[0] // Youthvibe, always first
const MARQUEE_A = takePerEvent(2) // 2 photos per event, in order
const MARQUEE_B = takePerEvent(2).slice().reverse() // same coverage, opposite order/direction
const POLAROID = takePerEvent(2) // guarantees every event appears on the wall
const TOTAL_PHOTOS = MASTER.length

const ROTATIONS = [-6, 4, -3, 7, -8, 5, -4, 6, -5, 3, -7, 6]
const LIFTS = [0, 24, 8, 32, 4, 20, 12, 28, 6, 26, 10, 30]

const BENTO_SPANS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-2 row-span-1',
]

// Fires once when the element scrolls into view.
const useRevealOnView = (options = {}) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.1, ...options }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

// Tracks scroll progress through the whole page, 0 → 1.
const useScrollProgress = () => {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return progress
}

// ---------- Top scroll-progress bar ----------
const ScrollProgressBar = ({ progress }) => (
  <div className="fixed left-0 top-0 z-60 h-1 w-full bg-white/5">
    <div
      className="h-full bg-linear-to-r from-red-500 via-red-400 to-orange-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] transition-transform duration-150 ease-out"
      style={{ width: '100%', transform: `scaleX(${progress})`, transformOrigin: 'left' }}
    />
  </div>
)

// ---------- Event filter bar (with live counts) ----------
const FilterBar = ({ active, onChange }) => (
  <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-3 px-5">
    {EVENT_FILTERS.map((f) => {
      const count = f === 'All' ? TOTAL_PHOTOS : PHOTOS_BY_EVENT[f]?.length ?? 0
      const isActive = active === f
      return (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`group relative flex items-center gap-2 overflow-hidden rounded-full border px-5 py-2 text-xs uppercase tracking-widest transition-all duration-300 ${
            isActive
              ? 'border-red-500 bg-red-500 text-black font-semibold shadow-[0_0_25px_rgba(239,68,68,0.35)]'
              : 'border-white/15 bg-black/40 text-gray-300 hover:border-red-500/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>{f}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
              isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'
            }`}
          >
            {count}
          </span>
        </button>
      )
    })}
  </div>
)

// ---------- Live stats strip ----------
const StatsStrip = () => {
  const [ref, inView] = useRevealOnView({ threshold: 0.4 })
  const stats = [
    { label: 'Photos', value: TOTAL_PHOTOS },
    { label: 'Events', value: EVENT_ORDER.length },
    { label: 'Memories', value: '∞' },
  ]
  return (
    <div
      ref={ref}
      className="mx-auto mt-10 flex max-w-md items-center justify-center gap-8 px-5 text-center sm:gap-14"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center">
          <span className="font-[font7] text-2xl text-white md:text-3xl">{s.value}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-red-400/80">{s.label}</span>
          {i < stats.length - 1 && (
            <span className="absolute mt-0 hidden" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- Section label with animated line ----------
const SectionLabel = ({ eyebrow, title, inView }) => (
  <div
    className="flex items-end justify-between"
    style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}
  >
    <div>
      <p className="mb-2 flex items-center gap-3 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
        <span
          className="block h-px bg-red-500 transition-all duration-700"
          style={{ width: inView ? '28px' : '0px' }}
        />
        {eyebrow}
      </p>
      <h2 className="font-[font7] text-3xl uppercase text-white md:text-5xl">{title}</h2>
    </div>
  </div>
)

// ---------- Featured banner ----------
const FeaturedBanner = ({ image, onOpen }) => {
  const [ref, inView] = useRevealOnView({ threshold: 0.2 })

  return (
    <section ref={ref} className="relative z-10 mx-auto mt-16 w-full max-w-7xl px-5 md:px-0">
      <button
        onClick={onOpen}
        className="group relative block h-[60vh] w-full overflow-hidden rounded-4xl border border-white/10 transition-all duration-500 hover:border-red-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 md:h-[74vh]"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        <img
          src={image.src}
          alt={image.caption}
          className="h-full w-full object-cover transition-transform duration-1200 ease-out group-hover:scale-105"
          style={{ animation: 'dyc-slow-zoom 18s ease-in-out infinite alternate' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-linear-to-t from-red-900/30 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-8 text-left md:p-14">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.4em] text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Flagship Event
          </p>
          <h2 className="font-[font7] text-4xl uppercase leading-none text-white md:text-6xl">
            {image.caption}
          </h2>
        </div>

        <span className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs uppercase tracking-widest text-white backdrop-blur-sm transition-all duration-300 group-hover:border-red-500/50 group-hover:bg-red-500/20">
          View
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">↗</span>
        </span>
      </button>
    </section>
  )
}

// ---------- Bento tile with cursor-tracked 3D tilt + glare ----------
const BentoTile = ({ image, index, onOpen }) => {
  const [ref, inView] = useRevealOnView({ threshold: 0.1 })
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({ x: (py - 0.5) * -6, y: (px - 0.5) * 6, glareX: px * 100, glareY: py * 100 })
  }

  return (
    <button
      ref={(el) => {
        ref.current = el
        cardRef.current = el
      }}
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 })
      }}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${BENTO_SPANS[index % BENTO_SPANS.length]}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: `${inView ? 'scale(1)' : 'scale(0.94)'} perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovering
          ? 'transform 0.1s ease-out'
          : `opacity 0.7s ease ${(index % 7) * 0.06}s, transform 0.5s ease-out`,
        boxShadow: hovering ? '0 20px 50px rgba(239,68,68,0.2)' : 'none',
      }}
    >
      <img
        src={image.src}
        alt={image.caption}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Cursor glare */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(220px circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.15), transparent 60%)` }}
      />

      <span className="pointer-events-none absolute -bottom-3 -left-1 select-none font-[font7] text-[5rem] leading-none text-white/10 transition-colors duration-500 group-hover:text-red-500/25 md:text-[7rem]">
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-widest text-white/80 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        {image.event}
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/90 to-transparent p-5 transition-transform duration-400 ease-out group-hover:translate-y-0">
        <p className="text-sm uppercase tracking-widest text-white">{image.caption}</p>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-red-500/40" />
    </button>
  )
}

// ---------- Drag-to-explore carousel ----------
const DragCarousel = ({ images, onOpen }) => {
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [headingRef, headingInView] = useRevealOnView({ threshold: 0.3 })

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }

  useEffect(() => {
    handleScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  const scrollByCard = (dir) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' })
  }

  if (images.length === 0) return null

  return (
    <section className="relative z-10 mx-auto mt-28 w-full max-w-7xl px-5 md:px-0">
      <div ref={headingRef} className="mb-8">
        <SectionLabel eyebrow="The Reel" title="Drag To Explore" inView={headingInView} />
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="dyc-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(img)}
            className="group relative h-[50vh] w-[80vw] shrink-0 snap-center overflow-hidden rounded-[1.75rem] border border-white/10 transition-colors duration-300 hover:border-red-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 md:h-[58vh] md:w-[40vw]"
          >
            <img
              src={img.src}
              alt={img.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/0 to-black/10" />
            <span className="pointer-events-none absolute bottom-6 left-6 text-left">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-red-400">{img.event}</span>
              <span className="mt-1 block text-sm uppercase tracking-widest text-white">
                {img.caption}
              </span>
            </span>
            <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-red-500/40" />
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-sm items-center gap-3">
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-[35%] rounded-full bg-linear-to-r from-red-500 to-orange-400 transition-transform duration-150 ease-out"
            style={{ transform: `translateX(${progress * 185}%)` }}
          />
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scrollByCard(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 transition-colors hover:border-red-500/50 hover:text-white"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            onClick={() => scrollByCard(1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 transition-colors hover:border-red-500/50 hover:text-white"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

// ---------- Auto-scrolling marquee rows ----------
const MarqueeRow = ({ images, reverse, duration, onOpen }) => {
  if (images.length === 0) return null
  const loop = [...images, ...images]
  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="dyc-marquee-track flex w-max gap-5 py-2"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {loop.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(img)}
            className="group relative h-[30vh] w-[52vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 transition-colors duration-300 hover:border-red-500/40 md:h-[34vh] md:w-[22vw]"
          >
            <img
              src={img.src}
              alt={img.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-t from-black/80 to-transparent" />
            <span className="pointer-events-none absolute bottom-3 left-4 text-xs uppercase tracking-widest text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {img.caption}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- Polaroid scatter wall ----------
const PolaroidWall = ({ images, onOpen }) => {
  const [sectionRef, sectionInView] = useRevealOnView({ threshold: 0.1 })

  return (
    <section ref={sectionRef} className="relative z-10 mx-auto mt-28 w-full max-w-6xl px-5 md:px-0">
      <div className="mb-14 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
          The Wall
        </p>
        <h2 className="font-[font7] text-3xl uppercase text-white md:text-5xl">
          Pinned Memories
        </h2>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-4 md:gap-x-6">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(img)}
            className="group relative w-[42vw] shrink-0 rounded-lg border border-white/10 bg-white p-2 pb-8 shadow-[0_15px_35px_rgba(0,0,0,0.5)] focus:outline-none md:w-[16vw]"
            style={{
              transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg) translateY(${LIFTS[i % LIFTS.length]}px)`,
              opacity: sectionInView ? 1 : 0,
              transition: 'opacity 0.6s ease, transform 0.35s ease, z-index 0s',
              transitionDelay: `${(i % 8) * 0.06}s`,
              zIndex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg) translateY(-6px) scale(1.08)'
              e.currentTarget.style.zIndex = 20
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${ROTATIONS[i % ROTATIONS.length]}deg) translateY(${LIFTS[i % LIFTS.length]}px)`
              e.currentTarget.style.zIndex = 1
            }}
          >
            {/* Pin */}
            <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />

            <div className="aspect-4/5 w-full overflow-hidden bg-black">
              <img src={img.src} alt={img.caption} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-2 truncate px-1 text-left text-[10px] uppercase tracking-widest text-black/70">
              {img.caption}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

// ---------- CTA band ----------
const CTABand = () => {
  const [ref, inView] = useRevealOnView({ threshold: 0.3 })
  return (
    <section
      ref={ref}
      className="relative z-10 mx-auto mt-28 mb-8 w-full max-w-4xl overflow-hidden rounded-4xl border border-red-500/20 bg-linear-to-b from-red-950/40 to-black/70 px-8 py-16 text-center backdrop-blur-md md:px-16"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 blur-[80px]" />

      <h2 className="relative font-[font7] text-3xl uppercase text-white md:text-5xl">
        Want Your Moment <span className="text-red-500">Here?</span>
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl leading-relaxed text-gray-400">
        Tag us in your event photos and we'll feature the best ones in this gallery.
      </p>
      <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <a
          href="https://www.instagram.com/youthvibe.lpu/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-2 border-pink-600 bg-white px-8 py-4 text-sm font-bold uppercase text-black transition-all duration-300 hover:bg-pink-600 hover:text-white hover:shadow-[0_0_30px_rgba(219,39,119,0.4)]"
        >
          Tag Us On Instagram ↗
        </a>
        <Link
          to="/join"
          className="rounded-full bg-red-500 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]"
        >
          Join The Team ↗
        </Link>
      </div>
    </section>
  )
}

// ---------- Lightbox with prev/next + counter ----------
const Lightbox = ({ images, index, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const image = images[index]
  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-md"
      style={{ animation: 'dyc-fade-in 0.25s ease' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 text-3xl leading-none text-white/70 transition-colors hover:text-white"
        aria-label="Close"
      >
        ×
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-2xl text-white/70 transition-colors hover:border-red-500/50 hover:text-white md:left-8"
        aria-label="Previous image"
      >
        ‹
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-2xl text-white/70 transition-colors hover:border-red-500/50 hover:text-white md:right-8"
        aria-label="Next image"
      >
        ›
      </button>

      <div className="relative z-10 mx-auto flex max-h-[85vh] max-w-[88vw] flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={image.src} alt={image.caption} className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl" />
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
          <span className="rounded-full border border-red-500/30 px-3 py-1 text-[10px] uppercase tracking-widest text-red-400">
            {image.event}
          </span>
          <span className="uppercase tracking-widest text-white">{image.caption}</span>
          <span>{index + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  )
}

const Gallery = () => {
  const [headingRef, headingInView] = useRevealOnView({ threshold: 0.3 })
  const [bentoHeadingRef, bentoHeadingInView] = useRevealOnView({ threshold: 0.2 })
  const [filter, setFilter] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const sectionRef = useRef(null)
  const spotlightRef = useRef(null)
  const raf = useRef(null)
  const scrollProgress = useScrollProgress()

  useEffect(() => {
    const handleMove = (e) => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          if (spotlightRef.current) {
            spotlightRef.current.style.setProperty('--spot-x', `${x}px`)
            spotlightRef.current.style.setProperty('--spot-y', `${y}px`)
          }
          raf.current = null
        })
      }
    }
    const node = sectionRef.current
    node?.addEventListener('mousemove', handleMove)
    return () => node?.removeEventListener('mousemove', handleMove)
  }, [])

  // Filtered set drives the bento grid + carousel. The rest of the page
  // (marquee rows, polaroid wall, featured banner) stays fixed so there's
  // always content, and every event, even when a filter is active.
  const filtered = useMemo(
    () => (filter === 'All' ? MASTER.slice(1) : MASTER.filter((img) => img.event === filter)),
    [filter]
  )

  const bento = filtered.slice(0, 7)
  const carousel = filtered.slice(7, 13)

  const openLightbox = useCallback((img) => {
    const idx = MASTER.findIndex((m) => m === img)
    setLightboxIndex(idx === -1 ? 0 : idx)
  }, [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prevImage = useCallback(() => setLightboxIndex((i) => (i - 1 + MASTER.length) % MASTER.length), [])
  const nextImage = useCallback(() => setLightboxIndex((i) => (i + 1) % MASTER.length), [])

  return (
    <div ref={sectionRef} className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <ScrollProgressBar progress={scrollProgress} />
      <StarBackground />

      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-black via-red-950/30 to-black" />
      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/15 blur-[150px]" />

      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          '--spot-x': '50%',
          '--spot-y': '50%',
          background: 'radial-gradient(500px circle at var(--spot-x) var(--spot-y), rgba(239,68,68,0.08), transparent 70%)',
        }}
      />

      <Link to="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white">
        <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back
      </Link>

      <main className="relative z-10 w-full pt-24 pb-8 md:pt-32">
        <section
          ref={headingRef}
          className="mx-auto max-w-4xl px-5 text-center"
          style={{
            opacity: headingInView ? 1 : 0,
            transform: headingInView ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">Moments</p>
          <h1 className="font-[font7] text-[13vw] uppercase leading-[0.85] tracking-tight text-white md:text-[6vw]">
            Our{' '}
            <span className="bg-linear-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(239,68,68,0.35)]">
              Gallery
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            A look back at what DYC has built. Filter by event, click, drag, and scroll through every frame.
          </p>
        </section>

        <StatsStrip />

        <FilterBar active={filter} onChange={setFilter} />

        <FeaturedBanner image={FEATURED} onOpen={() => openLightbox(FEATURED)} />

        <div ref={bentoHeadingRef} className="mx-auto mt-28 max-w-7xl px-5 md:px-0">
          <SectionLabel eyebrow="The Collection" title={filter === 'All' ? 'Every Frame' : filter} inView={bentoHeadingInView} />
        </div>

        <section className="mx-auto mt-8 grid max-w-7xl auto-rows-45 grid-cols-2 gap-4 px-5 md:auto-rows-55 md:grid-cols-4 md:px-0">
          {bento.map((image, i) => (
            <BentoTile key={`${filter}-${i}`} image={image} index={i} onOpen={() => openLightbox(image)} />
          ))}
        </section>

        <DragCarousel images={carousel} onOpen={openLightbox} />

        <section className="mx-auto mt-28 max-w-7xl space-y-5">
          <MarqueeRow images={MARQUEE_A} reverse={false} duration={34} onOpen={openLightbox} />
          <MarqueeRow images={MARQUEE_B} reverse={true} duration={40} onOpen={openLightbox} />
        </section>

        <PolaroidWall images={POLAROID} onOpen={openLightbox} />

        <CTABand />
      </main>

      {lightboxIndex !== null && (
        <Lightbox images={MASTER} index={lightboxIndex} onClose={closeLightbox} onPrev={prevImage} onNext={nextImage} />
      )}

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @keyframes dyc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dyc-slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.12); }
        }
        @keyframes dyc-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .dyc-marquee-track {
          animation-name: dyc-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .dyc-marquee-track:hover { animation-play-state: paused; }
        .dyc-no-scrollbar::-webkit-scrollbar { display: none; }
        .dyc-no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @media (prefers-reduced-motion: reduce) {
          .dyc-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}

export default Gallery