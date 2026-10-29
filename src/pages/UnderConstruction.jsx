import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Locked from './pages/Locked'

import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Achievements from './pages/Achievements'
import Sponsers from './pages/Sponsers'
// ...your other imports

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/about" element={<Locked name="about" label="Our Story"><OurStory /></Locked>} />
      <Route path="/team" element={<Locked name="team" label="Team"><Team /></Locked>} />
      <Route path="/gallery" element={<Locked name="gallery" label="Gallery"><Gallery /></Locked>} />
      <Route path="/achievements" element={<Locked name="achievements" label="Achievements"><Achievements /></Locked>} />
      <Route path="/sponsors" element={<Locked name="sponsors" label="Sponsors"><Sponsers /></Locked>} />

      {/* ...your other routes */}
    </Routes>
  </BrowserRouter>
)

export default App