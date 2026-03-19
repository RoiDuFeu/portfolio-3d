export type PerformanceMode = 'potato' | 'balanced' | 'ultra'

export interface PerformanceConfig {
  label: string
  dpr: number | [number, number]
  antialias: boolean
  starCount: number
  bloomIntensity: number
  bloomThreshold: number
  bloomRadius: number
  postProcessing: boolean
  multisampling: number
}

export const PERFORMANCE_CONFIGS: Record<PerformanceMode, PerformanceConfig> = {
  potato: {
    label: 'LOW',
    dpr: 1,
    antialias: false,
    starCount: 800,
    bloomIntensity: 0,
    bloomThreshold: 1,
    bloomRadius: 0.5,
    postProcessing: false,
    multisampling: 0,
  },
  balanced: {
    label: 'BALANCED',
    dpr: [1, 1.5],
    antialias: false,
    starCount: 2000,
    bloomIntensity: 1.8,
    bloomThreshold: 0.58,
    bloomRadius: 0.65,
    postProcessing: true,
    multisampling: 0,
  },
  ultra: {
    label: 'ULTRA',
    dpr: [1, 2],
    antialias: true,
    starCount: 3200,
    bloomIntensity: 2.8,
    bloomThreshold: 0.55,
    bloomRadius: 0.7,
    postProcessing: true,
    multisampling: 0,
  },
}
