import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Components/Navbar'
import EventsPopup from './Components/EventsPopup'
import Home from './pages/Home'

// Only Home loads up front; every other page downloads when it is opened.
const Magnitude = lazy(() => import('./pages/Magnitude'))
const MagnitudeRegister = lazy(() => import('./pages/MagnitudeRegister'))
const Youthvibe = lazy(() => import('./pages/Youthvibe'))
const Concoction = lazy(() => import('./pages/Concoction'))
const FTS = lazy(() => import('./pages/FTS'))
const TEDx = lazy(() => import('./pages/TEDx'))
const HultPrize = lazy(() => import('./pages/HultPrize'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const JoinUs = lazy(() => import('./pages/JoinUs'))
const OurStory = lazy(() => import('./pages/OurStory'))
const Team = lazy(() => import('./pages/Team'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Sponsers = lazy(() => import('./pages/Sponsers'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Help = lazy(() => import('./pages/Help'))
const Feedback = lazy(() => import('./pages/Feedback'))

const App = () => {
  return (
    <>
      <Navbar />
      <EventsPopup />
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/magnitude" element={<Magnitude />} />
          <Route path="/magnitude/register" element={<MagnitudeRegister />} />
          <Route path="/youthvibe" element={<Youthvibe />} />
          <Route path="/concoction" element={<Concoction />} />
          <Route path="/fts" element={<FTS />} />
          <Route path="/tedx" element={<TEDx />} />
          <Route path="/hult-prize" element={<HultPrize />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/join" element={<JoinUs />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/team" element={<Team />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/sponsors" element={<Sponsers />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/help" element={<Help />} />
          <Route path="/feedback" element={<Feedback />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App