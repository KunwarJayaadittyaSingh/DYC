import React from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

const HultPrize = () => {
  return (
    <div className="bg-black">
      <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-5 text-center text-white">
        <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-black via-red-950/40 to-red-800/60" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/20 blur-[150px]" />

        {/* Watermark word, bottom right */}
        <span className="pointer-events-none absolute bottom-4 right-4 z-0 select-none font-sans font-bold text-[10vw] uppercase leading-none text-red-500/10 md:text-[6vw]">
          Hult Prize
        </span>

        <div className="relative z-10">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            Hult Prize
          </p>

          <h1 className="font-[font7] text-[15vw] uppercase leading-[0.85] tracking-tight text-white md:text-[8vw]">
            Coming
            <br />
            <span className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.55)]">
              Soon
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
            We're building something amazing.
            <br />
            This page is under construction.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
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

export default HultPrize