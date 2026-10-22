import { useEffect, useRef, useState } from 'react'
import EventPage from '../Components/EventPage'
import Footer from './Footer'
import StarBackground from '../Components/StarBackground'
import { getRegistrationLink, MAGNITUDE_FORM } from '../data/registrations'

/* ──────────────────────────────────────────────────────────────
   "Where innovation meets excellence" section — edit here
   ────────────────────────────────────────────────────────────── */
const EDITION = '26' // shows as "Magnitude 25"
const ABOUT_IMAGE = '' // optional, e.g. '/images/magnitude-7.jpg'. Leave '' to hide.
const STATS = [
  { value: 3, suffix: '', label: 'Days of innovation' },
  { value: 50, suffix: '+', label: 'Events & competitions' },
  { value: 1000, suffix: '+', label: 'Participants' },
  { value: 25, suffix: '+', label: 'Categories' },
]

/* purple gradient used on the stat numbers: change the two colours to taste */
const NUMBER_GRADIENT = 'linear-gradient(180deg, #c4b5fd 0%, #a855f7 55%, #7c3aed 100%)'
const NUMBER_GLOW = 'drop-shadow(0 0 22px rgba(168,85,247,0.35))'

/* "Your Stage Awaits" content: edit freely (keep it true for your event) */
const PERKS = [
  {
    icon: '✦',
    title: 'Open to every student',
    text: 'Magnitude is open across campus. Bring your talent, whatever your course or year.',
  },
  {
    icon: '◈',
    title: 'Solo & team events',
    text: 'Compete on your own or build a team. Pick the events that fit you best.',
  },
  {
    icon: '❖',
    title: 'Quick registration',
    text: 'One short form, a few minutes, and your place in the line-up is on its way.',
  },
]

const STEPS = [
  { n: '01', title: 'Pick your event', text: 'Browse the categories and choose where you want to shine.' },
  { n: '02', title: 'Fill the form', text: 'Add your details, plus your team if the event needs one.' },
  { n: '03', title: 'Show up & shine', text: 'Watch for schedule updates, then bring your best on the day.' },
]

/* ── SPACING KNOB ──
   How far the registration section is pulled up under this one.
   Content below has enough bottom padding to stay clear of it. */
const BRIDGE_PULL = '-mb-12 md:-mb-16'

// words in the sliding line (taken from the registration form's event list)
const BAND_WORDS = MAGNITUDE_FORM.events

// stars fade in and out at the top and bottom, so the section blends into the page
const FADE = 'linear-gradient(to bottom, transparent, black 12%, black 80%, transparent)'

const useInView = (threshold = 0.4) => {
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

// fade + rise when scrolled into view
const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, seen] = useInView(0.15)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
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
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
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

/* One quiet sliding line. Padding (not gap) on each item keeps the -50% loop seamless. */
const CategoryBand = () => {
  const words = [...BAND_WORDS, ...BAND_WORDS]
  return (
    <div className="mt-16 md:mt-24" aria-label="Event categories">
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">What&rsquo;s on</p>

      <div className="mag-fade overflow-hidden">
        <div
          className="mag-slide flex w-max items-center whitespace-nowrap"
          style={{ animationDuration: `${Math.max(30, BAND_WORDS.length * 4)}s` }}
        >
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className="flex items-center" aria-hidden={i >= BAND_WORDS.length ? 'true' : undefined}>
              <span
                className="mag-display px-6 uppercase text-white/70 md:px-9"
                style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.75rem)' }}
              >
                {word}
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500/80" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Fills the space between the stats and the registration form */
const StageAwaits = () => (
  <div className="mx-auto mt-24 max-w-5xl md:mt-36">
    <Reveal>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-purple-300">Your stage awaits</p>
      <h3
        className="mag-display mx-auto max-w-3xl uppercase leading-[1.02]"
        style={{ fontSize: 'clamp(1.9rem, 5vw, 3.75rem)' }}
      >
        Ready to make your <span className="text-red-500">mark?</span>
      </h3>
    </Reveal>

    {/* perk cards */}
    <div className="mt-12 grid gap-4 text-left md:mt-16 md:grid-cols-3">
      {PERKS.map((p, i) => (
        <Reveal key={p.title} delay={i * 120}>
          <div className="mag-card group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-purple-400/50 hover:bg-purple-500/[0.06]">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent 70%)' }}
              aria-hidden="true"
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/10 text-lg text-purple-300">
              {p.icon}
            </span>
            <h4 className="relative mt-5 text-lg font-semibold text-white">{p.title}</h4>
            <p className="relative mt-2 text-sm leading-relaxed text-white/55">{p.text}</p>
          </div>
        </Reveal>
      ))}
    </div>

    {/* how it works */}
    <Reveal className="mt-16 md:mt-24">
      <p className="mb-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">How it works</p>
      <ol className="relative grid gap-10 text-center md:grid-cols-3 md:gap-6">
        {/* connecting line (desktop) */}
        <div
          className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-6 hidden h-px md:block"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }}
          aria-hidden="true"
        />
        {STEPS.map((s) => (
          <li key={s.n} className="relative flex flex-col items-center">
            <span className="mag-display relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-purple-400/40 bg-black text-lg text-purple-300">
              {s.n}
            </span>
            <h4 className="mt-5 text-base font-semibold text-white">{s.title}</h4>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/50">{s.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  </div>
)

const MagnitudeAbout = () => (
  <section
    className={`relative isolate w-full text-center text-white ${BRIDGE_PULL}`}
    aria-labelledby="about-title"
  >
    {/* site-wide star background, confined to this section and faded at the edges */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ contain: 'paint', maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <StarBackground />
    </div>

    {/* soft glows for depth */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-24 -z-10 h-80 w-[44rem] max-w-full -translate-x-1/2 rounded-full opacity-25 blur-3xl"
      style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-24 left-1/2 -z-10 h-80 w-[44rem] max-w-full -translate-x-1/2 rounded-full opacity-20 blur-3xl"
      style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)' }}
    />

    <div className="relative px-5 pb-28 pt-24 md:pb-40 md:pt-36">
      <Reveal>
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-red-400">Magnitude {EDITION}</p>
        <h2
          id="about-title"
          className="mag-display mx-auto max-w-4xl uppercase leading-[0.98]"
          style={{ fontSize: 'clamp(2.4rem, 7.5vw, 6.25rem)' }}
        >
          Where innovation
          <br />
          meets <span className="text-red-500">excellence</span>
        </h2>
      </Reveal>

      <Reveal delay={150}>
        <p className="mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-white/60 md:mt-10 md:text-xl">
          Magnitude {EDITION} is more than an event — it&rsquo;s a convergence of brilliance, creativity, and ambition.
          Where the future is shaped by today&rsquo;s innovators.
        </p>
      </Reveal>

      <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-12 md:mt-24 md:grid-cols-4 md:divide-x md:divide-white/10">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="flex flex-col-reverse items-center">
            <dt className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/50 md:text-xs">{s.label}</dt>
            <dd
              className="mag-display mag-num leading-none"
              style={{
                fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
                backgroundImage: NUMBER_GRADIENT,
                filter: NUMBER_GLOW,
              }}
            >
              <CountUp to={s.value} suffix={s.suffix} />
            </dd>
          </Reveal>
        ))}
      </dl>

      {ABOUT_IMAGE && (
        <Reveal className="mx-auto mt-20 max-w-4xl">
          <div
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
            }}
          >
            <img src={ABOUT_IMAGE} alt="Magnitude stage" loading="lazy" className="w-full object-cover opacity-70" />
          </div>
        </Reveal>
      )}

      <Reveal>
        <CategoryBand />
      </Reveal>

      <StageAwaits />

      {/* scroll cue that leads the eye into the registration section */}
      <Reveal delay={100}>
        <div className="mt-20 flex flex-col items-center gap-3 md:mt-28" aria-hidden="true">
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/35">Register below</span>
          <span className="mag-cue block h-10 w-px bg-gradient-to-b from-purple-400 to-transparent" />
        </div>
      </Reveal>
    </div>

    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
      .mag-display { font-family: 'Anton', 'Impact', 'Arial Narrow Bold', sans-serif; letter-spacing: -0.01em; }
      .mag-num {
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }
      .mag-fade {
        mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
      }
      .mag-slide { animation-name: mag-slide; animation-timing-function: linear; animation-iteration-count: infinite; }
      .mag-fade:hover .mag-slide { animation-play-state: paused; }
      .mag-cue { animation: mag-cue 2s ease-in-out infinite; transform-origin: top; }
      @keyframes mag-slide {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes mag-cue {
        0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
        50% { transform: scaleY(1); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .mag-slide, .mag-cue { animation: none; }
        .mag-fade { overflow-x: auto; }
      }
    `}</style>
  </section>
)

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */
const Magnitude = () => {
  return (
    <>
      <EventPage
        heading="Magnitude"
        category="LPU's Open Intra-University Cultural Fest"
        media="/images/MAGNITUDE.jpg"
        mediaType="image"
        description="Magnitude is DYC's flagship cultural fest — a full-scale celebration of music, dance, drama, and everything in between, open to every student across campus."
        galleryRows={[
          [
            '/images/MAGNITUDE.jpg',
            '/images/magnitude-2.jpg',
            '/images/magnitude-3.jpg',
            '/images/magnitude-4.jpg',
            '/images/magnitude-5.jpg',
          ],
          [
            '/images/magnitude-6.jpg',
            '/images/magnitude-8.jpg',
            '/images/magnitude-9.jpg',
            '/images/magnitude-10.jpg',
            '/images/magnitude-11.jpg',
          ],
          [
            '/images/magnitude-12.jpg',
            '/images/magnitude-13.jpg',
            '/images/magnitude-14.jpg',
            '/images/magnitude-15.jpg',
            '/images/magnitude-16.jpg',
          ],
        ]}
        registrationLink={getRegistrationLink('/magnitude')}
        beforeRegistration={<MagnitudeAbout />}
      />

      {/* pulls the footer up under the registration section to remove the gap */}
      <div className="relative -mt-12 md:-mt-20">
        <Footer />
      </div>
    </>
  )
}

export default Magnitude