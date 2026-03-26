import { create } from 'zustand'
import * as THREE from 'three'
import type { Project, CameraMode } from '../types'
import type { PerformanceMode } from '../utils/performanceConfig'
import type { FlightInput } from '../systems/flightPhysics'

type AppPhase = 'loading' | 'intro' | 'hyperspace' | 'arriving' | 'main'

interface StoreState {
  // Keyboard layout (for HUD display)
  keyboardLayout: 'azerty' | 'qwerty'
  setKeyboardLayout: (layout: 'azerty' | 'qwerty') => void

  // Flight input ref (transient — set by UnifiedFalcon, read by MobileFlightControls)
  flightInputRef: React.MutableRefObject<FlightInput> | null

  // Fire shake (transient — mutated in-place by BlasterBolts, read by camera rig)
  fireShakeIntensity: number

  // Thrust input (transient — mutated by UnifiedFalcon, read by camera for trailing)
  thrustInput: number

  // Fire recoil flag (transient — set by BlasterBolts, consumed by UnifiedFalcon)
  fireRecoilTrigger: number   // increments on each shot; Falcon watches for changes

  // Flight telemetry (transient — mutated by UnifiedFalcon, read by debug HUD)
  flightTelemetry: {
    pitch: number       // angular velocity x (rad/s)
    yaw: number         // angular velocity y (rad/s)
    roll: number        // angular velocity z (rad/s)
    bankAngle: number   // accumulated bank (rad)
    speed: number       // units/s
    euler: { x: number; y: number; z: number }  // orientation as euler (degrees)
    position: { x: number; y: number; z: number }  // world position
    orientationQ: { x: number; y: number; z: number; w: number }  // physics quaternion
    visualQ: { x: number; y: number; z: number; w: number }       // final visual quaternion (physics+bank+secondary)
  }

  // App phase
  appPhase: AppPhase
  setAppPhase: (phase: AppPhase) => void
  entryAnimDone: boolean
  setEntryAnimDone: (done: boolean) => void

  // Falcon world position (mutated in-place, read via getState() in useFrame)
  falconWorldPosition: THREE.Vector3

  // Hyperspace loading
  hyperspaceReady: boolean
  setHyperspaceReady: (ready: boolean) => void
  hyperspaceLoadProgress: number
  setHyperspaceLoadProgress: (progress: number) => void

  // Copilot choice — drives cinematic entry after card selection
  pilotChoice: 'r2d2' | 'c3po' | null
  setPilotChoice: (choice: 'r2d2' | 'c3po' | null) => void

  // Flight mode (falconOrientation is transient, mutated in-place like falconWorldPosition)
  falconOrientation: THREE.Quaternion
  isFlying: boolean
  setIsFlying: (flying: boolean) => void
  isBoosting: boolean
  setIsBoosting: (boosting: boolean) => void
  isLooping: boolean
  isBarrelRolling: boolean
  flightSpeed: number
  setFlightSpeed: (speed: number) => void

  // Pause
  isPaused: boolean
  setIsPaused: (paused: boolean) => void

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

  // Planet visit (proximity card + cinematic)
  approachCardDismissed: Set<string>
  dismissApproachCard: (name: string) => void
  planetVisitActive: boolean
  visitingPlanetName: string | null
  setPlanetVisitActive: (active: boolean) => void
  setVisitingPlanetName: (name: string | null) => void
  preVisitFalconPos: THREE.Vector3 | null
  setPreVisitFalconPos: (pos: THREE.Vector3 | null) => void

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
  // Keyboard layout
  keyboardLayout: 'qwerty',
  setKeyboardLayout: (layout) => set({ keyboardLayout: layout }),

  // Flight input ref (transient — set by UnifiedFalcon)
  flightInputRef: null,

  // Fire shake (transient — mutated via getState())
  fireShakeIntensity: 0,

  // Thrust input (transient — mutated via getState())
  thrustInput: 0,

  // Fire recoil trigger (transient — mutated via getState())
  fireRecoilTrigger: 0,

  // Flight telemetry (transient — mutated via getState())
  flightTelemetry: {
    pitch: 0, yaw: 0, roll: 0, bankAngle: 0, speed: 0,
    euler: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    orientationQ: { x: 0, y: 0, z: 0, w: 1 },
    visualQ: { x: 0, y: 0, z: 0, w: 1 },
  },

  // App phase — starts in 'loading' until all assets are ready
  appPhase: 'loading',
  setAppPhase: (phase) => set({ appPhase: phase }),
  entryAnimDone: false,
  setEntryAnimDone: (done) => set({ entryAnimDone: done }),

  // Falcon world position (transient — mutated in-place by UnifiedFalcon)
  falconWorldPosition: new THREE.Vector3(0, 0, -4),

  // Hyperspace loading
  hyperspaceReady: false,
  setHyperspaceReady: (ready) => set({ hyperspaceReady: ready }),
  hyperspaceLoadProgress: 0,
  setHyperspaceLoadProgress: (progress) => set({ hyperspaceLoadProgress: progress }),

  // Copilot choice
  pilotChoice: null,
  setPilotChoice: (choice) => set({ pilotChoice: choice }),

  // Flight mode
  falconOrientation: new THREE.Quaternion(),
  isFlying: false,
  setIsFlying: (flying) => set({ isFlying: flying }),
  isBoosting: false,
  setIsBoosting: (boosting) => set({ isBoosting: boosting }),
  isLooping: false,
  isBarrelRolling: false,
  flightSpeed: 0,
  setFlightSpeed: (speed) => set({ flightSpeed: speed }),

  // Pause
  isPaused: false,
  setIsPaused: (paused) => set({ isPaused: paused }),

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
    pilotChoice: null,
    isFlying: false,
    isBoosting: false,
    flightSpeed: 0,
    cameraMode: 'orbit' as CameraMode,
    selectedProject: null,
    scrollProgress: 0,
    activeSection: 0,
    targetPlanet: null,
    approachCardDismissed: new Set<string>(),
    planetVisitActive: false,
    visitingPlanetName: null,
    preVisitFalconPos: null,
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

  // Planet visit
  approachCardDismissed: new Set<string>(),
  dismissApproachCard: (name) => set((s) => {
    const next = new Set(s.approachCardDismissed)
    next.add(name)
    return { approachCardDismissed: next }
  }),
  planetVisitActive: false,
  visitingPlanetName: null,
  setPlanetVisitActive: (active) => set({ planetVisitActive: active }),
  setVisitingPlanetName: (name) => set({ visitingPlanetName: name }),
  preVisitFalconPos: null,
  setPreVisitFalconPos: (pos) => set({ preVisitFalconPos: pos }),

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
