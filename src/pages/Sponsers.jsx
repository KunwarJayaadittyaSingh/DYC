import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import StarBackground from '../Components/StarBackground'

/* ──────────────────────────────────────────────────────────────
   CONTENT — edit freely
   `logo` optional (null → name shows as text). `url` optional.
   If a logo file fails to load, the name is shown automatically.
   ────────────────────────────────────────────────────────────── */

const FOUNDED = 2013
const FLAGSHIP_COUNT = 4

const SPONSORS = [
  { name: 'Amazon', logo: '/images/sponsors/amazon.jpg', url: 'https://www.amazon.com', tagline: 'Powering fast, reliable delivery for every event.' },
  { name: 'Canon', logo: '/images/sponsors/canon.png', url: 'https://in.canon/en/consumer', tagline: 'Capturing every moment in stunning detail.' },
  { name: 'Café Coffee Day', logo: '/images/sponsors/ccd.png', url: 'https://www.cafecoffeeday.com', tagline: 'Fueling late-night prep with great coffee.' },
  { name: 'Coca-Cola', logo: '/images/sponsors/coca-cola.png', url: 'https://www.coca-colacompany.com', tagline: 'Refreshing every celebration, big or small.' },
  { name: 'eBay', logo: '/images/sponsors/ebay.webp', url: 'https://www.ebay.com', tagline: 'Connecting our community to what they need.' },
  { name: 'KTM', logo: '/images/sponsors/ktm.webp', url: 'https://www.ktm.com/en-int.html', tagline: 'Built for speed, just like our events.' },
  { name: 'MTV', logo: '/images/sponsors/mtv.png', url: 'https://www.mtv.com', tagline: 'Amplifying youth culture and creativity.' },
  { name: 'UBON', logo: '/images/sponsors/ubon.jpeg', url: 'https://ubonindia.com', tagline: 'Sound that moves every crowd.' },
  { name: 'Nook Nosh', logo: '/images/sponsors/nooknosh.webp', url: 'https://nooknosh.in', tagline: 'A valued partner in our journey.' },
  { name: 'Muddy Water', logo: '/images/sponsors/muddy_water.jpeg', url: 'https://muddy-water.com', tagline: 'A valued partner in our journey.' },
  { name: 'Hilary Rhoda', logo: '/images/sponsors/hilary-rhoda.jpeg', url: 'https://hilaryrhoda.in', tagline: 'A valued partner in our journey.' },
]

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const pad = (n) => String(n).padStart(2, '0')

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

/** 0→1 as an element travels up through the screen */
const useScrollProgress = () => {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      setProgress(clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.1), 0, 1))
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

/** Logo with automatic fallback to the sponsor's name if missing / broken */
const SponsorLogo = ({ sponsor, imgClass = '', textClass = '' }) => {
  const [failed, setFailed] = useState(false)
  if (!sponsor.logo || failed) {
    return <span className={`font-display text-center leading-tight tracking-tight ${textClass}`}>{sponsor.name}</span>
  }
  return <img src={sponsor.logo} alt={sponsor.name} onError={() => setFailed(true)} className={`object-contain ${imgClass}`} />
}

/* ──────────────────────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────────────────────── */

const SpinBadge = () => (
  <div className="relative h-28 w-28 md:h-40 md:w-40">
    <svg viewBox="0 0 120 120" className="spin-slow h-full w-full" aria-hidden="true">
      <defs>
        <path id="badgeCircle" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
      </defs>
      <text fill="rgba(255,255,255,0.8)" fontSize="9" className="font-display" style={{ letterSpacing: '0.16em' }}>
        <textPath href="#badgeCircle" textLength="292" lengthAdjust="spacing">
          THANK YOU ✦ THANK YOU ✦ THANK YOU ✦
        </textPath>
      </text>
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-2xl text-red-500 md:text-4xl">♥</span>
  </div>
)

const Hero = ({ reduced }) => {
  const [ref, p] = useScrollProgress()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const line = (text, delay, extra = {}) =>
    text.split('').map((l, i) => (
      <span
        key={`${text}-${i}`}
        className="inline-block"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0) rotateX(0)' : 'translateY(70%) rotateX(-80deg)',
          transition: `all 1.1s cubic-bezier(0.22,1,0.36,1) ${delay + i * 0.06}s`,
          ...extra.style?.(i),
        }}
      >
        {l}
      </span>
    ))

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(220,38,38,0.22),transparent_70%)]" />

      <div
        className="relative z-10 w-full max-w-7xl text-center"
        style={{ transform: reduced ? 'none' : `translateY(${p * -90}px)`, opacity: 1 - p * 0.9 }}
      >
        <p
          className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-red-400 md:text-sm"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 0.2s' }}
        >
          Backed by {SPONSORS.length} believers
        </p>

        <h1 className="font-display leading-none tracking-tight" aria-label="Our Sponsors">
          <span
            className="block text-transparent"
            style={{
              fontSize: 'clamp(2rem, 6.5vw, 5.5rem)',
              letterSpacing: '-0.02em',
              WebkitTextStroke: '1.5px rgba(255,255,255,0.75)',
            }}
          >
            {line('Our', 0.2)}
          </span>
          <span className="block text-white" style={{ fontSize: 'clamp(3rem, 14vw, 12.5rem)', letterSpacing: '-0.05em' }}>
            {line('Spon', 0.4)}
            <span className="text-red-500" style={{ textShadow: '0 0 60px rgba(239,68,68,0.7)' }}>
              {line('sors', 0.64)}
            </span>
          </span>
        </h1>

        <p
          className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-gray-400 md:text-xl"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(20px)',
            transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 1.1s',
          }}
        >
          Brands that bet on student talent before it looked like a sure thing. Every stage we build has their name on the foundation.
        </p>
      </div>

      <div
        className="absolute bottom-24 right-6 z-10 hidden md:block lg:right-16"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 1.4s' }}
      >
        <SpinBadge />
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ opacity: (1 - p * 4) * (loaded ? 1 : 0), transition: 'opacity 0.6s ease 1.4s' }}
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
   NAME MARQUEE — two tilted rows, opposite directions
   ────────────────────────────────────────────────────────────── */

const MarqueeRow = ({ reverse, outlined }) => {
  const row = [...SPONSORS, ...SPONSORS]
  return (
    <div className="marquee-wrap overflow-hidden">
      <div
        className="marquee-track flex w-max items-center gap-10 whitespace-nowrap py-2"
        style={{ animationDirection: reverse ? 'reverse' : 'normal', animationDuration: reverse ? '55s' : '48s' }}
      >
        {row.map((s, i) => (
          <span key={`${s.name}-${i}`} className="flex items-center gap-10 font-display text-4xl tracking-[-0.03em] md:text-7xl">
            <span
              className={outlined ? 'text-transparent' : 'text-white/90'}
              style={outlined ? { WebkitTextStroke: '1.5px rgba(239,68,68,0.85)' } : undefined}
            >
              {s.name}
            </span>
            <span className="text-red-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const NameMarquee = () => (
  <section className="relative my-10 -rotate-2 overflow-hidden border-y border-red-500/20 bg-red-950/20 py-6 md:my-24">
    <MarqueeRow outlined={false} />
    <MarqueeRow outlined reverse />
  </section>
)

/* ──────────────────────────────────────────────────────────────
   ROSTER — big index list, logo card follows the cursor
   ────────────────────────────────────────────────────────────── */

const Roster = ({ sponsors }) => {
  const [active, setActive] = useState(-1)
  const cardRef = useRef(null)
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    if (active < 0) return
    let raf
    const loop = () => {
      const p = pos.current
      p.x += (p.tx - p.x) * 0.14
      p.y += (p.ty - p.y) * 0.14
      if (cardRef.current) {
        const tilt = clamp((p.tx - p.x) * 0.06, -14, 14)
        cardRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])

  const handleEnter = (i, e) => {
    const p = pos.current
    p.tx = e.clientX
    p.ty = e.clientY
    if (active < 0) {
      p.x = e.clientX
      p.y = e.clientY
    }
    setActive(i)
  }

  const handleMove = useCallback((e) => {
    pos.current.tx = e.clientX
    pos.current.ty = e.clientY
  }, [])

  const current = active >= 0 ? sponsors[active] : null

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-28">
      <Reveal className="mb-14 max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-500">The Roster</p>
        <h2 className="font-display leading-[1.05] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 4.6rem)' }}>
          Every name. <span className="text-red-500">Every reason.</span>
        </h2>
      </Reveal>

      <div className="border-t border-white/10" onMouseMove={handleMove} onMouseLeave={() => setActive(-1)}>
        {sponsors.map((s, i) => {
          const Tag = s.url ? 'a' : 'div'
          const props = s.url ? { href: s.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Visit ${s.name}` } : {}
          const dim = active >= 0 && active !== i
          return (
            <Reveal key={s.name} delay={Math.min(i, 5) * 60}>
              <Tag
                {...props}
                onMouseEnter={(e) => handleEnter(i, e)}
                className="roster-row group relative flex items-center gap-4 border-b border-white/10 py-7 transition-all duration-500 md:gap-10 md:py-10"
                style={{ opacity: dim ? 0.25 : 1, paddingLeft: active === i ? '1.25rem' : 0 }}
              >
                <span className="absolute inset-0 z-0 origin-left scale-x-0 bg-linear-to-r from-red-600/20 via-red-600/5 to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100" />
                <span className="relative font-display text-sm tabular-nums text-red-500/80 md:w-14 md:text-lg">{pad(i + 1)}</span>
                <h3
                  className="relative flex-1 font-display leading-none tracking-[-0.03em] text-white transition-colors duration-300 group-hover:text-red-400"
                  style={{ fontSize: 'clamp(1.7rem, 4.6vw, 3.8rem)' }}
                >
                  {s.name}
                </h3>
                <p className="relative hidden max-w-xs text-sm text-gray-500 transition-colors duration-300 group-hover:text-gray-300 lg:block">
                  {s.tagline}
                </p>
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition-all duration-500 group-hover:rotate-45 group-hover:border-red-500 group-hover:bg-red-500 group-hover:text-black md:h-14 md:w-14">
                  ↗
                </span>
              </Tag>
            </Reveal>
          )
        })}
      </div>

      {/* floating logo card (desktop only) */}
      <div
        ref={cardRef}
        className="pointer-events-none fixed left-0 top-0 z-50 hidden md:block"
        style={{ opacity: current ? 1 : 0, transition: 'opacity 0.3s ease', willChange: 'transform' }}
      >
        <div
          className="flex h-44 w-72 items-center justify-center rounded-3xl border border-red-500/40 bg-black/80 p-8 backdrop-blur-xl"
          style={{
            boxShadow: '0 30px 80px rgba(239,68,68,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
            transform: current ? 'scale(1)' : 'scale(0.7)',
            transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {current && (
            <SponsorLogo key={current.name} sponsor={current} imgClass="max-h-24 max-w-full" textClass="text-3xl text-white" />
          )}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   STATS
   ────────────────────────────────────────────────────────────── */

const Stats = () => {
  const items = [
    { value: SPONSORS.length, label: 'Partners on board' },
    { value: new Date().getFullYear() - FOUNDED, label: 'Years of building' },
    { value: FLAGSHIP_COUNT, label: 'Flagship events' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-red-500/15 bg-red-500/10 md:grid-cols-3">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="bg-black/90 p-10 text-center md:p-14">
            <p
              className="font-display leading-none tracking-[-0.04em] text-white"
              style={{ fontSize: 'clamp(3.4rem, 7vw, 6.2rem)', textShadow: '0 0 40px rgba(239,68,68,0.4)' }}
            >
              <CountUp to={s.value} />
            </p>
            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500 md:text-xs">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   LOGO WALL — spotlight cards
   ────────────────────────────────────────────────────────────── */

const WallCard = ({ sponsor, index }) => {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
    el.style.transform = `perspective(900px) rotateY(${(x / rect.width - 0.5) * 8}deg) rotateX(${-(y / rect.height - 0.5) * 8}deg)`
  }, [])

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'
  }, [])

  const Tag = sponsor.url ? 'a' : 'div'
  const props = sponsor.url
    ? { href: sponsor.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Visit ${sponsor.name}` }
    : {}

  return (
    <Reveal delay={(index % 4) * 90}>
      <Tag
        ref={ref}
        {...props}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="wall-card group relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 transition-[transform,border-color] duration-300 ease-out hover:border-red-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        style={{ '--mx': '50%', '--my': '50%' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(320px circle at var(--mx) var(--my), rgba(239,68,68,0.25), transparent 60%)' }}
        />
        <span className="pointer-events-none absolute left-5 top-4 font-display text-xs tabular-nums text-white/30 transition-colors duration-500 group-hover:text-red-400">
          {pad(index + 1)}
        </span>
        <span className="pointer-events-none absolute right-5 top-4 text-white/30 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-400">
          ↗
        </span>

        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <SponsorLogo
            sponsor={sponsor}
            imgClass="max-h-20 max-w-[75%] opacity-60 grayscale transition-all duration-500 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0"
            textClass="text-lg text-gray-500 transition-colors duration-300 group-hover:text-white md:text-xl"
          />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-linear-to-r from-transparent via-red-500 to-transparent transition-all duration-500 group-hover:w-full" />
      </Tag>
    </Reveal>
  )
}

const LogoWall = () => (
  <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
    <Reveal className="mb-14 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-500">The Wall</p>
      <h2 className="font-display leading-[1.05] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 4.6rem)' }}>
        Together, <span className="text-red-500">in one frame.</span>
      </h2>
    </Reveal>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {SPONSORS.map((s, i) => (
        <WallCard key={s.name} sponsor={s} index={i} />
      ))}
    </div>
  </section>
)

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
  <section className="relative mx-auto max-w-5xl px-5 pb-32 pt-20 text-center md:px-10 md:pt-32">
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

const Sponsers = () => {
  const reduced = usePrefersReducedMotion()
  const [pageProgress, setPageProgress] = useState(0)
  const glowRef = useRef(null)

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

  // soft cursor glow
  useEffect(() => {
    if (reduced) return
    const move = (e) => {
      const el = glowRef.current
      if (el) el.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [reduced])

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
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />
      {!reduced && (
        <div
          ref={glowRef}
          className="pointer-events-none fixed left-0 top-0 z-0 h-100 w-100 rounded-full bg-red-600/15 blur-[90px] transition-transform duration-200 ease-out"
        />
      )}

      <Link
        to="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur-md transition-colors hover:border-red-400/50 hover:text-white"
      >
        ← Back
      </Link>

      <main className="relative z-10 w-full">
        <Hero reduced={reduced} />
        <NameMarquee />
        <Roster sponsors={SPONSORS} />
        <Stats />
        <LogoWall />
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
          animation: marquee 50s linear infinite;
        }
        .marquee-wrap:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .spin-slow {
          animation: spin 18s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .scroll-cue {
          animation: scrollCue 1.8s ease-in-out infinite;
        }
        @keyframes scrollCue {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .spin-slow, .scroll-cue { animation: none; }
        }
      `}</style>
    </div>
  )
}

export default Sponsers