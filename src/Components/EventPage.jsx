import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StarBackground from './StarBackground'

// Fires once when the element scrolls into view.
const useRevealOnView = (options = {}) => {
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

// One scrolling row of gallery images. Direction and speed are passed in
// per-row so rows don't look mechanically synced with each other.
const GalleryRow = ({ images, reverse, duration }) => {
  const loop = [...images, ...images]

  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className="dyc-marquee-track flex gap-6 w-max py-2"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            className="w-[62vw] md:w-[26vw] h-[38vh] shrink-0 rounded-2xl overflow-hidden border border-white/10"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

const EventPage = ({
  heading,
  category,
  media,
  mediaType = 'image',
  description,
  gallery = [],
  galleryRows = null,
  registrationLink,
}) => {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const [regRef, regInView] = useRevealOnView({ threshold: 0.3 })
  const [galleryRef, galleryInView] = useRevealOnView({ threshold: 0.1 })

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const start = windowHeight
      const end = -rect.height + windowHeight
      const raw = (rect.top - start) / (end - start)
      setProgress(Math.min(Math.max(raw, 0), 1))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  let scale
  let textOpacity

  if (progress < 0.4) {
    scale = 0.55 + (progress / 0.4) * 0.45
    textOpacity = 0
  } else if (progress < 0.65) {
    scale = 1
    textOpacity = Math.min((progress - 0.4) / 0.15, 1)
  } else {
    scale = 1 - ((progress - 0.65) / 0.35) * 0.35
    textOpacity = Math.max(1 - (progress - 0.65) / 0.15, 0)
  }

  const radius = (1 - scale) * 64

  const rows = (galleryRows && galleryRows.length > 0)
    ? galleryRows
    : [gallery, gallery, gallery, gallery]

  const rowConfigs = [
    { reverse: false, duration: 32 },
    { reverse: true, duration: 40 },
    { reverse: false, duration: 36 },
    { reverse: true, duration: 28 },
  ]

  const hasGallery = rows.some((row) => row && row.length > 0)

  return (
    <div className="relative bg-black">
      <StarBackground />

      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-black via-red-950/30 to-black" />
      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/15 blur-[150px]" />

      <style>{`
        @keyframes dyc-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .dyc-marquee-track {
          animation-name: dyc-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .dyc-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .dyc-marquee-track { animation: none; }
        }
      `}</style>

      <section ref={sectionRef} className="relative z-10 min-h-[280vh] w-full">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 pt-28 md:pt-24">
          {category && (
            <p className="text-red-600 uppercase tracking-widest text-sm mb-4">
              {category}
            </p>
          )}

          <h1 className="font-[font7] text-white uppercase text-[9vw] md:text-[4.5vw] text-center leading-none mb-8">
            {heading}
          </h1>

          <div
            className="overflow-hidden shadow-2xl"
            style={{
              width: `${scale * 88}vw`,
              height: `${scale * 58}vh`,
              borderRadius: `${radius}px`,
            }}
          >
            {mediaType === 'video' ? (
              <video
                src={media}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img src={media} alt={heading} className="w-full h-full object-cover" />
            )}
          </div>

          <p
            className="text-gray-300 max-w-xl text-center mt-8 text-base md:text-lg leading-relaxed"
            style={{ opacity: textOpacity }}
          >
            {description}
          </p>
        </div>
      </section>

      <section
        ref={regRef}
        className="relative z-10 w-full min-h-[70vh] py-32 px-6 flex flex-col items-center justify-center text-center overflow-y-auto"
        style={{
          opacity: regInView ? 1 : 0,
          transform: regInView ? 'translateY(0)' : 'translateY(50px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <p className="text-white uppercase tracking-widest text-sm mb-4">
          Registrations
        </p>
        <h2 className="font-[font7] text-white uppercase text-[6vw] md:text-[2.6vw] mb-8 leading-tight">
          Ready to take part?
        </h2>

        {registrationLink ? (
          <a
            href={registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white font-bold uppercase text-sm px-10 py-4 rounded-full hover:bg-red-500 transition-colors"
          >
            Register Now
          </a>
        ) : (
          <span className="text-gray-500 border border-gray-700 rounded-full px-10 py-4 uppercase text-sm">
            Registration opens soon
          </span>
        )}
      </section>

      {hasGallery && (
        <section
          ref={galleryRef}
          className="relative z-10 w-full py-16 overflow-hidden"
          style={{
            opacity: galleryInView ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          <div className="mx-auto max-w-6xl space-y-6">
            {rows.map((rowImages, i) =>
              rowImages && rowImages.length > 0 ? (
                <GalleryRow
                  key={i}
                  images={rowImages}
                  reverse={rowConfigs[i % rowConfigs.length].reverse}
                  duration={rowConfigs[i % rowConfigs.length].duration}
                />
              ) : null
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default EventPage