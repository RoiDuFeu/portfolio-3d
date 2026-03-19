import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useStudioStore } from '../../store/useStudioStore'
import { StudioPlanet } from './StudioPlanet'
import { StudioOcean } from './StudioOcean'
import { StudioClouds } from './StudioClouds'
import { StudioAtmosphere } from './StudioAtmosphere'
import { StudioRings } from './StudioRings'
import { StudioMoon } from './StudioMoon'
import { StudioEnvironment } from './StudioEnvironment'
import { EvolutionDriver } from './EvolutionDriver'

function StudioLighting() {
  const config = useStudioStore((s) => s.config)
  const isSun = config.renderMode === 'photorealistic' && config.photoRealisticPreset === 'sun-cubemap'
  const isPhotorealistic = config.renderMode === 'photorealistic'

  if (isSun) {
    // CubemapSun has its own point lights — minimal scene lighting
    return <ambientLight intensity={0.02} color="#4466aa" />
  }

  if (isPhotorealistic) {
    return (
      <>
        <directionalLight
          position={config.lightPosition}
          intensity={1.5}
          color="#fff5e6"
        />
        <ambientLight intensity={0.12} color="#4466aa" />
        <hemisphereLight args={['#4466aa', '#1a0a00', 0.08]} />
      </>
    )
  }

  // Procedural mode — original lighting
  return (
    <>
      <directionalLight
        position={config.lightPosition}
        intensity={1.2}
        color="#fff5e6"
      />
      <ambientLight intensity={0.15} color="#4466aa" />
    </>
  )
}

function StudioPostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.7}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export function StudioCanvas() {
  const config = useStudioStore((s) => s.config)

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50, near: 0.1, far: 500 }}
      style={{ background: '#000510' }}
    >
      <Suspense fallback={null}>
        <OrbitControls enableDamping dampingFactor={0.05} />

        <StudioLighting />

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

        <StudioPostProcessing />
      </Suspense>
    </Canvas>
  )
}
