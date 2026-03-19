import { create } from 'zustand'
import type {
  CubemapSunUniforms,
  SunSurfaceUniforms,
  SunPerlinUniforms,
  SunGlowUniforms,
  SunRaysUniforms,
  SunFlaresUniforms,
  SunLightsUniforms,
} from '../types/shaderUniforms'
import { DEFAULT_SUN_UNIFORMS } from '../utils/shaderDefaults'

interface ShaderState {
  uniforms: CubemapSunUniforms

  updateSurface: (partial: Partial<SunSurfaceUniforms>) => void
  updatePerlin: (partial: Partial<SunPerlinUniforms>) => void
  updateGlow: (partial: Partial<SunGlowUniforms>) => void
  updateRays: (partial: Partial<SunRaysUniforms>) => void
  updateFlares: (partial: Partial<SunFlaresUniforms>) => void
  updateLights: (partial: Partial<SunLightsUniforms>) => void
  resetToDefaults: () => void
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const useShaderStore = create<ShaderState>((set) => ({
  uniforms: deepClone(DEFAULT_SUN_UNIFORMS),

  updateSurface: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, surface: { ...s.uniforms.surface, ...partial } },
    })),

  updatePerlin: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, perlin: { ...s.uniforms.perlin, ...partial } },
    })),

  updateGlow: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, glow: { ...s.uniforms.glow, ...partial } },
    })),

  updateRays: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, rays: { ...s.uniforms.rays, ...partial } },
    })),

  updateFlares: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, flares: { ...s.uniforms.flares, ...partial } },
    })),

  updateLights: (partial) =>
    set((s) => ({
      uniforms: { ...s.uniforms, lights: { ...s.uniforms.lights, ...partial } },
    })),

  resetToDefaults: () => set({ uniforms: deepClone(DEFAULT_SUN_UNIFORMS) }),
}))
