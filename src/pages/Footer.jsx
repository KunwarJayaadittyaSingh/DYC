import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const ORG_NAME = 'DYC'
const LAST_UPDATED = 'October 2026'

/* ──────────────────────────────────────────────────────────────
   POLICY TEXT — edit freely
   This is starter wording written for a student-run event website.
   Have your department / faculty advisor read it and confirm it
   before you rely on it.
   Each section: h = heading, p = paragraphs, list = bullet points
   ────────────────────────────────────────────────────────────── */
const DOCS = {
  privacy: {
    label: 'Privacy Policy',
    intro:
      'This policy explains what information the DYC website collects, why we collect it, and the choices you have. We keep it short and plain on purpose.',
    sections: [
      {
        h: 'Who we are',
        p: [
          'DYC (Department of Youth Capital) is a student body working under the Division of Youth Affairs, Student Welfare Wing, LPU. We run events such as Magnitude, Youthvibe, Concoction and FTS, and this website supports them.',
        ],
      },
      {
        h: 'What we collect',
        p: ['We only collect what you choose to give us through our forms:'],
        list: [
          'Event registrations: full name, registration number, contact number, course, day scholar or hosteller, the event you pick, and team details for team events.',
          'Join, contact and feedback forms: whatever you write to us, plus the contact details you enter.',
          'Basic technical data, such as browser type and pages visited, that is created automatically when you use any website.',
        ],
      },
      {
        h: 'How we use it',
        list: [
          'To register you for events and confirm your participation.',
          'To contact you about schedules, changes and results.',
          'To plan and run events, and to answer your questions.',
          'To keep the site safe and working, for example by blocking spam and duplicate registrations.',
        ],
      },
      {
        h: 'Who can see it',
        p: [
          'Your details are visible to the DYC organising team members who need them to run the event, and to university staff where an event requires it.',
          'We use third-party tools to run the site and store form responses. Those providers process data only to deliver their service. We do not sell your information.',
        ],
      },
      {
        h: 'How long we keep it',
        p: [
          'We keep registration data for as long as it is needed to run the event and for a reasonable period afterwards for our records. After that it is deleted or anonymised.',
        ],
      },
      {
        h: 'Your choices',
        p: [
          'You can ask us to correct or delete the details you submitted by contacting us. If you ask us to delete your registration, you may lose your place in that event.',
        ],
      },
      {
        h: 'Cookies and local storage',
        p: [
          'To save you time, this site may remember things in your own browser, such as the details you typed into a form and which events you have registered for. This stays on your device and you can clear it from your browser settings at any time.',
        ],
      },
      {
        h: 'Changes to this policy',
        p: ['If we change this policy, the date at the top of this window will change. Please check back now and then.'],
      },
    ],
  },

  terms: {
    label: 'Terms of Service',
    intro: 'By using this website or registering for a DYC event, you agree to these terms. Please read them once.',
    sections: [
      {
        h: 'Using the website',
        p: [
          'This website is provided by DYC to share information about our events and to take registrations. Please use it only for those purposes and do not try to disrupt, copy or misuse it.',
        ],
      },
      {
        h: 'Who can register',
        p: [
          'Eligibility depends on the event. Where an event is meant for LPU students, you must be a currently enrolled student. Details are in each event’s rulebook.',
        ],
      },
      {
        h: 'Registrations',
        list: [
          'Give accurate and complete details. Registrations with false information can be cancelled.',
          'Register for an event only once. Duplicate registrations may be removed.',
          'For team events, the team leader is responsible for the details of every member.',
          'Registering does not guarantee a place in a competition. Organisers may limit entries, shortlist or close registrations at any time.',
        ],
      },
      {
        h: 'Rules and conduct',
        p: [
          'Every event has a rulebook. By registering you agree to follow it, along with LPU’s code of conduct. Organisers and judges may disqualify participants who break the rules or behave unfairly or disrespectfully. Their decisions are final.',
        ],
      },
      {
        h: 'Changes to events',
        p: [
          'Dates, venues, formats, rules and prizes can change. We will try to tell registered participants in time, using the contact details you gave us.',
        ],
      },
      {
        h: 'Photos and videos',
        p: [
          'Our events are photographed and recorded. By taking part you agree that photos and videos that include you may be used on DYC and university channels to promote and document the events.',
        ],
      },
      {
        h: 'Content and ownership',
        p: [
          'The DYC name, logo, design and content on this site belong to DYC or their respective owners. Please do not reuse them without permission. If you submit work to an event, you keep ownership of it and allow us to display it for the event and its promotion.',
        ],
      },
      {
        h: 'Liability',
        p: [
          'We work hard to run safe and well-organised events, but you take part at your own risk. To the extent allowed by law, DYC and its volunteers are not liable for loss or injury that happens because of your participation or your use of this site.',
        ],
      },
      {
        h: 'Changes to these terms',
        p: ['We may update these terms from time to time. Continuing to use the site after a change means you accept the new terms.'],
      },
    ],
  },
}

const TABS = ['privacy', 'terms']

/* ──────────────────────────────────────────────────────────────
   POLICY MODAL
   ────────────────────────────────────────────────────────────── */

const PolicyModal = ({ initial, onClose }) => {
  const [tab, setTab] = useState(initial)
  const doc = DOCS[tab]

  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current()
      else if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll('a[href], button:not([disabled])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [])

  const switchTab = useCallback((next) => {
    setTab(next)
    bodyRef.current?.scrollTo({ top: 0 })
  }, [])

  return (
    <div className='fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6' role='dialog' aria-modal='true' aria-labelledby='policy-title'>
      <div className='absolute inset-0 bg-black/85 backdrop-blur-md' onClick={onClose} />

      <div
        ref={panelRef}
        className='policy-pop relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-red-500/30 bg-neutral-950 text-white sm:rounded-3xl'
        style={{ boxShadow: '0 40px 120px rgba(239,68,68,0.25)' }}
      >
        {/* header */}
        <div className='shrink-0 border-b border-white/10 px-6 pb-0 pt-6 sm:px-8'>
          <button
            ref={closeRef}
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 transition hover:border-red-500 hover:bg-red-500 hover:text-black'
          >
            ✕
          </button>

          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-red-400'>{ORG_NAME} · Legal</p>
          <h2 id='policy-title' className='mt-3 pr-12 text-3xl font-bold leading-tight tracking-tight sm:text-4xl'>
            {doc.label}
          </h2>
          <p className='mt-1 text-sm text-gray-500'>Last updated {LAST_UPDATED}</p>

          <div className='mt-5 flex gap-6' role='tablist' aria-label='Policy documents'>
            {TABS.map((t) => (
              <button
                key={t}
                type='button'
                role='tab'
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={`-mb-px border-b-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                  tab === t ? 'border-red-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {DOCS[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div ref={bodyRef} className='min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8' role='tabpanel'>
          <p className='text-[15px] leading-relaxed text-gray-300'>{doc.intro}</p>

          <div className='mt-8 space-y-8'>
            {doc.sections.map((s, i) => (
              <section key={s.h}>
                <h3 className='flex items-baseline gap-3 text-lg font-semibold text-white'>
                  <span className='text-sm tabular-nums text-red-500'>{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h3>
                {s.p?.map((para) => (
                  <p key={para} className='mt-3 text-[15px] leading-relaxed text-gray-400'>
                    {para}
                  </p>
                ))}
                {s.list && (
                  <ul className='mt-3 space-y-2'>
                    {s.list.map((item) => (
                      <li key={item} className='flex gap-3 text-[15px] leading-relaxed text-gray-400'>
                        <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500' aria-hidden='true' />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className='mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-gray-400'>
            Questions about this {tab === 'privacy' ? 'policy' : 'document'}? Reach out through our{' '}
            <Link to='/contact' onClick={onClose} className='text-red-400 underline underline-offset-4 hover:text-red-300'>
              contact page
            </Link>
            .
          </p>
        </div>

        {/* footer bar */}
        <div className='flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-black/60 px-6 py-4 sm:px-8'>
          <p className='hidden text-xs text-gray-500 sm:block'>Press Esc to close</p>
          <button
            type='button'
            onClick={onClose}
            className='w-full rounded-full bg-red-500 px-8 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-red-400 sm:w-auto'
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        .policy-pop { animation: policyPop 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes policyPop {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .policy-pop { animation: none; }
        }
      `}</style>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   FOOTER
   ────────────────────────────────────────────────────────────── */

const Footer = () => {
  const [policy, setPolicy] = useState(null) // null | 'privacy' | 'terms'

  return (
    <footer className='relative z-10 w-full bg-black text-white px-8 md:px-16 py-16'>
      <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10'>

        <div>
          <h3 className='font-[font6] text-2xl mb-4 tracking-wide'>{ORG_NAME}</h3>
          <p className='text-gray-400 text-sm leading-relaxed'>
            Department of Youth Capital — Empowering students through innovation,
            creativity, and collaborative experiences under the Aegis of
            Division of Youth Affairs, Student Welfare Wing, LPU.
          </p>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>About</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/our-story" className='hover:text-white'>Our Story</Link></li>
            <li><Link to="/team" className='hover:text-white'>Team</Link></li>
            <li><Link to="/join" className='hover:text-white'>Join Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>Events</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/magnitude" className='hover:text-white'>Magnitude</Link></li>
            <li><Link to="/youthvibe" className='hover:text-white'>Youthvibe</Link></li>
            <li><Link to="/concoction" className='hover:text-white'>Concoction</Link></li>
            <li><Link to="/fts" className='hover:text-white'>FTS</Link></li>
          </ul>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>Support</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/contact" className='hover:text-white'>Contact Us</Link></li>
            <li><Link to="/help" className='hover:text-white'>Help & FAQ</Link></li>
            <li><Link to="/feedback" className='hover:text-white'>Feedback</Link></li>
          </ul>
        </div>

      </div>

      <div className='max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mt-16 pt-8 border-t border-gray-800 text-gray-500 text-sm gap-4'>
        <p>© 2026 {ORG_NAME}. All rights reserved.</p>
        <div className='flex gap-6'>
          <button type='button' onClick={() => setPolicy('privacy')} className='hover:text-white'>
            Privacy Policy
          </button>
          <button type='button' onClick={() => setPolicy('terms')} className='hover:text-white'>
            Terms of Service
          </button>
          <Link to="/contact" className="hover:text-white">
            Support
          </Link>
        </div>
      </div>

      <div className='max-w-6xl mx-auto text-center mt-8 text-gray-500 text-sm'>
        <p>Made with ❤️ by DYC Team</p>
      </div>

      {policy && <PolicyModal key={policy} initial={policy} onClose={() => setPolicy(null)} />}
    </footer>
  )
}

export default Footer