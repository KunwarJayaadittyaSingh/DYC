import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

const CONTACT_EMAIL = 'youthvibe@lpu.co.in'
const CONTACT_PHONE = '+91 00000 00000'

const ContactPage = () => {
  const [status, setStatus] = useState('idle')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [stars, setStars] = useState([])

  useEffect(() => {
    const generatedStars = Array.from({ length: 90 }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.7 + 0.2,
    }))

    setStars(generatedStars)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    setStatus('sending')

    const subject = form.subject || `Message from ${form.name}`

    const body = `
Name: ${form.name}
Email: ${form.email}
Phone: ${form.phone || 'Not provided'}

Message:
${form.message}
    `.trim()

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`

    window.location.href = mailto

    setTimeout(() => {
      setStatus('sent')
    }, 500)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">

      {/* =========================
          SUBTLE CRIMSON BACKGROUND
      ========================== */}

      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/70 via-black/95 to-black" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-0 h-150 w-225 -translate-x-1/2 translate-y-1/3 rounded-full bg-red-700/20 blur-[160px]" />

      {/* =========================
          MOVING STAR BACKGROUND
      ========================== */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-red-300"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              animation: `starMove ${star.duration}s linear ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Subtle red glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/3 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-500/10 blur-[140px]" />

      {/* Back link */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white"
      >
        ← Back
      </Link>

      {/* =========================
          CONTACT CONTENT
      ========================== */}

      <main className="relative z-10 w-full px-5 py-24 md:px-10 md:py-32">

        {/* Header */}

        <section className="mx-auto max-w-5xl text-center">

          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            Get In Touch
          </p>

          <h1 className="font-[font7] text-[13vw] leading-[0.85] uppercase tracking-tight md:text-[7vw]">
            Contact{' '}
            <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              Us
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            Have questions or want to collaborate?
            <br className="hidden md:block" />
            We'd love to hear from you. Reach out and let's create
            something amazing together.
          </p>

        </section>


        {/* =========================
            CONTACT INFORMATION
        ========================== */}

        <section className="mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">

          {/* Email */}

          <div className="group rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_35px_rgba(239,68,68,0.08)]">

            <div className="mb-7 flex h-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <span className="text-xl">✉</span>
            </div>

            <p className="mb-2 text-sm uppercase tracking-widest text-gray-500">
              Email Us
            </p>

            <h3 className="mb-3 text-xl font-semibold">
              Drop us a line
            </h3>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="break-all text-red-500 transition hover:text-red-400"
            >
              {CONTACT_EMAIL}
            </a>

          </div>


          {/* Phone */}

          <div className="group rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_35px_rgba(239,68,68,0.08)]">

            <div className="mb-7 flex h-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <span className="text-xl">☎</span>
            </div>

            <p className="mb-2 text-sm uppercase tracking-widest text-gray-500">
              Call Us
            </p>

            <h3 className="mb-3 text-xl font-semibold">
              Let&apos;s talk
            </h3>

            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
              className="text-red-500 transition hover:text-red-400"
            >
              {CONTACT_PHONE}
            </a>

          </div>


          {/* Location */}

          <div className="group rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_35px_rgba(239,68,68,0.08)]">

            <div className="mb-7 flex h-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <span className="text-xl">⌖</span>
            </div>

            <p className="mb-2 text-sm uppercase tracking-widest text-gray-500">
              Visit Us
            </p>

            <h3 className="mb-3 text-xl font-semibold">
              Come say hello
            </h3>

            <p className="leading-relaxed text-red-500">
              Lovely Professional University
              <br />
              Punjab, India
              <br />
              Block-13
              <br />
              Room No: 206
            </p>

          </div>

        </section>


        {/* =========================
            CONTACT FORM
        ========================== */}

        <section className="mx-auto mt-20 max-w-5xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_0_80px_rgba(239,68,68,0.04)] backdrop-blur-md md:p-12">

          <div className="mb-12 text-center">

            <h2 className="font-[font7] text-4xl uppercase md:text-5xl">
              Send Us A{' '}
              <span className="text-red-500">
                Message
              </span>
            </h2>

            <p className="mt-5 text-gray-500">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>

          </div>


          {/* Success message */}

          {status === 'sent' && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
              Your message has been prepared successfully. Your email app should
              open so you can send the message.
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >

            {/* Name + Email */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Your Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                />
              </div>


              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                />
              </div>

            </div>


            {/* Phone + Subject */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 123 456 7890"
                  className="w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                />
              </div>


              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Subject <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  className="w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                />
              </div>

            </div>


            {/* Message */}

            <div>

              <label className="mb-3 block text-sm text-gray-300">
                Your Message <span className="text-red-500">*</span>
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows={7}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
              />

            </div>


            {/* Button */}

            <div className="flex justify-center pt-3">

              <button
                type="submit"
                disabled={status === 'sending'}
                className="group relative overflow-hidden rounded-full bg-red-500 px-10 py-4 font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="relative z-10 flex items-center gap-3">
                  {status === 'sending'
                    ? 'Sending...'
                    : 'Send Message'}

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    ↗
                  </span>
                </span>

              </button>

            </div>

          </form>

        </section>

      </main>


      {/* =========================
          YOUR EXISTING FOOTER
      ========================== */}

      <div className="relative z-10">
        <Footer />
      </div>


      {/* =========================
          STAR ANIMATION
      ========================== */}

      <style>{`
        @keyframes starMove {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          25% {
            transform: translate3d(35px, -25px, 0) scale(1.15);
          }

          50% {
            transform: translate3d(-25px, 35px, 0) scale(0.8);
          }

          75% {
            transform: translate3d(25px, 20px, 0) scale(1.1);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>

    </div>
  )
}

export default ContactPage