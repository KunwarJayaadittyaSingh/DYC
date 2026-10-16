import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Add a `logo: '/images/logos/youthvibe.png'` field once you have the files —
// it'll render automatically in place of the video.
const EVENTS = [
  { name: 'Youthvibe', path: '/youthvibe', video: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_yv1', logo: null },
  { name: 'FTS', path: '/fts', video: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_fts', logo: null },
  { name: 'Magnitude', path: '/magnitude', video: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_mag', logo: null },
  { name: 'Concoction', path: '/concoction', video: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_con', logo: null },
]

// Fires once when the element scrolls into view.
const useSlideInView = (options = {}) => {
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
      { threshold: 0.2, ...options }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

const EventLogo = ({ event, index }) => {
  const [ref, inView] = useSlideInView()
  const fromSide = index % 2 === 0 ? -80 : 80

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : `translateX(${fromSide}px)`,
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <Link
        to={event.path}
        className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 transition-all duration-500 hover:border-white/40 hover:-translate-y-1 md:h-56"
      >
        {event.video ? (
          <video
            src={event.video}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : event.logo ? (
          <img
            src={event.logo}
            alt={event.name}
            className="relative z-10 max-h-[60%] max-w-[70%] object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-white/5" />
        )}

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/0 transition-all duration-500 group-hover:ring-white/30" />
      </Link>
    </div>
  )
}

const UniverseSection = () => {
  const [headingRef, headingInView] = useSlideInView({ threshold: 0.3 })

  return (
    <section className="relative z-10 w-full bg-transparent px-6 py-24 md:px-16 md:py-40">
      <div
        ref={headingRef}
        className="mx-auto max-w-6xl text-center"
        style={{
          opacity: headingInView ? 1 : 0,
          transform: headingInView ? 'translateX(0)' : 'translateX(-80px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <h2 className="font-[font5] text-[16vw] uppercase leading-none text-white md:text-[9vw]">
          Our Universe
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-gray-400 md:text-base">
          Every event, every initiative — one connected DYC ecosystem.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {EVENTS.map((event, i) => (
          <EventLogo key={event.path} event={event} index={i} />
        ))}
      </div>
    </section>
  )
}

export default UniverseSection