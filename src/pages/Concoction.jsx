import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import EventPage from '../Components/EventPage'
import Footer from './Footer'

/* ──────────────────────────────────────────────────────────────
   Concoction page
   Everything lives in this one file:
     RegistrationCTA        big animated "Ready to take part?" section
     PhotoWall              full-width endless photo belts + full-screen viewer
     useHideStockRegistration  hides EventPage's own plain registration block
   Everything is transparent: the fixed star field behind the page shows through.
   ────────────────────────────────────────────────────────────── */

/* Photos for the moving wall: add / remove files here.
   (Missing files are skipped automatically.) */
const PHOTOS = [
  // real photos pulled from the Gallery page (these files exist in /public/images)
  '/images/youthvibe-2.jpg',
  '/images/magnitude-2.jpg',
  '/images/youthvibe-onstage.jpg',
  '/images/MAGNITUDE.jpg',
  '/images/FTS_Group_image.jpg',
  '/images/magnitude-10.jpg',
  '/images/youthvibe-9.jpg',
  '/images/magnitude-12.jpg',
  '/images/youthvibe-11.jpg',
  '/images/magnitude-3.jpg',
  '/images/youthvibe-closing.jpg',
  '/images/tedx-bg.jpg',
  '/images/tedx-coming-soon.jpg',
  '/images/hultprize-coming-soon.jpg',

  // Concoction's own photos: drop files named concoction-1.jpg ... concoction-15.jpg
  // into /public/images and they show up automatically (missing ones are skipped)
  '/images/concoction-1.jpg',
  '/images/concoction-2.jpg',
  '/images/concoction-3.jpg',
  '/images/concoction-4.jpg',
  '/images/concoction-5.jpg',
  '/images/concoction-6.jpg',
  '/images/concoction-7.jpg',
  '/images/concoction-8.jpg',
  '/images/concoction-9.jpg',
  '/images/concoction-10.jpg',
  '/images/concoction-11.jpg',
  '/images/concoction-12.jpg',
  '/images/concoction-13.jpg',
  '/images/concoction-14.jpg',
  '/images/concoction-15.jpg',
]

// wall headline, split into lines of words (accent: true gets the red shimmer)
const WALL_LINES = [
  [{ t: 'Ideas' }, { t: 'that' }],
  [{ t: 'collided', accent: true }],
]

// tile shapes, cycled so the wall feels like a collage
const ASPECTS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[5/6]', 'aspect-[2/3]']

// a column's photo group is repeated until it has at least this many tiles,
// so the belt always overfills the wall and a gap can never show
const MIN_GROUP = 8

// seconds each tile takes to pass: lower = faster belts
const SECONDS_PER_TILE = 9

const pad = (n) => String(n).padStart(2, '0')

const getColumnCount = () => {
  if (window.matchMedia('(min-width: 1024px)').matches) return 4
  if (window.matchMedia('(min-width: 640px)').matches) return 3
  return 2
}

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

/* Loads every gallery photo once and keeps only the ones that exist.
   Doing this BEFORE building the belts is what removes the black gaps:
   a missing/slow photo would otherwise vanish from one copy of a belt but not the
   other, so the two halves would differ in height and the -50% loop would break. */
const useValidPhotos = (list) => {
  const [photos, setPhotos] = useState(null)
  useEffect(() => {
    let alive = true
    Promise.all(
      list.map(
        (src) =>
          new Promise((resolve) => {
            const im = new Image()
            im.onload = () => resolve(src)
            im.onerror = () => resolve(null)
            im.src = src
          })
      )
    ).then((ok) => alive && setPhotos(ok.filter(Boolean)))
    return () => {
      alive = false
    }
  }, [list])
  return photos
}

const useColumnCount = () => {
  const [n, setN] = useState(getColumnCount)
  useEffect(() => {
    const onResize = () => setN(getColumnCount())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return n
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

/* Headline: each word slides up from behind a mask, one after another */
const SlideHeadline = ({ id, lines, size = 'clamp(2.4rem, 7.5vw, 6.25rem)' }) => {
  const [ref, seen] = useInView(0.2)
  let index = 0

  return (
    <h2
      id={id}
      ref={ref}
      className="mag-display mx-auto max-w-4xl uppercase leading-[0.98]"
      style={{ fontSize: size }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((word, wi) => {
            const delay = index++ * 130
            return (
              <span key={word.t}>
                <span className="inline-block overflow-hidden align-bottom">
                  <span
                    className={`mag-word inline-block ${word.accent ? 'mag-shimmer' : ''}`}
                    style={{
                      transform: seen ? 'translateY(0)' : 'translateY(115%)',
                      transition: `transform 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
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
    </h2>
  )
}

/* One photo. The bottom padding (not a gap) is what keeps each belt's loop seamless.
   Keep it equal to the column gap in PhotoWall (gap-2 / md:gap-3). */
const Tile = ({ src, n, total, aspect, hidden, onOpen }) => {
  return (
    <div className="pb-2 md:pb-3">
      <button
        type="button"
        onClick={onOpen}
        tabIndex={hidden ? -1 : undefined}
        aria-label={`Open photo ${n} of ${total}`}
        className={`group relative block w-full ${aspect} overflow-hidden rounded-md bg-white/4 text-left outline-none transition-shadow duration-500 hover:shadow-[0_24px_80px_rgba(168,85,247,0.3)] focus-visible:ring-2 focus-visible:ring-white`}
      >
        <img
          src={src}
          alt=""
          draggable="false"
          className="h-full w-full object-cover object-[50%_28%] transition duration-700 ease-out group-hover:scale-[1.07] group-hover:brightness-110"
        />

        <span className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10 transition-colors duration-500 group-hover:ring-purple-400/60" />

        <span className="absolute bottom-3.5 left-4 translate-y-2 text-xs font-semibold tabular-nums tracking-widest text-white/80 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {pad(n)}
        </span>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 scale-75 items-center justify-center rounded-full bg-white/90 text-sm text-black opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100">
          ↗
        </span>
      </button>
    </div>
  )
}

const Lightbox = ({ photos, index, onClose, onNav }) => {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const touchX = useRef(null)
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
        const f = panelRef.current.querySelectorAll('button:not([disabled])')
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
    ;[1, -1].forEach((d) => {
      const im = new Image()
      im.src = photos[(index + d + photos.length) % photos.length]
    })
  }, [index, photos])

  const src = photos[index]

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-100 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) onNav(dx < 0 ? 1 : -1)
      }}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <img
        key={src}
        src={src}
        alt={`Gallery photo ${index + 1} of ${photos.length}`}
        draggable="false"
        className="mag-lb-img relative max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-[0_30px_120px_rgba(168,85,247,0.25)]"
      />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-red-500 hover:bg-red-500 hover:text-black md:right-8 md:top-8"
      >
        ✕
      </button>

      <button
        type="button"
        onClick={() => onNav(-1)}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-purple-400 hover:text-purple-300 md:left-8"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => onNav(1)}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-purple-400 hover:text-purple-300 md:right-8"
      >
        →
      </button>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums tracking-[0.3em] text-white/60">
        {pad(index + 1)} / {pad(photos.length)}
      </p>
    </div>
  )
}

/* Full-width wall of endless vertical belts.
   photos: array of image URLs (keep the array outside your component so it stays stable) */
const PhotoWall = ({
  photos: list,
  eyebrow = 'Gallery',
  lines = WALL_LINES,
  intro = 'A few frames from the event. Hover to pause, tap any photo to see it up close.',
  link,
  ctaEyebrow = 'Your turn',
  ctaLabel = 'Be in the next frame →',
}) => {
  const cols = useColumnCount()
  const photos = useValidPhotos(list)
  const [open, setOpen] = useState(-1)

  const columns = useMemo(() => {
    const out = Array.from({ length: cols }, () => [])
    ;(photos || []).forEach((src, i) => out[i % cols].push({ src, i }))
    return out.map((base) => {
      if (!base.length) return { items: [], baseLen: 0 }
      let items = base
      while (items.length < MIN_GROUP) items = items.concat(base)
      return { items, baseLen: base.length }
    })
  }, [cols, photos])

  const total = photos ? photos.length : 0
  const close = useCallback(() => setOpen(-1), [])
  const nav = useCallback((d) => setOpen((i) => (i + d + total) % total), [total])

  return (
    <section className="relative z-10 w-full overflow-x-clip text-white" aria-labelledby="gallery-title">
      <WallStyles />

      <div className="mx-auto max-w-7xl px-5 pt-24 text-center md:px-10 md:pt-36">
        <Reveal>
          <p className="mb-6 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-red-400">
            <span className="h-px w-10 bg-linear-to-r from-transparent to-red-400/70 md:w-16" />
            {eyebrow}
            <span className="h-px w-10 bg-linear-to-l from-transparent to-red-400/70 md:w-16" />
          </p>
        </Reveal>

        <SlideHeadline id="gallery-title" lines={lines} />

        <Reveal delay={150}>
          <p className="mx-auto mt-8 max-w-xl text-base font-light leading-relaxed text-white/60 md:mt-10 md:text-xl">
            {intro}
          </p>
        </Reveal>
      </div>

      {total > 0 && (
        <div className="mag-wall mt-14 h-[85vh] w-full px-2 md:mt-20 md:h-screen md:px-3">
          <div className="mag-vmask flex h-full gap-2 md:gap-3">
            {columns.map(({ items, baseLen }, ci) => {
              const seconds = Math.round(items.length * SECONDS_PER_TILE * (1 + (ci % 3) * 0.25))
              return (
                <div key={ci} className="min-w-0 flex-1 overflow-hidden">
                  <div
                    className="mag-vtrack"
                    style={{
                      animationDuration: `${seconds}s`,
                      animationDirection: ci % 2 ? 'reverse' : 'normal',
                      animationDelay: `-${Math.round((seconds * ci) / cols)}s`,
                    }}
                  >
                    {[0, 1].map((copy) => (
                      <div key={copy} className={copy ? 'mag-dup' : ''} aria-hidden={copy ? 'true' : undefined}>
                        {items.map(({ src, i }, k) => (
                          <Tile
                            key={`${src}-${k}`}
                            src={src}
                            n={i + 1}
                            total={total}
                            aspect={ASPECTS[(i * 3 + 1) % ASPECTS.length]}
                            hidden={copy > 0 || k >= baseLen}
                            onOpen={() => setOpen(i)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={`relative z-10 px-5 text-center ${link ? 'pb-16 pt-2 md:pb-20' : 'pb-0 pt-0'}`}>
        {link && (
          <Reveal>
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">{ctaEyebrow}</p>
            <a
              href={link}
              className="inline-block rounded-full bg-red-500 px-10 py-4 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-red-400 hover:shadow-[0_0_50px_rgba(239,68,68,0.5)]"
            >
              {ctaLabel}
            </a>
          </Reveal>
        )}
      </div>

      {open >= 0 && total > 0 && <Lightbox photos={photos} index={open} onClose={close} onNav={nav} />}
    </section>
  )
}

const WallStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
    .mag-display { font-family: 'Anton', 'Impact', 'Arial Narrow Bold', sans-serif; letter-spacing: -0.01em; }

    .mag-shimmer {
      background-image: linear-gradient(100deg, #ef4444 0%, #ef4444 40%, #fecaca 50%, #ef4444 60%, #ef4444 100%);
      background-size: 250% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      animation: mag-shine 4.5s linear infinite;
    }
    @keyframes mag-shine {
      from { background-position: 150% 0; }
      to { background-position: -50% 0; }
    }

    .mag-vmask {
      mask-image: linear-gradient(to bottom, transparent, black 8%, black 94%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 8%, black 94%, transparent);
    }
    .mag-vtrack {
      animation-name: mag-vloop;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      will-change: transform;
    }
    .mag-wall:hover .mag-vtrack { animation-play-state: paused; }
    @keyframes mag-vloop {
      from { transform: translate3d(0, 0, 0); }
      to { transform: translate3d(0, -50%, 0); }
    }

    .mag-lb-img { animation: mag-lb 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
    @keyframes mag-lb {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .mag-shimmer, .mag-vtrack { animation: none !important; }
      .mag-word { transform: none !important; transition: none !important; }
      .mag-lb-img { animation: none; }
      .mag-dup { display: none; }
      .mag-wall { height: auto !important; }
      .mag-vmask { mask-image: none; -webkit-mask-image: none; }
    }
  `}</style>
)

/* ──────────────────────────────────────────────────────────────
   REGISTRATION SECTION
   props: link (empty => "Opens soon"), eyebrow, lines, marquee, stats
   ────────────────────────────────────────────────────────────── */
const DEFAULT_LINES = ['Ready to', 'take part?']

/* Headline: letters rise from behind a mask one after another.
   Words stay together so lines wrap cleanly on phones. */
const RegHeadline = ({ lines, seen }) => {
  let n = 0
  const last = lines.length - 1
  return (
    <h2
      id="reg-title"
      className="reg-display relative mx-auto max-w-[95vw] text-center uppercase leading-[0.9]"
      style={{ fontSize: 'clamp(3.2rem, 11.5vw, 10.5rem)' }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word, wi) => (
            <span key={wi} className="mr-[0.2em] inline-block whitespace-nowrap last:mr-0">
              {word.split('').map((ch, ci) => {
                const delay = n++ * 38
                return (
                  <span key={ci} className="inline-block overflow-hidden align-bottom">
                    <span
                      className={`reg-ch inline-block ${li === last ? 'reg-outline' : ''}`}
                      style={{
                        transform: seen ? 'translateY(0)' : 'translateY(112%)',
                        transition: `transform 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms, color 0.35s ease, -webkit-text-stroke-color 0.35s ease`,
                      }}
                    >
                      {ch}
                    </span>
                  </span>
                )
              })}
            </span>
          ))}
        </span>
      ))}
    </h2>
  )
}

/* One giant outlined word-belt behind the content */
const Belt = ({ text, seconds, reverse, className = '' }) => {
  const group = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="flex items-center">
      <span className="reg-display reg-belt-word px-8 uppercase md:px-14">{text}</span>
      <span className="reg-belt-star">✦</span>
    </span>
  ))
  return (
    <div className={`reg-belt-mask pointer-events-none absolute inset-x-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="reg-slide flex w-max whitespace-nowrap"
        style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="flex">{group}</div>
        <div className="flex">{group}</div>
      </div>
    </div>
  )
}

const RegistrationCTA = ({
  link,
  eyebrow = 'Registrations',
  lines = DEFAULT_LINES,
  marquee = 'Register now',
  stats = [],
}) => {
  const live = Boolean(link)
  const sectionRef = useRef(null)
  const magnetRef = useRef(null)
  const [viewRef, seen] = useInView(0.25)
  const ringId = `reg-ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  /* cursor spotlight (--mx/--my), scroll parallax (--p) and the magnetic pull on the button */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const updateScroll = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
      el.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateScroll)
    }

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)

      const m = magnetRef.current
      if (!m) return
      const b = m.getBoundingClientRect()
      const dx = e.clientX - (b.left + b.width / 2)
      const dy = e.clientY - (b.top + b.height / 2)
      const reach = b.width * 1.15
      if (Math.hypot(dx, dy) < reach) {
        m.style.setProperty('--bx', `${(dx * 0.32).toFixed(1)}px`)
        m.style.setProperty('--by', `${(dy * 0.32).toFixed(1)}px`)
      } else {
        m.style.setProperty('--bx', '0px')
        m.style.setProperty('--by', '0px')
      }
    }
    const onLeave = () => {
      const m = magnetRef.current
      if (!m) return
      m.style.setProperty('--bx', '0px')
      m.style.setProperty('--by', '0px')
    }

    updateScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const ringText = live
    ? 'REGISTER NOW • REGISTER NOW • REGISTER NOW • '
    : 'REGISTRATION OPENS SOON • REGISTRATION OPENS SOON • '

  const Tag = live ? 'a' : 'div'
  const tagProps = live
    ? { href: link }
    : { role: 'status', 'aria-label': 'Registration opens soon' }

  return (
    <section
      ref={(node) => {
        sectionRef.current = node
        viewRef.current = node
      }}
      className="reg-section relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden px-5 py-28 text-white md:py-36"
      aria-labelledby="reg-title"
    >
      <RegStyles />

      {/* drifting colour blobs */}
      <div aria-hidden="true" className="reg-orb reg-orb-a pointer-events-none absolute" />
      <div aria-hidden="true" className="reg-orb reg-orb-b pointer-events-none absolute" />

      {/* cursor spotlight */}
      <div aria-hidden="true" className="reg-spot pointer-events-none absolute inset-0" />

      {/* giant belts, drifting with scroll */}
      <Belt text={marquee} seconds={70} className="reg-par-up top-[8%]" />
      <Belt text={marquee} seconds={90} reverse className="reg-par-down bottom-[8%]" />

      {/* film grain */}
      <div aria-hidden="true" className="reg-grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p
          className="mb-8 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.4em] text-red-400 md:mb-10"
          style={{
            opacity: seen ? 1 : 0,
            transform: seen ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <span className="h-px w-10 bg-linear-to-r from-transparent to-red-400/70 md:w-16" />
          {eyebrow}
          <span className="h-px w-10 bg-linear-to-l from-transparent to-red-400/70 md:w-16" />
        </p>

        <RegHeadline lines={lines} seen={seen} />

        {/* magnetic button with rotating ring text */}
        <div
          ref={magnetRef}
          className="reg-magnet relative mt-14 md:mt-20"
          style={{
            width: 'clamp(11rem, 20vw, 15rem)',
            height: 'clamp(11rem, 20vw, 15rem)',
            opacity: seen ? 1 : 0,
            scale: seen ? '1' : '0.6',
            transition: 'opacity 1s ease 0.6s, scale 1.1s cubic-bezier(0.22,1,0.36,1) 0.6s',
          }}
        >
          <div className="reg-pull absolute inset-0">
            <svg viewBox="0 0 200 200" className="reg-spin absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <path id={ringId} d="M 100,100 m -86,0 a 86,86 0 1,1 172,0 a 86,86 0 1,1 -172,0" />
              </defs>
              <text
                className="reg-ring-text"
                fill={live ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)'}
              >
                <textPath href={`#${ringId}`} textLength="533" lengthAdjust="spacing">
                  {ringText}
                </textPath>
              </text>
            </svg>

            <Tag
              {...tagProps}
              className={`reg-disc ${live ? 'reg-disc-live' : 'reg-disc-soon'} absolute inset-[21%] flex items-center justify-center overflow-hidden rounded-full text-center outline-none focus-visible:ring-2 focus-visible:ring-white`}
            >
              <span className="reg-fill absolute inset-0 rounded-full" />
              <span className="reg-disc-label relative flex flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-[0.2em] md:text-xs">
                {live ? 'Register' : 'Opens soon'}
                <span className="reg-arrow text-xl leading-none md:text-2xl">{live ? '↗' : '✦'}</span>
              </span>
            </Tag>
          </div>
        </div>

        {stats.length > 0 && (
          <ul
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium uppercase tracking-[0.25em] text-white/50 md:mt-20"
            style={{
              opacity: seen ? 1 : 0,
              transition: 'opacity 1s ease 1.1s',
            }}
          >
            {stats.map((s, i) => (
              <li key={s.l} className="flex items-center gap-8">
                <span>
                  <b className="mr-2 font-bold text-white/90">{s.v}</b>
                  {s.l}
                </span>
                {i < stats.length - 1 && <span className="h-1 w-1 rounded-full bg-purple-500/80" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

const RegStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
    .reg-display { font-family: 'Anton', 'Impact', 'Arial Narrow Bold', sans-serif; letter-spacing: -0.01em; }

    /* headline: last line is an outline that floods red letter by letter on hover */
    .reg-ch { cursor: default; }
    .reg-ch:hover { color: #ef4444; }
    .reg-outline {
      color: transparent;
      -webkit-text-stroke: 2px rgba(255,255,255,0.9);
    }
    .reg-outline:hover { color: #ef4444; -webkit-text-stroke-color: #ef4444; }

    /* giant belts */
    .reg-belt-word {
      font-size: clamp(6rem, 20vw, 17rem);
      line-height: 1;
      color: transparent;
      -webkit-text-stroke: 1.5px rgba(255,255,255,0.075);
    }
    .reg-belt-star { color: rgba(168,85,247,0.28); font-size: clamp(2rem, 6vw, 5rem); }
    .reg-belt-mask {
      mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
    }
    .reg-slide { animation: reg-slide linear infinite; will-change: transform; }
    @keyframes reg-slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .reg-par-up { transform: translateY(calc((var(--p, 0.5) - 0.5) * -90px)); }
    .reg-par-down { transform: translateY(calc((var(--p, 0.5) - 0.5) * 90px)); }

    /* colour blobs */
    .reg-orb { border-radius: 9999px; filter: blur(90px); opacity: 0.55; will-change: transform; }
    .reg-orb-a {
      width: min(60vw, 640px); aspect-ratio: 1; left: -10%; top: 18%;
      background: radial-gradient(circle, rgba(239,68,68,0.55), transparent 65%);
      animation: reg-drift-a 18s ease-in-out infinite alternate;
    }
    .reg-orb-b {
      width: min(55vw, 560px); aspect-ratio: 1; right: -8%; bottom: 6%;
      background: radial-gradient(circle, rgba(168,85,247,0.5), transparent 65%);
      animation: reg-drift-b 22s ease-in-out infinite alternate;
    }
    @keyframes reg-drift-a { to { transform: translate3d(18vw, 8vh, 0) scale(1.15); } }
    @keyframes reg-drift-b { to { transform: translate3d(-16vw, -10vh, 0) scale(1.2); } }

    /* cursor spotlight */
    .reg-spot {
      opacity: 0;
      transition: opacity 0.6s ease;
      background: radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(239,68,68,0.14), transparent 65%);
    }
    @media (hover: hover) { .reg-section:hover .reg-spot { opacity: 1; } }

    /* film grain */
    .reg-grain {
      opacity: 0.07;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }

    /* magnetic button */
    .reg-pull {
      transform: translate3d(var(--bx, 0px), var(--by, 0px), 0);
      transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reg-spin { animation: reg-spin 22s linear infinite; }
    .reg-magnet:hover .reg-spin { animation-duration: 7s; }
    @keyframes reg-spin { to { transform: rotate(360deg); } }
    .reg-ring-text { font-family: 'Inter', system-ui, sans-serif; font-size: 13.5px; font-weight: 700; letter-spacing: 0.18em; }

    .reg-disc {
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      transform: translate3d(calc(var(--bx, 0px) * 0.35), calc(var(--by, 0px) * 0.35), 0);
      transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s ease, box-shadow 0.5s ease;
    }
    .reg-disc-soon { border-style: dashed; color: rgba(255,255,255,0.7); cursor: default; }
    .reg-disc-live { cursor: pointer; }
    .reg-fill {
      transform: scale(0);
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reg-disc-live .reg-fill { background: #ef4444; }
    .reg-disc-soon .reg-fill { background: rgba(168,85,247,0.35); }
    .reg-disc:hover .reg-fill { transform: scale(1.02); }
    .reg-disc-live:hover { border-color: #ef4444; box-shadow: 0 0 80px rgba(239,68,68,0.55); }
    .reg-disc-live:hover .reg-disc-label { color: #000; }
    .reg-disc-soon:hover { border-color: rgba(168,85,247,0.8); box-shadow: 0 0 60px rgba(168,85,247,0.35); }
    .reg-arrow { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); display: inline-block; }
    .reg-disc-live:hover .reg-arrow { transform: translate(4px, -4px) scale(1.15); }
    .reg-disc-soon .reg-arrow { animation: reg-pulse 2.4s ease-in-out infinite; }
    @keyframes reg-pulse { 50% { transform: scale(1.35) rotate(90deg); opacity: 0.6; } }

    @media (prefers-reduced-motion: reduce) {
      .reg-slide, .reg-spin, .reg-orb, .reg-arrow { animation: none !important; }
      .reg-ch { transform: none !important; transition: none !important; }
      .reg-par-up, .reg-par-down { transform: none; }
      .reg-spot { display: none; }
    }
  `}</style>
)

/* EventPage still renders its own plain "Ready to take part?" block.
   This hides it so only the new section above shows.
   Cleaner fix later: remove that block from EventPage.jsx, then delete this hook. */
const useHideStockRegistration = () => {
  useEffect(() => {
    const hide = () => {
      document.querySelectorAll('h1, h2, h3').forEach((h) => {
        if (h.dataset.regDone || h.closest('.reg-section')) return
        if (!/ready to take part/i.test(h.textContent || '')) return
        h.dataset.regDone = '1'
        let box = h.closest('section')
        if (!box || box.querySelector('.reg-section, .mag-section, h1, video')) box = h.parentElement
        if (box) box.style.display = 'none'
      })
    }
    hide()
    const mo = new MutationObserver(hide)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */
const Concoction = () => {
  const registrationLink = null // put the registration URL here when it opens
  useHideStockRegistration()

  return (
    <>
      <EventPage
        heading="Concoction"
        category="Department of Youth Capital"
        media="https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_con"
        mediaType="video"
        description="Concoction mixes disciplines and ideas together — a space where creativity from different corners of campus collides into something new."
        galleryRows={[]} // the moving photo wall below replaces EventPage's own gallery
        registrationLink={registrationLink}
        beforeRegistration={<RegistrationCTA link={registrationLink} marquee="Concoction" />}
      />

      <PhotoWall
        photos={PHOTOS}
        lines={WALL_LINES}
        intro="A few frames from where different ideas collided. Hover to pause, tap any photo to see it up close."
        link={registrationLink}
      />

      <Footer />
    </>
  )
}

export default Concoction