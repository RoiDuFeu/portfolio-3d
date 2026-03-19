import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { FreeCameraControls } from './FreeCameraControls'
import { Lighting } from './Lighting'
import { PostProcessing } from './PostProcessing'
import { SpaceBackground } from '../environment/SpaceBackground'
import { CubemapSun } from '../planets/CubemapSun'
import { OrbitRings } from '../planets/OrbitRings'
import { PlanetRenderer } from '../planets/PlanetRenderer'
import { solarBodies } from '../../data/solarSystem'

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 50, 60], fov: 55, near: 0.1, far: 800 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020510']} />

      <Suspense fallback={null}>
        <CameraRig />
        <FreeCameraControls />
        <Lighting />
        <SpaceBackground />

        {/* Solar system */}
        <CubemapSun />
        <OrbitRings />

        {solarBodies.map((body) => (
          <PlanetRenderer key={body.name} body={body} />
        ))}

        <PostProcessing />
      </Suspense>
    </Canvas>
  )
}
