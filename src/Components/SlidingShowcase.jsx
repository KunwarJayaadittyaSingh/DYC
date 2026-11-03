import React, { useState } from 'react'
import LazyVideo from './LazyVideo'

const ITEMS = [
  { type: 'video', src: '/videos/dyc-video-logo.mp4' },
  { type: 'image', src: '/images/MAGNITUDE.jpg' },
  { type: 'video', src: '/videos/dyc-video-logo.mp4' },
  { type: 'image', src: '/images/IMG_4623.jpg' },
  { type: 'video', src: '/videos/dyc-video-logo.mp4' },
  { type: 'image', src: '/images/832925557_2688947411619250_204391593947818516_n.jpg' },
  { type: 'image', src: '/images/IMG_4624.jpg' },

  // { type: 'image', src: '/images/LPU.jpeg' },
]
const LOOP = [...ITEMS, ...ITEMS]

const SlidingShowcase = () => {
  // tracked per tile, so one broken file no longer hides every tile that shares it
  const [broken, setBroken] = useState({})
  const hide = (i) => setBroken((prev) => ({ ...prev, [i]: true }))

  return (
    <section className="relative z-10 w-full overflow-hidden bg-transparent py-16">
      <div className="showcase-track flex w-max gap-6 will-change-transform">
        {LOOP.map((item, i) =>
          broken[i] ? null : (
            <div
              key={i}
              className="h-64 w-96 shrink-0 overflow-hidden rounded-2xl transition-transform duration-500 md:h-80 md:w-md md:hover:scale-105"
            >
              {item.type === 'video' ? (
                <LazyVideo
                  src={item.src}
                  className="h-full w-full object-cover"
                  onError={() => hide(i)}
                />
              ) : (
                <img
                  src={item.src}
                  alt="DYC Showcase"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={() => hide(i)}
                />
              )}
            </div>
          )
        )}
      </div>

      <style>{`
        .showcase-track { animation: showcase-scroll 40s linear infinite; }
        @media (hover: hover) {
          .showcase-track:hover { animation-play-state: paused; }
        }
        @keyframes showcase-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .showcase-track { animation: none; }
        }
      `}</style>
    </section>
  )
}

export default React.memo(SlidingShowcase)