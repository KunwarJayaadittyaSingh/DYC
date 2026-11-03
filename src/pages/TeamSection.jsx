import React, { useRef } from 'react'
import useScrollLinked from '../hooks/useScrollLinked'

const clamp = (v) => Math.min(Math.max(v, 0), 1)

const TeamSection = () => {
  const sectionRef = useRef(null)
  const headRef = useRef(null)
  const imgWrap = useRef(null)
  const textRef = useRef(null)

  useScrollLinked(sectionRef, (rect, vh) => {
    const progress = clamp((rect.top - vh) / -rect.height)

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
      const g = (progress - 0.65) / 0.35
      scale = 0.8 + g * 0.6
      textOpacity = Math.max(1 - g / 0.3, 0)
    }

    const k = scale / 0.8
    const radius = Math.max((1 - scale) * 64, 0) / k
    const headOpacity = Math.min(progress / 0.15, 1)

    // The image grows/shrinks with a transform, so move the heading and text
    // out of its way by the same amount the old layout used to.
    const baseH = imgWrap.current ? imgWrap.current.offsetHeight : 0
    const shift = (baseH * (k - 1)) / 2

    if (headRef.current) {
      headRef.current.style.opacity = headOpacity
      headRef.current.style.transform = `translate3d(0, ${(1 - headOpacity) * 30 - shift}px, 0)`
      headRef.current.style.filter = `blur(${(1 - headOpacity) * 8}px)`
    }
    if (imgWrap.current) {
      imgWrap.current.style.transform = `scale(${k})`
      imgWrap.current.style.borderRadius = `${radius}px`
    }
    if (textRef.current) {
      textRef.current.style.opacity = textOpacity
      textRef.current.style.transform = `translate3d(0, ${shift}px, 0)`
    }
  })

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[220vh] w-full bg-transparent">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 py-6">

        <div ref={headRef} className="flex flex-col items-center" style={{ opacity: 0 }}>
          <p className="team-mono text-red-700 uppercase tracking-widest text-xs mb-2">
            Welcome to DYC
          </p>

          <h2
            className="team-display text-white uppercase text-center leading-tight mb-10"
            style={{ fontSize: 'clamp(1.1rem, 3.2vw, 2.6rem)' }}
          >
            Team Driving Youth Innovation
          </h2>
        </div>

        <div className="flex flex-col items-center">
          <div
            ref={imgWrap}
            className="overflow-hidden shadow-2xl"
            style={{ width: '48vw', maxWidth: '608px', transform: 'scale(0.375)' }}
          >
            <img
              src="/images/IMG_4623.jpg"
              alt="The DYC Team"
              decoding="async"
              className="w-full h-auto object-cover"
            />
          </div>

          <p
            ref={textRef}
            className="team-body pointer-events-none mt-6 max-w-lg text-center font-semibold normal-case tracking-normal text-white/90 leading-snug"
            style={{ fontSize: 'clamp(0.8rem, 1.4vw, 1.05rem)', opacity: 0 }}
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