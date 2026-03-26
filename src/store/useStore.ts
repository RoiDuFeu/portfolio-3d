import { create } from 'zustand'
import * as THREE from 'three'
import type { Project, CameraMode } from '../types'
import type { PerformanceMode } from '../utils/performanceConfig'

type AppPhase = 'loading' | 'intro' | 'hyperspace' | 'arriving' | 'main'

interface StoreState {
  // App phase
  appPhase: AppPhase
  setAppPhase: (phase: AppPhase) => void
  entryAnimDone: boolean
  setEntryAnimDone: (done: boolean) => void

  // Arrival choice (C-3PO / R2-D2 cards after wormhole)
  showArrivalChoice: boolean
  setShowArrivalChoice: (show: boolean) => void
  tourMode: 'none' | 'guided' | 'free'
  setTourMode: (mode: 'none' | 'guided' | 'free') => void

  // Planet proximity & choice cards (during free flight)
  nearPlanet: string | null
  setNearPlanet: (name: string | null) => void
  showPlanetChoice: boolean
  setShowPlanetChoice: (show: boolean) => void

  // Guided orbit mode (Falcon orbits planet, scroll-driven)
  guidedOrbitActive: boolean
  setGuidedOrbitActive: (active: boolean) => void
  guidedOrbitPlanet: string | null
  setGuidedOrbitPlanet: (name: string | null) => void
  guidedOrbitProgress: number
  setGuidedOrbitProgress: (progress: number) => void

  // Star Wars wipe transition
  showStarWarsTransition: boolean
  setShowStarWarsTransition: (show: boolean) => void

  // Falcon world position (mutated in-place, read via getState() in useFrame)
  falconWorldPosition: THREE.Vector3

  // Hyperspace loading
  hyperspaceReady: boolean
  setHyperspaceReady: (ready: boolean) => void
  hyperspaceLoadProgress: number
  setHyperspaceLoadProgress: (progress: number) => void

  // Flight mode (falconOrientation is transient, mutated in-place like falconWorldPosition)
  falconOrientation: THREE.Quaternion
  isFlying: boolean
  setIsFlying: (flying: boolean) => void
  isBoosting: boolean
  setIsBoosting: (boosting: boolean) => void
  flightSpeed: number
  setFlightSpeed: (speed: number) => void

  // Debug
  debugFreeCamera: boolean
  setDebugFreeCamera: (free: boolean) => void
  debugTimeline: boolean
  setDebugTimeline: (show: boolean) => void
  debugPaused: boolean
  setDebugPaused: (paused: boolean) => void
  debugSpeedMultiplier: number
  setDebugSpeedMultiplier: (speed: number) => void
  debugManualT: number | null  // null = auto, number = manual scrub override
  setDebugManualT: (t: number | null) => void
  resetScene: () => void

  // Performance
  performanceMode: PerformanceMode
  setPerformanceMode: (mode: PerformanceMode) => void
  sceneKey: number
  bumpSceneKey: () => void
  isReloading: boolean
  setIsReloading: (loading: boolean) => void

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
  // App phase — starts in 'loading' until all assets are ready
  appPhase: 'loading',
  setAppPhase: (phase) => set({ appPhase: phase }),
  entryAnimDone: false,
  setEntryAnimDone: (done) => set({ entryAnimDone: done }),

  // Arrival choice
  showArrivalChoice: false,
  setShowArrivalChoice: (show) => set({ showArrivalChoice: show }),
  tourMode: 'none',
  setTourMode: (mode) => set({ tourMode: mode }),

  // Planet proximity
  nearPlanet: null,
  setNearPlanet: (name) => set({ nearPlanet: name }),
  showPlanetChoice: false,
  setShowPlanetChoice: (show) => set({ showPlanetChoice: show }),

  // Guided orbit
  guidedOrbitActive: false,
  setGuidedOrbitActive: (active) => set({ guidedOrbitActive: active }),
  guidedOrbitPlanet: null,
  setGuidedOrbitPlanet: (name) => set({ guidedOrbitPlanet: name }),
  guidedOrbitProgress: 0,
  setGuidedOrbitProgress: (progress) => set({ guidedOrbitProgress: progress }),

  // Star Wars transition
  showStarWarsTransition: false,
  setShowStarWarsTransition: (show) => set({ showStarWarsTransition: show }),

  // Falcon world position (transient — mutated in-place by UnifiedFalcon)
  falconWorldPosition: new THREE.Vector3(0, 0, -4),

  // Hyperspace loading
  hyperspaceReady: false,
  setHyperspaceReady: (ready) => set({ hyperspaceReady: ready }),
  hyperspaceLoadProgress: 0,
  setHyperspaceLoadProgress: (progress) => set({ hyperspaceLoadProgress: progress }),

  // Flight mode
  falconOrientation: new THREE.Quaternion(),
  isFlying: false,
  setIsFlying: (flying) => set({ isFlying: flying }),
  isBoosting: false,
  setIsBoosting: (boosting) => set({ isBoosting: boosting }),
  flightSpeed: 0,
  setFlightSpeed: (speed) => set({ flightSpeed: speed }),

  // Debug
  debugFreeCamera: false,
  setDebugFreeCamera: (free) => set({ debugFreeCamera: free }),
  debugTimeline: false,
  setDebugTimeline: (show) => set({ debugTimeline: show }),
  debugPaused: false,
  setDebugPaused: (paused) => set({ debugPaused: paused }),
  debugSpeedMultiplier: 1,
  setDebugSpeedMultiplier: (speed) => set({ debugSpeedMultiplier: speed }),
  debugManualT: null,
  setDebugManualT: (t) => set({ debugManualT: t }),
  resetScene: () => set((s) => ({
    appPhase: 'loading' as AppPhase,
    entryAnimDone: false,
    hyperspaceReady: false,
    hyperspaceLoadProgress: 0,
    debugFreeCamera: false,
    debugTimeline: false,
    debugPaused: false,
    debugSpeedMultiplier: 1,
    debugManualT: null,
    isFlying: false,
    isBoosting: false,
    flightSpeed: 0,
    cameraMode: 'orbit' as CameraMode,
    selectedProject: null,
    scrollProgress: 0,
    activeSection: 0,
    targetPlanet: null,
    showArrivalChoice: false,
    tourMode: 'none' as const,
    nearPlanet: null,
    showPlanetChoice: false,
    guidedOrbitActive: false,
    guidedOrbitPlanet: null,
    guidedOrbitProgress: 0,
    showStarWarsTransition: false,
    sceneKey: s.sceneKey + 1,
  })),

  // Performance
  performanceMode: 'balanced',
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  sceneKey: 0,
  bumpSceneKey: () => set((s) => ({ sceneKey: s.sceneKey + 1 })),
  isReloading: false,
  setIsReloading: (loading) => set({ isReloading: loading }),

  // Navigation
  scrollProgress: 0,
  activeSection: 0,
  cameraMode: 'orbit',
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
