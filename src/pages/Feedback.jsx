import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import FormField from '../Components/FormField'
import SelectField from '../Components/SelectField'

const CONTACT_EMAIL = 'youthvibe@lpu.co.in'

const ACCENT_TEXT = 'text-red-500'
const FOCUS_CLASS = 'focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.12)]'

const FEEDBACK_TYPES = [
  'General Feedback',
  'Website Feedback',
  'Event Feedback',
  'Team Feedback',
  'Suggestion',
  'Issue / Bug Report',
  'Other',
]

const RATINGS = ['1', '2', '3', '4', '5']

const initialForm = {
  name: '',
  email: '',
  type: '',
  rating: '',
  message: '',
  suggestion: '',
}

const Feedback = () => {
  const [status, setStatus] = useState('idle')
  const [form, setForm] = useState(initialForm)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('sending')

    const subject = `DYC Feedback — ${form.type || 'General'}`
    const body = `
Name: ${form.name}
Email: ${form.email}
Feedback Type: ${form.type}
Rating: ${form.rating || 'Not rated'}

Message:
${form.message}

Suggestion:
${form.suggestion || 'None'}
    `.trim()

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`

    setTimeout(() => setStatus('sent'), 500)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white"
      >
        ← Back
      </Link>

      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-500/10 blur-[140px]" />

      <main className="relative z-10 w-full px-5 py-24 md:px-10 md:py-32">
        <section className="mx-auto max-w-5xl text-center">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            We're Listening
          </p>

          <h1 className="font-[font7] text-[13vw] uppercase leading-[0.85] tracking-tight md:text-[7vw]">
            Share Your{' '}
            <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              Feedback
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            Good, bad, or somewhere in between — your feedback helps DYC get better.
          </p>
        </section>

        <section className="mx-auto mt-20 max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_0_80px_rgba(239,68,68,0.04)] backdrop-blur-md md:p-12">
          {status === 'sent' && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
              Thanks for the feedback! Your email app should open so you can send it.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectField
                label="Feedback Type"
                name="type"
                value={form.type}
                onChange={handleChange}
                options={FEEDBACK_TYPES}
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <SelectField
                label="Rating"
                name="rating"
                value={form.rating}
                onChange={handleChange}
                options={RATINGS}
                placeholder="Rate 1 to 5"
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <FormField
              label="Message / Feedback"
              name="message"
              textarea
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what's on your mind..."
              required
              accentText={ACCENT_TEXT}
              focusClass={FOCUS_CLASS}
            />

            <FormField
              label="Optional Suggestion"
              name="suggestion"
              textarea
              rows={3}
              value={form.suggestion}
              onChange={handleChange}
              placeholder="Anything you'd love to see improved? (optional)"
              accentText={ACCENT_TEXT}
              focusClass={FOCUS_CLASS}
            />

            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="group relative overflow-hidden rounded-full bg-red-500 px-10 py-4 font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {status === 'sending' ? 'Sending...' : 'Send Feedback'}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
                </span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

export default Feedback