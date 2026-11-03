import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import StarBackground from './StarBackground'
import LazyVideo from './LazyVideo'
import useScrollLinked from '../hooks/useScrollLinked'
import useInView from '../hooks/useInView'

const clamp = (v) => Math.min(Math.max(v, 0), 1)

// One scrolling row of gallery images. Direction and speed are passed in
// per-row so rows don't look mechanically synced with each other.
const GalleryRow = ({ images, reverse, duration }) => {
  const loop = [...images, ...images]

  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className="dyc-marquee-track flex gap-6 w-max py-2 will-change-transform"
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
            <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

const rowConfigs = [
  { reverse: false, duration: 32 },
  { reverse: true, duration: 40 },
  { reverse: false, duration: 36 },
  { reverse: true, duration: 28 },
]

const EventPage = ({
  heading,
  category,
  media,
  mediaType = 'image',
  description,
  gallery = [],
  galleryRows = null,
  registrationLink,
  beforeRegistration = null, // optional section shown right before "Ready to take part?"
}) => {
  const sectionRef = useRef(null)
  const headRef = useRef(null)
  const mediaRef = useRef(null)
  const textRef = useRef(null)

  const [regRef, regInView] = useInView({ threshold: 0.3 })
  const [galleryRef, galleryInView] = useInView({ threshold: 0.1 })

  useScrollLinked(sectionRef, (rect, vh) => {
    const progress = clamp((rect.top - vh) / -rect.height)

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

    // The media shrinks/grows with a transform, so move the heading and text
    // by the same amount the old layout used to.
    const baseH = mediaRef.current ? mediaRef.current.offsetHeight : 0
    const shift = (baseH * (scale - 1)) / 2

    if (mediaRef.current) {
      mediaRef.current.style.transform = `scale(${scale})`
      mediaRef.current.style.borderRadius = `${((1 - scale) * 64) / scale}px`
    }
    if (headRef.current) headRef.current.style.transform = `translate3d(0, ${-shift}px, 0)`
    if (textRef.current) {
      textRef.current.style.opacity = textOpacity
      textRef.current.style.transform = `translate3d(0, ${shift}px, 0)`
    }
  })

  const rows = (galleryRows && galleryRows.length > 0)
    ? galleryRows
    : [gallery, gallery, gallery, gallery]

  const hasGallery = rows.some((row) => row && row.length > 0)

  const registerClass =
    'bg-red-600 text-white font-bold uppercase text-sm px-10 py-4 rounded-full hover:bg-red-500 transition-colors'

  return (
    <div className="relative bg-black">
      {/* same fixed star field as the home page: the only background on this page */}
      <StarBackground />

      <style>{`
        @keyframes dyc-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .dyc-marquee-track {
          animation-name: dyc-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (hover: hover) {
          .dyc-marquee-track:hover { animation-play-state: paused; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dyc-marquee-track { animation: none; }
        }
      `}</style>

      <section ref={sectionRef} className="relative z-10 min-h-[280vh] w-full">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 pt-28 md:pt-24">
          <div ref={headRef} className="flex flex-col items-center will-change-transform">
            {category && (
              <p className="text-red-600 uppercase tracking-widest text-sm mb-4">
                {category}
              </p>
            )}

            <h1 className="font-[font7] text-white uppercase text-[9vw] md:text-[4.5vw] text-center leading-none mb-8">
              {heading}
            </h1>
          </div>

          <div
            ref={mediaRef}
            className="overflow-hidden shadow-2xl will-change-transform"
            style={{ width: '88vw', height: '58vh', transform: 'scale(0.55)' }}
          >
            {mediaType === 'video' ? (
              <LazyVideo eager src={media} className="w-full h-full object-cover" />
            ) : (
              <img src={media} alt={heading} decoding="async" className="w-full h-full object-cover" />
            )}
          </div>

          <p
            ref={textRef}
            className="text-gray-300 max-w-xl text-center mt-8 text-base md:text-lg leading-relaxed will-change-transform"
            style={{ opacity: 0 }}
          >
            {description}
          </p>
        </div>
      </section>

      {/* optional section placed right before registration */}
      {beforeRegistration}

      <section
        ref={regRef}
        className="relative z-10 w-full min-h-[70vh] py-32 px-6 flex flex-col items-center justify-center text-center"
        style={{
          opacity: regInView ? 1 : 0,
          transform: regInView ? 'translate3d(0, 0, 0)' : 'translate3d(0, 50px, 0)',
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
          registrationLink.startsWith('/') ? (
            // link to a page on this site: smooth navigation, no new tab
            <Link to={registrationLink} className={registerClass}>
              Register Now
            </Link>
          ) : (
            // outside link (Google Form etc.): opens in a new tab
            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className={registerClass}
            >
              Register Now
            </a>
          )
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