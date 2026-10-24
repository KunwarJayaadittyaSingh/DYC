import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import StarBackground from '../Components/StarBackground'
import { REGISTRATIONS, MAGNITUDE_FORM, getStatus } from '../data/registrations'

const EV = REGISTRATIONS.find((e) => e.path === '/magnitude')
const C = { ...EV, ...MAGNITUDE_FORM }

/* ──────────────────────────────────────────────────────────────
   EVENTS + REGISTRATION CONTROLS — edit freely
   ──────────────────────────────────────────────────────────────

  HOW TO OPEN / CLOSE REGISTRATIONS (three levels)

  1. WHOLE PAGE  → data/registrations.js, exactly as before.
                   (opensAt / closesAt on the '/magnitude' entry, or whatever
                   switch getStatus() already reads: 'open' | 'closed' | 'upcoming')

  2. ONE EVENT   → set `open: false` on that event below.
                   The card shows "Registration closed" and nobody can sign up.

  3. SCHEDULE ONE EVENT → add opensAt / closesAt (ISO with timezone), e.g.
                   opensAt: '2026-10-28T10:00:00+05:30'

  A closed event is still visible on the page, with a locked button.

  FIELDS
  group    : filter chip it belongs to
  category : red label on the card
  min/max  : team size. min = max = 1 → Solo
  image    : /public/images/magnitude/events/<id>.jpg (falls back to a coloured card)
  rulebook : link to the PDF / Drive. '' shows "Rulebook soon"
  extra    : optional extra field asked from the team leader
*/

const EVENT_DATE = '28 OCT - 4 NOV 25'
const PRIZE = 'Trophies & Certificates'

const img = (id) => `/images/magnitude/events/${id}.jpg`

const MAGNITUDE_EVENTS = [
  { id: 'paridhan', name: 'Paridhan', group: 'Lifestyle', category: 'Lifestyle (Group Fashion)', desc: 'A group fashion showcase featuring coordinated themes, creativity, and style synchronization.', min: 8, max: 15, image: img('paridhan'), rulebook: '' },
  { id: 'frame-focus', name: 'Frame & Focus', group: 'Media & Production', category: 'Media & Production (Photography)', desc: 'A photography contest based on a given theme testing creativity and composition.', min: 1, max: 1, image: img('frame-focus'), rulebook: '' },
  { id: 'open-mic', name: 'Open Mic', group: 'Literary & Theatre', category: 'Literary & Theatre', desc: 'A platform for storytelling, poetry, and stand-up performances celebrating creativity and expression.', min: 1, max: 1, image: img('open-mic'), rulebook: '' },
  { id: 'spike-showdown', name: 'Spike Showdown (Valorant)', group: 'eSports', category: 'eSports', desc: 'A thrilling Valorant 5v5 tournament testing strategy, teamwork, and reflexes.', min: 1, max: 6, image: img('spike-showdown'), rulebook: '', extra: { label: 'Riot ID', placeholder: 'Name#TAG' } },
  { id: 'bgmi', name: 'Battleground Magnitude Series (BGMI)', group: 'eSports', category: 'eSports', desc: 'A competitive BGMI tournament where squads battle for glory.', min: 1, max: 5, image: img('bgmi'), rulebook: '', extra: { label: 'BGMI Character ID', placeholder: 'e.g. 5123456789' } },
  { id: 'kitchen-king', name: "LPU's Kitchen King", group: 'Management', category: 'Management (Cooking)', desc: 'A live cooking contest testing culinary skills, creativity, and presentation.', min: 1, max: 2, image: img('kitchen-king'), rulebook: '' },
  { id: 'arm-face-off', name: 'Arm Face-Off', group: 'Sports', category: 'Sports', desc: 'An arm wrestling competition focusing on strength and endurance.', min: 1, max: 1, image: img('arm-face-off'), rulebook: '' },
  { id: 'rush-to-roadies', name: 'Rush to Roadies', group: 'Sports', category: 'Sports (Fitness)', desc: 'An obstacle-based fitness challenge testing agility, stamina, and determination.', min: 1, max: 1, image: img('rush-to-roadies'), rulebook: '' },
  { id: 'brushstroke', name: 'Brushstroke', group: 'Fine Arts', category: 'Fine Arts', desc: "A live drawing competition based on the theme 'Nature's Splendor'.", min: 1, max: 1, image: img('brushstroke'), rulebook: '' },
  { id: 'mehandi-art', name: 'Mehandi Art', group: 'Fine Arts', category: 'Fine Arts', desc: 'A traditional Mehandi competition celebrating artistry and precision in design.', min: 1, max: 1, image: img('mehandi-art'), rulebook: '' },
  { id: 'startup-spotlight', name: 'Startup Spotlight', group: 'Entrepreneurship', category: 'Entrepreneurship', desc: 'A startup pitch competition where participants present innovative business ideas.', min: 1, max: 5, image: img('startup-spotlight'), rulebook: '' },
  { id: 'poetry-slam', name: 'Poetry Slam', group: 'Literary & Theatre', category: 'Literary', desc: 'A poetry performance competition where participants express emotions through powerful verses.', min: 1, max: 1, image: img('poetry-slam'), rulebook: '' },
  { id: 'first-act', name: 'The First Act', group: 'Literary & Theatre', category: 'Theatre', desc: 'A one-act play competition testing acting, storytelling, and stage performance.', min: 1, max: 1, image: img('first-act'), rulebook: '' },
  { id: 'news-debate', name: 'The News Debate', group: 'Literary & Theatre', category: 'Literary', desc: 'A debate competition where participants discuss contemporary issues with logic and confidence.', min: 1, max: 1, image: img('news-debate'), rulebook: '' },

  // Catch-all slot (keeps the old "Other" option from your form).
  { id: 'other', name: 'Something else?', group: 'Other', category: 'Open Slot', isOther: true, desc: 'Have a talent that is not on the list? Tell us what you would like to perform and we will get in touch.', min: 1, max: 1, image: '', rulebook: '' },
]

const isSolo = (e) => e.max === 1
const typeLabel = (e) => (isSolo(e) ? 'Solo' : `Team of ${e.min}-${e.max}`)

/**
 * Final status of one event.
 * `base` is the whole-page status from getStatus() ('open' | 'closed' | 'upcoming').
 */
const eventStatus = (ev, base, now = Date.now()) => {
  if (base !== 'open') return base
  if (ev.open === false) return 'closed'
  if (ev.opensAt && now < new Date(ev.opensAt).getTime()) return 'upcoming'
  if (ev.closesAt && now > new Date(ev.closesAt).getTime()) return 'closed'
  return 'open'
}

/* ──────────────────────────────────────────────────────────────
   FORM CONSTANTS + HELPERS
   ────────────────────────────────────────────────────────────── */

const RESIDENCE = ['Day Scholar', 'Hosteller']
const COURSES = [
  'B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com',
  'BA', 'MA', 'B.Sc', 'M.Sc', 'B.Des', 'LLB', 'Diploma',
]
const REG_RE = /^[A-Za-z0-9/-]{4,20}$/
const LS_DONE = 'magnitude:done'
const LS_PROFILE = 'magnitude:profile'

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* non-critical */
  }
}

const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// accepts "+91 98765 43210", "09876543210" or a plain 10 digit number
const cleanPhone = (v) => {
  let d = v.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d.slice(0, 10)
}

const initials = (name) =>
  name.replace(/[^A-Za-z\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
const gradientFor = (name) => {
  const sum = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  const hue = (345 + (sum % 6) * 14) % 360
  return [`hsl(${hue} 75% 38%)`, `hsl(${(hue + 35) % 360} 70% 12%)`]
}

/** Dev only: open /magnitude/register?status=open|closed|upcoming to preview each state. */
const devStatus = () => (import.meta.env.DEV ? new URLSearchParams(window.location.search).get('status') : null)

const validateYou = (f, ev) => {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Enter your full name.'
  if (!REG_RE.test(f.regNo.trim())) e.regNo = 'Enter a valid registration number (4–20 letters or digits).'
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = 'Enter a valid 10-digit mobile number.'
  if (f.course.trim().length < 2) e.course = 'Enter your course, for example B.Tech CSE.'
  if (!f.residence) e.residence = 'Please choose one.'
  if (ev.isOther && f.otherEvent.trim().length < 2) e.otherEvent = 'Tell us which event.'
  if (ev.extra && f.extra.trim().length < 2) e.extra = `Enter your ${ev.extra.label}.`
  return e
}

const validateTeam = (f, members) => {
  const e = {}
  if (f.teamName.trim().length < 2) e.teamName = 'Give your team a name.'
  members.forEach((m, i) => {
    if (m.name.trim().length < 2) e[`m${i}name`] = 'Enter the member’s name.'
    if (!REG_RE.test(m.regNo.trim())) e[`m${i}reg`] = 'Enter a valid registration number.'
  })
  return e
}

const useInView = (threshold = 0.12) => {
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

const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, seen] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'none' : 'translateY(30px)',
        filter: seen ? 'blur(0)' : 'blur(5px)',
        transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   SMALL UI PIECES
   ────────────────────────────────────────────────────────────── */

const inputCls = (err) =>
  `w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder-white/30 outline-none transition focus:border-red-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/30 ${
    err ? 'border-red-500/70' : 'border-white/15'
  }`

const Field = ({ id, label, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
      {label}
    </label>
    {children}
    {hint && !error && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    {error && (
      <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-red-400">
        {error}
      </p>
    )}
  </div>
)

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
      active ? 'border-red-500 bg-red-500 text-black' : 'border-white/15 text-white/60 hover:border-red-400/60 hover:text-white'
    }`}
  >
    {children}
  </button>
)

const Pill = ({ className = '', children }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold leading-none ${className}`}>{children}</span>
)

const Countdown = ({ target, label, onDone }) => {
  const [left, setLeft] = useState(() => new Date(target).getTime() - Date.now())
  useEffect(() => {
    const tick = () => {
      const l = new Date(target).getTime() - Date.now()
      setLeft(l)
      if (l <= 0) {
        clearInterval(id)
        onDone?.()
      }
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [target, onDone])

  if (left <= 0) return null
  const s = Math.floor(left / 1000)
  const parts = [
    ['Days', Math.floor(s / 86400)],
    ['Hours', Math.floor((s % 86400) / 3600)],
    ['Mins', Math.floor((s % 3600) / 60)],
    ['Secs', s % 60],
  ]
  return (
    <div className="mt-8" role="timer" aria-label={label}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-red-400">{label}</p>
      <div className="flex gap-3">
        {parts.map(([k, v]) => (
          <div key={k} className="min-w-18 rounded-2xl border border-white/10 bg-white/4 px-3 py-3 text-center backdrop-blur-md">
            <p className="font-display text-3xl tabular-nums leading-none text-white" style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
              {String(v).padStart(2, '0')}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">{k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.6,
        color: ['#ef4444', '#ffffff', '#facc15', '#f87171'][i % 4],
        rotate: Math.random() * 360,
      })),
    []
  )
  return (
    <div className="confetti-wrap pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, transform: `rotate(${p.rotate}deg)` }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   EVENT CARD
   ────────────────────────────────────────────────────────────── */

const EventImage = ({ ev }) => {
  const [failed, setFailed] = useState(false)
  if (ev.image && !failed) {
    return (
      <img
        src={ev.image}
        alt={ev.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
    )
  }
  const [from, to] = gradientFor(ev.name)
  return (
    <div
      role="img"
      aria-label={ev.name}
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="font-display text-7xl text-white/70">{ev.isOther ? '+' : initials(ev.name)}</span>
    </div>
  )
}

const STATUS_PILL = {
  open: ['OPEN', 'bg-emerald-400 text-black'],
  closed: ['CLOSED', 'bg-red-500 text-white'],
  upcoming: ['SOON', 'bg-yellow-400 text-black'],
}

const EventCard = ({ ev, status, registered, onRegister }) => {
  const [label, pillCls] = STATUS_PILL[status]
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/90 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-500/60 hover:shadow-[0_20px_60px_rgba(239,68,68,0.2)]">
      <div className="relative h-56 overflow-hidden bg-black">
        <EventImage ev={ev} />
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-black/10 to-black/40" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-2">
            {isSolo(ev) && !ev.isOther && <Pill className="bg-white text-black">SOLO</Pill>}
            <Pill className="bg-red-500 text-black">{ev.category}</Pill>
          </div>
          <Pill className={`shrink-0 ${pillCls}`}>{label}</Pill>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl leading-[1.1] tracking-[-0.03em] text-white">{ev.name}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-400">{ev.desc}</p>

        {!ev.isOther && (
          <dl className="mt-5 space-y-2.5 text-[15px]">
            {[
              ['Type', typeLabel(ev)],
              ['Prize Pool', PRIZE],
              ['Date', EVENT_DATE],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4">
                <dt className="text-gray-500">{k}:</dt>
                <dd className="text-right text-red-300">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto space-y-2.5 pt-6">
          {registered ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
              Registered ✓
            </div>
          ) : status === 'open' ? (
            <button
              type="button"
              onClick={() => onRegister(ev)}
              className="w-full rounded-full bg-red-500 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Register now →
            </button>
          ) : status === 'upcoming' ? (
            <div className="w-full rounded-full border border-yellow-400/40 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-yellow-300">
              Opens soon
            </div>
          ) : (
            <div className="w-full rounded-full border border-white/10 bg-white/3 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/40">
              Registration closed 🔒
            </div>
          )}

          {!ev.isOther &&
            (ev.rulebook ? (
              <a
                href={ev.rulebook}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-full border border-white/20 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:border-red-400/60 hover:text-white"
              >
                View rulebook ↗
              </a>
            ) : (
              <div className="w-full py-2 text-center text-xs uppercase tracking-[0.16em] text-white/30">Rulebook soon</div>
            ))}
        </div>
      </div>
    </article>
  )
}

/* ──────────────────────────────────────────────────────────────
   REGISTRATION MODAL — quick steps, opened after picking an event
   ────────────────────────────────────────────────────────────── */

const Stepper = ({ steps, step }) => (
  <ol className="mt-5 flex items-center gap-2" aria-label="Progress">
    {steps.map((s, i) => (
      <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            i < step ? 'bg-red-500 text-black' : i === step ? 'border-2 border-red-500 text-red-400' : 'border border-white/15 text-white/40'
          }`}
        >
          {i < step ? '✓' : i + 1}
        </span>
        <span className={`hidden text-xs font-semibold uppercase tracking-[0.16em] sm:inline ${i === step ? 'text-white' : 'text-white/40'}`}>{s}</span>
        {i < steps.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-red-500' : 'bg-white/10'}`} />}
      </li>
    ))}
  </ol>
)

const RegisterModal = ({ ev, onClose, onSuccess, onServerClosed }) => {
  const profile = useMemo(() => readLS(LS_PROFILE, {}), [])
  const team = !isSolo(ev)
  const steps = team ? ['You', 'Team', 'Review'] : ['You', 'Review']

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: profile.name || '',
    regNo: profile.regNo || '',
    phone: profile.phone || '',
    course: profile.course || '',
    residence: profile.residence || '',
    otherEvent: '',
    extra: '',
    teamName: '',
    size: ev.min,
    consent: false,
    website: '', // honeypot
  })
  const [members, setMembers] = useState(() => Array.from({ length: Math.max(ev.min - 1, 0) }, () => ({ name: '', regNo: '' })))
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(null)

  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current()
      else if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea')
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

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: '' }))
  }
  const onText = (key) => (e) => set(key, e.target.value)
  const aria = (key) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `f-${key}-err` : undefined,
  })

  const setSize = (size) => {
    setForm((f) => ({ ...f, size }))
    setMembers((prev) => {
      const next = prev.slice(0, size - 1)
      while (next.length < size - 1) next.push({ name: '', regNo: '' })
      return next
    })
  }
  const setMember = (i, key, errKey) => (e) => {
    const value = key === 'regNo' ? e.target.value.toUpperCase() : e.target.value
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)))
    if (errors[errKey]) setErrors((er) => ({ ...er, [errKey]: '' }))
  }

  const kind = steps[step]

  const focusFirst = (errs) => {
    const bad = Object.keys(errs).find((k) => errs[k])
    if (bad) setTimeout(() => document.getElementById(`f-${bad}`)?.focus(), 30)
    return !!bad
  }

  const next = () => {
    const errs = kind === 'You' ? validateYou(form, ev) : validateTeam(form, members)
    setErrors(errs)
    if (focusFirst(errs)) return
    setStep((s) => s + 1)
    bodyRef.current?.scrollTo({ top: 0 })
  }
  const back = () => {
    setStep((s) => Math.max(0, s - 1))
    setServerError('')
    bodyRef.current?.scrollTo({ top: 0 })
  }

  async function submit(e) {
    e.preventDefault()
    if (sending) return
    if (form.website) return // honeypot: real people never fill this
    if (!form.consent) {
      setErrors({ consent: 'Please confirm to continue.' })
      return
    }
    if (!C.submitUrl) {
      setServerError('Registration is not connected yet. Please contact the organisers.')
      return
    }

    const payload = {
      // same fields your sheet already receives
      name: form.name.trim(),
      regNo: form.regNo.trim().toUpperCase(),
      phone: form.phone,
      course: form.course.trim(),
      residence: form.residence,
      event: ev.isOther ? 'Other' : ev.name,
      otherEvent: ev.isOther ? form.otherEvent.trim() : '',
      // new fields
      eventId: ev.id,
      eventType: typeLabel(ev),
      extraLabel: ev.extra?.label || '',
      extraValue: ev.extra ? form.extra.trim() : '',
      teamName: team ? form.teamName.trim() : '',
      teamSize: team ? form.size : 1,
      members: team ? members.map((m) => ({ name: m.name.trim(), regNo: m.regNo.trim().toUpperCase() })) : [],
    }

    setSending(true)
    setServerError('')
    try {
      const res = await fetch(C.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.ok) {
        writeLS(LS_PROFILE, { name: form.name, regNo: form.regNo, phone: form.phone, course: form.course, residence: form.residence })
        setDone(payload)
        onSuccess(ev.id)
      } else if (data.error === 'duplicate') setServerError(`This registration number is already registered for ${ev.isOther ? 'this event' : ev.name}.`)
      else if (data.error === 'closed') {
        setServerError('Registrations have just closed.')
        onServerClosed()
      } else setServerError('Something went wrong. Please try again.')
    } catch {
      setServerError('Could not reach the server. Check your internet and try again.')
    } finally {
      setSending(false)
    }
  }

  const eventLabel = ev.isOther ? form.otherEvent.trim() || 'your event' : ev.name
  const shareText = encodeURIComponent(
    `I just registered for ${eventLabel} at Magnitude, LPU's open intra-university cultural fest! Join me: ${window.location.origin}${window.location.pathname}`
  )

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="reg-title">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div
        ref={panelRef}
        className="modal-pop relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-red-500/30 bg-neutral-950 sm:rounded-3xl"
        style={{ boxShadow: '0 40px 120px rgba(239,68,68,0.28)' }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black"
        >
          ✕
        </button>

        {done ? (
          <div className="relative overflow-hidden px-6 py-12 text-center sm:px-10" role="status">
            <Confetti />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-black">✓</div>
              <h2 id="reg-title" className="font-display mt-6 text-3xl tracking-tight">You&apos;re registered!</h2>
              <p className="mt-3 text-gray-400">
                See you at <span className="font-semibold text-white">{done.event === 'Other' ? done.otherEvent : done.event}</span>. We&apos;ll share updates on {done.phone}.
              </p>

              <dl className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 text-left text-sm">
                {[
                  ['Name', done.name],
                  ['Registration no.', done.regNo],
                  ['Course', done.course],
                  ['Residence', done.residence],
                  ...(done.teamName ? [['Team', `${done.teamName} (${done.teamSize})`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-5 py-3">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="text-right text-white">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-red-500 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-red-400"
                >
                  Register for another event
                </button>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:border-red-400/60 hover:text-white"
                >
                  Tell a friend ↗
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-white/10 px-6 pb-5 pt-6 sm:px-8">
              <div className="flex flex-wrap gap-2 pr-12">
                {isSolo(ev) && !ev.isOther && <Pill className="bg-white text-black">SOLO</Pill>}
                <Pill className="bg-red-500 text-black">{ev.category}</Pill>
              </div>
              <h2 id="reg-title" className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">{ev.name}</h2>
              {!ev.isOther && (
                <p className="mt-1 text-sm text-gray-500">
                  {typeLabel(ev)} · {EVENT_DATE}
                </p>
              )}
              <Stepper steps={steps} step={step} />
            </div>

            <div ref={bodyRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
              {kind === 'You' && (
                <>
                  <Field id="f-name" label={team ? 'Team leader — full name' : 'Full name'} error={errors.name}>
                    <input id="f-name" type="text" autoComplete="name" placeholder="Your full name" value={form.name} onChange={onText('name')} className={inputCls(errors.name)} {...aria('name')} />
                  </Field>

                  <Field id="f-regNo" label="Registration number" error={errors.regNo}>
                    <input
                      id="f-regNo"
                      type="text"
                      autoCapitalize="characters"
                      autoComplete="off"
                      placeholder="e.g. 12345678"
                      value={form.regNo}
                      onChange={onText('regNo')}
                      className={`${inputCls(errors.regNo)} uppercase placeholder:normal-case`}
                      {...aria('regNo')}
                    />
                  </Field>

                  <Field id="f-phone" label="Contact number" error={errors.phone} hint="10-digit mobile number. We will use it to share event updates.">
                    <input
                      id="f-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => set('phone', cleanPhone(e.target.value))}
                      className={inputCls(errors.phone)}
                      {...aria('phone')}
                    />
                  </Field>

                  <Field id="f-course" label="Course" error={errors.course}>
                    <input id="f-course" type="text" list="course-list" autoComplete="off" placeholder="e.g. B.Tech CSE" value={form.course} onChange={onText('course')} className={inputCls(errors.course)} {...aria('course')} />
                    <datalist id="course-list">
                      {COURSES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </Field>

                  <div>
                    <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Day scholar or hosteller?</p>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Day scholar or hosteller">
                      {RESIDENCE.map((r, i) => (
                        <button
                          key={r}
                          id={i === 0 ? 'f-residence' : undefined}
                          type="button"
                          role="radio"
                          aria-checked={form.residence === r}
                          onClick={() => set('residence', r)}
                          className={`rounded-xl border px-4 py-3.5 text-sm font-semibold transition ${
                            form.residence === r ? 'border-red-500 bg-red-500/15 text-white' : errors.residence ? 'border-red-500/70 text-white/60' : 'border-white/15 text-white/60 hover:border-red-400/60'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {errors.residence && <p role="alert" className="mt-2 text-sm text-red-400">{errors.residence}</p>}
                  </div>

                  {ev.extra && (
                    <Field id="f-extra" label={ev.extra.label} error={errors.extra}>
                      <input id="f-extra" type="text" placeholder={ev.extra.placeholder} value={form.extra} onChange={onText('extra')} className={inputCls(errors.extra)} {...aria('extra')} />
                    </Field>
                  )}

                  {ev.isOther && (
                    <Field id="f-otherEvent" label="Which event?" error={errors.otherEvent}>
                      <input id="f-otherEvent" type="text" placeholder="Tell us what you would like to perform" value={form.otherEvent} onChange={onText('otherEvent')} className={inputCls(errors.otherEvent)} {...aria('otherEvent')} />
                    </Field>
                  )}
                </>
              )}

              {kind === 'Team' && (
                <>
                  <Field id="f-teamName" label="Team name" error={errors.teamName}>
                    <input id="f-teamName" type="text" autoComplete="off" placeholder="Make it memorable" value={form.teamName} onChange={onText('teamName')} className={inputCls(errors.teamName)} {...aria('teamName')} />
                  </Field>

                  {ev.min !== ev.max && (
                    <div>
                      <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Team size (including you)</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: ev.max - ev.min + 1 }, (_, i) => ev.min + i).map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={form.size === n}
                            onClick={() => setSize(n)}
                            className={`h-11 w-11 rounded-xl border text-sm font-bold transition ${
                              form.size === n ? 'border-red-500 bg-red-500 text-black' : 'border-white/15 text-white/60 hover:border-red-400/60'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {members.map((m, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-4">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Member {i + 2}</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id={`f-m${i}name`} label="Full name" error={errors[`m${i}name`]}>
                          <input id={`f-m${i}name`} type="text" value={m.name} onChange={setMember(i, 'name', `m${i}name`)} className={inputCls(errors[`m${i}name`])} {...aria(`m${i}name`)} />
                        </Field>
                        <Field id={`f-m${i}reg`} label="Registration number" error={errors[`m${i}reg`]}>
                          <input id={`f-m${i}reg`} type="text" autoCapitalize="characters" value={m.regNo} onChange={setMember(i, 'regNo', `m${i}reg`)} className={`${inputCls(errors[`m${i}reg`])} uppercase`} {...aria(`m${i}reg`)} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {kind === 'Review' && (
                <>
                  <p className="text-sm text-gray-400">Check everything once. You can edit any section before submitting.</p>

                  {[
                    {
                      title: 'You',
                      go: 0,
                      rows: [
                        ['Name', form.name],
                        ['Registration no.', form.regNo.toUpperCase()],
                        ['Contact', form.phone],
                        ['Course', form.course],
                        ['Residence', form.residence],
                        ...(ev.extra ? [[ev.extra.label, form.extra]] : []),
                        ...(ev.isOther ? [['Event', form.otherEvent]] : []),
                      ],
                    },
                    ...(team
                      ? [
                          {
                            title: 'Team',
                            go: 1,
                            rows: [
                              ['Team name', form.teamName],
                              ['Size', String(form.size)],
                              ...members.map((m, i) => [`Member ${i + 2}`, `${m.name} · ${m.regNo.toUpperCase()}`]),
                            ],
                          },
                        ]
                      : []),
                  ].map((sec) => (
                    <section key={sec.title} className="rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">{sec.title}</h3>
                        <button type="button" onClick={() => setStep(sec.go)} className="text-xs font-semibold text-white/60 underline underline-offset-4 hover:text-white">
                          Edit
                        </button>
                      </div>
                      <dl className="divide-y divide-white/10 text-sm">
                        {sec.rows.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 px-5 py-3">
                            <dt className="text-gray-500">{k}</dt>
                            <dd className="text-right text-white">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}

                  <div>
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => set('consent', e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-red-500"
                      />
                      <span>
                        I confirm the details above are correct
                        {ev.rulebook ? (
                          <>
                            {' '}and I have read the{' '}
                            <a href={ev.rulebook} target="_blank" rel="noopener noreferrer" className="text-red-400 underline underline-offset-4">
                              rulebook
                            </a>
                          </>
                        ) : null}
                        .
                      </span>
                    </label>
                    {errors.consent && <p role="alert" className="mt-2 text-sm text-red-400">{errors.consent}</p>}
                  </div>

                  {/* honeypot: hidden from people, bots fill it in */}
                  <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label>
                      Website
                      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={onText('website')} />
                    </label>
                  </div>

                  {import.meta.env.DEV && !C.submitUrl && (
                    <p className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                      Dev note: <code>submitUrl</code> is empty in <code>data/registrations.js</code>, so submitting will show an error.
                    </p>
                  )}

                  {serverError && (
                    <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                      {serverError}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-black/60 px-6 py-4 sm:px-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-full border border-white/20 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition hover:border-red-400/60 hover:text-white"
                >
                  ← Back
                </button>
              )}
              {kind !== 'Review' ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex-1 rounded-full bg-red-500 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-black transition hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 rounded-full bg-red-500 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-black transition hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Submitting…' : 'Submit registration'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function MagnitudeRegister() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [mode, setMode] = useState('all') // all | solo | team
  const [active, setActive] = useState(null)
  const [done, setDone] = useState(() => readLS(LS_DONE, []))
  const [serverClosed, setServerClosed] = useState(false)
  const [, force] = useState(0)
  const refresh = useCallback(() => force((n) => n + 1), [])

  // Master switch: data/registrations.js (open / closed / upcoming)
  const base = serverClosed ? 'closed' : devStatus() || getStatus(EV)
  const statusOf = (ev) => eventStatus(ev, base)

  const groups = useMemo(() => [...new Set(MAGNITUDE_EVENTS.map((e) => e.group))], [])
  const realEvents = MAGNITUDE_EVENTS.filter((e) => !e.isOther)
  const openCount = realEvents.filter((e) => statusOf(e) === 'open').length

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MAGNITUDE_EVENTS.filter(
      (e) =>
        (group === 'all' || e.group === group) &&
        (mode === 'all' || (mode === 'solo' ? isSolo(e) : !isSolo(e))) &&
        (!q || `${e.name} ${e.category} ${e.desc}`.toLowerCase().includes(q))
    )
  }, [query, group, mode])

  const handleSuccess = useCallback((id) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id]
      writeLS(LS_DONE, next)
      return next
    })
  }, [])

  const surprise = () => {
    const pool = realEvents.filter((e) => statusOf(e) === 'open' && !done.includes(e.id))
    if (pool.length) setActive(pool[Math.floor(Math.random() * pool.length)])
  }

  const reset = () => {
    setQuery('')
    setGroup('all')
    setMode('all')
  }

  return (
    <div className="font-body relative min-h-screen w-full overflow-x-clip bg-black text-white">
      <StarBackground />
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/50 via-transparent to-black/40" />
      <div className="pointer-events-none fixed left-1/2 top-24 z-0 h-104 w-104 -translate-x-1/2 rounded-full bg-red-600/20 blur-[120px]" />

      <Link
        to="/magnitude"
        className="fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur-md transition-colors hover:border-red-400/50 hover:text-white"
      >
        ← Back
      </Link>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-28 md:px-10 md:pt-32">
        {/* hero */}
        <Reveal className="mb-10 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">{C.name || 'Magnitude'} · Registrations</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              <span className={`h-2 w-2 rounded-full ${base === 'open' ? 'animate-pulse bg-emerald-400' : base === 'upcoming' ? 'bg-yellow-400' : 'bg-red-500'}`} />
              {base === 'open' ? 'Open' : base === 'upcoming' ? 'Opens soon' : 'Closed'}
            </span>
          </div>

          <h1 className="font-display leading-[0.98] tracking-[-0.04em]" style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}>
            Pick your <span className="text-red-500" style={{ textShadow: '0 0 50px rgba(239,68,68,0.6)' }}>stage.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-400 md:text-lg">
            Choose an event you love. We only ask for your details after you pick, and it takes about a minute.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.22em] text-gray-500">
            {realEvents.length} events · {openCount} open now · {EVENT_DATE}
          </p>

          {base === 'open' && C.closesAt && <Countdown target={C.closesAt} label="Registrations close in" onDone={refresh} />}
          {base === 'upcoming' && C.opensAt && <Countdown target={C.opensAt} label="Registrations open in" onDone={refresh} />}
          {base === 'open' && C.closesAt && <p className="mt-4 text-sm text-gray-500">Closes {fmtDate(C.closesAt)}</p>}
          {base === 'upcoming' && C.opensAt && <p className="mt-4 text-sm text-gray-500">Opens {fmtDate(C.opensAt)}</p>}
        </Reveal>

        {base === 'closed' && (
          <div className="mb-10 rounded-3xl border border-white/10 bg-neutral-950/80 p-8 text-center backdrop-blur-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Registrations closed
            </span>
            <p className="mt-5 text-gray-400">Registrations for {C.name || 'Magnitude'} are not open right now. You can still browse every event below.</p>
          </div>
        )}

        {/* filters — scrolls with the page (not sticky) */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-neutral-950/80 p-4 backdrop-blur-md md:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block w-full sm:max-w-xs">
                <span className="sr-only">Search events</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events…"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter by participation">
                <Chip active={mode === 'all'} onClick={() => setMode('all')}>Solo + Team</Chip>
                <Chip active={mode === 'solo'} onClick={() => setMode('solo')}>Solo</Chip>
                <Chip active={mode === 'team'} onClick={() => setMode('team')}>Team</Chip>
              </div>
              {base === 'open' && (
                <button
                  type="button"
                  onClick={surprise}
                  className="shrink-0 rounded-full border border-red-500/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500 hover:text-black sm:ml-auto"
                >
                  🎲 Surprise me
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              <Chip active={group === 'all'} onClick={() => setGroup('all')}>All categories</Chip>
              {groups.map((g) => (
                <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gray-500" aria-live="polite">
          Showing {list.length} of {MAGNITUDE_EVENTS.length} events
        </p>

        {list.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center">
            <p className="text-lg text-gray-400">No events match your filters.</p>
            <button type="button" onClick={reset} className="mt-5 text-sm font-semibold text-red-400 underline underline-offset-4">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((ev, i) => (
              <Reveal key={ev.id} delay={Math.min(i, 5) * 70} className="h-full">
                <EventCard ev={ev} status={statusOf(ev)} registered={done.includes(ev.id)} onRegister={setActive} />
              </Reveal>
            ))}
          </div>
        )}
      </main>

      {active && (
        <RegisterModal key={active.id} ev={active} onClose={() => setActive(null)} onSuccess={handleSuccess} onServerClosed={() => setServerClosed(true)} />
      )}

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; font-weight: 800; }
        .font-body { font-family: 'Inter', system-ui, sans-serif; }

        .modal-pop { animation: modalPop 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }

        .confetti {
          position: absolute;
          top: -14px;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          opacity: 0;
          animation: confettiFall linear forwards;
        }
        @keyframes confettiFall {
          0% { opacity: 1; margin-top: 0; }
          100% { opacity: 0; margin-top: 560px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-pop { animation: none !important; }
          .confetti-wrap { display: none; }
        }
      `}</style>
    </div>
  )
}