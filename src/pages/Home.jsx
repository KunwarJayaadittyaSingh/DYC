import React from 'react'
import StarBackground from '../Components/StarBackground'
import CinematicHero from '../Components/CinematicHero'
import TeamSection from './TeamSection'
import UniverseSection from './UniverseSection'
import SlidingShowcase from '../Components/SlidingShowcase'
import JoinForceSection from './JoinForceSection'
import Footer from './Footer'
import ScrollContactPrompt from '../Components/ScrollContactPrompt'

const Home = () => {
  return (
    <>
      <StarBackground />

      <div className="relative z-10">
        <CinematicHero
          videoSrc="https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/IMG_6966.mp4"
          heroWord="DYC"
          belowText="Department of Youth Capital"
        />
        <TeamSection />
        <UniverseSection />
        <JoinForceSection />
        <SlidingShowcase />
      </div>

      {/* Footer's own opaque bg-black covers the fixed star layer — no stars visible here */}
      <div className="relative z-10">
        <Footer />
      </div>

      <ScrollContactPrompt />
    </>
  )
}

export default Home