export type BiomePreset = 'earth' | 'mars' | 'ice' | 'lava' | 'gas-giant' | 'sun' | 'barren' | 'custom'
export type PlanetMode = 'rocky' | 'star'

export interface AnimatableValue {
  base: number
  evolved: number
}

export interface MoonConfig {
  id: string
  size: number
  color: string
  colorSecondary: string
  roughness: number
  craterStrength: number
  orbitRadius: number
  orbitSpeed: number
  orbitTilt: number
}

export interface RingConfig {
  enabled: boolean
  innerRadius: number
  outerRadius: number
  tilt: number
  colorInner: string
  colorOuter: string
  opacity: number
  bandCount: number
}

export interface PlanetConfig {
  id: string
  name: string
  createdAt: number
  updatedAt: number

  mode: PlanetMode

  // Geometry
  size: number
  rotationSpeed: AnimatableValue

  // Rocky mode — terrain
  terrain: {
    displacement: AnimatableValue
    noiseFrequency: number
    noiseOctaves: number
    seed: number
  }

  // Rocky mode — biome
  biome: {
    oceanLevel: AnimatableValue
    vegetation: AnimatableValue
    frost: AnimatableValue
  }

  // Rocky mode — colors
  colors: {
    primary: string
    secondary: string
    ocean: string
    vegetation: string
    snow: string
    frost: string
  }

  // Rocky mode — clouds
  clouds: {
    enabled: boolean
    density: AnimatableValue
    speed: number
    color: string
  }

  // Star/fire mode
  fire: {
    intensity: AnimatableValue
    colorCore: string
    colorMid: string
    colorEdge: string
    coronaGlow: number
  }

  // Shared — atmosphere
  atmosphere: {
    enabled: boolean
    color: string
    intensity: AnimatableValue
    exponent: number
  }

  // Shared — rings
  rings: RingConfig

  // Shared — moons (max 3)
  moons: MoonConfig[]

  // Light
  lightPosition: [number, number, number]
}

export interface SavedPlanetEntry {
  id: string
  name: string
  updatedAt: number
}
