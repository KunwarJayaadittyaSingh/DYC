import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const EVENTS = [
  { name: 'Youthvibe', path: '/youthvibe' },
  { name: 'Freshmen Talent Search', path: '/fts' },
  { name: 'Magnitude', path: '/magnitude' },
  { name: 'Concoction', path: '/concoction' },
  { name: 'TEDx', path: '/tedx' },
  { name: 'Hult Prize', path: '/hult-prize' },
]

const NAV_LINKS = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/our-story' },
  { key: 'team', path: '/team' },
  { key: 'sponsors', path: '/sponsors' },
  { key: 'gallery', path: '/gallery' },
]

const Navbar = () => {
  const location = useLocation()
  const [eventsOpen, setEventsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [visible, setVisible] = useState(true)

  const lastScrollY = useRef(0)
  const linkRefs = useRef({})
  const containerRef = useRef(null)
  const [highlight, setHighlight] = useState({ left: 0, width: 0, opacity: 0 })

  // Fade out on scroll down, fade back in on scroll up — no position change.
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY

      if (currentY <= 0) {
        setVisible(true)
      } else if (currentY > lastScrollY.current) {
        setVisible(false) // scrolling down
      } else {
        setVisible(true) // scrolling up
      }

      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const moveHighlightTo = (key) => {
    const el = linkRefs.current[key]
    if (!el || !containerRef.current) return
    setHighlight({
      left: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1,
    })
  }

  // "events" is intentionally excluded — the glass highlight never tracks it.
  const activeKey = NAV_LINKS.find((l) => l.path === location.pathname)?.key || null

  useEffect(() => {
    if (activeKey) {
      requestAnimationFrame(() => moveHighlightTo(activeKey))
    } else {
      setHighlight((h) => ({ ...h, opacity: 0 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleMouseLeaveGroup = () => {
    if (activeKey) {
      moveHighlightTo(activeKey)
    } else {
      setHighlight((h) => ({ ...h, opacity: 0 }))
    }
  }

  return (
    <>
      {/* Desktop centered pill nav */}
      <nav
        className="fixed top-4 left-1/2 z-50 hidden w-fit -translate-x-1/2 transition-opacity duration-500 ease-out md:block"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center justify-center gap-6 rounded-full border border-red-500/20 bg-black/80 px-6 py-2.5 backdrop-blur-md shadow-[0_10px_40px_rgba(239,68,68,0.15)]">
          <div
            ref={containerRef}
            onMouseLeave={handleMouseLeaveGroup}
            className="relative flex items-center gap-8"
          >
            {/* Sliding glass highlight — never targets Events */}
            <div
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out"
              style={{
                left: highlight.left - 12,
                width: highlight.width + 24,
                height: '1.75rem',
                opacity: highlight.opacity,
              }}
            />

            <Link
              to="/"
              ref={(el) => (linkRefs.current.home = el)}
              onMouseEnter={() => moveHighlightTo('home')}
              className="relative z-10 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
            >
              Home
            </Link>

            {/* Events dropdown — no highlight tracking, and no gap between
                the button and the menu so hover doesn't drop out. */}
            <div
              className="relative z-10"
              onMouseEnter={() => setEventsOpen(true)}
              onMouseLeave={() => setEventsOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
              >
                Events
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${eventsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* pt-3 (instead of a separate mt-3 wrapper) keeps the hoverable
                  area continuous from the button straight into the menu. */}
              <div
                className={`absolute left-1/2 top-full w-48 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  eventsOpen
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-2 opacity-0'
                }`}
              >
                <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-black/95 backdrop-blur-md shadow-[0_10px_40px_rgba(239,68,68,0.15)]">
                  {EVENTS.map((event) => (
                    <Link
                      key={event.path}
                      to={event.path}
                      onClick={() => setEventsOpen(false)}
                      className="block px-5 py-3 text-sm text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      {event.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/our-story"
              ref={(el) => (linkRefs.current.about = el)}
              onMouseEnter={() => moveHighlightTo('about')}
              className="relative z-10 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
            >
              About
            </Link>

            <Link
              to="/team"
              ref={(el) => (linkRefs.current.team = el)}
              onMouseEnter={() => moveHighlightTo('team')}
              className="relative z-10 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
            >
              Team
            </Link>

            <Link
              to="/sponsors"
              ref={(el) => (linkRefs.current.sponsors = el)}
              onMouseEnter={() => moveHighlightTo('sponsors')}
              className="relative z-10 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
            >
             Spotlight
            </Link>

            <Link
              to="/gallery"
              ref={(el) => (linkRefs.current.gallery = el)}
              onMouseEnter={() => moveHighlightTo('gallery')}
              className="relative z-10 text-sm uppercase tracking-widest text-gray-300 transition-colors hover:text-red-400"
            >
              Gallery
            </Link>
          </div>

          <Link
            to="/join"
            className="flex shrink-0 items-center gap-2 rounded-full bg-red-500 px-5 py-1.5 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-red-400"
          >
            Join Us
          </Link>
        </div>
      </nav>

      {/* Mobile: hamburger button pinned top-right */}
      <div
        className="fixed top-4 right-4 z-50 transition-opacity duration-500 ease-out md:hidden"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-black/80 text-white backdrop-blur-md shadow-[0_10px_40px_rgba(239,68,68,0.15)]"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile dropdown menu, anchored under the button */}
        {mobileOpen && (
          <div className="absolute right-0 mt-3 flex w-64 flex-col gap-1 rounded-3xl border border-red-500/20 bg-black/95 p-4 backdrop-blur-md">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              Home
            </Link>

            <p className="px-4 pb-1 pt-3 text-xs uppercase tracking-widest text-gray-500">Events</p>
            {EVENTS.map((event) => (
              <Link
                key={event.path}
                to={event.path}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400"
              >
                {event.name}
              </Link>
            ))}

            <Link
              to="/our-story"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              About
            </Link>
            <Link
              to="/team"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              Team
            </Link>
            <Link
              to="/sponsors"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              Spotlight
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              Gallery
            </Link>
            <Link
              to="/join"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-xl bg-red-500 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-black hover:bg-red-400"
            >
              Join Us
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default Navbar