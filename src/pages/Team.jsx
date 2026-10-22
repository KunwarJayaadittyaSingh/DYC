import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

const TEAM = [
  { code: 'DYC 0001', name: 'Divyanshu', role: 'Department Head', desc: 'Sets the vision for DYC and steers every flagship event from concept to curtain call.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/divyanshu-kumar2004?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
  { code: 'DYC 0002', name: 'Aditi Dosad', role: 'Managment', desc: 'Coordinates across teams to keep every initiative aligned and moving forward.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/aditi-dosad/' },
  { code: 'DYC 0003', name: 'Manvendra Singh', role: 'Core', desc: 'A driving force across departments, stepping in wherever the team needs support.', photo: '/images/IMG_3320.PNG', instagram: ' # ', linkedin: 'https://www.linkedin.com/in/manvendra-singh-06ba8a245/' },
  { code: 'DYC 0004', name: 'Yuvraj Singh Nimbalkar', role: 'Design Lead', desc: 'Shapes the visual identity of every event, from posters to on-ground branding.', photo: '/images/yuvraj-design-lead.png', instagram: 'https://www.instagram.com/nonchalant_nimbalkar/', linkedin: 'https://www.linkedin.com/in/yuvrajsinghnimbalkar/' },
  { code: 'DYC 0006', name: 'Sumit Kumar', role: 'Media Lead', desc: 'Captures and curates DYC\u2019s story through photography, video, and press coverage.', photo: '/images/IMG_5089.PNG', instagram: 'https://www.instagram.com/sumit_prajapatiii1111/', linkedin: 'https://www.linkedin.com/in/sumit-kumar-4a3196397?utm_source=share_via&utm_content=profile&utm_medium=member_ios' },
  { code: 'DYC 0007', name: 'Nabiya Usmani', role: 'Marketing Lead', desc: 'Builds outreach strategy and grows DYC\u2019s presence across campus and social media.', photo: null, instagram: '#', linkedin: 'https://www.linkedin.com/in/nabiya-usmani-780a30335/' },
  { code: 'DYC 0005', name: 'Kunwar Jayaadittya Singh', role: 'Technology Lead', desc: 'Builds and maintains the website and internal tools that power DYC\u2019s digital presence.', photo: '', instagram: 'https://www.instagram.com/kunwarjayaadittyasingh/', linkedin: 'https://www.linkedin.com/in/kunwar-jayaadittya-singh-3415a9366/' },
  { code: 'DYC 0008', name: 'Sahil Kumar', role: 'Operations Lead', desc: 'Manages logistics and hospitality to keep every event running smoothly on the ground.', photo: '/images/Sahil2.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0009', name: 'Ayush Pandey', role: 'Public relation Lead', desc: 'Builds relationships with stakeholders and represents DYC in the wider community.', photo: '/images/ayush.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0010', name: 'Sneha Kumari', role: ' Female Fashion Lead', desc: 'Curates styling and fashion direction for every event\u2019s stage and shoots.', photo: '/images/Sneha2.jpeg', instagram: 'https://www.instagram.com/__s.now._12?stkn=bGNocXN5dm9sZGY=', linkedin: 'https://www.linkedin.com/in/sneha-kumari-47a236373' },
  { code: 'DYC 0011', name: 'Parsoon Sharma ', role: 'Office Management', desc: 'Oversees administrative operations and keeps the department\u2019s day-to-day running efficiently.', photo: '/images/parsoon.jpg', instagram: 'https://www.instagram.com/theprasoon_/', linkedin: 'https://linkedin.com/in/theprasoon' },
  { code: 'DYC 0012', name: 'Yuva Kumar', role: 'Public Speaking', desc: 'Leads hosting and public speaking engagements, giving every event its voice on stage.', photo: '/images/Yuva.jpeg', instagram: 'https://www.instagram.com/the.real.yuva/', linkedin: 'https://www.linkedin.com/in/yuva-boppudi-785bbb2ba/' },
  { code: 'DYC 0013', name: 'Suryansh', role: 'Audio Visuals Lead', desc: 'Manages sound, lighting, and visual production for every event.', photo: '/images/Suryansh2.jpeg', instagram: '#', linkedin: '#' },
  { code: 'DYC 0014', name: 'Tanuj Grandhi', role: 'Promotions Lead', desc: 'Drives promotional campaigns that build hype and turnout for every event.', photo: '/images/Tanuj.JPG', instagram: 'https://www.instagram.com/tanuj_grandhi?stkn=MTB3OXB2ZWF5MzB5cg==', linkedin: 'https://www.linkedin.com/in/tanuj-grandhi/' },
  { code: 'DYC 0010', name: 'SUHAIB SHAKEEL', role: ' Male Fashion Lead', desc: 'Curates styling and fashion direction for every event\u2019s stage and shoots.', photo: '', instagram: 'https://www.instagram.com/iam_suhaib37?dlrf=MXhmaGVkMm55cTl2cw%3D%3D&utm_source=qr', linkedin: 'https://www.linkedin.com/in/suhaib-shakeel-521aa5297/' },
  { code: 'DYC 0015', name: 'Prakhar', role: 'Fine arts Lead', desc: 'Curates styling and fashion direction for every event\u2019s stage and shoots.', photo: '', instagram: '#', linkedin: '#' },
]
const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const TeamCard = ({ member }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-red-500/15 bg-black transition-all duration-300 hover:-translate-y-1 hover:border-red-400/50 hover:shadow-[0_10px_50px_rgba(239,68,68,0.18)]">
    {/* Code badge — sits in its own row above the photo, not overlapping it */}
    <div className="px-4 pt-4">
      <span className="inline-block rounded-md border border-red-500/40 bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-widest text-red-400">
        {member.code}
      </span>
    </div>

    {/* Photo */}
    <div className="mt-3 h-80 w-full overflow-hidden bg-linear-to-b from-red-950/30 to-black">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-red-500/20">
          {initials(member.name)}
        </div>
      )}
    </div>

    {/* Info */}
    <div className="p-6">
      <h3 className="font-mono text-2xl uppercase tracking-wide text-white">{member.name}</h3>
      <p className="mt-2 text-base font-semibold text-red-500">{member.role}</p>
      <p className="mt-3 text-sm font-bold leading-relaxed tracking-wide text-gray-200">
        {member.desc}
      </p>

      <div className="mt-5 flex gap-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <a
          href={member.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-red-400"
          aria-label={`${member.name} on Instagram`}
        >
          Instagram
        </a>

        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-red-400"
          aria-label={`${member.name} on LinkedIn`}
        >
          LinkedIn
        </a>
      </div>
    </div>
  </div>
)

const Team = () => {
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-t from-red-950/70 via-black/95 to-black" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-0 h-150 w-225 -translate-x-1/2 translate-y-1/3 rounded-full bg-red-700/20 blur-[160px]" />

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

      <Link
        to="/"
        className="fixed top-6 left-6 z-50 text-sm uppercase tracking-widest text-white/70 transition-colors hover:text-white"
      >
        ← Back
      </Link>

      <div className="pointer-events-none fixed left-1/2 top-1/4 z-0 h-125 w-125 -translate-x-1/2 rounded-full bg-red-600/15 blur-[150px]" />

      <main className="relative z-10 w-full px-5 py-24 md:px-10 md:py-32">
        <section className="mx-auto max-w-5xl text-center">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            Meet The Team
          </p>

          <h1 className="font-[font7] text-[13vw] uppercase leading-[0.85] tracking-tight md:text-[7vw]">
            The People{' '}
            <span className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.55)]">
              Behind DYC
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            A small team driving a big amount of youth innovation across campus.
          </p>
        </section>

        <section className="mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member) => (
            <TeamCard key={member.code} member={member} />
          ))}
        </section>

        <section className="mx-auto mt-24 max-w-6xl text-center">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-red-500">
            Together As One
          </p>

          <h2 className="font-[font7] text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">
            The Full{' '}
            <span className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.55)]">
              DYC Family
            </span>
          </h2>

          <div className="mt-12 overflow-hidden rounded-2xl border border-red-500/15 shadow-[0_10px_60px_rgba(239,68,68,0.15)]">
            <img
              src="/images/IMG_4623.jpg"
              alt="The full DYC team"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`
        @keyframes starMove {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(35px, -25px, 0) scale(1.15); }
          50% { transform: translate3d(-25px, 35px, 0) scale(0.8); }
          75% { transform: translate3d(25px, 20px, 0) scale(1.1); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default Team