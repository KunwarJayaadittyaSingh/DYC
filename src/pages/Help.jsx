import React from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import AccordionItem from '../Components/AccordionItem'

const ACCENT_ICON = 'text-red-500'
const BORDER_HOVER = 'hover:border-red-500/40'

const FAQ_CATEGORIES = [
  {
    category: 'General Questions',
    items: [
      { q: 'What is DYC?', a: 'DYC — the Department of Youth Capital — is a student-run department under the Division of Youth Affairs, Student Welfare Wing, LPU, focused on empowering students through innovation, creativity, and collaborative events.' },
      { q: 'Who can be part of DYC?', a: 'Any enrolled student interested in contributing their skills — from public speaking to design to operations — is welcome to apply.' },
    ],
  },
  {
    category: 'Joining the Organization',
    items: [
      { q: 'How do I apply to join?', a: "Head to the Join Us page from the footer, fill out the application form, and select the domain that fits you best." },
      { q: 'Is there a selection process?', a: 'Yes — after you apply, the relevant domain lead will reach out for a short conversation before onboarding.' },
    ],
  },
  {
    category: 'Domains & Departments',
    items: [
      { q: 'What domains does DYC have?', a: 'Public Speaking, Technology, Technical, Logistics, Graphics & Design, Hospitality, Office Management, Marketing & Social Media, Content & Documentation, and Event Management.' },
      { q: 'Can I switch domains later?', a: 'Yes, members can request a domain switch once they have completed onboarding in their current one.' },
    ],
  },
  {
    category: 'Events',
    items: [
      { q: 'What events does DYC run?', a: 'Our flagship events include Youthvibe, Magnitude, Concoction, and FTS each with its own theme and audience.' },
      { q: 'Are events open to all students?', a: 'Most events are campus-wide, though a few — like FTS — are reserved specifically for freshers.' },
    ],
  },
  {
    category: 'Volunteering',
    items: [
      { q: 'Can I volunteer without formally joining?', a: 'Yes, we regularly open short-term volunteer slots for specific events — keep an eye on our WhatsApp channel and Instagram.' },
    ],
  },
  {
    category: 'Technical Issues',
    items: [
      { q: 'The website isn\u2019t loading properly, what do I do?', a: 'Try refreshing or switching browsers first. If the issue persists, report it through the Feedback page under "Issue / Bug Report".' },
    ],
  },
  {
    category: 'Contact & Support',
    items: [
      { q: 'How do I reach the team directly?', a: 'Use the Contact Us page, or email us — our contact details are listed there and in the footer.' },
    ],
  },
]

const Help = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* subtle crimson glow rising from the bottom, mostly black elsewhere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/70 via-black/95 to-black" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-0 h-150 w-225 -translate-x-1/2 translate-y-1/3 rounded-full bg-red-700/20 blur-[160px]" />

      <Link
        to="/"
        className="fixed top-6 left-6 z-50 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white"
      >
        ← Back
      </Link>

      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/10 blur-[140px]" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-5 py-24 md:px-10 md:py-32">
        <section className="text-center">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            Help & FAQ
          </p>

          <h1 className="font-[font7] text-[13vw] uppercase leading-[0.85] tracking-tight md:text-[7vw]">
            How Can We <span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]">Help</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            Answers to what students ask us most. Can't find yours? Reach out through Contact Us.
          </p>
        </section>

        <div className="mt-20 space-y-14">
          {FAQ_CATEGORIES.map((group) => (
            <section key={group.category}>
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-red-500">
                {group.category}
              </h2>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <AccordionItem
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                    accentClass={ACCENT_ICON}
                    borderHover={BORDER_HOVER}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

export default Help