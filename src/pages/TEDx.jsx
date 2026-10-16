import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

const TEDx = () => {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-black">
      <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-5 text-center text-white">
        <img src="/images/tedx-bg.jpg" className="absolute inset-0 z-0 h-full w-full object-cover opacity-30" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-black via-red-950/40 to-red-800/60" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/20 blur-[150px]" />

        {/* Watermark word, bottom right */}
        <span className="pointer-events-none absolute bottom-4 right-4 z-0 select-none text-[14vw] uppercase leading-none text-red-500/10 md:text-[9vw] font-sans font-bold">
          DYC
        </span>

        <div className="relative z-10">
          <p
            className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500 transition-all duration-700"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            TEDx
          </p>

          <h1
            className="font-[font7] text-[15vw] uppercase leading-[0.85] tracking-tight text-white md:text-[8vw] transition-all duration-1000"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0) scale(1)' : 'translateY(40px) scale(1.05)',
              filter: revealed ? 'blur(0px)' : 'blur(10px)',
              transitionDelay: '100ms',
            }}
          >
            Coming
            <br />
            <span className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.55)]">
              Soon
            </span>
          </h1>

          <p
            className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg transition-all duration-700"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '300ms',
            }}
          >
            We're building something amazing.
            <br />
            This page is under construction.
          </p>

          <div
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center transition-all duration-700"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '450ms',
            }}
          >
            <Link
              to="/"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              ← Back to Home
            </Link>

            <Link
              to="/join"
              className="rounded-full bg-red-500 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]"
            >
              ← Register Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TEDx