export type PlanetType = 'terrain' | 'metallic' | 'audio' | 'default'

export type CameraMode = 'journey' | 'orbit' | 'detail' | 'flight' | 'planet-visit' | 'guidedOrbit'

export type SolarPlanetName =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export interface SolarBody {
  name: SolarPlanetName
  displayName: string
  realRadiusRatio: number   // relative to Earth = 1
  realAU: number            // orbital distance in AU
  realPeriodYears: number   // orbital period in Earth years
  orbitOffset: number       // radians, initial angle
  projectId?: string        // links to a Project (undefined = decorative)
  type: PlanetType
  color: string
  atmosphereColor?: string
  hasRings?: boolean
  axialTilt?: number        // degrees
}

export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  position: [number, number, number]
  color: string
  type: PlanetType
  timeline?: {
    start: string
    end?: string
    milestones: string[]
  }
  techStack?: string[]
  links?: {
    live?: string
    github?: string
  }
  audioPath?: string
}
