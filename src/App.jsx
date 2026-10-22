import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Components/Navbar'
import EventsPopup from './Components/EventsPopup'
import Home from './pages/Home'
import Magnitude from './pages/Magnitude'
import MagnitudeRegister from './pages/MagnitudeRegister'
import Youthvibe from './pages/Youthvibe'
import Concoction from './pages/Concoction'
import FTS from './pages/FTS'
import TEDx from './pages/TEDx'
import HultPrize from './pages/HultPrize'
import ContactPage from './pages/ContactPage'
import JoinUs from './pages/JoinUs'
import OurStory from './pages/OurStory'
import Team from './pages/Team'
import Sponsers from './pages/Sponsers'
import Gallery from './pages/Gallery'
import Help from './pages/Help'
import Feedback from './pages/Feedback'

const App = () => {
  return (
    <>
      <Navbar />
      <EventsPopup />
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
        <Route path="/sponsors" element={<Sponsers />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/help" element={<Help />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </>
  )
}

export default App