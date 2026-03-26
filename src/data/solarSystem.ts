import type { SolarBody } from '../types'

// ── Scale constants ──
// Sun radius stays at 3 (anchor). Real Sun = 109x Earth radius.
// Planet sizes use real ratios scaled so Earth ≈ 0.55 units.
// Orbit distances use power-curve compression for navigability.

const PLANET_SCALE = 0.55       // Earth display radius
const MIN_SIZE = 0.25           // Mercury never invisible
const ORBIT_SCALE = 18          // distance multiplier
const ORBIT_POWER = 0.55        // sqrt-ish compression
const BASE_OFFSET = 8           // inner clearance from Sun corona
const BASE_SPEED = 0.08         // Earth orbital speed

// ── Real astronomical data ──
export const solarBodies: SolarBody[] = [
  {
    name: 'earth',
    displayName: 'Earth',
    realRadiusRatio: 1.8,
    realAU: 1.0,
    realPeriodYears: 1.0,
    orbitOffset: 0.0,
    projectId: 'fertiscale',
    type: 'terrain',
    color: '#4CAF50',
    atmosphereColor: '#6DB3F2',
    axialTilt: 23.44,
  },
  {
    name: 'mars',
    displayName: 'Mars',
    realRadiusRatio: 0.532,
    realAU: 1.524,
    realPeriodYears: 1.881,
    orbitOffset: 2.1,
    projectId: 'godsplan',
    type: 'metallic',
    color: '#FFD700',
    atmosphereColor: '#D4956A',
    axialTilt: 25.19,
  },
  {
    name: 'neptune',
    displayName: 'Neptune',
    realRadiusRatio: 3.88,
    realAU: 30.07,
    realPeriodYears: 164.8,
    orbitOffset: 4.2,
    projectId: 'lesyndrome',
    type: 'audio',
    color: '#9C27B0',
    atmosphereColor: '#4169E1',
    axialTilt: 28.32,
  },
]

// ── Computed display values ──

const PROJECT_PLANET_MULTIPLIER = 4  // project planets 4× bigger so they're visible in the galaxy

export function getDisplaySize(body: SolarBody): number {
  const base = Math.max(body.realRadiusRatio * PLANET_SCALE, MIN_SIZE)
  return body.projectId ? base * PROJECT_PLANET_MULTIPLIER : base
}

export function getDisplayOrbit(body: SolarBody): number {
  return BASE_OFFSET + Math.pow(body.realAU, ORBIT_POWER) * ORBIT_SCALE
}

export function getDisplaySpeed(body: SolarBody): number {
  return BASE_SPEED / body.realPeriodYears
}

// ── Sorted by orbit for camera path ──
export function getBodiesSortedByOrbit(): SolarBody[] {
  return [...solarBodies].sort((a, b) => a.realAU - b.realAU)
}

// ── Find body by project ID ──
export function getBodyByProjectId(projectId: string): SolarBody | undefined {
  return solarBodies.find((b) => b.projectId === projectId)
}

// ── Find body by name ──
export function getBodyByName(name: string): SolarBody | undefined {
  return solarBodies.find((b) => b.name === name)
}
