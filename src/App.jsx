import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Locked from './pages/Locked'

import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Achievements from './pages/Achievements'
import Sponsors from './pages/Sponsors' // renamed from "Sponsers"

const lockedRoutes = [
  { path: '/about', name: 'about', label: 'Our Story', Component: OurStory },
  { path: '/team', name: 'team', label: 'Team', Component: Team },
  { path: '/gallery', name: 'gallery', label: 'Gallery', Component: Gallery },
  { path: '/achievements', name: 'achievements', label: 'Achievements', Component: Achievements },
  { path: '/sponsors', name: 'sponsors', label: 'Sponsors', Component: Sponsors },
]

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />

      {lockedRoutes.map(({ path, name, label, Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <Locked name={name} label={label}>
              <Component />
            </Locked>
          }
        />
      ))}

      {/* Redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App