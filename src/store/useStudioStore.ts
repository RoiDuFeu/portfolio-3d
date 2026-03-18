import { create } from 'zustand'
import type { PlanetConfig, SavedPlanetEntry } from '../types/studio'
import { createPreset } from '../utils/planetPresets'
import { savePlanet, loadPlanet, listPlanets, deletePlanet as removePlanet } from '../utils/persistence'

interface StudioState {
  config: PlanetConfig
  evolution: number
  isPlaying: boolean
  playbackSpeed: number
  savedPlanets: SavedPlanetEntry[]

  // Config actions
  updateConfig: (partial: Partial<PlanetConfig>) => void
  setConfig: (config: PlanetConfig) => void

  // Timeline actions
  setEvolution: (t: number) => void
  togglePlayback: () => void
  setPlaybackSpeed: (speed: number) => void

  // Persistence actions
  save: () => void
  load: (id: string) => void
  deletePlanet: (id: string) => void
  refreshSavedList: () => void

  // Preset actions
  loadPreset: (key: string) => void
  reset: () => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
  config: createPreset('earth'),
  evolution: 0,
  isPlaying: false,
  playbackSpeed: 1,
  savedPlanets: listPlanets(),

  updateConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial, updatedAt: Date.now() },
    })),

  setConfig: (config) => set({ config }),

  setEvolution: (t) => set({ evolution: t }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  save: () => {
    const { config } = get()
    savePlanet(config)
    set({ savedPlanets: listPlanets() })
  },

  load: (id) => {
    const config = loadPlanet(id)
    if (config) {
      set({ config, evolution: 0, isPlaying: false })
    }
  },

  deletePlanet: (id) => {
    removePlanet(id)
    set({ savedPlanets: listPlanets() })
  },

  refreshSavedList: () => set({ savedPlanets: listPlanets() }),

  loadPreset: (key) =>
    set({
      config: createPreset(key),
      evolution: 0,
      isPlaying: false,
    }),

  reset: () =>
    set({
      config: createPreset('blank'),
      evolution: 0,
      isPlaying: false,
    }),
}))
