import { Routes, Route } from 'react-router-dom'
import { GalaxyPage } from './pages/GalaxyPage'
import { PlanetStudioPage } from './pages/PlanetStudioPage'
import { EarthTestPage } from './pages/EarthTestPage'
import { RealisticPlanetsPage } from './pages/RealisticPlanetsPage'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GalaxyPage />} />
      <Route path="/studio" element={<PlanetStudioPage />} />
      <Route path="/earth-test" element={<EarthTestPage />} />
      <Route path="/realistic-planets" element={<RealisticPlanetsPage />} />
    </Routes>
  )
}

export default App
