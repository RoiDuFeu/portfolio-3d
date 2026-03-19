import type { CubemapSunUniforms } from '../types/shaderUniforms'

export const DEFAULT_SUN_UNIFORMS: CubemapSunUniforms = {
  surface: {
    fresnelPower: 1.0,
    fresnelInfluence: 0.8,
    tint: 0.2,
    base: 4.0,
    brightnessOffset: 1.0,
    brightness: 0.8,
  },
  perlin: {
    spatialFrequency: 6.0,
    temporalFrequency: 0.1,
    contrast: 0.25,
    flatten: 0.72,
  },
  glow: {
    radius: 3.0,
    tint: 0.25,
    brightness: 0.12,
    falloffColor: 0.3,
  },
  rays: {
    width: 0.08,
    length: 0.7,
    opacity: 0.08,
    noiseFrequency: 8.0,
    noiseAmplitude: 0.5,
    alphaBlended: 0.4,
    hueSpread: 0.2,
    hue: 0.2,
  },
  flares: {
    width: 0.015,
    amp: 0.6,
    opacity: 0.5,
    alphaBlended: 0.7,
    hueSpread: 0.16,
    hue: 0.0,
    noiseFrequency: 4.0,
    noiseAmplitude: 0.25,
  },
  lights: {
    keyColor: '#FFA54F',
    keyIntensity: 7.0,
    keyDistance: 600,
    fillColor: '#FF8030',
    fillIntensity: 4.0,
    fillDistance: 350,
  },
}

export type UniformRange = {
  min: number
  max: number
  step: number
  label: string
}

export const SUN_UNIFORM_RANGES: Record<string, Record<string, UniformRange>> = {
  surface: {
    fresnelPower: { min: 0.1, max: 5.0, step: 0.1, label: 'Fresnel Power' },
    fresnelInfluence: { min: 0, max: 1.0, step: 0.01, label: 'Fresnel Influence' },
    tint: { min: 0, max: 1.0, step: 0.01, label: 'Tint' },
    base: { min: 0.5, max: 10.0, step: 0.1, label: 'Base Brightness' },
    brightnessOffset: { min: 0, max: 3.0, step: 0.05, label: 'Brightness Offset' },
    brightness: { min: 0, max: 2.0, step: 0.01, label: 'Brightness' },
  },
  perlin: {
    spatialFrequency: { min: 1.0, max: 20.0, step: 0.5, label: 'Spatial Frequency' },
    temporalFrequency: { min: 0.01, max: 1.0, step: 0.01, label: 'Temporal Frequency' },
    contrast: { min: 0, max: 1.0, step: 0.01, label: 'Contrast' },
    flatten: { min: 0, max: 1.0, step: 0.01, label: 'Flatten' },
  },
  glow: {
    radius: { min: 0.5, max: 10.0, step: 0.1, label: 'Radius' },
    tint: { min: 0, max: 1.0, step: 0.01, label: 'Tint' },
    brightness: { min: 0, max: 1.0, step: 0.005, label: 'Brightness' },
    falloffColor: { min: 0, max: 1.0, step: 0.01, label: 'Falloff Color' },
  },
  rays: {
    width: { min: 0.01, max: 0.5, step: 0.005, label: 'Width' },
    length: { min: 0.1, max: 3.0, step: 0.05, label: 'Length' },
    opacity: { min: 0, max: 0.5, step: 0.005, label: 'Opacity' },
    noiseFrequency: { min: 1.0, max: 20.0, step: 0.5, label: 'Noise Frequency' },
    noiseAmplitude: { min: 0, max: 2.0, step: 0.05, label: 'Noise Amplitude' },
    alphaBlended: { min: 0, max: 1.0, step: 0.01, label: 'Alpha Blended' },
    hueSpread: { min: 0, max: 1.0, step: 0.01, label: 'Hue Spread' },
    hue: { min: 0, max: 1.0, step: 0.01, label: 'Hue' },
  },
  flares: {
    width: { min: 0.001, max: 0.1, step: 0.001, label: 'Width' },
    amp: { min: 0, max: 2.0, step: 0.05, label: 'Amplitude' },
    opacity: { min: 0, max: 1.0, step: 0.01, label: 'Opacity' },
    alphaBlended: { min: 0, max: 1.0, step: 0.01, label: 'Alpha Blended' },
    hueSpread: { min: 0, max: 1.0, step: 0.01, label: 'Hue Spread' },
    hue: { min: 0, max: 1.0, step: 0.01, label: 'Hue' },
    noiseFrequency: { min: 1.0, max: 20.0, step: 0.5, label: 'Noise Frequency' },
    noiseAmplitude: { min: 0, max: 2.0, step: 0.05, label: 'Noise Amplitude' },
  },
  lights: {
    keyIntensity: { min: 0, max: 20.0, step: 0.5, label: 'Key Intensity' },
    keyDistance: { min: 50, max: 1000, step: 10, label: 'Key Distance' },
    fillIntensity: { min: 0, max: 20.0, step: 0.5, label: 'Fill Intensity' },
    fillDistance: { min: 50, max: 1000, step: 10, label: 'Fill Distance' },
  },
}
