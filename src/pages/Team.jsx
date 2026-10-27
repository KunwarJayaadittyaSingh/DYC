import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

/* ------------------------------------------------------------------
   EDIT THIS SECTION ONLY.
   - Everyone is shown together, in code order (DYC 0001, 0002, ...).
   - photo: path inside /public (or leave '' to show initials)
   - instagram / linkedin: leave '' or '#' to hide that icon
------------------------------------------------------------------- */

const TEAM = [
  { code: 'DYC 0001', name: 'Divyanshu Kumar', role: 'Department Head', desc: 'Sets the vision for DYC and steers every flagship event from concept to curtain call.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/divyanshu-kumar2004?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
  { code: 'DYC 0002', name: 'Aditi Dosad', role: 'Management / Emcee', desc: 'Coordinates across teams to keep every initiative aligned and moving forward.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/aditi-dosad/' },
  { code: 'DYC 0003', name: 'Manvendra Singh', role: 'Core', desc: 'A driving force across departments, stepping in wherever the team needs support.', photo: '/images/IMG_3320.PNG', instagram: '#', linkedin: 'https://www.linkedin.com/in/manvendra-singh-06ba8a245/' },
  { code: 'DYC 0004', name: 'Yuvraj Singh Nimbalkar', role: 'Design Lead', desc: 'Shapes the visual identity of every event, from posters to on-ground branding.', photo: '/images/yuvraj-design-lead.png', instagram: 'https://www.instagram.com/nonchalant_nimbalkar/', linkedin: 'https://www.linkedin.com/in/yuvrajsinghnimbalkar/' },
  { code: 'DYC 0005', name: 'Kunwar Jayaadittya Singh', role: 'Technology Lead', desc: 'Builds and maintains the website and internal tools that power DYC\u2019s digital presence.', photo: '', instagram: 'https://www.instagram.com/kunwarjayaadittyasingh/', linkedin: 'https://www.linkedin.com/in/kunwar-jayaadittya-singh-3415a9366/' },
  { code: 'DYC 0006', name: 'Sumit Kumar', role: 'Media Lead', desc: 'Captures and curates DYC\u2019s story through photography, video, and press coverage.', photo: '/images/IMG_5089.PNG', instagram: 'https://www.instagram.com/sumit_prajapatiii1111/', linkedin: 'https://www.linkedin.com/in/sumit-kumar-4a3196397?utm_source=share_via&utm_content=profile&utm_medium=member_ios' },
  { code: 'DYC 0007', name: 'Nabiya Usmani', role: 'Marketing Lead', desc: 'Builds outreach strategy and grows DYC\u2019s presence across campus and social media.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/nabiya-usmani-780a30335/' },
  { code: 'DYC 0008', name: 'Sahil Kumar', role: 'Operations Lead', desc: 'Manages logistics and hospitality to keep every event running smoothly on the ground.', photo: '/images/Sahil2.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0009', name: 'Ayush Pandey', role: 'Public Relations Lead', desc: 'Builds relationships with stakeholders and represents DYC in the wider community.', photo: '/images/ayush.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0010', name: 'Sneha Kumari', role: 'Female Fashion Lead', desc: 'Curates styling and fashion direction for every event\u2019s stage and shoots.', photo: '/images/Sneha2.jpeg', instagram: 'https://www.instagram.com/__s.now._12?stkn=bGNocXN5dm9sZGY=', linkedin: 'https://www.linkedin.com/in/sneha-kumari-47a236373' },
  { code: 'DYC 0011', name: 'Parsoon Sharma', role: 'Office Management', desc: 'Oversees administrative operations and keeps the department\u2019s day-to-day running efficiently.', photo: '/images/parsoon.jpg', instagram: 'https://www.instagram.com/theprasoon_/', linkedin: 'https://linkedin.com/in/theprasoon' },
  { code: 'DYC 0012', name: 'Yuva Kumar', role: 'Public Speaking', desc: 'Leads hosting and public speaking engagements, giving every event its voice on stage.', photo: '/images/Yuva.jpeg', instagram: 'https://www.instagram.com/the.real.yuva/', linkedin: 'https://www.linkedin.com/in/yuva-boppudi-785bbb2ba/' },
  { code: 'DYC 0013', name: 'Suryansh', role: 'Audio Visuals Lead', desc: 'Manages sound, lighting, and visual production for every event.', photo: '/images/Suryansh2.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0014', name: 'Tanuj Grandhi', role: 'Promotions Lead', desc: 'Drives promotional campaigns that build hype and turnout for every event.', photo: '/images/Tanuj.JPG', instagram: 'https://www.instagram.com/tanuj_grandhi?stkn=MTB3OXB2ZWF5MzB5cg==', linkedin: 'https://www.linkedin.com/in/tanuj-grandhi/' },
  { code: 'DYC 0015', name: 'Prakhar', role: 'Fine Arts Lead', desc: 'Leads the fine arts side of DYC, from live art to the creative details that make each event feel unique.', photo: '', instagram: '#', linkedin: '#' },
  { code: 'DYC 0016', name: 'Suhaib Shakeel', role: 'Male Fashion Lead', desc: 'Curates styling and fashion direction for every event\u2019s stage and shoots.', photo: '', instagram: 'https://www.instagram.com/iam_suhaib37?dlrf=MXhmaGVkMm55cTl2cw%3D%3D&utm_source=qr', linkedin: 'https://www.linkedin.com/in/suhaib-shakeel-521aa5297/' },
]

// The big words that scroll across the page. Change them to anything you like.
const SLOGANS = ['Backstage', 'All access', 'Crew only', 'Showtime']

/* ------------------------------------------------------------------ */

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const initials = (name) =>
  name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const validLink = (u) => Boolean(u && u.trim() && u.trim() !== '#')
const slug = (m) => `crew-${m.code.replace(/\s/g, '')}`
const crewNo = (m) => m.code.replace(/^\D+/, '')
const pad = (n) => String(n).padStart(2, '0')

// Fires once when the element scrolls into view.
const useInView = (threshold = 0.1) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -5% 0px' }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [threshold])

  return [ref, inView]
}

// Text that decodes from random characters, like a terminal unlocking.
const GLYPHS = '!<>-_/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const Scramble = ({ text, active = false, duration = 800 }) => {
  const [out, setOut] = useState(text)
  const raf = useRef(0)

  const run = useCallback(() => {
    if (reducedMotion()) {
      setOut(text)
      return
    }
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const reveal = Math.floor(p * text.length)
      let s = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        s += ch === ' ' || i < reveal ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setOut(p < 1 ? s : text)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [text, duration])

  useEffect(() => {
    if (active) run()
    return () => cancelAnimationFrame(raf.current)
  }, [active, run])

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{out}</span>
    </>
  )
}

const Clock = () => {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <span>
      {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}
    </span>
  )
}

// A button that leans toward the cursor.
const Magnetic = ({ children }) => {
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || reducedMotion()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.3).toFixed(1)}px)`
  }
  const onLeave = (e) => {
    e.currentTarget.style.transform = ''
  }
  return (
    <span
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-block transition-transform duration-200 ease-out"
    >
      {children}
    </span>
  )
}

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.54h.05c.53-1 1.82-2.04 3.75-2.04 4 0 4.75 2.63 4.75 6.05V21h-4v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58V21h-4V9.75Z" />
  </svg>
)

// Thin reading-progress line at the very top. The site navbar handles navigation.
const ProgressBar = () => {
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.75 bg-white/5">
      <div
        ref={bar}
        className="h-full origin-left bg-linear-to-r from-red-600 via-red-400 to-orange-400"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

// Photo: shown in full colour. Members without a photo get their initials.
const Portrait = ({ member }) => {
  const [failed, setFailed] = useState(false)

  return member.photo && !failed ? (
    <>
      <img
        src={member.photo}
        alt={member.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-top"
      />
    </>
  ) : (
    <div className="team-font flex h-full w-full items-center justify-center bg-linear-to-br from-red-950/70 to-neutral-950">
      <span className="team-outline text-6xl opacity-60">{initials(member.name)}</span>
    </div>
  )
}

// Barcode drawn from the member code, so every pass looks a little different.
const Barcode = ({ value }) => {
  const bars = Array.from(value.replace(/\s/g, '')).flatMap((ch) => {
    const n = ch.charCodeAt(0)
    return [1 + (n % 3), 1 + ((n >> 2) % 2), 2 + ((n >> 3) % 3)]
  })

  return (
    <div aria-hidden="true" className="flex h-7 items-stretch gap-0.5 overflow-hidden">
      {bars.map((w, i) => (
        <span key={i} className={i % 2 === 0 ? 'bg-white/70' : 'bg-transparent'} style={{ width: `${w}px` }} />
      ))}
    </div>
  )
}

// One crew pass: drops onto the rail, tilts toward you, shines like foil and scans.
const PassCard = ({ member, index }) => {
  const [ref, inView] = useInView(0.1)
  const [hot, setHot] = useState(false)
  const cardRef = useRef(null)
  const hasInsta = validLink(member.instagram)
  const hasLinked = validLink(member.linkedin)

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || reducedMotion() || !cardRef.current) return
    const el = cardRef.current
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`)
    el.style.setProperty('--mx', x.toFixed(3))
    el.style.setProperty('--my', y.toFixed(3))
  }
  const onLeave = () => {
    setHot(false)
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--mx', '0.5')
    el.style.setProperty('--my', '0.5')
  }

  return (
    <div ref={ref} id={slug(member)} className="relative flex scroll-mt-24 justify-center">
      {/* shared rail every pass hangs from */}
      <span aria-hidden="true" className="team-rail absolute -left-3 -right-3 top-0 h-0.75 rounded-full" />

      <div
        data-in={inView}
        style={{ '--d': `${(index % 4) * 110}ms` }}
        className="team-drop relative w-full max-w-76 pt-9"
      >
        {/* lanyard strap and clip */}
        <span aria-hidden="true" className="team-strap absolute left-1/2 top-0 h-8 w-2.5 -translate-x-1/2" />
        <span aria-hidden="true" className="absolute left-1/2 top-5 z-10 h-3.5 w-6 -translate-x-1/2 rounded-sm border border-white/30 bg-neutral-700" />

        <article
          ref={cardRef}
          onPointerEnter={() => setHot(true)}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          className="team-pass relative overflow-hidden rounded-xl border border-white/10 bg-[#110e0e]"
        >
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          {/* header strip */}
          <div className="flex items-center justify-between bg-linear-to-r from-red-700 to-red-500 px-4 pb-2 pt-6 text-[10px] uppercase tracking-[0.25em] text-white">
            <span>Crew pass</span>
            <span className="text-red-100/90">No. {crewNo(member)}</span>
          </div>

          {/* photo with scan line and stamp */}
          <div className="relative mx-4 mt-4 aspect-4/5 overflow-hidden rounded-lg border border-white/10">
            <Portrait member={member} />
            <span aria-hidden="true" className="team-scan pointer-events-none absolute inset-x-0 top-0 h-px" />
            <span
              aria-hidden="true"
              className="team-stamp pointer-events-none absolute bottom-4 left-1/2 whitespace-nowrap rounded border-2 border-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-red-400"
            >
              Access granted
            </span>
          </div>

          {/* details */}
          <div className="px-5 pb-4 pt-4">
            <h3 className="team-font wrap-break-word text-[15px] leading-snug text-white">{member.name}</h3>
            <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-red-400">
              <Scramble text={member.role} active={hot} duration={600} />
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{member.desc}</p>
          </div>

          {/* perforation with punched notches */}
          <div className="relative mt-1">
            <span aria-hidden="true" className="team-notch absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-white/10" />
            <span aria-hidden="true" className="team-notch absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-white/10" />
            <div className="mx-5 border-t border-dashed border-white/20" />
          </div>

          {/* stub */}
          <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-4">
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500">{member.code} · All areas</p>
              <Barcode value={member.code} />
            </div>

            {(hasInsta || hasLinked) && (
              <div className="relative z-30 flex gap-2">
                {hasInsta && (
                  <a
                    href={member.instagram.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on Instagram`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-500 hover:text-black focus-visible:outline-2 focus-visible:outline-red-400"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {hasLinked && (
                  <a
                    href={member.linkedin.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on LinkedIn`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-500 hover:text-black focus-visible:outline-2 focus-visible:outline-red-400"
                  >
                    <LinkedInIcon />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* holographic foil and glare that follow the cursor */}
          <span aria-hidden="true" className="team-holo pointer-events-none absolute inset-0 z-20" />
          <span aria-hidden="true" className="team-glare pointer-events-none absolute inset-0 z-20" />
        </article>
      </div>
    </div>
  )
}

// Endless scrolling band of words.
const Marquee = ({ items, reverse = false, big = false }) => {
  const row = [...items, ...items]
  const fade = 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden border-y border-white/10 ${big ? 'py-6' : 'py-3'}`}
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <div className={`team-marquee ${reverse ? 'team-marquee-rev' : ''} flex w-max items-center ${big ? 'gap-10' : 'gap-8'}`}>
        {[...row, ...row].map((w, i) => (
          <span
            key={i}
            className={`flex items-center whitespace-nowrap uppercase ${big ? 'team-font gap-10 text-[clamp(2rem,6vw,5rem)] leading-none' : 'gap-8 text-xs tracking-[0.3em] text-gray-500'}`}
          >
            <span className={big && i % 2 === 0 ? 'team-outline' : big ? 'text-white' : ''}>{w}</span>
            <span className="text-red-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Group photo styled like a camera viewfinder.
const Viewfinder = () => (
  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black">
    <img
      src="/images/IMG_4623.jpg"
      alt="The full DYC team"
      loading="lazy"
      className="h-auto w-full object-cover transition-transform duration-1400 ease-out group-hover:scale-[1.04]"
    />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.65))]" />

    {/* corner marks */}
    {[
      'left-4 top-4 border-l-2 border-t-2',
      'right-4 top-4 border-r-2 border-t-2',
      'bottom-4 left-4 border-b-2 border-l-2',
      'bottom-4 right-4 border-b-2 border-r-2',
    ].map((c) => (
      <span key={c} aria-hidden="true" className={`pointer-events-none absolute h-7 w-7 border-white/80 ${c}`} />
    ))}

    {/* crosshair */}
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-60">
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
    </span>

    <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white">
      <span className="team-rec h-2.5 w-2.5 rounded-full bg-red-500" />
      Rec
    </div>
    <div className="pointer-events-none absolute right-6 top-6 text-[11px] uppercase tracking-[0.3em] text-white/80">
      Wrap
    </div>
    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.35em] text-white/80">
      The full DYC family
    </div>
  </div>
)

const Team = () => {
  const spot = useRef(null)

  // A red spotlight that follows the mouse across the whole page.
  const onRootMove = (e) => {
    if (e.pointerType !== 'mouse' || !spot.current) return
    spot.current.style.setProperty('--sx', `${e.clientX}px`)
    spot.current.style.setProperty('--sy', `${e.clientY}px`)
  }

  return (
    <div
      onPointerMove={onRootMove}
      className="team-root relative min-h-screen w-full overflow-hidden bg-[#070606] text-white"
    >
      <ProgressBar />
      <div ref={spot} aria-hidden="true" className="team-spot pointer-events-none fixed inset-0 z-20" />

      <main className="relative z-10 w-full">
        {/* ---------- Hero: stage with light beams ---------- */}
        <header className="relative isolate overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pt-40">
          <div aria-hidden="true" className="team-grid pointer-events-none absolute inset-0 -z-10" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <span className="team-beam team-beam-a" />
            <span className="team-beam team-beam-b" />
            <span className="team-beam team-beam-c" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-[#070606] to-transparent"
          />

          <div className="mx-auto max-w-7xl">
            <p className="team-rise mb-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-red-400">
              <span className="h-px w-10 bg-red-500" />
              Organising committee · backstage
            </p>

            <h1
              aria-label="We run the show."
              className="team-font text-[clamp(2.4rem,9.2vw,8.5rem)] uppercase leading-[0.98]"
            >
              <span className="block whitespace-nowrap">
                <Scramble text="We run" active duration={900} />
              </span>
              <span className="block whitespace-nowrap">
                <span className="team-outline">
                  <Scramble text="the" active duration={1100} />
                </span>{' '}
                <span className="team-red">
                  <Scramble text="show." active duration={1400} />
                </span>
              </span>
            </h1>

            <p
              className="team-rise mt-8 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg"
              style={{ animationDelay: '300ms' }}
            >
              Designers, hosts, techies, photographers and organisers. The crew that plans, builds and runs every DYC
              event on campus.
            </p>

            {/* live info strip */}
            <dl
              className="team-rise mt-12 max-w-xs border-y border-white/15"
              style={{ animationDelay: '450ms' }}
            >
              <div className="py-4">
                <dt className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Local time</dt>
                <dd className="team-font mt-1.5 text-lg md:text-2xl">
                  <Clock />
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <Marquee items={SLOGANS} big />

        {/* ---------- The pass wall ---------- */}
        <section aria-label="Crew passes" className="px-8 pb-12 pt-24 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex flex-wrap items-end justify-between gap-4">
              <h2 className="team-font text-3xl uppercase leading-tight md:text-5xl">
                Crew <span className="team-red">passes</span>
              </h2>
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Hover a pass to scan</p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((m, i) => (
                <PassCard key={m.code + m.name} member={m} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Wrap photo ---------- */}
        <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
          <h2 className="team-font mb-10 text-center text-[clamp(2.2rem,7vw,5.5rem)] uppercase leading-[0.95]">
            Full DYC <span className="team-red">family</span>
          </h2>
          <Viewfinder />
        </section>

        {/* ---------- Join ---------- */}
        <section className="relative isolate mt-28 overflow-hidden px-5 pb-32 pt-10 text-center md:px-8">
          <span
            aria-hidden="true"
            className="team-font team-outline pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none whitespace-nowrap text-[18vw] uppercase leading-none opacity-[0.16]"
          >
            Your pass
          </span>

          <p className="text-[11px] uppercase tracking-[0.35em] text-red-400">Crew call is open</p>
          <h2 className="team-font mx-auto mt-5 max-w-3xl text-3xl uppercase leading-tight md:text-5xl">
            Your pass is <span className="team-red">waiting.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-gray-400">
            We are always looking for people who want to build great events. Pick your area and join the crew.
          </p>

          <div className="mt-10">
            <Magnetic>
              <Link
                to="/join"
                className="team-cta relative inline-block rounded-full bg-red-600 px-10 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-white"
              >
                Join the crew
              </Link>
            </Magnetic>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .team-root { --page: #070606; font-family: 'Space Grotesk', system-ui, sans-serif; }
        .team-root ::selection { background: #ef4444; color: #000; }
        .team-root [class*="tracking-"] { font-family: 'Space Mono', ui-monospace, monospace; }
        .team-root .team-font { font-family: 'Unbounded', 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: -0.015em; }
        html { scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: #b91c1c #070606; }

        .team-outline { -webkit-text-stroke: 1.5px rgba(255,255,255,.85); color: transparent; }
        .team-red {
          color: #ff2d2d;
          text-shadow: 0 0 40px rgba(255,45,45,.55);
          display: inline-block;
          animation: team-glitch 7s steps(1, end) infinite;
        }
        @keyframes team-glitch {
          0%, 91%, 100% { transform: none; text-shadow: 0 0 40px rgba(255,45,45,.55); }
          92% { transform: translate(-3px, 1px) skewX(-6deg); text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; }
          94% { transform: translate(3px, -1px) skewX(5deg); text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; }
          96% { transform: translate(-1px, 0); text-shadow: 2px 0 #22d3ee, -2px 0 #e879f9; }
        }

        /* recording light */
        .team-rec { animation: team-rec 1.4s ease-in-out infinite; box-shadow: 0 0 10px rgba(239,68,68,.9); }
        @keyframes team-rec { 0%, 100% { opacity: 1; } 50% { opacity: .15; } }

        /* mouse spotlight */
        .team-spot {
          background: radial-gradient(420px circle at var(--sx, 50%) var(--sy, -20%), rgba(255,60,60,.12), transparent 70%);
          mix-blend-mode: screen;
        }
        @media (hover: none) { .team-spot { display: none; } }

        /* stage grid and light beams */
        .team-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 80%);
          mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 80%);
        }
        .team-beam {
          position: absolute; top: -12%; height: 125%; width: 32vw; min-width: 260px;
          transform-origin: 50% 0;
          clip-path: polygon(46% 0, 54% 0, 100% 100%, 0 100%);
          filter: blur(14px);
          mix-blend-mode: screen;
          animation: team-sway 9s ease-in-out infinite alternate;
        }
        .team-beam-a { left: 4%; background: linear-gradient(to bottom, rgba(239,68,68,.55), transparent 78%); --from: -16deg; --to: 12deg; }
        .team-beam-b { left: 36%; background: linear-gradient(to bottom, rgba(255,255,255,.28), transparent 70%); --from: 10deg; --to: -12deg; animation-duration: 11s; animation-delay: -3s; }
        .team-beam-c { right: 2%; background: linear-gradient(to bottom, rgba(249,115,22,.5), transparent 78%); --from: 14deg; --to: -14deg; animation-duration: 10s; animation-delay: -6s; }
        @keyframes team-sway {
          from { transform: rotate(var(--from, -10deg)); }
          to { transform: rotate(var(--to, 10deg)); }
        }

        /* entrance */
        @keyframes team-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .team-rise { opacity: 0; animation: team-rise .9s cubic-bezier(.2,.8,.2,1) forwards; }

        /* marquees */
        @keyframes team-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .team-marquee { animation: team-marquee 45s linear infinite; }
        .team-marquee-rev { animation-direction: reverse; animation-duration: 70s; }

        /* the rail and lanyard */
        .team-rail { background: linear-gradient(180deg, #7f1d1d, #ef4444 50%, #7f1d1d); box-shadow: 0 0 16px rgba(239,68,68,.45); }
        .team-strap { background: repeating-linear-gradient(180deg, #b91c1c 0 6px, #ef4444 6px 12px); }

        /* pass drops onto the rail with a little swing */
        .team-drop { opacity: 0; transform-origin: 50% 0; }
        .team-drop[data-in="true"] { animation: team-drop 1s cubic-bezier(.2,.9,.3,1) both; animation-delay: var(--d, 0ms); }
        @keyframes team-drop {
          0% { opacity: 0; transform: translateY(-90px) rotate(-7deg); }
          55% { opacity: 1; transform: translateY(10px) rotate(2.5deg); }
          75% { transform: translateY(-3px) rotate(-1.2deg); }
          100% { opacity: 1; transform: none; }
        }

        /* the pass itself */
        .team-pass {
          --rx: 0deg; --ry: 0deg; --mx: .5; --my: .5; --lift: 0px;
          transform: perspective(900px) translateY(var(--lift)) rotateX(var(--rx)) rotateY(var(--ry));
          transition: transform .18s ease-out, border-color .25s ease, box-shadow .25s ease;
          will-change: transform;
        }
        .team-pass:hover {
          --lift: -6px;
          border-color: rgba(239,68,68,.65);
          box-shadow: 0 24px 70px rgba(239,68,68,.22), 0 18px 50px rgba(0,0,0,.6);
        }

        /* holographic foil and glare */
        .team-holo {
          background: linear-gradient(115deg, transparent 18%, rgba(255,60,60,.5) 32%, rgba(255,200,80,.45) 42%, rgba(80,220,255,.4) 52%, rgba(255,70,200,.4) 62%, transparent 78%);
          background-size: 260% 260%;
          background-position: calc(var(--mx) * 100%) calc(var(--my) * 100%);
          mix-blend-mode: color-dodge;
          opacity: 0;
          transition: opacity .3s ease;
        }
        .team-glare {
          background: radial-gradient(240px circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), rgba(255,255,255,.16), transparent 65%);
          opacity: 0;
          transition: opacity .3s ease;
        }
        .team-pass:hover .team-holo { opacity: .55; }
        .team-pass:hover .team-glare { opacity: 1; }

        /* scan line and stamp */
        .team-scan {
          background: #ff4d4d;
          box-shadow: 0 0 14px 3px rgba(255,77,77,.85);
          opacity: 0;
        }
        .team-pass:hover .team-scan { animation: team-scan 1.6s ease-in-out infinite; }
        @keyframes team-scan {
          0% { top: 0; opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .team-stamp {
          opacity: 0;
          background: rgba(7,6,6,.7);
          transform: translateX(-50%) rotate(-9deg) scale(1.7);
          transition: opacity .25s ease .15s, transform .3s cubic-bezier(.2,1.3,.4,1) .15s;
        }
        .team-pass:hover .team-stamp { opacity: 1; transform: translateX(-50%) rotate(-9deg) scale(1); }

        /* punched notches take the colour of the page behind them */
        .team-notch { background: var(--page); }

        /* join button pulse ring */
        .team-cta::after {
          content: ''; position: absolute; inset: -6px; border-radius: 9999px;
          border: 2px solid rgba(239,68,68,.6);
          animation: team-ring 2.2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes team-ring {
          0% { transform: scale(1); opacity: .8; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .team-rise { animation: none; opacity: 1; }
          .team-drop { opacity: 1; }
          .team-drop[data-in="true"] { animation: none; }
          .team-beam, .team-marquee, .team-rec, .team-red, .team-cta::after,
          .team-pass:hover .team-scan { animation: none; }
          .team-pass { transition: none; transform: none; }
          .team-stamp, .team-holo, .team-glare { transition: none; }
        }
      `}</style>
    </div>
  )
}

export default Team