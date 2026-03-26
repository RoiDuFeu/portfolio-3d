import * as THREE from 'three'

/**
 * Shared singleton — PlanetRenderer updates these world positions each frame.
 * Other systems (proximity detection, guided orbit camera) read from here.
 * Mutated in-place to avoid allocations.
 */
export const planetWorldPositions: Record<string, THREE.Vector3> = {}

export function getPlanetWorldPosition(name: string): THREE.Vector3 | null {
  return planetWorldPositions[name] ?? null
}
