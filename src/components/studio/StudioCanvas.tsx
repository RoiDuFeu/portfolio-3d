import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStudioStore } from '../../store/useStudioStore'
import { StudioPlanet } from './StudioPlanet'
import { StudioOcean } from './StudioOcean'
import { StudioClouds } from './StudioClouds'
import { StudioAtmosphere } from './StudioAtmosphere'
import { StudioRings } from './StudioRings'
import { StudioMoon } from './StudioMoon'
import { StudioEnvironment } from './StudioEnvironment'
import { EvolutionDriver } from './EvolutionDriver'

export function StudioCanvas() {
  const config = useStudioStore((s) => s.config)

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50, near: 0.1, far: 500 }}
      style={{ background: '#000510' }}
    >
      <Suspense fallback={null}>
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* Lighting */}
        <directionalLight
          position={config.lightPosition}
          intensity={1.2}
          color="#fff5e6"
        />
        <ambientLight intensity={0.15} color="#4466aa" />

        {/* Background stars */}
        <StudioEnvironment />

        {/* Planet group */}
        <group>
          <StudioPlanet />
          <StudioOcean />
          <StudioClouds />
          <StudioAtmosphere />
          <StudioRings />

          {config.moons.map((moon) => (
            <StudioMoon key={moon.id} moon={moon} />
          ))}
        </group>

        {/* Timeline playback driver */}
        <EvolutionDriver />
      </Suspense>
    </Canvas>
  )
}
