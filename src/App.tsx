import { Routes, Route } from 'react-router-dom'
import { GalaxyPage } from './pages/GalaxyPage'
import { PlanetStudioPage } from './pages/PlanetStudioPage'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GalaxyPage />} />
      <Route path="/studio" element={<PlanetStudioPage />} />
    </Routes>
  )
}

export default App
