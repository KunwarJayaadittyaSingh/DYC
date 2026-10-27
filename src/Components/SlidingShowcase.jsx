import React, { useState } from 'react'

const ITEMS = [
  { type: 'video', src: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/dyc-video-logo.mp4' },
  { type: 'image', src: 'https://res.cloudinary.com/dqb0zmval/image/upload/q_auto,f_auto/dyc/images/MAGNITUDE.jpg' },
  { type: 'video', src: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/dyc-video-logo.mp4' },
  { type: 'image', src: 'https://res.cloudinary.com/dqb0zmval/image/upload/q_auto,f_auto/dyc/images/IMG_4623.jpg' },
  { type: 'video', src: 'https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/dyc-video-logo.mp4' },
  { type: 'image', src: 'https://res.cloudinary.com/dqb0zmval/image/upload/q_auto,f_auto/dyc/images/832925557_2688947411619250_204391593947818516_n.jpg' },
  { type: 'image', src: 'https://res.cloudinary.com/dqb0zmval/image/upload/q_auto,f_auto/dyc/images/IMG_4624.jpg' },
  
  // { type: 'image', src: 'https://res.cloudinary.com/dqb0zmval/image/upload/q_auto,f_auto/dyc/images/LPU.jpeg' },
]
const LOOP = [...ITEMS, ...ITEMS]

const SlidingShowcase = () => {
  const [broken, setBroken] = useState({})

  return (
    <section className="relative z-10 w-full overflow-hidden bg-transparent py-16">
      <div className="showcase-track flex w-max gap-6">
        {LOOP.map((item, i) =>
          broken[item.src] ? null : (
            <div
              key={i}
              className="h-64 w-96 shrink-0 overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-105 md:h-80 md:w-md"
            >
              {item.type === 'video' ? (
                <video
                  src={item.src}
                  className="h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setBroken((prev) => ({ ...prev, [item.src]: true }))}
                />
              ) : (
                <img
                  src={item.src}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setBroken((prev) => ({ ...prev, [item.src]: true }))}
                />
              )}
            </div>
          )
        )}
      </div>

      <style>{`
        .showcase-track { animation: showcase-scroll 40s linear infinite; }
        .showcase-track:hover { animation-play-state: paused; }
        @keyframes showcase-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .showcase-track { animation: none; }
        }
      `}</style>
    </section>
  )
}

export default SlidingShowcase