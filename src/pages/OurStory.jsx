import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Footer from './Footer'

/* ──────────────────────────────────────────────────────────────
   PAGE SWITCH
   true  = Our Story page is open
   false = anyone visiting this page (navbar click or typed URL) is sent to Home
   ────────────────────────────────────────────────────────────── */
const OURSTORY_PAGE_OPEN = false

/* ──────────────────────────────────────────────────────────────
   CONTENT — edit freely
   ────────────────────────────────────────────────────────────── */

const FOUNDED = 2013

const MANIFESTO =
  "We didn't wait for a stage. We built one. Then we handed the keys to the next student, and the next, until leading stopped being a privilege and became a habit."

const MILESTONES = [
  {
    year: '2013',
    title: 'The Spark',
    desc: 'A handful of students under the Student Welfare Wing set out to give campus talent a real stage.',
  },
  {
    year: '2021',
    title: 'Finding Our Name',
    desc: 'The Department of Youth Capital took shape — a home for every domain, not just performers.',
  },
  {
    year: '2023',
    title: 'Growing The Universe',
    desc: 'Magnitude, Youthvibe, Concoction, and FTS came together as flagship events under one roof.',
  },
  {
    year: 'Today',
    title: 'Still Building',
    desc: 'Hundreds of students, dozens of events, one mission — empower youth through what they build.',
  },
]

const FLAGSHIPS = [
  { name: 'Youthvibe', tag: 'Flagship 01', line: 'The pulse of campus culture.' },
  { name: 'Magnitude', tag: 'Flagship 02', line: 'Where ambition gets amplified.' },
  { name: 'Concoction', tag: 'Flagship 03', line: 'Ideas mixed until something new appears.' },
  { name: 'FTS', tag: 'Flagship 04', line: 'Talent, given room to run.' },
]

const VALUES = [
  { n: '01', title: 'Innovation', desc: 'We back new ideas before they look safe.' },
  { n: '02', title: 'Collaboration', desc: 'Every event is built by many hands, many domains.' },
  { n: '03', title: 'Ownership', desc: 'Members lead real work, not busywork.' },
]

const DOMAINS = [
  'Technology',
  'Design',
  'Marketing',
  'Event Management',
  'Operations',
  'Media',
  'Public Relations',
  'Sponsorship',
  'Content',
  'Leadership',
]

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

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

/** Fires once when the element enters the viewport. */
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

/** Scroll progress of an element. mode "pin": 0→1 while a tall section is pinned. mode "pass": 0→1 as it travels up the screen. */
const useScrollProgress = (mode = 'pass') => {
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
      let p
      if (mode === 'pin') {
        const total = rect.height - vh
        p = total > 0 ? -rect.top / total : 0
      } else {
        p = (vh * 0.85 - rect.top) / (rect.height + vh * 0.1)
      }
      setProgress(clamp(p, 0, 1))
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
  }, [mode])

  return [ref, progress]
}

const Reveal = ({ children, delay = 0, className = '', as: Tag = 'div' }) => {
  const [ref, seen] = useInView(0.15)
  return (
    <Tag
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
    </Tag>
  )
}

const CountUp = ({ to, suffix = '', duration = 1800 }) => {
  const [ref, seen] = useInView(0.5)
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(to * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  )
}

/* ──────────────────────────────────────────────────────────────
   HERO — living particle constellation that reacts to the cursor
   ────────────────────────────────────────────────────────────── */

const Constellation = ({ reduced }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let raf = 0
    let particles = []
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = clamp(Math.floor((w * h) / 14000), 30, 110)
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const LINK = 130
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1

          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < 160 * 160) {
            const d = Math.sqrt(d2) || 1
            const force = (160 - d) / 160
            p.x += (dx / d) * force * 1.6
            p.y += (dy / d) * force * 1.6
          }
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < LINK) {
            ctx.strokeStyle = `rgba(239,68,68,${(1 - d / LINK) * 0.35})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(254,202,202,0.85)'
        ctx.shadowColor = 'rgba(239,68,68,0.9)'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }
      raf = requestAnimationFrame(draw)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}

const Hero = ({ reduced }) => {
  const [ref, p] = useScrollProgress('pass')
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const letters = ['D', 'Y', 'C']

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <Constellation reduced={reduced} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(220,38,38,0.22),transparent_70%)]" />

      <div
        className="relative z-10 text-center"
        style={{ transform: reduced ? 'none' : `translateY(${p * -80}px)`, opacity: 1 - p * 0.9 }}
      >
        <p
          className="mb-6 text-xs font-medium uppercase tracking-[0.5em] text-red-400 md:text-sm"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 0.2s' }}
        >
          Our Story · Since {FOUNDED}
        </p>

        <h1
          className="flex items-center justify-center font-display uppercase leading-[0.85] text-white"
          style={{ fontSize: 'clamp(5.5rem, 22vw, 18rem)', letterSpacing: '-0.04em' }}
          aria-label="DYC"
        >
          {letters.map((l, i) => (
            <span
              key={l}
              className="inline-block"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) rotateX(0)' : 'translateY(60%) rotateX(-70deg)',
                transition: `all 1.1s cubic-bezier(0.22,1,0.36,1) ${0.25 + i * 0.14}s`,
                textShadow: i === 1 ? '0 0 60px rgba(239,68,68,0.7)' : 'none',
                color: i === 1 ? '#ef4444' : '#fff',
              }}
            >
              {l}
            </span>
          ))}
        </h1>

        <p
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-400 md:text-xl"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(20px)',
            transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 0.9s',
          }}
        >
          Before it was a department, it was a dare —
          <br className="hidden md:block" /> that students shouldn't have to wait to lead.
        </p>
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ opacity: (1 - p * 4) * (loaded ? 1 : 0), transition: 'opacity 0.6s ease 1.4s' }}
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-white/40">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollCue_1.8s_ease-in-out_infinite] bg-red-400" />
        </span>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   MANIFESTO — words ignite as you scroll
   ────────────────────────────────────────────────────────────── */

const Manifesto = () => {
  const [ref, p] = useScrollProgress('pass')
  const words = MANIFESTO.split(' ')

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-5 py-32 md:px-10 md:py-48">
      <p className="mb-10 text-xs font-semibold uppercase tracking-[0.5em] text-red-500">The Idea</p>
      <p className="font-display text-[1.5rem] uppercase leading-tight tracking-tight md:text-[2.6rem]">
        {words.map((word, i) => {
          const start = i / words.length
          const lit = clamp((p * 1.35 - start) * words.length * 0.5, 0, 1)
          return (
            <span
              key={i}
              className="inline-block pr-[0.28em]"
              style={{
                color: `rgba(${255 - lit * 16}, ${255 - lit * 187}, ${255 - lit * 187}, ${0.14 + lit * 0.86})`,
                textShadow: lit > 0.85 ? '0 0 28px rgba(239,68,68,0.35)' : 'none',
                transition: 'color 0.25s linear',
              }}
            >
              {word}
            </span>
          )
        })}
      </p>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   TIMELINE — pinned, scroll-scrubbed chapters
   ────────────────────────────────────────────────────────────── */

const Timeline = ({ milestones, reduced }) => {
  const count = milestones.length
  const [ref, p] = useScrollProgress('pin')
  const f = p * count
  const active = clamp(Math.floor(f), 0, count - 1)

  return (
    <section ref={ref} className="relative" style={{ height: `${count * 100 + 40}vh` }} aria-label="Our timeline">
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        {/* drifting accent glow that follows the story */}
        <div
          className="pointer-events-none absolute h-[70vh] w-[70vh] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.38), transparent 70%)',
            left: `${10 + p * 60}%`,
            top: `${30 + Math.sin(p * Math.PI * 2) * 15}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.3s linear, top 0.3s linear',
          }}
        />

        {/* progress rail */}
        <div className="absolute inset-y-[18%] left-4 z-20 w-px bg-white/10 md:left-10">
          <div className="absolute inset-x-0 top-0 bg-linear-to-b from-red-400 to-red-600" style={{ height: `${p * 100}%` }} />
          {milestones.map((m, i) => (
            <span
              key={m.year}
              className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-500"
              style={{
                top: `${(i / (count - 1)) * 100}%`,
                background: i <= active ? '#ef4444' : '#000',
                borderColor: i <= active ? '#ef4444' : 'rgba(255,255,255,0.25)',
                boxShadow: i === active ? '0 0 18px 5px rgba(239,68,68,0.6)' : 'none',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-10 md:grid-cols-2 md:gap-16 md:px-20">
          {/* giant year */}
          <div className="relative h-32 md:h-88">
            {milestones.map((m, i) => {
              const d = f - i - 0.5
              const opacity = reduced ? (i === active ? 1 : 0) : clamp(1 - Math.abs(d) * 2.4, 0, 1)
              return (
                <div
                  key={m.year}
                  className="absolute inset-0 flex items-center"
                  style={{
                    opacity,
                    transform: reduced ? 'none' : `translateY(${d * -90}px) scale(${1 - Math.abs(d) * 0.12})`,
                  }}
                >
                  <span
                    className="font-display leading-none text-transparent"
                    style={{
                      fontSize: m.year.length > 4 ? 'clamp(3rem, 9vw, 7.5rem)' : 'clamp(4.2rem, 13vw, 10.5rem)',
                      letterSpacing: '-0.04em',
                      WebkitTextStroke: '1.5px rgba(239,68,68,0.9)',
                      filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.45))',
                    }}
                  >
                    {m.year}
                  </span>
                </div>
              )
            })}
          </div>

          {/* chapter copy */}
          <div className="relative h-60 md:h-80">
            {milestones.map((m, i) => {
              const d = f - i - 0.5
              const opacity = reduced ? (i === active ? 1 : 0) : clamp(1 - Math.abs(d) * 2.6, 0, 1)
              return (
                <div
                  key={m.year}
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{
                    opacity,
                    transform: reduced ? 'none' : `translateY(${d * -60}px)`,
                    pointerEvents: i === active ? 'auto' : 'none',
                  }}
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.45em] text-red-400">
                    Chapter {String(i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                  </p>
                  <h3
                    className="font-display uppercase leading-[1.05] tracking-tight text-white"
                    style={{ fontSize: 'clamp(1.7rem, 3.8vw, 3.2rem)' }}
                  >
                    {m.title}
                  </h3>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-gray-400 md:text-lg">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   STATS
   ────────────────────────────────────────────────────────────── */

const Stats = () => {
  const years = new Date().getFullYear() - FOUNDED
  const items = [
    { value: years, suffix: '', label: 'Years of building' },
    { value: FLAGSHIPS.length, suffix: '', label: 'Flagship events' },
    { value: DOMAINS.length, suffix: '', label: 'Domains under one roof' },
    { value: 1, suffix: '', label: 'Mission' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-36">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-red-500/15 bg-red-500/10 md:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="bg-black/90 p-8 text-center md:p-12">
            <p
              className="font-display leading-none tracking-tight text-white"
              style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)', textShadow: '0 0 40px rgba(239,68,68,0.4)' }}
            >
              <CountUp to={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-gray-500 md:text-xs">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   FLAGSHIPS — cursor spotlight cards
   ────────────────────────────────────────────────────────────── */

const FlagshipCard = ({ item, index }) => {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
    el.style.transform = `perspective(900px) rotateY(${(x / rect.width - 0.5) * 7}deg) rotateX(${-(y / rect.height - 0.5) * 7}deg) translateZ(0)`
  }, [])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'
  }, [])

  return (
    <Reveal delay={index * 120}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-black p-8 transition-[transform,border-color] duration-300 ease-out hover:border-red-500/50 md:h-80 md:p-10"
        style={{ '--mx': '50%', '--my': '50%' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgba(239,68,68,0.22), transparent 60%)' }}
        />
        <span
          className="pointer-events-none absolute -bottom-4 -right-2 select-none font-display leading-none text-white/4 transition-colors duration-500 group-hover:text-red-500/10"
          style={{ fontSize: '10rem' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="relative flex h-full flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-400">{item.tag}</p>
          <div>
            <h3
              className="font-display uppercase leading-none tracking-tight text-white"
              style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.8rem)' }}
            >
              {item.name}
            </h3>
            <p className="mt-4 max-w-xs text-gray-400">{item.line}</p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

const Flagships = () => (
  <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
    <Reveal className="mb-14 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.5em] text-red-500">The Universe</p>
      <h2 className="font-display uppercase leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)' }}>
        Four worlds. <span className="text-red-500">One orbit.</span>
      </h2>
    </Reveal>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {FLAGSHIPS.map((f, i) => (
        <FlagshipCard key={f.name} item={f} index={i} />
      ))}
    </div>
  </section>
)

/* ──────────────────────────────────────────────────────────────
   MARQUEE
   ────────────────────────────────────────────────────────────── */

const Marquee = () => {
  const row = [...DOMAINS, ...DOMAINS]
  return (
    <section className="relative my-24 -rotate-2 overflow-hidden border-y border-red-500/20 bg-red-950/20 py-6 md:my-36">
      <div className="flex w-max animate-[marquee_45s_linear_infinite] gap-10 whitespace-nowrap">
        {row.map((d, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-2xl uppercase tracking-tight text-white/80 md:text-4xl">
            {d}
            <span className="text-red-500">✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
   VALUES
   ────────────────────────────────────────────────────────────── */

const Values = () => (
  <section className="mx-auto max-w-5xl px-5 py-16 md:px-10 md:py-24">
    <Reveal className="mb-12">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.5em] text-red-500">What Drives Us</p>
      <h2 className="font-display uppercase leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)' }}>
        Three beliefs. <span className="text-red-500">No fine print.</span>
      </h2>
    </Reveal>

    <div className="border-t border-white/10">
      {VALUES.map((v, i) => (
        <Reveal key={v.title} delay={i * 100}>
          <div className="group relative flex flex-col gap-3 border-b border-white/10 py-10 transition-all duration-500 hover:pl-4 md:flex-row md:items-center md:gap-12 md:py-14 md:hover:pl-8">
            <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-red-600/0 via-red-600/10 to-red-600/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative font-display text-lg text-red-500/70 md:w-16">{v.n}</span>
            <h3
              className="relative font-display uppercase leading-none tracking-tight text-white transition-colors duration-300 group-hover:text-red-400 md:w-1/2"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)' }}
            >
              {v.title}
            </h3>
            <p className="relative max-w-sm text-gray-400 md:ml-auto md:text-lg">{v.desc}</p>
          </div>
        </Reveal>
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
      className="relative mt-12 inline-block rounded-full bg-red-500 px-12 py-5 font-display text-xs font-bold uppercase tracking-[0.2em] text-black transition-[transform,background-color,box-shadow] duration-300 ease-out hover:bg-red-400 hover:shadow-[0_0_60px_rgba(239,68,68,0.55)]"
    >
      {children}
    </Link>
  )
}

const FinalCta = () => (
  <section className="relative mx-auto max-w-5xl px-5 pb-32 pt-24 text-center md:px-10 md:pt-40">
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-112 w-md -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/25 blur-[140px]" />
    <Reveal>
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.5em] text-red-500">The next chapter</p>
      <h2
        className="relative font-display uppercase leading-[1.02] tracking-tight"
        style={{ fontSize: 'clamp(2.4rem, 8vw, 6.5rem)' }}
      >
        Write it
        <br />
        <span className="text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">with us.</span>
      </h2>
      <p className="relative mx-auto mt-8 max-w-lg text-lg leading-relaxed text-gray-400">
        Every story needs new characters. Come write the next part of ours.
      </p>
      <MagneticLink to="/join">Join Us ↗</MagneticLink>
    </Reveal>
  </section>
)

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

const OurStoryPage = () => {
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
      {/* top reading progress */}
      <div className="fixed inset-x-0 top-0 z-60 h-0.5 bg-transparent">
        <div
          className="h-full bg-linear-to-r from-red-700 via-red-400 to-white"
          style={{ width: `${pageProgress * 100}%`, boxShadow: '0 0 14px rgba(239,68,68,0.8)' }}
        />
      </div>

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/60 via-black to-black" />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.07]"
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
        className="font-body fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-widest text-white/70 backdrop-blur-md transition-colors hover:border-red-400/50 hover:text-white"
      >
        ← Back
      </Link>

      <main className="relative z-10 w-full">
        <Hero reduced={reduced} />
        <Manifesto />
        <Timeline milestones={MILESTONES} reduced={reduced} />
        <Stats />
        <Flagships />
        <Marquee />
        <Values />
        <FinalCta />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Space+Grotesk:wght@400;500;600&display=swap');

        .font-display {
          font-family: 'Unbounded', 'Arial Black', sans-serif;
          font-weight: 800;
        }
        .font-body {
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scrollCue {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  )
}

// Gatekeeper: while OURSTORY_PAGE_OPEN is false, this page redirects to Home.
const OurStory = () => {
  if (!OURSTORY_PAGE_OPEN) return <Navigate to="/" replace />
  return <OurStoryPage />
}

export default OurStory