import type { PlanetConfig } from '../types/studio'

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const now = Date.now()

function base(): PlanetConfig {
  return {
    id: makeId(),
    name: 'New Planet',
    createdAt: now,
    updatedAt: now,
    mode: 'rocky',
    size: 2.5,
    rotationSpeed: { base: 0.002, evolved: 0.002 },
    terrain: {
      displacement: { base: 0.25, evolved: 0.25 },
      noiseFrequency: 1.5,
      noiseOctaves: 4,
      seed: 0,
    },
    biome: {
      oceanLevel: { base: 0.35, evolved: 0.35 },
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0, evolved: 0 },
    },
    colors: {
      primary: '#8b7355',
      secondary: '#a0937a',
      ocean: '#0a3066',
      vegetation: '#1a8c1e',
      snow: '#e6eaf0',
      frost: '#c0ddf0',
    },
    clouds: {
      enabled: false,
      density: { base: 0.4, evolved: 0.4 },
      speed: 0.3,
      color: '#ffffff',
    },
    fire: {
      intensity: { base: 0.8, evolved: 1.0 },
      colorCore: '#fffff0',
      colorMid: '#ff9a18',
      colorEdge: '#cc1a02',
      coronaGlow: 0.6,
    },
    atmosphere: {
      enabled: false,
      color: '#6688cc',
      intensity: { base: 0.5, evolved: 0.5 },
      exponent: 3.5,
    },
    rings: {
      enabled: false,
      innerRadius: 1.4,
      outerRadius: 2.8,
      tilt: 0.3,
      colorInner: '#c8b080',
      colorOuter: '#8a7050',
      opacity: 0.7,
      bandCount: 8,
    },
    moons: [],
    lightPosition: [30, 20, 30],
  }
}

export const PRESETS: Record<string, () => PlanetConfig> = {
  blank: () => ({
    ...base(),
    name: 'Blank',
  }),

  // ── Mercury: heavily cratered, no atmosphere, extreme temperature contrast ──
  mercury: () => ({
    ...base(),
    name: 'Mercury',
    size: 1.6,
    rotationSpeed: { base: 0.0003, evolved: 0.0003 }, // Very slow rotation (58.6 Earth days)
    terrain: {
      displacement: { base: 0.3, evolved: 0.3 },
      noiseFrequency: 2.2,
      noiseOctaves: 5,
      seed: 55,
    },
    biome: {
      oceanLevel: { base: 0, evolved: 0 },
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0, evolved: 0 },
    },
    colors: {
      primary: '#8c8680',   // Grey regolith
      secondary: '#6b6560', // Darker basaltic plains
      ocean: '#555050',
      vegetation: '#555050',
      snow: '#a09a94',
      frost: '#908a84',
    },
    atmosphere: {
      enabled: false,
      color: '#888888',
      intensity: { base: 0, evolved: 0 },
      exponent: 5.0,
    },
  }),

  // ── Venus: thick sulfuric atmosphere, volcanic surface, very slow retrograde rotation ──
  venus: () => ({
    ...base(),
    name: 'Venus',
    size: 2.4,
    rotationSpeed: { base: 0.0002, evolved: 0.0002 }, // Extremely slow retrograde
    terrain: {
      displacement: { base: 0.18, evolved: 0.18 },
      noiseFrequency: 1.4,
      noiseOctaves: 4,
      seed: 22,
    },
    biome: {
      oceanLevel: { base: 0, evolved: 0 }, // No liquid water
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0, evolved: 0 },
    },
    colors: {
      primary: '#c4943a',   // Volcanic highland basalt
      secondary: '#a87830', // Darker lava plains
      ocean: '#8a6020',
      vegetation: '#8a6020',
      snow: '#d4a850',
      frost: '#c49840',
    },
    clouds: {
      enabled: true,
      density: { base: 0.7, evolved: 0.8 }, // Very thick sulfuric acid clouds
      speed: 0.6, // Super-rotation — clouds move much faster than surface
      color: '#e8d8a0',
    },
    atmosphere: {
      enabled: true,
      color: '#e8c060',     // Dense yellowish CO2 atmosphere
      intensity: { base: 1.2, evolved: 1.2 },
      exponent: 2.0,        // Very thick — low exponent = wide glow
    },
  }),

  // ── Earth: the blue marble ──
  earth: () => ({
    ...base(),
    name: 'Earth',
    size: 2.5,
    rotationSpeed: { base: 0.003, evolved: 0.003 },
    terrain: {
      displacement: { base: 0.25, evolved: 0.25 }, // Enough relief to see continents clearly
      noiseFrequency: 1.0,  // Very low freq → big continent shapes
      noiseOctaves: 5,
      seed: 14,
    },
    biome: {
      oceanLevel: { base: 0.3, evolved: 0.3 },   // Tuned for ~60-70% water with this noise
      vegetation: { base: 0.5, evolved: 0.85 },   // Evolve: spring → summer canopy peak
      frost: { base: 0.22, evolved: 0.1 },        // Evolve: winter ice caps → summer melt
    },
    colors: {
      primary: '#9a8a62',   // Sandy continental lowlands (Sahara, Australian outback)
      secondary: '#6e5e3e', // Highland rock / mountain ranges
      ocean: '#1a4a8a',     // Bright enough to read as ocean, not a black void
      vegetation: '#2e7830', // Satellite green — temperate forests
      snow: '#f0f4fa',
      frost: '#d4e8f4',
    },
    clouds: {
      enabled: true,
      density: { base: 0.2, evolved: 0.35 }, // Lighter clouds — land should be visible
      speed: 0.2,
      color: '#ffffff',
    },
    atmosphere: {
      enabled: true,
      color: '#4488cc',
      intensity: { base: 0.4, evolved: 0.4 },
      exponent: 6.0,        // Tight narrow limb glow
    },
    moons: [
      {
        id: 'moon-luna',
        size: 0.38,
        color: '#c0bab0',         // Highlands — warm light grey
        colorSecondary: '#8a8478', // Maria — not too dark, warm mid-grey
        roughness: 0.85,
        craterStrength: 0.5,       // Subtle surface detail, not a spiky rock
        orbitRadius: 5.8,
        orbitSpeed: 0.18,
        orbitTilt: 0.09,
      },
    ],
  }),

  // ── Mars: the red planet ──
  // Reference: HiRISE imagery, Mars Reconnaissance Orbiter color data
  mars: () => ({
    ...base(),
    name: 'Mars',
    size: 2.0,                                      // ~53% Earth diameter
    rotationSpeed: { base: 0.0032, evolved: 0.0032 }, // 24h 37m — almost Earth-like
    terrain: {
      displacement: { base: 0.4, evolved: 0.4 },   // Huge relief: Olympus Mons (21km), Valles Marineris (7km deep)
      noiseFrequency: 1.2,  // Low freq → broad highland/lowland dichotomy
      noiseOctaves: 5,
      seed: 42,
    },
    biome: {
      oceanLevel: { base: 0, evolved: 0 },         // Bone dry
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0.18, evolved: 0.35 },        // Evolve: summer → winter CO2 polar cap growth
    },
    colors: {
      primary: '#c2622a',   // Bright ferric oxide dust — Tharsis/Arabia Terra
      secondary: '#7c3a18', // Dark basaltic rock — Syrtis Major albedo feature
      ocean: '#4a3020',     // Low-lying basin dust tone (Hellas, Utopia)
      vegetation: '#5a4830', // Unused but blends as warm neutral
      snow: '#f0e0d0',      // CO2 frost — warm pinkish white (not pure white)
      frost: '#e0c8b0',     // Dusty ice — Mars frost is always contaminated with dust
    },
    clouds: {
      enabled: true,
      density: { base: 0.05, evolved: 0.15 },  // Evolve: clear → dust storm season
      speed: 0.4,                               // Fast high-altitude CO2 clouds
      color: '#e8c8a0',                         // Pinkish-tan dust haze, not white
    },
    atmosphere: {
      enabled: true,
      color: '#d48844',     // Butterscotch sky from suspended ferric dust
      intensity: { base: 0.15, evolved: 0.28 }, // Evolve: clear → global dust storm haze
      exponent: 5.5,        // Very thin atmosphere — narrow limb glow
    },
    moons: [
      {
        id: 'moon-phobos',
        size: 0.1,                  // ~22km avg diameter — tiny vs Mars
        color: '#6e645a',           // Dark carbonaceous chondrite grey
        colorSecondary: '#4a4038',  // Stickney crater interior — darker regolith
        roughness: 0.95,
        craterStrength: 0.8,        // Stickney crater — visible but not spiky
        orbitRadius: 3.0,           // Only 6000km above surface — very close
        orbitSpeed: 0.9,            // 7h 39m — orbits faster than Mars rotates
        orbitTilt: 0.02,            // Nearly equatorial
      },
      {
        id: 'moon-deimos',
        size: 0.06,                 // ~12km — even smaller
        color: '#7a7068',           // Slightly lighter than Phobos
        colorSecondary: '#544a42',
        roughness: 0.9,
        craterStrength: 0.4,        // Smoother — regolith-filled craters
        orbitRadius: 5.5,           // ~23,000km — much farther than Phobos
        orbitSpeed: 0.25,           // 30h period
        orbitTilt: 0.03,
      },
    ],
  }),

  // ── Ice World: Europa / Enceladus-inspired frozen moon ──
  ice: () => ({
    ...base(),
    name: 'Ice World',
    size: 2.0,
    rotationSpeed: { base: 0.001, evolved: 0.001 }, // Tidally locked
    terrain: {
      displacement: { base: 0.1, evolved: 0.1 },  // Smooth with cracks
      noiseFrequency: 2.5,
      noiseOctaves: 4,
      seed: 7,
    },
    biome: {
      oceanLevel: { base: 0.15, evolved: 0.15 },  // Subsurface ocean glimpses
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0.85, evolved: 0.95 },        // Almost entirely frozen
    },
    colors: {
      primary: '#a0aab8',   // Dirty ice
      secondary: '#8898a8',
      ocean: '#1a3860',     // Dark subsurface ocean showing through
      vegetation: '#506070',
      snow: '#e8eef8',      // Pure ice
      frost: '#d0e0f5',
    },
    atmosphere: {
      enabled: true,
      color: '#88bbee',
      intensity: { base: 0.3, evolved: 0.3 },
      exponent: 3.5,
    },
  }),

  // ── Lava: young volcanic world / Io-inspired ──
  lava: () => ({
    ...base(),
    name: 'Lava World',
    size: 2.3,
    rotationSpeed: { base: 0.002, evolved: 0.002 },
    terrain: {
      displacement: { base: 0.4, evolved: 0.4 },
      noiseFrequency: 1.0,
      noiseOctaves: 3,
      seed: 13,
    },
    biome: {
      oceanLevel: { base: 0.32, evolved: 0.32 },  // Lava "ocean" fills low regions
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0, evolved: 0 },
    },
    colors: {
      primary: '#1a1210',   // Dark cooled basalt crust
      secondary: '#2a1a12',
      ocean: '#dd3800',     // Molten lava glow
      vegetation: '#333333',
      snow: '#444444',
      frost: '#333333',
    },
    atmosphere: {
      enabled: true,
      color: '#cc4422',     // Volcanic outgassing — sulfurous red
      intensity: { base: 0.6, evolved: 0.8 },
      exponent: 2.5,
    },
  }),

  // ── Star: G-type main sequence (like the Sun) ──
  sun: () => ({
    ...base(),
    name: 'Star',
    mode: 'star',
    size: 3.5,
    rotationSpeed: { base: 0.001, evolved: 0.001 },
    fire: {
      intensity: { base: 0.6, evolved: 1.1 },
      colorCore: '#fffff0',  // ~6000K white-yellow core
      colorMid: '#ffb830',   // Chromosphere orange
      colorEdge: '#dd2a00',  // Photosphere limb darkening
      coronaGlow: 0.8,
    },
    atmosphere: {
      enabled: true,
      color: '#ff6620',      // Solar corona
      intensity: { base: 0.9, evolved: 1.2 },
      exponent: 2.0,
    },
  }),

  // ── Red Dwarf: cooler, smaller M-type star ──
  'red-dwarf': () => ({
    ...base(),
    name: 'Red Dwarf',
    mode: 'star',
    size: 2.0,
    rotationSpeed: { base: 0.0005, evolved: 0.0005 },
    fire: {
      intensity: { base: 0.4, evolved: 0.7 },
      colorCore: '#ffcc88',   // Cooler ~3500K core
      colorMid: '#e05520',
      colorEdge: '#881100',
      coronaGlow: 0.4,
    },
    atmosphere: {
      enabled: true,
      color: '#aa2200',
      intensity: { base: 0.5, evolved: 0.6 },
      exponent: 3.0,
    },
  }),

  // ── Gas Giant: Saturn-inspired with rings and moons ──
  saturn: () => ({
    ...base(),
    name: 'Gas Giant',
    size: 3.8,
    rotationSpeed: { base: 0.005, evolved: 0.005 }, // Fast rotation (10.7h)
    terrain: {
      displacement: { base: 0.05, evolved: 0.05 }, // Nearly smooth — gas surface
      noiseFrequency: 4.0,                          // High freq = banding pattern
      noiseOctaves: 3,
      seed: 99,
    },
    biome: {
      oceanLevel: { base: 0, evolved: 0 },  // No solid surface
      vegetation: { base: 0, evolved: 0 },
      frost: { base: 0, evolved: 0 },
    },
    colors: {
      primary: '#c4a04a',    // Ammonia cloud bands
      secondary: '#dcc070',  // Lighter hydrogen bands
      ocean: '#a08030',      // Band variation
      vegetation: '#b09040',
      snow: '#e8d8a0',
      frost: '#d0c080',
    },
    rings: {
      enabled: true,
      innerRadius: 1.3,
      outerRadius: 3.2,
      tilt: 0.47,            // Saturn's ~26.7° axial tilt
      colorInner: '#d8c890', // Inner C ring — fainter
      colorOuter: '#907040', // Outer A ring
      opacity: 0.8,
      bandCount: 15,         // Cassini division + many ringlets
    },
    atmosphere: {
      enabled: true,
      color: '#ccaa44',
      intensity: { base: 0.35, evolved: 0.35 },
      exponent: 4.5,
    },
    moons: [
      {
        id: 'moon-titan',
        size: 0.35,
        color: '#c8a050',         // Orange — Titan's thick haze
        colorSecondary: '#a08030',
        roughness: 0.7,
        craterStrength: 0.2,      // Few craters — atmosphere protects
        orbitRadius: 6.0,
        orbitSpeed: 0.15,
        orbitTilt: 0.05,
      },
      {
        id: 'moon-enceladus',
        size: 0.15,
        color: '#e8eef8',         // Brightest object in solar system
        colorSecondary: '#c8d8e8',
        roughness: 0.6,
        craterStrength: 0.5,
        orbitRadius: 4.5,
        orbitSpeed: 0.35,
        orbitTilt: 0.0,
      },
      {
        id: 'moon-mimas',
        size: 0.12,
        color: '#b0aaa0',
        colorSecondary: '#8a8478',
        roughness: 0.9,
        craterStrength: 0.6,      // Herschel crater — visible but smooth
        orbitRadius: 3.8,
        orbitSpeed: 0.5,
        orbitTilt: 0.03,
      },
    ],
  }),
}

export function createPreset(key: string): PlanetConfig {
  const factory = PRESETS[key]
  if (!factory) return PRESETS.blank()
  const config = factory()
  config.id = makeId()
  config.createdAt = Date.now()
  config.updatedAt = Date.now()
  return config
}
