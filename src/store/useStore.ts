import { create } from 'zustand'
import type { Project, CameraMode } from '../types'

interface StoreState {
  // Navigation
  scrollProgress: number
  activeSection: number
  cameraMode: CameraMode
  targetPlanet: string | null

  // UI
  selectedProject: Project | null
  isLoading: boolean
  loadProgress: number
  showHints: boolean

  // Audio
  isPlaying: boolean
  beat: number
  energy: number
  frequencies: Float32Array

  // Navigation actions
  setScrollProgress: (progress: number) => void
  setActiveSection: (section: number) => void
  setCameraMode: (mode: CameraMode) => void
  setTargetPlanet: (id: string | null) => void

  // UI actions
  selectProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
  setLoadProgress: (progress: number) => void
  setShowHints: (show: boolean) => void

  // Audio actions
  setIsPlaying: (playing: boolean) => void
  setAudioData: (beat: number, energy: number) => void
  setFrequencies: (data: Uint8Array) => void
}

export const useStore = create<StoreState>((set) => ({
  // Navigation
  scrollProgress: 0,
  activeSection: 0,
  cameraMode: 'journey',
  targetPlanet: null,

  // UI
  selectedProject: null,
  isLoading: true,
  loadProgress: 0,
  showHints: true,

  // Audio
  isPlaying: false,
  beat: 0,
  energy: 0,
  frequencies: new Float32Array(128),

  // Navigation actions
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setActiveSection: (section) => set({ activeSection: section }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setTargetPlanet: (id) => set({ targetPlanet: id }),

  // UI actions
  selectProject: (project) => set({ selectedProject: project }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadProgress: (progress) => set({ loadProgress: progress }),
  setShowHints: (show) => set({ showHints: show }),

  // Audio actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAudioData: (beat, energy) => set({ beat, energy }),
  // Mutate in place to avoid re-renders — read via getState() in useFrame
  setFrequencies: (data) => {
    const { frequencies } = useStore.getState()
    for (let i = 0; i < Math.min(data.length, frequencies.length); i++) {
      frequencies[i] = data[i] / 255
    }
  },
}))
