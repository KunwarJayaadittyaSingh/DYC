import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import FormField from '../Components/FormField'
import SelectField from '../Components/SelectField'

const ACCENT_TEXT = 'text-red-500'
const FOCUS_CLASS = 'focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.12)]'

const DOMAIN_OPTIONS = [
  'Public Speaking',
  'Technology',
  'Technical',
  'Logistics',
  'Graphics & Design',
  'Hospitality',
  'Office Management',
  'Marketing & Social Media',
  'Content & Documentation',
  'Event Management',
  'Visual Oops',
]

const EXPERIENCE_OPTIONS = ['No Prior Experience', 'Beginner', 'Intermediate', 'Advanced']

const AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Flexible / Both', 'Limited Availability']

const WHY_JOIN = [

]

const initialForm = {
  fullName: '',
  contactNumber: '',
  email: '',
  role: '',
  domain: '',
  experience: '',
  skills: '',
  reason: '',
  availability: '',
  additional: '',
}

const JoinUs = () => {
  const [status, setStatus] = useState('idle')
  const [form, setForm] = useState(initialForm)

  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    // TODO: hook this up to Supabase (or your backend of choice) later.
    console.log('Form submitted:', form)

    setStatus('sent')
    setForm(initialForm)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white"
      >
        ← Back
      </Link>

      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/10 blur-[140px]" />

      <main className="relative z-10 w-full px-5 py-24 md:px-10 md:py-32">
        <section className="mx-auto max-w-5xl text-center">
          <p
            className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500 transition-all duration-700"
            style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(24px)' }}
          >
            Join The Revolution
          </p>

          <h1
            className="font-[font7] text-[13vw] uppercase leading-[0.85] tracking-tight md:text-[7vw] transition-all duration-1000"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0) scale(1)' : 'translateY(40px) scale(1.05)',
              filter: revealed ? 'blur(0px)' : 'blur(10px)',
              transitionDelay: '100ms',
            }}
          >
            Join{' '}
            <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">Us</span>
          </h1>

          <p
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg transition-all duration-700"
            style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(24px)', transitionDelay: '300ms' }}
          >
            DYC runs on students who show up, build, and lead. Whatever your domain,
            there's a place for you here — fill out the application below to get started.
          </p>
        </section>

        <section className="mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
          {WHY_JOIN.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_35px_rgba(239,68,68,0.08)]"
            >
              <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
              <p className="leading-relaxed text-gray-400">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-20 max-w-6xl">
          <h2 className="mb-8 text-center font-[font7] text-3xl uppercase md:text-4xl">
            Choose Your <span className="text-red-500">Domain</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {DOMAIN_OPTIONS.map((domain) => (
              <span
                key={domain}
                className="rounded-full border border-white/10 bg-black/60 px-5 py-2 text-sm text-gray-300 transition-colors hover:border-red-500/40 hover:text-white"
              >
                {domain}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_0_80px_rgba(239,68,68,0.04)] backdrop-blur-md md:p-12">
          <div className="mb-12 text-center">
            <h2 className="font-[font7] text-4xl uppercase md:text-5xl">
              Application <span className="text-red-500">Form</span>
            </h2>
            <p className="mt-5 text-gray-500">
              Tell us about yourself — it only takes a few minutes.
            </p>
          </div>

          {status === 'sent' && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
              Your application has been recorded successfully. We'll be in touch soon!
            </div>
          )}

          {status === 'error' && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
              Something went wrong submitting your application. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <FormField
                label="Contact Number"
                name="contactNumber"
                type="tel"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="+91 123 456 7890"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <FormField
                label="Current Role / Occupation"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Student, B.Tech CSE"
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectField
                label="Domain / Department"
                name="domain"
                value={form.domain}
                onChange={handleChange}
                options={DOMAIN_OPTIONS}
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <SelectField
                label="Experience Level"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                options={EXPERIENCE_OPTIONS}
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectField
                label="Availability"
                name="availability"
                value={form.availability}
                onChange={handleChange}
                options={AVAILABILITY_OPTIONS}
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
              <FormField
                label="Relevant Skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="Photography, editing, React..."
                required
                accentText={ACCENT_TEXT}
                focusClass={FOCUS_CLASS}
              />
            </div>

            <FormField
              label="Why do you want to join?"
              name="reason"
              textarea
              rows={5}
              value={form.reason}
              onChange={handleChange}
              placeholder="Tell us what draws you to DYC..."
              required
              accentText={ACCENT_TEXT}
              focusClass={FOCUS_CLASS}
            />

            <FormField
              label="Any Additional Information"
              name="additional"
              textarea
              rows={4}
              value={form.additional}
              onChange={handleChange}
              placeholder="Anything else you'd like us to know? (optional)"
              accentText={ACCENT_TEXT}
              focusClass={FOCUS_CLASS}
            />

            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="group relative overflow-hidden rounded-full border-2 border-red-500 bg-white px-10 py-4 font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] active:bg-red-600 active:border-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {status === 'sending' ? 'Submitting...' : 'Submit Application'}
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

export default JoinUs