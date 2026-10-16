import React, { useEffect, useRef, useState } from 'react'

const StarBackground = ({ count = 140, cometCount = 6 }) => {
  const [stars, setStars] = useState([])
  const [comets, setComets] = useState([])
  const [reduced, setReduced] = useState(false)
  const containerRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const raf = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const mobile = window.innerWidth < 768
    const totalStars = mobile ? Math.round(count * 0.55) : count
    const totalComets = mobile ? Math.max(2, Math.round(cometCount * 0.5)) : cometCount

    setStars(
      Array.from({ length: totalStars }, (_, i) => {
        const layer = Math.random() < 0.65 ? 1 : Math.random() < 0.9 ? 2 : 3 // depth layers
        return {
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: layer === 3 ? Math.random() * 2.4 + 1.6 : layer === 2 ? Math.random() * 1.6 + 1 : Math.random() * 1 + 0.5,
          layer,
          twinkleDuration: Math.random() * 4 + 2.5,
          twinkleDelay: Math.random() * 6,
          driftDuration: Math.random() * 14 + 10,
          driftDelay: Math.random() * 8,
          baseOpacity: layer === 3 ? Math.random() * 0.3 + 0.6 : layer === 2 ? Math.random() * 0.3 + 0.35 : Math.random() * 0.25 + 0.15,
        }
      })
    )

    setComets(
      Array.from({ length: totalComets }, (_, i) => ({
        id: i,
        top: Math.random() * 55,
        left: Math.random() * 55,
        angle: 15 + Math.random() * 25,
        length: 140 + Math.random() * 110,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 22,
      }))
    )
  }, [count, cometCount])

  // Cursor-driven parallax — the whole field drifts gently toward the pointer
  useEffect(() => {
    if (reduced) return

    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      mouse.current = { x, y }

      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.setProperty('--parallax-x', mouse.current.x.toFixed(3))
            containerRef.current.style.setProperty('--parallax-y', mouse.current.y.toFixed(3))
          }
          raf.current = null
        })
      }
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [reduced])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      style={{ '--parallax-x': 0, '--parallax-y': 0 }}
    >
      {/* Nebula glow layers */}
      <div
        className="absolute inset-[-10%] opacity-70"
        style={{
          background:
            'radial-gradient(45% 35% at 20% 25%, rgba(139,92,246,0.16), transparent 70%), radial-gradient(40% 30% at 80% 70%, rgba(220,38,38,0.14), transparent 70%), radial-gradient(35% 30% at 65% 15%, rgba(34,211,238,0.10), transparent 70%)',
          transform: reduced ? 'none' : 'translate(calc(var(--parallax-x) * -12px), calc(var(--parallax-y) * -12px))',
          transition: 'transform 0.4s ease-out',
        }}
      />

      {/* Star layers, deeper layers parallax more */}
      <div
        className="absolute inset-0"
        style={{
          transform: reduced ? 'none' : 'translate(calc(var(--parallax-x) * 6px), calc(var(--parallax-y) * 6px))',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {stars
          .filter((s) => s.layer === 1)
          .map((s) => (
            <Star key={s.id} star={s} reduced={reduced} />
          ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          transform: reduced ? 'none' : 'translate(calc(var(--parallax-x) * 14px), calc(var(--parallax-y) * 14px))',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {stars
          .filter((s) => s.layer === 2)
          .map((s) => (
            <Star key={s.id} star={s} reduced={reduced} />
          ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          transform: reduced ? 'none' : 'translate(calc(var(--parallax-x) * 26px), calc(var(--parallax-y) * 26px))',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {stars
          .filter((s) => s.layer === 3)
          .map((s) => (
            <Star key={s.id} star={s} reduced={reduced} />
          ))}
      </div>

      {/* Comets */}
      {!reduced &&
        comets.map((c) => (
          <div
            key={`comet-${c.id}`}
            className="absolute"
            style={{ top: `${c.top}%`, left: `${c.left}%`, transform: `rotate(${c.angle}deg)`, transformOrigin: 'left center' }}
          >
            <span
              className="comet-line absolute top-0 left-0 block h-px rounded-full"
              style={{
                width: `${c.length}px`,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85) 70%, #fff)',
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              }}
            >
              <span
                className="absolute right-0 top-1/2 h-0.75 w-0.75 -translate-y-1/2 rounded-full bg-white"
                style={{ boxShadow: '0 0 10px 3px rgba(255,255,255,0.9)' }}
              />
            </span>
          </div>
        ))}

      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: var(--base-opacity); transform: scale(1); }
          50% { opacity: calc(var(--base-opacity) * 0.35); transform: scale(0.85); }
        }
        @keyframes star-drift {
          0%   { margin-left: 0px; margin-top: 0px; }
          50%  { margin-left: 10px; margin-top: -14px; }
          100% { margin-left: 0px; margin-top: 0px; }
        }
        .comet-line {
          opacity: 0;
          animation-name: comet-fly;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes comet-fly {
          0%   { transform: translateX(-160px); opacity: 0; }
          8%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateX(70vw); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

const Star = ({ star, reduced }) => (
  <span
    className="absolute rounded-full bg-white"
    style={{
      left: `${star.left}%`,
      top: `${star.top}%`,
      width: `${star.size}px`,
      height: `${star.size}px`,
      '--base-opacity': star.baseOpacity,
      opacity: star.baseOpacity,
      boxShadow: star.layer === 3 ? '0 0 8px 1px rgba(255,255,255,0.7)' : '0 0 4px rgba(255,255,255,0.5)',
      animation: reduced
        ? 'none'
        : `star-twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite, star-drift ${star.driftDuration}s ease-in-out ${star.driftDelay}s infinite`,
    }}
  />
)

export default StarBackground