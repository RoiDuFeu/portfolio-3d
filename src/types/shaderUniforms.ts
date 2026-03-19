export interface SunSurfaceUniforms {
  fresnelPower: number
  fresnelInfluence: number
  tint: number
  base: number
  brightnessOffset: number
  brightness: number
}

export interface SunPerlinUniforms {
  spatialFrequency: number
  temporalFrequency: number
  contrast: number
  flatten: number
}

export interface SunGlowUniforms {
  radius: number
  tint: number
  brightness: number
  falloffColor: number
}

export interface SunRaysUniforms {
  width: number
  length: number
  opacity: number
  noiseFrequency: number
  noiseAmplitude: number
  alphaBlended: number
  hueSpread: number
  hue: number
}

export interface SunFlaresUniforms {
  width: number
  amp: number
  opacity: number
  alphaBlended: number
  hueSpread: number
  hue: number
  noiseFrequency: number
  noiseAmplitude: number
}

export interface SunLightsUniforms {
  keyColor: string
  keyIntensity: number
  keyDistance: number
  fillColor: string
  fillIntensity: number
  fillDistance: number
}

export interface CubemapSunUniforms {
  surface: SunSurfaceUniforms
  perlin: SunPerlinUniforms
  glow: SunGlowUniforms
  rays: SunRaysUniforms
  flares: SunFlaresUniforms
  lights: SunLightsUniforms
}
