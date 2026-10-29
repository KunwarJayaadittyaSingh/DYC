import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Footer from './Footer'
import StarBackground from '../Components/StarBackground'

/* ──────────────────────────────────────────────────────────────
   PAGE SWITCH
   true  = Sponsors page is open
   false = anyone visiting this page (navbar click or typed URL) is sent to Home
   ────────────────────────────────────────────────────────────── */
const SPONSORS_PAGE_OPEN = true

/* ──────────────────────────────────────────────────────────────
   CONTENT — edit freely
   ────────────────────────────────────────────────────────────── */

const FOUNDED = 2013
const FLAGSHIP_COUNT = 4

/*
  ARTISTS — ⚠ PLACEHOLDERS. Replace every entry with the real artists
  who performed on your campus.
  photo    : '/images/artists/your-file.jpg'  (portrait works best, ~800x1000)
             If missing/broken, a coloured card with initials shows instead.
  featured : true  → shown as a big headliner card
  url      : optional (Instagram / YouTube link). Leave '' to hide the button.
*/
const ARTISTS = [
  { name: 'Headliner Name', genre: 'Live Band', event: 'Cultural Night', year: 2025, date: '14 Mar 2025', photo: '/images/artists/artist-01.jpg', featured: true, bio: 'Write 2–3 lines here: what they performed, how the crowd reacted, and why the night was special.', url: '' },
  { name: 'Headliner Name Two', genre: 'EDM', event: 'Annual Fest', year: 2024, date: '22 Feb 2024', photo: '/images/artists/artist-02.jpg', featured: true, bio: 'Write 2–3 lines here about this performance.', url: '' },
  { name: 'Artist Name 03', genre: 'Rapper', event: 'Cultural Night', year: 2025, date: '14 Mar 2025', photo: '/images/artists/artist-03.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 04', genre: 'Stand-up Comedy', event: 'Annual Fest', year: 2025, date: '15 Mar 2025', photo: '/images/artists/artist-04.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 05', genre: 'Playback Singer', event: 'Annual Fest', year: 2024, date: '23 Feb 2024', photo: '/images/artists/artist-05.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 06', genre: 'DJ', event: 'Tech Fest', year: 2024, date: '10 Oct 2024', photo: '/images/artists/artist-06.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 07', genre: 'Folk', event: 'Cultural Night', year: 2023, date: '18 Mar 2023', photo: '/images/artists/artist-07.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 08', genre: 'Live Band', event: 'Annual Fest', year: 2023, date: '19 Mar 2023', photo: '/images/artists/artist-08.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 09', genre: 'Stand-up Comedy', event: 'Tech Fest', year: 2022, date: '05 Nov 2022', photo: '/images/artists/artist-09.jpg', bio: 'Short story about this artist’s set.', url: '' },
  { name: 'Artist Name 10', genre: 'Rapper', event: 'Cultural Night', year: 2022, date: '12 Mar 2022', photo: '/images/artists/artist-10.jpg', bio: 'Short story about this artist’s set.', url: '' },
]

/* `logo` optional (name shows as text if missing or broken). `url` optional. */
const SPONSORS = [
  { name: 'Amazon', logo: '/images/sponsors/amazon.jpg', url: 'https://www.amazon.com', tagline: 'Powering fast, reliable delivery for every event.' },
  { name: 'Canon', logo: '/images/sponsors/canon.png', url: 'https://in.canon/en/consumer', tagline: 'Capturing every moment in stunning detail.' },
  { name: 'Café Coffee Day', logo: '/images/sponsors/ccd.png', url: 'https://www.cafecoffeeday.com', tagline: 'Fueling late-night prep with great coffee.' },
  { name: 'Coca-Cola', logo: '/images/sponsors/coca-cola-new.png', url: 'https://www.coca-colacompany.com', tagline: 'Refreshing every celebration, big or small.' },
  { name: 'eBay', logo: '/images/sponsors/ebay.webp', url: 'https://www.ebay.com', tagline: 'Connecting our community to what they need.' },
  { name: 'KTM', logo: '/images/sponsors/ktm.webp', url: 'https://www.ktm.com/en-int.html', tagline: 'Built for speed, just like our events.' },
  { name: 'MTV', logo: '/images/sponsors/mtv-new.png', url: 'https://www.mtv.com', tagline: 'Amplifying youth culture and creativity.' },
  { name: 'UBON', logo: '/images/sponsors/ubon.jpeg', url: 'https://ubonindia.com', tagline: 'Sound that moves every crowd.' },
  { name: 'Nook Nosh', logo: '/images/sponsors/nooknosh.webp', url: 'https://nooknosh.in', tagline: 'A valued partner in our journey.' },
  { name: 'Muddy Water', logo: '/images/sponsors/muddy_water.jpeg', url: 'https://muddy-water.com', tagline: 'A valued partner in our journey.' },
  { name: 'Hilary Rhoda', logo: '/images/sponsors/hilary-rhoda.jpeg', url: 'https://hilaryrhoda.in', tagline: 'A valued partner in our journey.' },
  { name: 'Pizza Hut', logo: '', url: '', tagline: 'Bakes the yummiest pizza in town.' },
  { name: "McDonald's", logo: '', url: '', tagline: 'Serves the freshest burgers.' },
  { name: 'Burger King', logo: '', url: '', tagline: 'Serves the freshest burgers.' },
  { name: 'Myntra', logo: '', url: '', tagline: 'Gen Z styles are here.' },
  { name: 'Stylz', logo: '', url: '', tagline: 'Best custom designs.' },
]

/* ──────────────────────────────────────────────────────────────
   HELPERS + HOOKS
   ────────────────────────────────────────────────────────────── */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const pad = (n) => String(n).padStart(2, '0')
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const gradientFor = (name) => {
  const sum = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  const hue = (345 + (sum % 6) * 14) % 360
  return [`hsl(${hue} 75% 38%)`, `hsl(${(hue + 35) % 360} 70% 12%)`]
}

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

const useInView = (threshold = 0.2) => {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen]
}

/** 0→1 as an element scrolls out through the TOP of the screen (0 when untouched at page top) */
const useExitProgress = () => {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setProgress(clamp(-rect.top / rect.height, 0, 1))
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
  return [ref, progress]
}

const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, seen] = useInView(0.12)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'translateY(0)' : 'translateY(36px)',
        filter: seen ? 'blur(0)' : 'blur(6px)',
        transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const CountUp = ({ to, duration = 1800 }) => {
  const [ref, seen] = useInView(0.5)
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return <span ref={ref}>{value}</span>
}

const SectionHead = ({ eyebrow, children, sub }) => (
  <Reveal className="mb-12 max-w-3xl">
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-500">{eyebrow}</p>
    <h2 className="font-display leading-[1.05] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 4.6rem)' }}>
      {children}
    </h2>
    {sub && <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-400 md:text-lg">{sub}</p>}
  </Reveal>
)

/* ──────────────────────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────────────────────── */

const Hero = ({ reduced }) => {
  const [ref, p] = useExitProgress()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const letters = (text, delay) =>
    text.split('').map((l, i) => (
      <span
        key={`${text}-${i}`}
        className="inline-block"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0) rotateX(0)' : 'translateY(70%) rotateX(-80deg)',
          transition: `all 1.1s cubic-bezier(0.22,1,0.36,1) ${delay + i * 0.05}s`,
        }}
      >
        {l === ' ' ? '\u00A0' : l}
      </span>
    ))

  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })

  return (
    <section ref={ref} className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-5 pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(220,38,38,0.22),transparent_70%)]" />

      <div
        className="relative z-10 w-full max-w-7xl text-center"
        style={{ transform: reduced ? 'none' : `translateY(${p * -90}px)`, opacity: 1 - p * 0.9 }}
      >
        <p
          className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-red-400 md:text-sm"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 0.2s' }}
        >
          {ARTISTS.length} artists · {SPONSORS.length} partners · one campus
        </p>

        <h1 className="font-display leading-none tracking-tight" aria-label="Artists and Sponsors">
          <span
            className="block text-transparent"
            style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3.6rem)', WebkitTextStroke: '1.5px rgba(255,255,255,0.75)' }}
          >
            {letters('On our stage', 0.2)}
          </span>
          <span className="mt-2 block whitespace-nowrap text-white" style={{ fontSize: 'clamp(2.8rem, 12vw, 10rem)', letterSpacing: '-0.05em' }}>
            {letters('Artists', 0.5)}
          </span>
          <span
            className="block whitespace-nowrap text-red-500"
            style={{ fontSize: 'clamp(2.8rem, 12vw, 10rem)', letterSpacing: '-0.05em', textShadow: '0 0 60px rgba(239,68,68,0.7)' }}
          >
            {letters('& Sponsors', 0.85)}
          </span>
        </h1>

        <p
          className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-gray-400 md:text-xl"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(20px)',
            transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 1.3s',
          }}
        >
          The voices that shook our campus, and the brands that made every night possible.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 1.6s' }}
        >
          <button
            type="button"
            onClick={() => jump('artists')}
            className="rounded-full bg-red-500 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]"
          >
            Meet the artists ↓
          </button>
          <button
            type="button"
            onClick={() => jump('sponsors')}
            className="rounded-full border border-white/20 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:border-red-400/60 hover:text-white"
          >
            Our sponsors ↓
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ opacity: (1 - p * 4) * (loaded ? 1 : 0), transition: 'opacity 0.6s ease 1.8s' }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/50">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/10">
          <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-red-400" />
        </span>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   ARTISTS
   ────────────────────────────────────────────────────────────── */

/** Photo with automatic fallback to a coloured card with initials */
const ArtistPhoto = ({ artist, className = '', initialsClass = 'text-5xl' }) => {
  const [failed, setFailed] = useState(false)
  if (artist.photo && !failed) {
    return (
      <img
        src={artist.photo}
        alt={artist.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    )
  }
  const [from, to] = gradientFor(artist.name)
  return (
    <div
      role="img"
      aria-label={artist.name}
      className={`flex items-center justify-center ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className={`font-display text-white/80 ${initialsClass}`}>{initials(artist.name)}</span>
    </div>
  )
}

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
      active
        ? 'border-red-500 bg-red-500 text-black'
        : 'border-white/15 text-white/60 hover:border-red-400/60 hover:text-white'
    }`}
  >
    {children}
  </button>
)

const ArtistCard = ({ artist, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label={`View ${artist.name}`}
    className="group relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-left transition-colors duration-300 hover:border-red-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
  >
    <ArtistPhoto
      artist={artist}
      initialsClass={artist.featured ? 'text-8xl' : 'text-5xl'}
      className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />

    <div className="absolute left-4 top-4 flex items-center gap-2">
      <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] font-semibold tabular-nums text-white/80 backdrop-blur-md">
        {artist.year}
      </span>
      {artist.featured && (
        <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
          Headliner
        </span>
      )}
    </div>

    <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:rotate-45 group-hover:border-red-500 group-hover:bg-red-500 group-hover:text-black group-hover:opacity-100">
      ↗
    </span>

    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">{artist.genre}</p>
      <h3
        className="mt-1 font-display leading-[1.05] tracking-[-0.03em] text-white"
        style={{ fontSize: artist.featured ? 'clamp(1.8rem, 3.4vw, 3rem)' : 'clamp(1.15rem, 1.8vw, 1.5rem)' }}
      >
        {artist.name}
      </h3>
      <p className="mt-1 text-xs text-gray-400">{artist.event}</p>
      <span className="mt-3 block h-px w-0 bg-red-500 transition-all duration-500 group-hover:w-full" />
    </div>
  </button>
)

const ArtistModal = ({ artists, index, onClose, onNav }) => {
  const artist = artists[index]
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const handlers = useRef({ onClose, onNav })
  handlers.current = { onClose, onNav }

  useEffect(() => {
    const previous = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') handlers.current.onClose()
      else if (e.key === 'ArrowRight') handlers.current.onNav(1)
      else if (e.key === 'ArrowLeft') handlers.current.onNav(-1)
      else if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll('a[href], button:not([disabled])')
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

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="artist-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        ref={panelRef}
        className="modal-pop relative grid max-h-full w-full max-w-4xl overflow-hidden rounded-3xl border border-red-500/30 bg-neutral-950 md:grid-cols-2"
        style={{ boxShadow: '0 40px 120px rgba(239,68,68,0.28)' }}
      >
        <div className="relative h-64 md:h-auto md:min-h-120">
          <ArtistPhoto key={artist.name} artist={artist} initialsClass="text-8xl" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:via-transparent md:to-neutral-950" />
        </div>

        <div className="flex flex-col overflow-y-auto p-6 md:p-10">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-red-500 hover:bg-red-500 hover:text-black"
          >
            ✕
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-red-400">
            {artist.genre}
            {artist.featured && ' · Headliner'}
          </p>
          <h3 id="artist-title" className="mt-3 font-display leading-[1.02] tracking-[-0.03em]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            {artist.name}
          </h3>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-white/10 py-5 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Event</dt>
              <dd className="mt-1 text-white">{artist.event}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Date</dt>
              <dd className="mt-1 text-white">{artist.date || artist.year}</dd>
            </div>
          </dl>

          {artist.bio && <p className="mt-6 text-sm leading-relaxed text-gray-400 md:text-base">{artist.bio}</p>}

          {artist.url && (
            <a
              href={artist.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/50 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-red-300 transition hover:bg-red-500 hover:text-black"
            >
              Follow / Watch ↗
            </a>
          )}

          <div className="mt-auto flex items-center justify-between pt-8">
            <span className="font-display text-sm tabular-nums text-white/40">
              {pad(index + 1)} / {pad(artists.length)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNav(-1)}
                aria-label="Previous artist"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-red-500 hover:text-red-400"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onNav(1)}
                aria-label="Next artist"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-red-500 hover:text-red-400"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Artists = () => {
  const [year, setYear] = useState('all')
  const [genre, setGenre] = useState('all')
  const [open, setOpen] = useState(-1)

  const years = useMemo(() => [...new Set(ARTISTS.map((a) => a.year))].sort((a, b) => b - a), [])
  const genres = useMemo(() => [...new Set(ARTISTS.map((a) => a.genre))].sort(), [])

  const list = useMemo(
    () =>
      ARTISTS.filter((a) => (year === 'all' || a.year === year) && (genre === 'all' || a.genre === genre)).sort(
        (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.year - a.year
      ),
    [year, genre]
  )

  const close = useCallback(() => setOpen(-1), [])
  const nav = useCallback((d) => setOpen((i) => (i + d + list.length) % list.length), [list.length])
  const reset = () => {
    setYear('all')
    setGenre('all')
  }

  return (
    <section id="artists" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-16 md:px-10 md:py-28">
      <SectionHead
        eyebrow="Live on campus"
        sub="Every artist who has taken our stage. Tap a card for the story behind the night."
      >
        The ones who <span className="text-red-500">lit it up.</span>
      </SectionHead>

      {/* filters */}
      <Reveal className="mb-10 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by year">
          <Chip active={year === 'all'} onClick={() => setYear('all')}>All years</Chip>
          {years.map((y) => (
            <Chip key={y} active={year === y} onClick={() => setYear(y)}>{y}</Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by genre">
          <Chip active={genre === 'all'} onClick={() => setGenre('all')}>All genres</Chip>
          {genres.map((g) => (
            <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Chip>
          ))}
        </div>
        <p className="pt-1 text-xs uppercase tracking-[0.2em] text-gray-500" aria-live="polite">
          Showing {list.length} of {ARTISTS.length} artists
        </p>
      </Reveal>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center">
          <p className="text-lg text-gray-400">No artists match these filters.</p>
          <button type="button" onClick={reset} className="mt-5 text-sm font-semibold text-red-400 underline underline-offset-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div
          key={`${year}-${genre}`}
          className="grid grid-flow-dense auto-rows-60 grid-cols-2 gap-3 md:auto-rows-68 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
        >
          {list.map((a, i) => (
            <Reveal
              key={a.name}
              delay={Math.min(i, 6) * 70}
              className={`h-full ${a.featured ? 'col-span-2 row-span-2' : ''}`}
            >
              <ArtistCard artist={a} onOpen={() => setOpen(i)} />
            </Reveal>
          ))}
        </div>
      )}

      {open >= 0 && list[open] && <ArtistModal artists={list} index={open} onClose={close} onNav={nav} />}
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   SPONSORS — one clean sliding line, each sponsor shown once
   ────────────────────────────────────────────────────────────── */

/** Logo with automatic fallback to the sponsor's name if missing / broken */
const SponsorLogo = ({ sponsor, imgClass = '', textClass = '' }) => {
  const [failed, setFailed] = useState(false)
  if (!sponsor.logo || failed) {
    return <span className={`font-display text-center leading-tight tracking-tight ${textClass}`}>{sponsor.name}</span>
  }
  return <img src={sponsor.logo} alt={sponsor.name} onError={() => setFailed(true)} className={`object-contain ${imgClass}`} />
}

const SponsorChip = ({ sponsor, hidden }) => {
  const Tag = sponsor.url ? 'a' : 'div'
  const props = sponsor.url
    ? { href: sponsor.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Visit ${sponsor.name}`, tabIndex: hidden ? -1 : undefined }
    : {}
  return (
    <Tag
      {...props}
      title={sponsor.name}
      className="flex h-28 w-52 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(239,68,68,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <SponsorLogo sponsor={sponsor} imgClass="max-h-14 max-w-full" textClass="text-lg text-neutral-800" />
    </Tag>
  )
}

const Sponsors = () => (
  <section id="sponsors" className="scroll-mt-10 py-16 md:py-28">
    <div className="mx-auto max-w-7xl px-5 md:px-10">
      <SectionHead
        eyebrow="Our partners"
        sub="Brands that bet on student talent before it looked like a sure thing."
      >
        Backed by <span className="text-red-500">believers.</span>
      </SectionHead>
    </div>

    <Reveal>
      <div className="marquee-wrap overflow-hidden py-4">
        <ul className="marquee-track flex w-max" style={{ animationDuration: `${SPONSORS.length * 4}s` }}>
          {[...SPONSORS, ...SPONSORS].map((s, i) => (
            <li key={`${s.name}-${i}`} className="pr-5" aria-hidden={i >= SPONSORS.length ? 'true' : undefined}>
              <SponsorChip sponsor={s} hidden={i >= SPONSORS.length} />
            </li>
          ))}
        </ul>
      </div>
    </Reveal>

    <p className="mt-6 text-center text-xs uppercase tracking-[0.25em] text-gray-600">Hover to pause</p>
  </section>
)

/* ──────────────────────────────────────────────────────────────
   STATS
   ────────────────────────────────────────────────────────────── */

const Stats = () => {
  const items = [
    { value: ARTISTS.length, label: 'Artists hosted' },
    { value: SPONSORS.length, label: 'Partners on board' },
    { value: FLAGSHIP_COUNT, label: 'Flagship events' },
    { value: new Date().getFullYear() - FOUNDED, label: 'Years of building' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-red-500/15 bg-red-500/10 md:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="bg-black/90 p-8 text-center md:p-12">
            <p
              className="font-display leading-none tracking-[-0.04em] text-white"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', textShadow: '0 0 40px rgba(239,68,68,0.4)' }}
            >
              <CountUp to={s.value} />
            </p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 md:text-xs">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   CTA
   ────────────────────────────────────────────────────────────── */

const MagneticLink = ({ to, children }) => {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.3
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.45
    el.style.transform = `translate(${x}px, ${y}px)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)'
  }
  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mt-12 inline-block rounded-full bg-red-500 px-12 py-5 font-body text-sm font-bold uppercase tracking-[0.14em] text-black transition-[transform,background-color,box-shadow] duration-300 ease-out hover:bg-red-400 hover:shadow-[0_0_60px_rgba(239,68,68,0.55)]"
    >
      {children}
    </Link>
  )
}

const FinalCta = () => (
  <section className="relative mx-auto max-w-5xl px-5 pb-32 pt-16 text-center md:px-10 md:pt-28">
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-112 w-md -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/25 blur-[140px]" />
    <Reveal>
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Your turn</p>
      <h2 className="relative font-display leading-[1.02] tracking-[-0.04em]" style={{ fontSize: 'clamp(2.8rem, 8.5vw, 7rem)' }}>
        Put your name
        <br />
        <span className="text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">on the stage.</span>
      </h2>
      <p className="relative mx-auto mt-8 max-w-lg text-lg leading-relaxed text-gray-400">
        Reach thousands of young, curious, energetic people. Partner with us and become part of the next chapter.
      </p>
      <MagneticLink to="/contact">Become a Sponsor</MagneticLink>
    </Reveal>
  </section>
)

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

const SponsersPage = () => {
  const reduced = usePrefersReducedMotion()
  const [pageProgress, setPageProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        setPageProgress(max > 0 ? clamp(window.scrollY / max, 0, 1) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-body relative min-h-screen w-full overflow-x-clip bg-black text-white">
      <StarBackground />

      {/* top reading progress */}
      <div className="fixed inset-x-0 top-0 z-60 h-0.5 bg-transparent">
        <div
          className="h-full bg-linear-to-r from-red-700 via-red-400 to-white"
          style={{ width: `${pageProgress * 100}%`, boxShadow: '0 0 14px rgba(239,68,68,0.8)' }}
        />
      </div>

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/50 via-transparent to-black/40" />

      <Link
        to="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur-md transition-colors hover:border-red-400/50 hover:text-white"
      >
        ← Back
      </Link>

      <main className="relative z-10 w-full">
        <Hero reduced={reduced} />
        <Artists />
        <Sponsors />
        <Stats />
        <FinalCta />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .font-display {
          font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
          font-weight: 800;
        }
        .font-body {
          font-family: 'Inter', system-ui, sans-serif;
        }

        .marquee-wrap {
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .marquee-track {
          animation: marquee 60s linear infinite;
        }
        .marquee-wrap:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .scroll-cue {
          animation: scrollCue 1.8s ease-in-out infinite;
        }
        @keyframes scrollCue {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }

        .modal-pop {
          animation: modalPop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .scroll-cue, .modal-pop { animation: none !important; }
          .marquee-wrap { overflow-x: auto !important; }
        }
      `}</style>
    </div>
  )
}

// Gatekeeper: while SPONSORS_PAGE_OPEN is false, this page redirects to Home.
const Sponsers = () => {
  if (!SPONSORS_PAGE_OPEN) return <Navigate to="/" replace />
  return <SponsersPage />
}

export default Sponsers