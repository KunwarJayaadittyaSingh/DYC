import React, { useEffect, useRef, useState } from 'react'

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

const JoinForceSection = () => {
  const [eyebrowRef, eyebrowIn] = useSlideInView({ threshold: 0.4 })
  const [headingRef, headingIn] = useSlideInView({ threshold: 0.25 })
  const [paraRef, paraIn] = useSlideInView({ threshold: 0.25 })
  const [buttonsRef, buttonsIn] = useSlideInView({ threshold: 0.2 })

  return (
    <section className='join-body w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-4 text-center'>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        .join-display { font-family: 'Unbounded', 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: -0.01em; }
        .join-body { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .join-mono { font-family: 'Space Mono', ui-monospace, monospace; }
      `}</style>

      <p
        ref={eyebrowRef}
        className='join-mono text-red-500 uppercase tracking-widest text-sm mb-6 transition-all duration-700'
        style={{
          opacity: eyebrowIn ? 1 : 0,
          transform: eyebrowIn ? 'translateY(0)' : 'translateY(40px)',
        }}
      >
        Join The Revolution
      </p>

      <h2
        ref={headingRef}
        className='join-display text-white uppercase text-[7vw] md:text-[4.2vw] leading-[1.1] mb-10 transition-all duration-1000'
        style={{
          opacity: headingIn ? 1 : 0,
          transform: headingIn ? 'translateY(0) scale(1)' : 'translateY(70px) scale(1.05)',
          filter: headingIn ? 'blur(0px)' : 'blur(14px)',
          transitionDelay: '100ms',
        }}
      >
        Join The Force <br /> That Inspire <br /> Change.
      </h2>

      <p
        ref={paraRef}
        className='text-gray-300 max-w-xl mb-10 text-base md:text-lg leading-relaxed transition-all duration-700'
        style={{
          opacity: paraIn ? 1 : 0,
          transform: paraIn ? 'translateY(0)' : 'translateY(40px)',
          transitionDelay: '250ms',
        }}
      >
        At DYC, we believe in empowering students to lead through innovation
        and creativity. Whether you're a developer, designer, manager, or
        visionary — this is your chance to be part of something bigger.
      </p>

      <div
        ref={buttonsRef}
        className='flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-700'
        style={{
          opacity: buttonsIn ? 1 : 0,
          transform: buttonsIn ? 'translateY(0)' : 'translateY(40px)',
          transitionDelay: '400ms',
        }}
      >
        <a
          href='https://linktr.ee/youthvibelpu.com'
          target='_blank'
          rel='noopener noreferrer'
          className='group relative overflow-hidden rounded-full border-2 border-yellow-300 bg-white px-8 py-4 font-bold uppercase text-sm text-black transition-all duration-300 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_35px_rgba(253,224,71,0.45)] active:bg-yellow-400 active:border-yellow-400'
        >
          <span className='relative z-10 flex items-center justify-center gap-2'>
            ◄ Become A Member
          </span>
        </a>

        <a
          href='https://whatsapp.com/channel/0029VbDPqmt1Hsq7DV2Sug1y'
          target='_blank'
          rel='noopener noreferrer'
          className='group relative overflow-hidden rounded-full border-2 border-green-500 bg-white px-8 py-4 font-bold uppercase text-sm text-black transition-all duration-300 hover:bg-green-500 hover:text-white hover:shadow-[0_0_35px_rgba(34,197,94,0.4)] active:bg-green-600 active:border-green-600'
        >
          <span className='relative z-10 flex items-center justify-center gap-2'>
            Join WhatsApp Channel
            <span className='transition-transform duration-300 group-hover:translate-x-1'>↗</span>
          </span>
        </a>
      </div>

      <a
        href='https://www.instagram.com/youthvibe.lpu/'
        target='_blank'
        rel='noopener noreferrer'
        className='group relative overflow-hidden rounded-full border-2 border-pink-600 bg-white px-8 py-4 font-bold uppercase text-sm text-black transition-all duration-300 hover:bg-pink-600 hover:text-white hover:shadow-[0_0_35px_rgba(219,39,119,0.4)] active:bg-pink-700 active:border-pink-700'
      >
        <span className='relative z-10 flex items-center justify-center gap-2'>
          Instagram
          <span className='transition-transform duration-300 group-hover:translate-x-1'>↗</span>
        </span>
      </a>
    </section>
  )
}

export default JoinForceSection