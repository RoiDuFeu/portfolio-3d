import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import {
  galaxyPlanetPlacements,
  SOLAR_SYSTEM_CENTER_Z,
  PLANET_APPROACH_CONFIG,
} from '../../data/galaxyLayout'

/**
 * Invisible R3F component that checks falcon-to-planet distances every few
 * frames and updates `targetPlanet` in the store when a project planet is
 * within approach range.
 *
 * All store reads use getState() to avoid React re-renders.
 */

// Pre-compute world positions for planets that have an approach config
const approachTargets = galaxyPlanetPlacements
  .filter((p) => PLANET_APPROACH_CONFIG[p.planetName])
  .map((p) => ({
    name: p.planetName,
    worldPos: new THREE.Vector3(
      p.position[0],
      p.position[1],
      p.position[2] + SOLAR_SYSTEM_CENTER_Z,
    ),
    threshold: PLANET_APPROACH_CONFIG[p.planetName].threshold,
  }))

let frameCount = 0

export function ProximityDetector() {
  useFrame(() => {
    // Throttle: check every 3 frames
    frameCount++
    if (frameCount % 3 !== 0) return

    const state = useStore.getState()

    // Only check during active flight, not during visit or pause
    if (!state.isFlying || state.planetVisitActive || state.isPaused) return

    const falconPos = state.falconWorldPosition

    let closestName: string | null = null
    let closestDist = Infinity

    for (const target of approachTargets) {
      const dist = falconPos.distanceTo(target.worldPos)
      if (dist < target.threshold && dist < closestDist) {
        closestDist = dist
        closestName = target.name
      }
    }

    // Only call setter when value actually changes
    if (closestName !== state.targetPlanet) {
      state.setTargetPlanet(closestName)
    }
  })

  return null
}
