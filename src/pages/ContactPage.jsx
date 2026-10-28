import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { supabase } from '../supabaseClient' // adjust path if your file lives elsewhere
import Footer from './Footer'

const CONTACT_EMAIL = 'youthvibe@lpu.co.in'
const CONTACT_PHONE = '+91 00000 00000'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Email is optional. If the EmailJS keys are not in .env, messages are only saved to Supabase.
const EMAIL_CONFIGURED = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
)

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

const inputClass =
  'contact-input w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)]'

const ContactPage = () => {
  // idle | sending | sent | error
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [honeypot, setHoneypot] = useState('') // spam trap, real users never fill this
  const [stars, setStars] = useState([])
  const statusRef = useRef(null)

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

  // Bring the status banner into view after submit
  useEffect(() => {
    if (status === 'sent' || status === 'error') {
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [status])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear old banner as soon as the user starts editing again
    if (status === 'sent' || status === 'error') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (status === 'sending') return

    // Bots fill hidden fields. Pretend success and do nothing.
    if (honeypot) {
      console.warn('Spam trap field was filled, so the message was NOT saved.')
      setStatus('sent')
      setForm(EMPTY_FORM)
      return
    }

    setStatus('sending')
    setErrorMessage('')

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || `Message from ${form.name.trim()}`,
      message: form.message.trim(),
    }

    // 1) Save to Supabase
    const saveToSupabase = async () => {
      const { error } = await supabase.from('contact_messages').insert([payload])
      if (error) throw error
    }

    // 2) Send email notification through EmailJS
    const sendEmail = () =>
      !EMAIL_CONFIGURED
        ? Promise.reject(new Error('EmailJS not configured'))
        : emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: payload.name,
          from_email: payload.email,
          phone: payload.phone || 'Not provided',
          subject: payload.subject,
          message: payload.message,
          to_email: CONTACT_EMAIL,
          reply_to: payload.email,
        },
        EMAILJS_PUBLIC_KEY
      )

    // Run both. The user only sees an error if BOTH fail.
    const [dbResult, mailResult] = await Promise.allSettled([
      saveToSupabase(),
      sendEmail(),
    ])

    if (dbResult.status === 'fulfilled') {
      console.info('Saved to Supabase: contact_messages')
    }
    if (dbResult.status === 'rejected') {
      console.error('Supabase insert failed:', dbResult.reason)
    }
    if (mailResult.status === 'rejected' && EMAIL_CONFIGURED) {
      console.error('EmailJS send failed:', mailResult.reason)
    }

    if (dbResult.status === 'fulfilled' || mailResult.status === 'fulfilled') {
      setStatus('sent')
      setForm(EMPTY_FORM)
    } else {
      setStatus('error')
      setErrorMessage(
        `We couldn't send your message. Please try again, or email us directly at ${CONTACT_EMAIL}.`
      )
    }
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


          {/* Status messages */}

          <div ref={statusRef} aria-live="polite">

            {status === 'sent' && (
              <div className="mb-8 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
                Message sent. Thank you for reaching out. We'll get back to you soon.
              </div>
            )}

            {status === 'error' && (
              <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

          </div>


          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >

            {/* Honeypot (hidden from people, visible to bots) */}

            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
            >
              <label htmlFor="hp_field">Leave this field empty</label>
              <input
                id="hp_field"
                type="text"
                name="hp_field"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>


            {/* Name + Email */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>
                <label htmlFor="name" className="mb-3 block text-sm text-gray-300">
                  Your Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </div>


              <div>
                <label htmlFor="email" className="mb-3 block text-sm text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  autoComplete="email"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

            </div>


            {/* Phone + Subject */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>
                <label htmlFor="phone" className="mb-3 block text-sm text-gray-300">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 123 456 7890"
                  autoComplete="tel"
                  maxLength={20}
                  className={inputClass}
                />
              </div>


              <div>
                <label htmlFor="subject" className="mb-3 block text-sm text-gray-300">
                  Subject <span className="text-red-500">*</span>
                </label>

                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

            </div>


            {/* Message */}

            <div>

              <label htmlFor="message" className="mb-3 block text-sm text-gray-300">
                Your Message <span className="text-red-500">*</span>
              </label>

              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows={7}
                maxLength={2000}
                required
                className={`${inputClass} resize-none`}
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
          STAR ANIMATION + AUTOFILL FIX
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

        /* Stops Chrome from painting autofilled fields light blue */
        .contact-input:-webkit-autofill,
        .contact-input:-webkit-autofill:hover,
        .contact-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          caret-color: #ffffff;
          -webkit-box-shadow: 0 0 0 1000px #0a0a0a inset;
          transition: background-color 9999s ease-in-out 0s;
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="starMove"] {
            animation: none !important;
          }
        }
      `}</style>

    </div>
  )
}

export default ContactPage
