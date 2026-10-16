import React, { useRef, useEffect, useState } from 'react'

const TeamSection = () => {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)

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

  if (progress < 0.35) {
    scale = 0.3 + (progress / 0.35) * 0.5
    textOpacity = 0
  } else if (progress < 0.55) {
    scale = 0.8
    textOpacity = Math.min((progress - 0.35) / 0.2, 1)
  } else if (progress < 0.65) {
    scale = 0.8
    textOpacity = 1
  } else {
    const growProgress = (progress - 0.65) / 0.35
    scale = 0.8 + growProgress * 0.6
    textOpacity = Math.max(1 - growProgress / 0.3, 0)
  }

  const radius = Math.max((1 - scale) * 64, 0)
  const headingOpacity = Math.min(progress / 0.15, 1)
  const headingY = (1 - headingOpacity) * 30
  const headingBlur = (1 - headingOpacity) * 8

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[220vh] w-full bg-transparent">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 py-6">
        <p
          className="text-red-700 uppercase tracking-widest text-xs mb-2"
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            filter: `blur(${headingBlur}px)`,
          }}
        >
          Welcome to DYC
        </p>

        <h2
          className="font-[font7] text-white uppercase text-center leading-none mb-10"
          style={{
            fontSize: 'clamp(1.25rem, 4vw, 3rem)',
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            filter: `blur(${headingBlur}px)`,
          }}
        >
          Team Driving Youth Innovation
        </h2>

        <div className="flex flex-col items-center">
          <div
            className="overflow-hidden shadow-2xl"
            style={{
              width: `${scale * 60}vw`,
              maxWidth: `${scale * 760}px`,
              borderRadius: `${radius}px`,
            }}
          >
            <img
              src="/images/IMG_4623.jpg"
              alt="The DYC Team"
              className="w-full h-auto object-cover"
            />
          </div>

          <p
            className="pointer-events-none mt-6 max-w-lg text-center font-bold normal-case tracking-normal text-white/90 leading-snug"
            style={{
              fontSize: 'clamp(0.8rem, 1.4vw, 1.05rem)',
              opacity: textOpacity,
            }}
          >
            A passionate collective of students, leaders, and creators
            working together to push ideas into reality. From late-night
            planning sessions to standing ovations on stage, this is the
            team that brings every DYC event to life.
          </p>
        </div>
      </div>
    </section>
  )
}

export default TeamSection