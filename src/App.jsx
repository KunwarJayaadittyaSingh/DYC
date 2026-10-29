import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Achievements from './pages/Achievements'
import Sponsers from './pages/Sponsers'
// ...your other imports

// Each page decides for itself whether it is open or "Under Construction".
// To open a page, set its *_PAGE_OPEN switch to true at the top of its file.

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<OurStory />} />
      <Route path="/team" element={<Team />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/sponsors" element={<Sponsers />} />

      {/* ...your other routes */}
    </Routes>
  </BrowserRouter>
)

export default App
