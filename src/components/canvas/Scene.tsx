import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { FreeCameraControls } from './FreeCameraControls'
import { Lighting } from './Lighting'
import { PostProcessing } from './PostProcessing'
import { SpaceBackground } from '../environment/SpaceBackground'
import { MillenniumFalcon } from '../environment/MillenniumFalcon'
import { CubemapSun } from '../planets/CubemapSun'
import { OrbitRings } from '../planets/OrbitRings'
import { PlanetRenderer } from '../planets/PlanetRenderer'
import { solarBodies } from '../../data/solarSystem'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'

export function Scene() {
  const mode = useStore((s) => s.performanceMode)
  const cfg  = PERFORMANCE_CONFIGS[mode]

  return (
    // canvas-container uses 100dvh for correct iOS Safari behaviour
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 50, 60], fov: 55, near: 0.1, far: 800 }}
        style={{ width: '100%', height: '100%' }}
        dpr={cfg.dpr}
        gl={{ antialias: cfg.antialias, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020510']} />

        <Suspense fallback={null}>
          <CameraRig />
          <FreeCameraControls />
          <Lighting />
          <SpaceBackground />

          {/* Space environment — affects PBR reflections only, not the visible background */}
          <Environment preset="night" background={false} />

          {/* Millennium Falcon — positioned between Earth (≈26u) and Mars (≈30u) orbits */}
          <MillenniumFalcon position={[28, 3, 5]} scale={0.4} />

          {/* Solar system */}
          <CubemapSun />
          <OrbitRings />

          {solarBodies.map((body) => (
            <PlanetRenderer key={body.name} body={body} />
          ))}

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  )
}
