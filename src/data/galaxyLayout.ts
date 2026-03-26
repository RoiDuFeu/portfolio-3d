import type { CubemapSunUniforms } from '../types/shaderUniforms'
import { DEFAULT_SUN_UNIFORMS } from '../utils/shaderDefaults'

// ── Star type definitions ──

export type StarType = 'yellow' | 'redDwarf' | 'blueGiant' | 'whiteDwarf' | 'orangeGiant' | 'redGiant'

export interface GalaxyStar {
  id: string
  position: [number, number, number]
  scale: number
  type: StarType
  detail: 'full' | 'simple'
  uniforms: CubemapSunUniforms
}

export interface GalaxyPlanetPlacement {
  planetName: string
  starId: string
  position: [number, number, number]
}

// ── Uniform presets per star type ──

function makeUniforms(overrides: {
  surfaceTint: number
  surfaceBrightness?: number
  surfaceBase?: number
  raysHue: number
  raysHueSpread?: number
  flaresHue: number
  flaresHueSpread?: number
  glowTint?: number
  glowBrightness?: number
  keyColor: string
  fillColor: string
  keyIntensity?: number
  fillIntensity?: number
}): CubemapSunUniforms {
  return {
    surface: {
      ...DEFAULT_SUN_UNIFORMS.surface,
      tint: overrides.surfaceTint,
      brightness: overrides.surfaceBrightness ?? DEFAULT_SUN_UNIFORMS.surface.brightness,
      base: overrides.surfaceBase ?? DEFAULT_SUN_UNIFORMS.surface.base,
    },
    perlin: { ...DEFAULT_SUN_UNIFORMS.perlin },
    glow: {
      ...DEFAULT_SUN_UNIFORMS.glow,
      tint: overrides.glowTint ?? DEFAULT_SUN_UNIFORMS.glow.tint,
      brightness: overrides.glowBrightness ?? DEFAULT_SUN_UNIFORMS.glow.brightness,
    },
    rays: {
      ...DEFAULT_SUN_UNIFORMS.rays,
      hue: overrides.raysHue,
      hueSpread: overrides.raysHueSpread ?? DEFAULT_SUN_UNIFORMS.rays.hueSpread,
    },
    flares: {
      ...DEFAULT_SUN_UNIFORMS.flares,
      hue: overrides.flaresHue,
      hueSpread: overrides.flaresHueSpread ?? DEFAULT_SUN_UNIFORMS.flares.hueSpread,
    },
    lights: {
      ...DEFAULT_SUN_UNIFORMS.lights,
      keyColor: overrides.keyColor,
      fillColor: overrides.fillColor,
      keyIntensity: overrides.keyIntensity ?? DEFAULT_SUN_UNIFORMS.lights.keyIntensity,
      fillIntensity: overrides.fillIntensity ?? DEFAULT_SUN_UNIFORMS.lights.fillIntensity,
    },
  }
}

const STAR_PRESETS: Record<StarType, (scale?: number) => CubemapSunUniforms> = {
  yellow: () => makeUniforms({
    surfaceTint: 0.20, raysHue: 0.20, flaresHue: 0.10,
    keyColor: '#FFA54F', fillColor: '#FF8030',
  }),
  redDwarf: () => makeUniforms({
    surfaceTint: 0.45, surfaceBrightness: 0.5, surfaceBase: 2.5,
    raysHue: 0.00, raysHueSpread: 0.08, flaresHue: 0.02, flaresHueSpread: 0.06,
    glowTint: 0.45, glowBrightness: 0.06,
    keyColor: '#FF4422', fillColor: '#CC2211',
    keyIntensity: 3.0, fillIntensity: 1.5,
  }),
  blueGiant: () => makeUniforms({
    surfaceTint: 0.05, surfaceBrightness: 1.2, surfaceBase: 6.0,
    raysHue: 0.60, raysHueSpread: 0.15, flaresHue: 0.55, flaresHueSpread: 0.12,
    glowTint: 0.08, glowBrightness: 0.18,
    keyColor: '#6688FF', fillColor: '#4466DD',
    keyIntensity: 12.0, fillIntensity: 6.0,
  }),
  whiteDwarf: () => makeUniforms({
    surfaceTint: 0.08, surfaceBrightness: 0.9, surfaceBase: 5.0,
    raysHue: 0.50, raysHueSpread: 0.1, flaresHue: 0.48,
    glowTint: 0.10, glowBrightness: 0.10,
    keyColor: '#CCDDFF', fillColor: '#AABBEE',
    keyIntensity: 4.0, fillIntensity: 2.0,
  }),
  orangeGiant: () => makeUniforms({
    surfaceTint: 0.32, surfaceBrightness: 0.9, surfaceBase: 4.5,
    raysHue: 0.10, raysHueSpread: 0.15, flaresHue: 0.08, flaresHueSpread: 0.12,
    glowTint: 0.30, glowBrightness: 0.14,
    keyColor: '#FF8833', fillColor: '#DD6622',
    keyIntensity: 9.0, fillIntensity: 5.0,
  }),
  redGiant: () => makeUniforms({
    surfaceTint: 0.50, surfaceBrightness: 0.7, surfaceBase: 3.5,
    raysHue: 0.02, raysHueSpread: 0.06, flaresHue: 0.01, flaresHueSpread: 0.05,
    glowTint: 0.48, glowBrightness: 0.10,
    keyColor: '#CC3311', fillColor: '#AA2200',
    keyIntensity: 8.0, fillIntensity: 4.0,
  }),
}

// ── 6 stars — one full-detail per project planet + 3 simple for ambiance ──
// Positions are relative to SolarSystemZone center [0, 0, -2000]

export const galaxyStars: GalaxyStar[] = [
  // ── Full-detail stars (3) — one per project planet ──
  { id: 'sol',         position: [0, 0, 0],           scale: 1.0,  type: 'yellow',      detail: 'full',   uniforms: STAR_PRESETS.yellow() },
  { id: 'rigel',       position: [-120, 15, -80],     scale: 1.8,  type: 'blueGiant',   detail: 'full',   uniforms: STAR_PRESETS.blueGiant() },
  { id: 'aldebaran',   position: [150, -10, 60],      scale: 1.5,  type: 'orangeGiant', detail: 'full',   uniforms: STAR_PRESETS.orangeGiant() },

  // ── Simple-detail stars (3) — distant ambiance ──
  { id: 'proxima',     position: [80, -25, -150],     scale: 0.4,  type: 'redDwarf',    detail: 'simple', uniforms: STAR_PRESETS.redDwarf() },
  { id: 'antares',     position: [-60, 30, 170],      scale: 1.6,  type: 'redGiant',    detail: 'simple', uniforms: STAR_PRESETS.redGiant() },
  { id: 'sirius-b',    position: [200, 20, -30],      scale: 0.25, type: 'whiteDwarf',  detail: 'simple', uniforms: STAR_PRESETS.whiteDwarf() },
]

// ── Planet placements — each near a specific star ──
// Positions include a 10-20 unit offset from the parent star

export const galaxyPlanetPlacements: GalaxyPlanetPlacement[] = [
  { planetName: 'earth',   starId: 'sol',        position: [15, -2, 8] },       // near central yellow star
  { planetName: 'mars',    starId: 'aldebaran',  position: [165, -6, 50] },     // near orange giant
  { planetName: 'neptune', starId: 'rigel',      position: [-105, 10, -90] },   // near blue giant
]

// ── Helpers ──

export function getGalaxyPosition(planetName: string): [number, number, number] | undefined {
  return galaxyPlanetPlacements.find((p) => p.planetName === planetName)?.position
}

export function getStarById(starId: string): GalaxyStar | undefined {
  return galaxyStars.find((s) => s.id === starId)
}

// Tour order for camera path — visits project planets
export const TOUR_ORDER: string[] = [
  'earth',    // project planet — sol
  'neptune',  // project planet — rigel area
  'mars',     // project planet — aldebaran area
]

// ── Solar system world offset ──
export const SOLAR_SYSTEM_CENTER_Z = -2000

// ── Planet approach configuration (for C-3PO proximity card) ──
export interface PlanetApproachConfig {
  threshold: number
  projectId: string
  c3poDialogue: string
}

export const PLANET_APPROACH_CONFIG: Record<string, PlanetApproachConfig> = {
  earth: {
    threshold: 20.0,
    projectId: 'fertiscale',
    c3poDialogue: 'Sir, I do believe this planet warrants our attention. My sensors indicate agricultural activity of considerable sophistication.',
  },
}
