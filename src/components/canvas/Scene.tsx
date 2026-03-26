import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { UnifiedCameraRig } from './UnifiedCameraRig'
import { AssetPreloader } from './AssetPreloader'
import { Lighting } from './Lighting'
import { PostProcessing } from './PostProcessing'
import { SolarSystemZone } from './SolarSystemZone'
import { SpaceBackground } from '../environment/SpaceBackground'
import { UnifiedFalcon } from '../environment/UnifiedFalcon'
import { BlasterBolts } from './BlasterBolts'
import { ProximityDetector } from './ProximityDetector'
import { CubemapSun } from '../planets/CubemapSun'
import { SimpleGlowStar } from '../planets/SimpleGlowStar'
import { PlanetRenderer } from '../planets/PlanetRenderer'
import { DebugHelpers } from './DebugHelpers'
import { solarBodies } from '../../data/solarSystem'
import { galaxyStars, galaxyPlanetPlacements } from '../../data/galaxyLayout'
import { useStore } from '../../store/useStore'

/**
 * Unified scene root:
 *   - Falcon at upper overview position
 *   - Galaxy zone (z = -2000 center): multiple suns, scattered planets, space background
 *
 * After loading, the scene goes straight to the galaxy overview with
 * droid selection cards. No wormhole intro.
 */
export function Scene() {
  const debugFree = useStore((s) => s.debugFreeCamera)

  return (
    <>
      {/* Progress tracker — outside Suspense so it's always mounted */}
      <AssetPreloader />

      <Suspense fallback={null}>
        <UnifiedCameraRig />

        {/* Minimal lighting — just enough to see the ship on black */}
        <ambientLight color="#334466" intensity={0.3} />
        <directionalLight position={[2, 4, 8]} intensity={0.6} color="#aabbff" />

        {/* ── Falcon (overview position, elevated above solar system) ── */}
        <UnifiedFalcon />

        {/* ── Blaster bolts (instanced mesh, fires from ship) ── */}
        <BlasterBolts />

        {/* ── Proximity detection for planet approach cards ── */}
        <ProximityDetector />

        {/* ── GALAXY ZONE (z = -2000 center) ────────────────── */}
        <SolarSystemZone>
          <Environment preset="night" background={false} />
          <Lighting />
          <SpaceBackground />

          {/* ── Multiple suns scattered across the galaxy ── */}
          {galaxyStars.map((star) =>
            star.detail === 'full' ? (
              <CubemapSun
                key={star.id}
                position={star.position}
                scale={star.scale}
                uniforms={star.uniforms}
              />
            ) : (
              <SimpleGlowStar
                key={star.id}
                position={star.position}
                scale={star.scale}
                color={star.uniforms.lights.keyColor}
              />
            )
          )}

          {/* ── Planets dispersed near their assigned stars ── */}
          {solarBodies.map((body) => {
            const placement = galaxyPlanetPlacements.find(
              (p) => p.planetName === body.name
            )
            return (
              <PlanetRenderer
                key={body.name}
                body={body}
                position={placement?.position}
              />
            )
          })}
        </SolarSystemZone>

        <PostProcessing />

        {/* Debug wireframes — press F to toggle */}
        <DebugHelpers visible={debugFree} />
      </Suspense>
    </>
  )
}
