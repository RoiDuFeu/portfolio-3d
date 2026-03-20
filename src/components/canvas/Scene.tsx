import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { UnifiedCameraRig } from './UnifiedCameraRig'
import { Lighting } from './Lighting'
import { PostProcessing } from './PostProcessing'
import { LobbyStarfield } from './LobbyStarfield'
import { SolarSystemZone } from './SolarSystemZone'
import { SpaceBackground } from '../environment/SpaceBackground'
import { UnifiedFalcon } from '../environment/UnifiedFalcon'
import { HyperspaceTunnel } from '../intro/HyperspaceTunnel'
import { CubemapSun } from '../planets/CubemapSun'
import { OrbitRings } from '../planets/OrbitRings'
import { PlanetRenderer } from '../planets/PlanetRenderer'
import { DebugHelpers } from './DebugHelpers'
import { solarBodies } from '../../data/solarSystem'
import { useStore } from '../../store/useStore'

/**
 * Unified scene root — contains all three spatial zones:
 *   1. Lobby (z ≈ 0): starfield + Falcon idle
 *   2. Tunnel (z = -50 to -1850): hyperspace streaking stars
 *   3. Solar system (z = -2000 center): sun, planets, space background
 *
 * The Falcon physically flies through all three zones.
 * Camera always follows via UnifiedCameraRig.
 */
export function Scene() {
  const debugFree = useStore((s) => s.debugFreeCamera)

  return (
    <Suspense fallback={null}>
      <UnifiedCameraRig />

      {/* Shared lighting — intro zone gets its own supplementary lights */}
      <Lighting />
      <ambientLight color="#1a2244" intensity={0.15} />
      <directionalLight position={[-3, 6, -20]} intensity={0.5} color="#99bbff" />

      <Environment preset="night" background={false} />

      {/* ── LOBBY ZONE (z ≈ 0) ──────────────────────────────────── */}
      <LobbyStarfield />
      <UnifiedFalcon />

      {/* ── TUNNEL ZONE (z = -50 to -1850) ──────────────────────── */}
      <group position={[0, 0, -50]}>
        <HyperspaceTunnel />
      </group>

      {/* ── SOLAR SYSTEM ZONE (z = -2000 center) ────────────────── */}
      <SolarSystemZone>
        <SpaceBackground />
        <CubemapSun />
        <OrbitRings />

        {solarBodies.map((body) => (
          <PlanetRenderer key={body.name} body={body} />
        ))}
      </SolarSystemZone>

      <PostProcessing />

      {/* Debug wireframes — press F to toggle */}
      <DebugHelpers visible={debugFree} />
    </Suspense>
  )
}
