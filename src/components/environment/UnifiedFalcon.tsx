import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import {
  wormholeSpline,
  FALCON_START_T,
  ENTRY_T,
  CRUISE_SPEED,
  WAIT_T,
  falconProgress,
} from '../../utils/wormholeSpline'
import { useFlightControls } from '../../hooks/useFlightControls'
import { createFlightState, stepFlightPhysics, type FlightState } from '../../systems/flightPhysics'

/**
 * Single Millennium Falcon for all scene phases:
 *   intro      → mouse-reactive idle at [0, 0, -4]
 *   hyperspace → flies FORWARD through wormhole spline (no looping)
 *   arriving   → parked at tunnel exit
 *   main       → static / flight mode
 */

// Solar system center in world space
const SOLAR_SYSTEM_Z = -2000

// Key positions
const INTRO_POS = new THREE.Vector3(0, 0, -4)
const SOLAR_SYSTEM_RADIUS = 130
const TUNNEL_EXIT = new THREE.Vector3(0, 0, SOLAR_SYSTEM_Z + SOLAR_SYSTEM_RADIUS) // [0, 0, -1870]
const GALAXY_POS = TUNNEL_EXIT

// Exit flight: from current position to spline end (t = 1.0)
const EXIT_DURATION = 2000 // ms

// Subtle banking when turning in the wormhole
const BANK_STRENGTH = 8 // subtle roll multiplier
const BANK_SMOOTHING = 0.04 // slow smooth for gentle feel

// Reusable vectors / objects
const _away = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _tempMatrix = new THREE.Matrix4()
const _splineQuat = new THREE.Quaternion()
const _upVec = new THREE.Vector3(0, 1, 0)
const _tangent = new THREE.Vector3()
const _tangentAhead = new THREE.Vector3()
const _curvature = new THREE.Vector3()
const _right = new THREE.Vector3()
const _fwd = new THREE.Vector3(0, 0, 1) // model-space forward for rotateOnAxis

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function UnifiedFalcon() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/millennium-falcon.glb')
  const { camera } = useThree()
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Mouse tracking
  const targetX = useRef(0)
  const targetY = useRef(0)
  const smoothX = useRef(0)
  const smoothY = useRef(0)

  // Hyperspace state — virtual time prevents GPU stalls from skipping animation
  const prevPhase = useRef<string>('loading')
  const arrivedTriggered = useRef(false)
  const lastHyperFrame = useRef(0)
  const virtualHyperElapsed = useRef(0)

  // Gravitational entry: slow attraction → exponential suction → stabilize
  const ENTRY_DURATION = 4000

  // Exit flight state
  const exitStart = useRef(0)
  const exitFromT = useRef(ENTRY_T)

  // Smooth banking
  const smoothBankAngle = useRef(0)

  // Flight mode
  const isFlying = useStore((s) => s.isFlying)
  const flightStateRef = useRef<FlightState | null>(null)
  const flightInput = useFlightControls(isFlying)
  const engineLight1 = useRef<THREE.PointLight>(null)
  const engineLight2 = useRef<THREE.PointLight>(null)
  const engineLight3 = useRef<THREE.PointLight>(null)

  // Computed spline position (shared between priority -3 and 0 useFrames)
  const computedT = useRef(FALCON_START_T)

  // Hyperspace rim/forward lighting
  const rimLight = useRef<THREE.PointLight>(null)
  const fillLight = useRef<THREE.PointLight>(null)
  const debugFrame = useRef(0)

  // Setup materials
  useEffect(() => {
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.renderOrder = 10
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 2.5
          mat.depthWrite = true
          mat.needsUpdate = true
        }
      })
    })
  }, [clonedScene])

  // Desktop mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetX.current = (e.clientX / window.innerWidth - 0.5) * 2
      targetY.current = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Mobile touch tracking
  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      targetX.current = (touch.clientX / window.innerWidth - 0.5) * 2
      targetY.current = -(touch.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => window.removeEventListener('touchmove', onTouch)
  }, [])

  // ── Priority -3: compute falconProgress.t and entryIntensity BEFORE ──
  // Wormhole reads them at -2 and WormholePortal renders at -1.
  // This eliminates the one-frame lag where ei=0 on the first hyperspace frame.
  useFrame(() => {
    const { appPhase, hyperspaceReady } = useStore.getState()

    // Detect hyperspace start
    if (appPhase === 'hyperspace' && prevPhase.current === 'intro') {
      lastHyperFrame.current = performance.now()
      virtualHyperElapsed.current = 0
      arrivedTriggered.current = false
      exitStart.current = 0
      computedT.current = FALCON_START_T
      falconProgress.t = FALCON_START_T
      falconProgress.entryIntensity = 0.15
      smoothBankAngle.current = 0

      if (import.meta.env.DEV) {
        const startPos = wormholeSpline.getPointAt(FALCON_START_T)
        const entryPos = wormholeSpline.getPointAt(ENTRY_T)
        console.log(`[FALCON] Hyperspace START — t=${FALCON_START_T.toFixed(4)} pos=[${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)}, ${startPos.z.toFixed(1)}]`)
        console.log(`[FALCON] Entry target    — t=${ENTRY_T.toFixed(4)} pos=[${entryPos.x.toFixed(1)}, ${entryPos.y.toFixed(1)}, ${entryPos.z.toFixed(1)}]`)
      }
    }
    prevPhase.current = appPhase

    if (appPhase !== 'hyperspace') return

    const { debugPaused, debugSpeedMultiplier, debugManualT } = useStore.getState()

    // Manual scrub override — skip all time-based logic
    if (debugManualT !== null) {
      computedT.current = debugManualT
      falconProgress.t = debugManualT
      // Approximate entryIntensity based on position
      if (debugManualT < ENTRY_T) {
        const phase = (debugManualT - FALCON_START_T) / (ENTRY_T - FALCON_START_T)
        falconProgress.entryIntensity = phase < 0.6
          ? 0.15 + Math.pow(Math.max(phase, 0) / 0.6, 1.2) * 0.85
          : 1.0 - (phase - 0.6) / 0.4 * 0.4
      } else {
        const settleRatio = Math.min((debugManualT - ENTRY_T) / 0.1, 1)
        falconProgress.entryIntensity = THREE.MathUtils.lerp(0.6, 0.15, settleRatio)
      }
      return
    }

    // Virtual time — respects pause and speed multiplier
    const now = performance.now()
    const rawDelta = now - lastHyperFrame.current
    lastHyperFrame.current = now
    const scaledDelta = debugPaused ? 0 : Math.min(rawDelta, 33) * debugSpeedMultiplier
    virtualHyperElapsed.current += scaledDelta
    const elapsed = virtualHyperElapsed.current

    // Compute spline position
    let currentT: number
    if (exitStart.current === 0) {
      if (elapsed < ENTRY_DURATION) {
        const phase = elapsed / ENTRY_DURATION
        const pull = Math.pow(phase, 2.0)
        currentT = THREE.MathUtils.lerp(FALCON_START_T, ENTRY_T, pull)
        falconProgress.entryIntensity = phase < 0.6
          ? 0.15 + Math.pow(phase / 0.6, 1.2) * 0.85
          : 1.0 - (phase - 0.6) / 0.4 * 0.4
      } else {
        const cruiseTime = (elapsed - ENTRY_DURATION) * 0.001
        currentT = ENTRY_T + cruiseTime * CRUISE_SPEED
        const settleTime = Math.min((elapsed - ENTRY_DURATION) * 0.0008, 1)
        falconProgress.entryIntensity = THREE.MathUtils.lerp(0.6, 0.15, settleTime)
        if (!hyperspaceReady) currentT = Math.min(currentT, WAIT_T)
        if (hyperspaceReady && currentT >= ENTRY_T + 0.1) {
          exitStart.current = virtualHyperElapsed.current
          exitFromT.current = Math.min(currentT, 0.95)
        }
      }
    } else {
      const exitElapsed = virtualHyperElapsed.current - exitStart.current
      const exitProgress = Math.min(exitElapsed / EXIT_DURATION, 1)
      const eased = easeOutCubic(exitProgress)
      currentT = THREE.MathUtils.lerp(exitFromT.current, 1.0, eased)
      falconProgress.entryIntensity = 0.1
    }

    computedT.current = currentT
    falconProgress.t = currentT
  }, -3)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const { appPhase, setAppPhase, falconWorldPosition } = useStore.getState()
    const t = state.clock.elapsedTime

    // ── LOADING / INTRO: mouse-reactive idle ────────────────────────────────
    if (appPhase === 'loading' || appPhase === 'intro') {
      smoothX.current += (targetX.current - smoothX.current) * 0.03
      smoothY.current += (targetY.current - smoothY.current) * 0.03

      const mx = smoothX.current
      const my = smoothY.current

      const roll = mx * Math.abs(mx) * 0.56
      const yaw = mx * 0.18
      const pitch = -my * 0.13 + mx * mx * mx * 0.04

      const idleRoll = Math.sin(t * 0.22) * 0.03
      const idlePitch = Math.sin(t * 0.17) * 0.018

      groupRef.current.rotation.set(
        idlePitch + pitch,
        Math.PI + yaw,
        idleRoll + roll,
      )

      groupRef.current.position.x = mx * Math.abs(mx) * 0.25
      groupRef.current.position.y = Math.sin(t * 0.42) * 0.18 - my * 0.08
      groupRef.current.position.z = -4
      groupRef.current.scale.setScalar(0.5)

      falconWorldPosition.copy(groupRef.current.position)
    }

    // ── HYPERSPACE: follow wormhole spline ───────────────────────────────
    // Progress (t, entryIntensity) is computed in the priority -3 useFrame above.
    // This useFrame handles positioning, orientation, lighting, and exit detection.
    if (appPhase === 'hyperspace') {
      const elapsed = virtualHyperElapsed.current
      const currentT = computedT.current

      // Detect exit completion (needs setAppPhase which is only in this useFrame)
      if (exitStart.current > 0) {
        const exitElapsed = virtualHyperElapsed.current - exitStart.current
        const exitProgress = Math.min(exitElapsed / EXIT_DURATION, 1)
        if (exitProgress >= 1 && !arrivedTriggered.current) {
          arrivedTriggered.current = true
          setAppPhase('arriving')
        }
      }

      // Position on spline
      const pos = wormholeSpline.getPointAt(currentT)
      groupRef.current.position.copy(pos)

      // ── Orient along spline + subtle banking ──
      _tangent.copy(wormholeSpline.getTangentAt(currentT))

      // Compute spline-local up (same method as camera) — prevents flipping
      _right.crossVectors(_tangent, _upVec)
      if (_right.lengthSq() < 0.001) _right.crossVectors(_tangent, new THREE.Vector3(1, 0, 0))
      _right.normalize()
      const pathUp = _curvature.crossVectors(_right, _tangent).normalize() // reuse _curvature as temp

      // Set the group's up to match the spline before lookAt
      groupRef.current.up.copy(pathUp)

      const lookT = Math.min(currentT + 0.005, 1)
      _lookTarget.copy(wormholeSpline.getPointAt(lookT))

      groupRef.current.lookAt(_lookTarget)
      groupRef.current.rotateY(Math.PI)

      // Curvature-based banking
      const aheadT = Math.min(currentT + 0.015, 1)
      _tangentAhead.copy(wormholeSpline.getTangentAt(aheadT))
      _curvature.subVectors(_tangentAhead, _tangent)
      _right.crossVectors(_tangent, _upVec)
      if (_right.lengthSq() < 0.001) _right.crossVectors(_tangent, new THREE.Vector3(1, 0, 0))
      _right.normalize()
      const lateralCurve = _curvature.dot(_right)
      const targetBank = -lateralCurve * BANK_STRENGTH
      smoothBankAngle.current += (targetBank - smoothBankAngle.current) * BANK_SMOOTHING

      // ── Entry instability: gravitational stress on the ship ──
      // Sine envelope: builds during capture, peaks mid-entry, dampens
      const entryPhase = Math.min(elapsed / ENTRY_DURATION, 1)
      const stressEnvelope = Math.sin(entryPhase * Math.PI) // 0→1→0
      const stressPitch = Math.sin(elapsed * 0.0037) * 0.05 * stressEnvelope
      const stressRoll = Math.sin(elapsed * 0.0029) * 0.07 * stressEnvelope

      groupRef.current.rotateX(stressPitch)
      groupRef.current.rotateZ(smoothBankAngle.current + stressRoll)

      // Scale
      const totalProgress = Math.min(elapsed / 3000, 1)
      const scale = THREE.MathUtils.lerp(0.5, 0.4, totalProgress)
      groupRef.current.scale.setScalar(scale)

      falconWorldPosition.copy(groupRef.current.position)

      // Debug: log every 60 frames (~1/sec)
      if (import.meta.env.DEV) {
        debugFrame.current++
        if (debugFrame.current % 60 === 1) {
          const p = groupRef.current.position
          console.log(`[FALCON] t=${currentT.toFixed(4)} pos=[${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}] elapsed=${elapsed.toFixed(0)}ms ei=${falconProgress.entryIntensity.toFixed(2)}`)
        }
      }

      // ── Lighting: ramps during entry, pulses during cruise ──
      const lightIntensity = elapsed < ENTRY_DURATION
        ? entryPhase * entryPhase // builds quadratically
        : 1.0
      const hyperPulse = 0.85 + 0.15 * Math.sin(elapsed * 0.003)
      const rimI = lightIntensity * hyperPulse

      if (rimLight.current) rimLight.current.intensity = 50 * rimI
      if (fillLight.current) fillLight.current.intensity = 35 * rimI
      if (engineLight1.current) engineLight1.current.intensity = (20 + 20 * lightIntensity) * hyperPulse
      if (engineLight2.current) engineLight2.current.intensity = (20 + 20 * lightIntensity) * hyperPulse
      if (engineLight3.current) engineLight3.current.intensity = (12 + 16 * lightIntensity) * hyperPulse

      // ── Material: reduce dark env reflections so the ship stays visible ──
      clonedScene.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial
          if (mat?.isMeshStandardMaterial) {
            mat.envMapIntensity = 0.5
          }
        })
      })
    }

    // Turn off hyperspace lights and restore materials when not in hyperspace
    if (appPhase !== 'hyperspace') {
      if (rimLight.current) rimLight.current.intensity = 0
      if (fillLight.current) fillLight.current.intensity = 0
      falconProgress.entryIntensity = 0

      // Restore normal material settings
      clonedScene.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial
          if (mat?.isMeshStandardMaterial) {
            mat.envMapIntensity = 2.5
          }
        })
      })
    }

    // ── ARRIVING + MAIN (parked) ────────────────────────────────────────────
    if (appPhase === 'arriving' || (appPhase === 'main' && !isFlying)) {
      groupRef.current.position.copy(GALAXY_POS)
      groupRef.current.scale.setScalar(0.4)

      _away.copy(groupRef.current.position).multiplyScalar(2).sub(camera.position)
      groupRef.current.lookAt(_away)

      falconWorldPosition.copy(groupRef.current.position)

      // Reset flight state when not flying
      flightStateRef.current = null
    }

    // ── MAIN (flight mode) ───────────────────────────────────────────────────
    if (appPhase === 'main' && isFlying) {
      const { falconOrientation, setFlightSpeed, setIsBoosting } = useStore.getState()

      // Initialize flight state on first frame
      if (!flightStateRef.current) {
        flightStateRef.current = createFlightState(
          groupRef.current.position,
          groupRef.current.quaternion,
        )
      }

      // Run physics tick
      stepFlightPhysics(flightStateRef.current, flightInput.current, delta)

      // Apply to group transform
      groupRef.current.position.copy(flightStateRef.current.position)
      groupRef.current.quaternion.copy(flightStateRef.current.orientation)
      groupRef.current.scale.setScalar(0.4)

      // Update store (transient — no re-render)
      falconWorldPosition.copy(flightStateRef.current.position)
      falconOrientation.copy(flightStateRef.current.orientation)

      // Update store (reactive — drives HUD / camera)
      setFlightSpeed(flightStateRef.current.speed)
      setIsBoosting(flightInput.current.boost)

      // Engine glow modulation
      const inp = flightInput.current
      const glowMult = inp.boost ? 3.0 : inp.thrust > 0 ? 1.8 : 1.0
      if (engineLight1.current) engineLight1.current.intensity = 14 * glowMult
      if (engineLight2.current) engineLight2.current.intensity = 14 * glowMult
      if (engineLight3.current) engineLight3.current.intensity = 8 * glowMult
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -4]} scale={0.5}>
      <primitive object={clonedScene} />
      <pointLight ref={engineLight1} color="#4466ff" intensity={14} distance={5} decay={2} position={[0.45, 0.05, 1.2]} />
      <pointLight ref={engineLight2} color="#4466ff" intensity={14} distance={5} decay={2} position={[-0.45, 0.05, 1.2]} />
      <pointLight ref={engineLight3} color="#2244cc" intensity={8} distance={10} decay={2} position={[0, 0.1, 1.8]} />
      {/* Hyperspace rim light — behind/above, creates edge highlights from camera's perspective */}
      <pointLight ref={rimLight} color="#6699ff" intensity={0} distance={20} decay={1.5} position={[0, 1.5, 2.5]} />
      {/* Hyperspace forward fill — from destination, backlit silhouette glow */}
      <pointLight ref={fillLight} color="#aaccff" intensity={0} distance={25} decay={1.5} position={[0, 0.3, -4]} />
    </group>
  )
}

useGLTF.preload('/models/millennium-falcon.glb')
