import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

/* Put photos in /public/events/ with these names. Missing files fall back to the animated visual. */
const EVENTS = [
  { name: 'Youthvibe', path: '/youthvibe', img: '/events/youthvibe.jpg', motif: 'bars', chips: ['Music', 'Fashion', 'Dance'], tag: 'The flagship fest. Music, fashion and a stage that never sleeps.', glow: ['#ef4444', '#f97316'] },
  { name: 'Magnitude', path: '/magnitude', img: '/events/magnitude.jpg', motif: 'rings', chips: ['Competitions', 'Ideas'], tag: 'Where big ideas and bigger competitions collide.', glow: ['#ec4899', '#ef4444'] },
  { name: 'Freshmen Talent Search', path: '/fts', img: '/events/fts.jpg', motif: 'beams', chips: ['First-years', 'Talent'], tag: 'First-years take the spotlight. Find the next star.', glow: ['#f59e0b', '#ef4444'] },
  { name: 'Concoction', path: '/concoction', img: '/events/concoction.jpg', motif: 'bubbles', chips: ['Creative', 'Build'], tag: 'Creativity, mixed. Build something unexpected.', glow: ['#a855f7', '#ef4444'] },
  { name: 'TEDx', path: '/tedx', img: '/events/tedx.jpg', motif: 'orbit', chips: ['Talks', 'Ideas'], tag: 'Ideas worth spreading, told on our stage.', glow: ['#dc2626', '#fb923c'] },
  { name: 'Hult Prize', path: '/hult-prize', img: '/events/hult-prize.jpg', motif: 'growth', chips: ['Startups', 'Impact'], tag: 'Student startups competing to change the world.', glow: ['#f43f5e', '#fb923c'] },
]

const ABOUT_ITEMS = [
  { name: 'Our Story', path: '/our-story', tag: 'How DYC began and where it is headed.' },
  { name: 'Team', path: '/team', tag: 'The people who run the show.' },
  { name: 'Achievements', path: '/achievements', tag: 'Milestones, awards and numbers.' },
  { name: 'Spotlight', path: '/sponsors', tag: 'Our sponsors and partners.' },
]

// file lives at DYC/public/apple-touch-icon.png, served from the site root
const LOGO_SRC = '/apple-touch-icon.png'

const keyForPath = (path) => {
  if (path === '/') return 'home'
  if (ABOUT_ITEMS.some((i) => i.path === path)) return 'about'
  if (EVENTS.some((e) => path.startsWith(e.path))) return 'events'
  if (path === '/gallery') return 'gallery'
  return null
}

const GLASS =
  'border border-white/15 bg-black/55 backdrop-blur-2xl shadow-[0_12px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.16)]'

const ITEM =
  'group relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-gray-300 focus-visible:outline-none'

// keyframes live here so no Tailwind config is needed
const KEYFRAMES = `
@keyframes dycFloatA { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(34px,-22px) scale(1.25) } }
@keyframes dycFloatB { 0%,100% { transform: translate(0,0) scale(1.1) } 50% { transform: translate(-30px,24px) scale(0.9) } }
@keyframes dycBar { 0%,100% { transform: scaleY(0.18) } 50% { transform: scaleY(1) } }
@keyframes dycPulse { 0% { transform: scale(0.15); opacity: 0.95 } 100% { transform: scale(1.7); opacity: 0 } }
@keyframes dycSweepA { from { transform: rotate(-26deg) } to { transform: rotate(26deg) } }
@keyframes dycSweepB { from { transform: rotate(26deg) } to { transform: rotate(-26deg) } }
@keyframes dycTwinkle { 0%,100% { transform: scale(0.75); opacity: 0.7 } 50% { transform: scale(1.2); opacity: 1 } }
@keyframes dycBubble { 0% { transform: translateY(0) scale(0.6); opacity: 0 } 15% { opacity: 0.95 } 100% { transform: translateY(-190px) scale(1.15); opacity: 0 } }
@keyframes dycSpin { to { transform: rotate(360deg) } }
@keyframes dycGrow { 0% { transform: scaleY(0) } 35%,85% { transform: scaleY(1) } 100% { transform: scaleY(0) } }
@keyframes dycLetter { from { transform: translateY(115%) } to { transform: translateY(0) } }
@keyframes dycFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dycLogoGlow { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  .dyc-anim { animation: none !important }
}
`

/* ---------- logo: black background blended away, glass pill + red glow ---------- */
const Logo = ({ className = '' }) => (
  <span
    className={`group/logo relative isolate flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_24px_rgba(239,68,68,0.35)] ${className}`}
  >
    {/* red glow behind the letters */}
    <span
      className="dyc-anim pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(75% 130% at 50% 0%, rgba(239,68,68,0.45), transparent 70%), radial-gradient(60% 90% at 50% 120%, rgba(251,146,60,0.30), transparent 70%)',
        animation: 'dycLogoGlow 3.2s ease-in-out infinite',
      }}
    />
    {/* screen blend turns the image's black square transparent, leaving only the letters */}
    <img
      src={LOGO_SRC}
      alt="DYC"
      draggable={false}
      className="relative h-[155%] w-auto max-w-none select-none mix-blend-screen transition-transform duration-300 group-hover/logo:scale-110"
    />
    {/* shine sweep */}
    <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 blur-md transition-transform duration-700 ease-out group-hover/logo:translate-x-[420%]" />
    {/* top highlight */}
    <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent" />
  </span>
)

/* ---------- one animated motif per event ---------- */
const Motif = ({ type, glow }) => {
  const [a, b] = glow

  if (type === 'bars')
    return (
      <div className="flex h-full items-end justify-center gap-1.5 px-4">
        {Array.from({ length: 17 }).map((_, i) => (
          <span
            key={i}
            className="dyc-anim h-full w-2 origin-bottom rounded-full"
            style={{
              background: `linear-gradient(to top, ${b}, ${a})`,
              animation: `dycBar ${0.9 + ((i * 7) % 5) * 0.18}s ease-in-out ${-i * 0.13}s infinite`,
            }}
          />
        ))}
      </div>
    )

  if (type === 'rings')
    return (
      <div className="relative flex h-full items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="dyc-anim absolute h-36 w-36 rounded-full border-2"
            style={{ borderColor: i % 2 ? b : a, animation: `dycPulse 3.6s ease-out ${-i * 0.9}s infinite` }}
          />
        ))}
        <span className="h-4 w-4 rounded-full bg-white" style={{ boxShadow: `0 0 34px 10px ${a}` }} />
      </div>
    )

  if (type === 'beams')
    return (
      <div className="relative h-full overflow-hidden">
        {[
          ['22%', a, 'dycSweepA'],
          ['78%', b, 'dycSweepB'],
        ].map(([x, c, name]) => (
          <span
            key={name}
            className="dyc-anim absolute -top-6 h-50 w-28 origin-top"
            style={{
              left: x,
              marginLeft: -56,
              background: `linear-gradient(to bottom, ${c}dd, transparent)`,
              clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)',
              animation: `${name} 3.8s ease-in-out infinite alternate`,
            }}
          />
        ))}
        <span
          className="dyc-anim absolute bottom-4 left-1/2 h-9 w-9 bg-white"
          style={{
            marginLeft: -18,
            clipPath: 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)',
            filter: `drop-shadow(0 0 12px ${a})`,
            animation: 'dycTwinkle 2s ease-in-out infinite',
          }}
        />
      </div>
    )

  if (type === 'bubbles')
    return (
      <div className="relative h-full overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => {
          const size = 10 + ((i * 13) % 24)
          return (
            <span
              key={i}
              className="dyc-anim absolute bottom-0 rounded-full"
              style={{
                left: `${((i * 37) % 90) + 3}%`,
                width: size,
                height: size,
                background: `radial-gradient(circle at 30% 30%, #ffffffaa, ${i % 2 ? a : b}bb)`,
                animation: `dycBubble ${3.5 + (i % 5) * 0.7}s ease-in ${-i * 0.45}s infinite`,
              }}
            />
          )
        })}
      </div>
    )

  if (type === 'orbit')
    return (
      <div className="relative flex h-full items-center justify-center">
        <span
          className="dyc-anim absolute h-40 w-40 rounded-full border-2 border-dashed"
          style={{ borderColor: `${a}aa`, animation: 'dycSpin 18s linear infinite' }}
        />
        <span
          className="dyc-anim absolute h-28 w-28 rounded-full border"
          style={{ borderColor: b, animation: 'dycSpin 10s linear infinite reverse' }}
        >
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white" style={{ boxShadow: `0 0 14px 3px ${b}` }} />
        </span>
        <span
          className="text-[84px] font-black leading-none"
          style={{ color: 'transparent', WebkitTextStroke: `2px ${a}`, filter: `drop-shadow(0 0 14px ${a})` }}
        >
          X
        </span>
      </div>
    )

  /* growth */
  return (
    <div className="flex h-full items-end justify-center gap-2.5 px-8">
      {[26, 40, 36, 60, 78, 100].map((h, i) => (
        <span
          key={i}
          className="dyc-anim w-7 origin-bottom rounded-t-md"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, ${b}55, ${a})`,
            animation: `dycGrow 3.4s cubic-bezier(0.3,0.7,0.2,1) ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* title where each letter rises out of a mask */
const RiseTitle = ({ text }) => {
  let n = 0
  return (
    <h3 className="text-[28px] font-black leading-[1.05] tracking-tight text-white">
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="mr-2 inline-block overflow-hidden whitespace-nowrap pb-1 align-bottom">
          {word.split('').map((ch) => (
            <span
              key={n}
              className="dyc-anim inline-block"
              style={{ animation: `dycLetter 0.55s cubic-bezier(0.2,0.8,0.2,1) ${n++ * 22}ms both` }}
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h3>
  )
}

const Roll = ({ children }) => (
  <span className="relative block overflow-hidden leading-[1.4]">
    <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full group-focus-visible:-translate-y-full">
      {children}
    </span>
    <span
      aria-hidden
      className="absolute left-0 top-full block text-white transition-transform duration-300 ease-out group-hover:-translate-y-full group-focus-visible:-translate-y-full"
    >
      {children}
    </span>
  </span>
)

const Chevron = ({ open, size = 'h-3 w-3' }) => (
  <svg
    className={`${size} transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const Arrow = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const OPEN_WIDTH = 760
const MOB_PAD = 24 // px-6, used by the carousel snap maths

const Navbar = () => {
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState(null) // 'events' | 'about' | null
  const [shownMenu, setShownMenu] = useState('events')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobSection, setMobSection] = useState('events') // 'events' | 'about' | null
  const [mobIdx, setMobIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [failedImgs, setFailedImgs] = useState({})
  const [restWidth, setRestWidth] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [mobAdminOpen, setMobAdminOpen] = useState(false)

  const lastScrollY = useRef(0)
  const itemRefs = useRef({})
  const closeTimer = useRef(null)
  const rowRef = useRef(null)
  const islandRef = useRef(null)
  const carouselRef = useRef(null)
  const adminRef = useRef(null)
  const mobAdminRef = useRef(null)
  const [highlight, setHighlight] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })

  /* measure the resting pill so the island morphs between two exact widths */
  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return
    const measure = () => setRestWidth(el.offsetWidth + 14)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* hide on scroll down, back on scroll up, page progress */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, y / max) : 0)
      if (y <= 0) setVisible(true)
      else if (Math.abs(y - lastScrollY.current) > 6) setVisible(y < lastScrollY.current)
      lastScrollY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!visible) setOpenMenu(null)
  }, [visible])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
        setAdminOpen(false)
        setMobAdminOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* close the Admin access dropdowns on outside click, on scroll-hide and on navigation */
  useEffect(() => {
    const onDown = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
      if (mobAdminRef.current && !mobAdminRef.current.contains(e.target)) setMobAdminOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  useEffect(() => {
    if (!visible) setAdminOpen(false)
  }, [visible])

  useEffect(() => {
    setAdminOpen(false)
    setMobAdminOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* when the mobile menu opens, start from the first event */
  useEffect(() => {
    if (mobileOpen && carouselRef.current) carouselRef.current.scrollLeft = 0
    if (!mobileOpen) setMobAdminOpen(false)
  }, [mobileOpen])

  /* sliding highlight */
  const moveHighlightTo = useCallback((key) => {
    const el = itemRefs.current[key]
    if (!el) return
    setHighlight({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      opacity: 1,
    })
  }, [])

  const activeKey = keyForPath(location.pathname)

  const restHighlight = useCallback(() => {
    if (activeKey) moveHighlightTo(activeKey)
    else setHighlight((h) => ({ ...h, opacity: 0 }))
  }, [activeKey, moveHighlightTo])

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
    requestAnimationFrame(restHighlight)
  }, [location.pathname, restHighlight])

  useEffect(() => {
    const onResize = () => restHighlight()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [restHighlight])

  /* hover intent */
  const cancelClose = () => clearTimeout(closeTimer.current)
  const hoverItem = (key, menu = null) => {
    cancelClose()
    setOpenMenu(menu)
    if (menu) setShownMenu(menu)
    moveHighlightTo(key)
  }
  const leaveAll = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      setOpenMenu(null)
      restHighlight()
    }, 160)
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  /* cursor spotlight on the island */
  const onMove = (e) => {
    const el = islandRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  /* tilt + light + parallax on the preview card */
  const onCardMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--ry', `${(px - 0.5) * 8}deg`)
    el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`)
    el.style.setProperty('--cx', `${px * 100}%`)
    el.style.setProperty('--cy', `${py * 100}%`)
    el.style.setProperty('--px', `${(px - 0.5) * 2}`)
    el.style.setProperty('--py', `${(py - 0.5) * 2}`)
  }
  const onCardLeave = (e) => {
    const el = e.currentTarget
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--px', '0')
    el.style.setProperty('--py', '0')
  }

  /* ---------- mobile helpers ---------- */
  const buzz = () => {
    try {
      navigator.vibrate && navigator.vibrate(8)
    } catch (_) {}
  }

  const toggleMobile = () => {
    if (!mobileOpen) {
      setMobSection('events')
      setMobIdx(0)
    }
    setMobileOpen((o) => !o)
    buzz()
  }

  const toggleSection = (s) => {
    setMobSection((cur) => (cur === s ? null : s))
    buzz()
  }

  /* which event card is snapped at the left edge (only that one animates) */
  const onCarouselScroll = (e) => {
    const el = e.currentTarget
    let best = 0
    let dist = Infinity
    Array.from(el.children).forEach((ch, i) => {
      const d = Math.abs(ch.offsetLeft - MOB_PAD - el.scrollLeft)
      if (d < dist) {
        dist = d
        best = i
      }
    })
    setMobIdx((prev) => {
      if (prev !== best) buzz()
      return best
    })
  }

  const stag = (i) => ({
    transitionDelay: `${mobileOpen ? 60 + i * 60 : 0}ms`,
    opacity: mobileOpen ? 1 : 0,
    transform: mobileOpen ? 'none' : 'translateY(22px)',
  })

  const ROW =
    'flex w-full items-center justify-between border-b border-white/10 py-[18px] text-left text-[40px] font-black leading-none tracking-tight transition-all duration-500 active:opacity-60'

  const preview = EVENTS[previewIdx]
  const isOpen = openMenu !== null

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* =============================== DESKTOP =============================== */}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-50 hidden justify-center transition-all duration-500 ease-out motion-reduce:transition-none md:flex"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-28px)',
        }}
      >
        <nav
          aria-label="Main"
          ref={islandRef}
          onMouseLeave={leaveAll}
          onMouseEnter={cancelClose}
          onMouseMove={onMove}
          className={`group/island relative box-border rounded-[28px] p-1.5 transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${GLASS} ${
            visible ? 'pointer-events-auto' : ''
          }`}
          style={{ width: isOpen ? OPEN_WIDTH : restWidth ?? undefined }}
        >
          <span className="pointer-events-none absolute inset-x-12 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent" />

          <span
            className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-300 group-hover/island:opacity-100"
            style={{
              background:
                'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.10), transparent 65%)',
            }}
          />

          {/* ---------- top row ---------- */}
          <div className="relative mx-auto w-max">
            <div ref={rowRef} className="relative flex w-max items-center gap-2">
              {/* DYC logo -> home */}
              <Link
                to="/"
                aria-label="DYC home"
                className="ml-1 shrink-0 transition-transform duration-300 hover:scale-105"
              >
                <Logo className="h-10 w-17" />
              </Link>

              <div className="relative flex items-center">
                <div
                  className="pointer-events-none absolute rounded-full border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-all duration-300 ease-out motion-reduce:transition-none"
                  style={{
                    left: highlight.left,
                    top: highlight.top,
                    width: highlight.width,
                    height: highlight.height,
                    opacity: highlight.opacity,
                  }}
                />

                <Link
                  to="/"
                  ref={(el) => (itemRefs.current.home = el)}
                  onMouseEnter={() => hoverItem('home')}
                  onFocus={() => hoverItem('home')}
                  className={ITEM}
                >
                  <Roll>Home</Roll>
                </Link>

                <button
                  type="button"
                  ref={(el) => (itemRefs.current.events = el)}
                  aria-expanded={openMenu === 'events'}
                  onMouseEnter={() => hoverItem('events', 'events')}
                  onFocus={() => hoverItem('events', 'events')}
                  onClick={() => setOpenMenu((m) => (m === 'events' ? null : 'events'))}
                  className={ITEM}
                >
                  <Roll>Events</Roll> <Chevron open={openMenu === 'events'} />
                </button>

                <button
                  type="button"
                  ref={(el) => (itemRefs.current.about = el)}
                  aria-expanded={openMenu === 'about'}
                  onMouseEnter={() => hoverItem('about', 'about')}
                  onFocus={() => hoverItem('about', 'about')}
                  onClick={() => setOpenMenu((m) => (m === 'about' ? null : 'about'))}
                  className={ITEM}
                >
                  <Roll>About</Roll> <Chevron open={openMenu === 'about'} />
                </button>

                <Link
                  to="/gallery"
                  ref={(el) => (itemRefs.current.gallery = el)}
                  onMouseEnter={() => hoverItem('gallery')}
                  onFocus={() => hoverItem('gallery')}
                  className={ITEM}
                >
                  <Roll>Gallery</Roll>
                </Link>
              </div>

              {/* Admin access: lock opens a small menu with Judges and Admin access inside */}
              <div ref={adminRef} className="relative">
                <button
                  type="button"
                  title="Admin access"
                  aria-label="Admin access"
                  aria-haspopup="menu"
                  aria-expanded={adminOpen}
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/15 hover:text-white ${
                    adminOpen || location.pathname === '/judging' || location.pathname === '/admin'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 118 0v3" />
                  </svg>
                </button>

                <div
                  role="menu"
                  className={`absolute right-0 top-full z-30 mt-3 w-56 origin-top-right rounded-2xl p-1.5 transition-all duration-200 ease-out ${GLASS} ${
                    adminOpen
                      ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                  }`}
                >
                  <div className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-400">
                    Admin access
                  </div>
                  <Link
                    to="/judging"
                    role="menuitem"
                    onClick={() => setAdminOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-white/10 ${
                      location.pathname === '/judging' ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    Judges
                    <span className="text-gray-400">
                      <Arrow />
                    </span>
                  </Link>
                  <Link
                    to="/admin"
                    role="menuitem"
                    onClick={() => setAdminOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-white/10 ${
                      location.pathname === '/admin' ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    Admin access
                    <span className="text-gray-400">
                      <Arrow />
                    </span>
                  </Link>
                </div>
              </div>

              <Link
                to="/join"
                className="group relative flex h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full border border-red-300/30 bg-red-500 px-5 text-[15px] font-semibold text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_22px_rgba(239,68,68,0.4)] transition-colors hover:bg-red-400"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/40 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                <span className="relative">Join us</span>
                <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                  <Arrow />
                </span>
              </Link>

              <span
                className="pointer-events-none absolute inset-x-6 -bottom-1.5 h-0.5 origin-left rounded-full bg-linear-to-r from-red-500 via-orange-400 to-amber-300 transition-transform duration-150 ease-out"
                style={{
                  transform: `scaleX(${progress})`,
                  opacity: progress > 0.005 && !isOpen ? 0.9 : 0,
                }}
              />
            </div>
          </div>

          {/* ---------- island grows downward ---------- */}
          <div
            className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-2">
                {/* EVENTS */}
                {shownMenu === 'events' && (
                  <div className="grid grid-cols-[1fr_1.15fr] gap-2">
                    <ul className="flex flex-col p-1">
                      {EVENTS.map((e, i) => {
                        const on = previewIdx === i
                        return (
                          <li key={e.path}>
                            <Link
                              to={e.path}
                              onMouseEnter={() => setPreviewIdx(i)}
                              onFocus={() => setPreviewIdx(i)}
                              onClick={() => setOpenMenu(null)}
                              className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-[22px] font-semibold leading-tight tracking-tight transition-all duration-300 ${
                                on ? 'translate-x-1.5 text-white' : 'text-gray-500'
                              } ${location.pathname.startsWith(e.path) ? 'text-red-400!' : ''}`}
                            >
                              {e.name}
                              <span
                                className={`transition-all duration-300 ${
                                  on ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                                }`}
                              >
                                <Arrow />
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>

                    {/* ---------- preview card: art on top, text on its own glass panel ---------- */}
                    <Link
                      to={preview.path}
                      onClick={() => setOpenMenu(null)}
                      onMouseMove={onCardMove}
                      onMouseLeave={onCardLeave}
                      className="group relative isolate flex min-h-97.5 flex-col justify-between overflow-hidden rounded-[22px] border border-white/10 p-4"
                      style={{
                        transform: 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
                        transition: 'transform 220ms ease-out',
                      }}
                    >
                      {EVENTS.map((e, i) => {
                        const on = previewIdx === i
                        const showImg = e.img && !failedImgs[i]
                        return (
                          <div
                            key={e.path}
                            aria-hidden
                            className="absolute inset-0 -z-10 transition-opacity duration-500"
                            style={{ opacity: on ? 1 : 0 }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ background: `linear-gradient(135deg, ${e.glow[1]}66, #000 85%)` }}
                            />

                            <span
                              className="dyc-anim absolute -right-10 -top-10 h-60 w-60 rounded-full opacity-70 blur-3xl"
                              style={{ background: e.glow[0], animation: 'dycFloatA 7s ease-in-out infinite' }}
                            />
                            <span
                              className="dyc-anim absolute -bottom-12 -left-10 h-52 w-52 rounded-full opacity-50 blur-3xl"
                              style={{ background: e.glow[1], animation: 'dycFloatB 9s ease-in-out infinite' }}
                            />

                            {showImg && (
                              <img
                                src={e.img}
                                alt=""
                                onError={() => setFailedImgs((f) => ({ ...f, [i]: true }))}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1400 ease-out"
                                style={{ transform: on ? 'scale(1.03)' : 'scale(1.18)' }}
                              />
                            )}

                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />

                            <div
                              className="absolute inset-x-5 top-14 h-37.5"
                              style={{
                                transform:
                                  'translate3d(calc(var(--px, 0) * 14px), calc(var(--py, 0) * 10px), 0)',
                                transition: 'transform 200ms ease-out',
                                mixBlendMode: 'screen',
                              }}
                            >
                              {on && <Motif type={e.motif} glow={e.glow} />}
                            </div>
                          </div>
                        )
                      })}

                      <span
                        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            'radial-gradient(220px circle at var(--cx, 50%) var(--cy, 50%), rgba(255,255,255,0.14), transparent 70%)',
                        }}
                      />

                      <div className="flex flex-wrap gap-1.5">
                        {preview.chips.map((c, ci) => (
                          <span
                            key={preview.name + c}
                            className="dyc-anim rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md"
                            style={{ animation: `dycFade 0.45s ease-out ${ci * 70}ms both` }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
                        <RiseTitle key={preview.name} text={preview.name} />
                        <p
                          key={preview.name + 'tag'}
                          className="dyc-anim mt-1.5 text-[14px] leading-snug text-white/75"
                          style={{ animation: 'dycFade 0.5s ease-out 0.15s both' }}
                        >
                          {preview.tag}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform duration-300 group-hover:translate-x-1.5">
                          Explore <Arrow />
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* ABOUT */}
                {shownMenu === 'about' && (
                  <div className="grid grid-cols-2 gap-2 p-1">
                    {ABOUT_ITEMS.map((a) => (
                      <Link
                        key={a.path}
                        to={a.path}
                        onClick={() => setOpenMenu(null)}
                        className={`group rounded-2xl border border-white/5 bg-white/4 p-5 transition-colors hover:border-white/15 hover:bg-white/10 ${
                          location.pathname === a.path ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xl font-bold tracking-tight">
                          {a.name}
                          <span className="text-gray-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-red-400">
                            <Arrow />
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">{a.tag}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* =============================== MOBILE =============================== */}
      <div className="md:hidden">
        {/* scroll progress along the very top of the screen */}
        <span
          className="pointer-events-none fixed inset-x-0 top-0 z-70 h-0.5 origin-left bg-linear-to-r from-red-500 via-orange-400 to-amber-300"
          style={{
            transform: `scaleX(${progress})`,
            opacity: progress > 0.005 ? 1 : 0,
            transition: 'transform 120ms linear, opacity 200ms',
          }}
        />

        {/* floating top bar: logo + menu button only (Join us now lives inside the menu) */}
        <div
          className="fixed inset-x-3 z-60 flex items-center justify-between transition-all duration-500 ease-out"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            opacity: visible || mobileOpen ? 1 : 0,
            transform: visible || mobileOpen ? 'none' : 'translateY(-24px)',
            pointerEvents: visible || mobileOpen ? 'auto' : 'none',
          }}
        >
          {/* DYC logo -> home */}
          <Link
            to="/"
            aria-label="DYC home"
            onClick={() => setMobileOpen(false)}
            className="transition-transform active:scale-95"
          >
            <Logo className="h-11 w-19" />
          </Link>

          <button
            type="button"
            onClick={toggleMobile}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform active:scale-90 ${GLASS}`}
          >
            <span
              className={`absolute h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                mobileOpen ? 'rotate-45' : '-translate-y-1.5'
              }`}
            />
            <span
              className={`absolute h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                mobileOpen ? '-rotate-45' : 'translate-y-1.5'
              }`}
            />
          </button>
        </div>

        {/* full-screen menu */}
        <div
          aria-hidden={!mobileOpen}
          className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-3xl transition-opacity duration-300 ${
            mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(80% 50% at 100% 0%, rgba(239,68,68,0.35), transparent 70%), radial-gradient(60% 40% at 0% 100%, rgba(251,146,60,0.18), transparent 70%)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            className="flex min-h-dvh flex-col px-6"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 84px)' }}
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {/* Home */}
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`${ROW} ${location.pathname === '/' ? 'text-red-400' : 'text-white'}`}
                style={stag(0)}
              >
                Home
              </Link>

              {/* Events accordion */}
              <button
                type="button"
                onClick={() => toggleSection('events')}
                aria-expanded={mobSection === 'events'}
                className={`${ROW} ${activeKey === 'events' ? 'text-red-400' : 'text-white'}`}
                style={stag(1)}
              >
                Events
                <span className="text-gray-400">
                  <Chevron open={mobSection === 'events'} size="h-6 w-6" />
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ gridTemplateRows: mobSection === 'events' ? '1fr' : '0fr' }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    ref={carouselRef}
                    onScroll={onCarouselScroll}
                    className="relative -mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-3 overflow-x-auto px-6 pb-3 pt-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
                  >
                    {EVENTS.map((e, i) => {
                      const live = mobileOpen && mobSection === 'events' && mobIdx === i
                      const showImg = e.img && !failedImgs[i] && mobileOpen && mobSection === 'events'
                      return (
                        <Link
                          key={e.path}
                          to={e.path}
                          onClick={() => setMobileOpen(false)}
                          className="relative isolate flex h-72.5 w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-3.5 transition-transform duration-200 active:scale-[0.97]"
                        >
                          <div aria-hidden className="absolute inset-0 -z-10">
                            <div
                              className="absolute inset-0"
                              style={{ background: `linear-gradient(135deg, ${e.glow[1]}66, #000 85%)` }}
                            />
                            <span
                              className="dyc-anim absolute -right-10 -top-10 h-52 w-52 rounded-full opacity-70 blur-3xl"
                              style={{
                                background: e.glow[0],
                                animation: live ? 'dycFloatA 7s ease-in-out infinite' : 'none',
                              }}
                            />
                            <span
                              className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full opacity-50 blur-3xl"
                              style={{ background: e.glow[1] }}
                            />
                            {showImg && (
                              <img
                                src={e.img}
                                alt=""
                                loading="lazy"
                                onError={() => setFailedImgs((f) => ({ ...f, [i]: true }))}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />

                            {/* motif, scaled down; only the centred card animates */}
                            <div
                              className="absolute left-3 right-3 top-12 h-28 overflow-hidden"
                              style={{ mixBlendMode: 'screen' }}
                            >
                              <div className="h-37.5 w-[133%] origin-top-left scale-75">
                                {live && <Motif type={e.motif} glow={e.glow} />}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {e.chips.map((c) => (
                              <span
                                key={c}
                                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md"
                              >
                                {c}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-end justify-between gap-3 rounded-2xl border border-white/10 bg-black/55 p-3.5 backdrop-blur-xl">
                            <div>
                              <h3 className="text-[21px] font-black leading-[1.05] tracking-tight text-white">
                                {e.name}
                              </h3>
                              <p className="mt-1 text-[13px] leading-snug text-white/70">{e.tag}</p>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
                              <Arrow />
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* page dots */}
                  <div className="flex justify-center gap-1.5 pb-4">
                    {EVENTS.map((e, i) => (
                      <span
                        key={e.path}
                        className="h-1.5 rounded-full bg-white transition-all duration-300"
                        style={{ width: mobIdx === i ? 18 : 6, opacity: mobIdx === i ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* About accordion */}
              <button
                type="button"
                onClick={() => toggleSection('about')}
                aria-expanded={mobSection === 'about'}
                className={`${ROW} ${activeKey === 'about' ? 'text-red-400' : 'text-white'}`}
                style={stag(2)}
              >
                About
                <span className="text-gray-400">
                  <Chevron open={mobSection === 'about'} size="h-6 w-6" />
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ gridTemplateRows: mobSection === 'about' ? '1fr' : '0fr' }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="flex flex-col gap-2 py-4">
                    {ABOUT_ITEMS.map((a) => (
                      <Link
                        key={a.path}
                        to={a.path}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 transition-colors active:bg-white/15"
                      >
                        <div>
                          <div
                            className={`text-xl font-bold tracking-tight ${
                              location.pathname === a.path ? 'text-red-400' : 'text-white'
                            }`}
                          >
                            {a.name}
                          </div>
                          <p className="mt-0.5 text-[13px] text-gray-400">{a.tag}</p>
                        </div>
                        <span className="text-gray-500">
                          <Arrow />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <Link
                to="/gallery"
                onClick={() => setMobileOpen(false)}
                className={`${ROW} ${location.pathname === '/gallery' ? 'text-red-400' : 'text-white'}`}
                style={stag(3)}
              >
                Gallery
              </Link>
            </nav>

            {/* sticky action bar, always reachable with a thumb */}
            <div
              className="sticky bottom-0 -mx-6 mt-auto flex items-center gap-3 bg-linear-to-t from-black via-black/90 to-transparent px-6 pt-10 transition-all duration-500"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                transitionDelay: `${mobileOpen ? 320 : 0}ms`,
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'none' : 'translateY(22px)',
              }}
            >
              <Link
                to="/join"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-4 text-base font-semibold text-black shadow-[0_6px_30px_rgba(239,68,68,0.45)] transition-transform active:scale-[0.98] active:bg-red-400"
              >
                Join us <Arrow />
              </Link>

              {/* Admin access dropdown (opens upward) with Judges and Admin access inside */}
              <div ref={mobAdminRef} className="relative shrink-0">
                <div
                  role="menu"
                  className={`absolute bottom-full right-0 mb-3 w-56 origin-bottom-right rounded-2xl p-1.5 transition-all duration-200 ease-out ${GLASS} ${
                    mobAdminOpen
                      ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none translate-y-1 scale-95 opacity-0'
                  }`}
                >
                  <div className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-400">
                    Admin access
                  </div>
                  <Link
                    to="/judging"
                    role="menuitem"
                    onClick={() => {
                      setMobAdminOpen(false)
                      setMobileOpen(false)
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium transition-colors active:bg-white/10 ${
                      location.pathname === '/judging' ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    Judges
                    <span className="text-gray-400">
                      <Arrow />
                    </span>
                  </Link>
                  <Link
                    to="/admin"
                    role="menuitem"
                    onClick={() => {
                      setMobAdminOpen(false)
                      setMobileOpen(false)
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium transition-colors active:bg-white/10 ${
                      location.pathname === '/admin' ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    Admin access
                    <span className="text-gray-400">
                      <Arrow />
                    </span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobAdminOpen((o) => !o)
                    buzz()
                  }}
                  aria-label="Admin access"
                  aria-haspopup="menu"
                  aria-expanded={mobAdminOpen}
                  className={`flex h-13.5 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm transition-colors active:bg-white/15 ${
                    mobAdminOpen || location.pathname === '/judging' || location.pathname === '/admin'
                      ? 'text-red-400'
                      : 'text-gray-200'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 118 0v3" />
                  </svg>
                  Admin access
                  <Chevron open={!mobAdminOpen} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar