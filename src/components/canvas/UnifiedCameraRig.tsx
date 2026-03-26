import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { wormholeSpline, falconProgress, FALCON_START_T } from '../../utils/wormholeSpline'
import { FLIGHT } from '../../systems/flightPhysics'
import { planetWorldPositions } from '../../utils/planetPositions'

/**
 * Single camera controller for all scene phases:
 *   intro      → chase cam behind Falcon, mouse-reactive tilt
 *   hyperspace → locked behind Falcon through tunnel (y≈2, inside tube radius 6)
 *   arriving   → lerp from tunnel exit to establishing shot (2s)
 *   main       → establishing shot with mouse parallax, then OrbitControls
 *
 * DEBUG: Press F at any time to toggle free camera (OrbitControls detached from script).
 *
 * The camera rig owns the arriving→main transition.
 */

// Solar system center offset
const SOLAR_SYSTEM_Z = -2000

// Falcon stays at the tunnel exit: [0, 0, -1870]
const TUNNEL_EXIT_Z = SOLAR_SYSTEM_Z + 130 // -1870

// Camera establishing shot: just behind & slightly above the falcon, looking at the sun
const ESTABLISHING_POS = new THREE.Vector3(0, 4, TUNNEL_EXIT_Z + 14) // [0, 4, -1856]
const ESTABLISHING_LOOK = new THREE.Vector3(0, 0, SOLAR_SYSTEM_Z) // sun position

// Reusable vectors (avoid allocations in useFrame)
const _mouseOffset = new THREE.Vector3()
const _lerpTarget = new THREE.Vector3()
const _lerpLookAt = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _alt = new THREE.Vector3(1, 0, 0) // fallback when tangent ≈ up
const _tangent = new THREE.Vector3()
const _right = new THREE.Vector3()
const _pathUp = new THREE.Vector3()

// Chase camera (flight mode)
const CHASE_DISTANCE = 8
const CHASE_HEIGHT = 2.5
const CHASE_LOOK_AHEAD = 12
const CHASE_POS_SPEED = 3.0
const CHASE_LOOK_SPEED = 5.0
const CHASE_SHAKE = 0.03
const BASE_FOV = 55
const BOOST_FOV = 75
const FOV_LERP = 3.0

const _chaseOffset = new THREE.Vector3()
const _desiredCamPos = new THREE.Vector3()
const _lookAhead = new THREE.Vector3()
const _desiredLook = new THREE.Vector3()
const _falconUp = new THREE.Vector3()

// How far behind the Falcon the camera sits on the spline (in t parameter)
const CAMERA_T_LAG = 0.007
// How far ahead to look (in t parameter)
const CAMERA_T_LOOK_AHEAD = 0.015
// Perpendicular "up" offset from the spline center (keeps camera inside tube)
const CAMERA_PATH_UP_OFFSET = 1.2
// Maximum distance from spline center the camera is allowed (prevents wall clipping)
// Must be well under WORMHOLE_TUBE_RADIUS (6) to account for curve dynamics
const MAX_CAMERA_OFFSET = 3.5

export function UnifiedCameraRig() {
  const { camera } = useThree()
  const debugFree = useStore((s) => s.debugFreeCamera)

  // Mouse tracking
  const mousePos = useRef({ x: 0, y: 0 })
  const introSmoothX = useRef(0)
  const introSmoothY = useRef(0)

  // Transition state
  const arrivingStart = useRef(0)
  const arrivingFrom = useRef(new THREE.Vector3())
  const arrivingLookFrom = useRef(new THREE.Vector3())
  const entryDone = useRef(false)
  const prevPhase = useRef<string>('loading')

  // Hyperspace entry transition — smooth sweep from lobby camera into wormhole
  // Virtual time prevents GPU stalls from skipping the entry animation
  const lastHyperFrame = useRef(0)
  const virtualHyperElapsed = useRef(0)
  const hyperTransFrom = useRef(new THREE.Vector3())
  const hyperTransLookFrom = useRef(new THREE.Vector3())
  const hyperTransUpFrom = useRef(new THREE.Vector3())

  // FOV animation
  const targetFov = useRef(58)
  const debugFrame = useRef(0)

  // Chase camera state (flight mode)
  const chaseLookTarget = useRef(new THREE.Vector3())
  const chaseInitialized = useRef(false)

  // Orbit controls state
  const cameraMode = useStore((s) => s.cameraMode)
  const entryAnimDone = useStore((s) => s.entryAnimDone)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // F: toggle debug free camera
      if (e.code === 'KeyF') {
        const state = useStore.getState()
        const next = !state.debugFreeCamera
        state.setDebugFreeCamera(next)
        if (next) {
          console.log('[DEBUG] Free camera ON — use mouse to orbit, scroll to zoom')
          const p = camera.position
          console.log(`[DEBUG] Camera pos: [${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}]`)
        } else {
          console.log('[DEBUG] Free camera OFF — returning to scripted camera')
        }
        return
      }

      // G: reset scene to intro
      if (e.code === 'KeyG') {
        useStore.getState().resetScene()
        return
      }

      const state = useStore.getState()
      if (!state.entryAnimDone) return

      // T: toggle flight mode
      if (e.code === 'KeyT') {
        if (state.cameraMode === 'flight') {
          // Exit flight
          state.setIsFlying(false)
          state.setCameraMode('orbit')
          chaseInitialized.current = false
        } else {
          // Enter flight
          state.setIsFlying(true)
          state.setCameraMode('flight')
          chaseInitialized.current = false
        }
        return
      }

      if (e.code === 'KeyV') {
        state.setCameraMode(state.cameraMode === 'orbit' ? 'journey' : 'orbit')
      }
      if (e.code === 'KeyR' && state.cameraMode === 'orbit') {
        camera.position.copy(ESTABLISHING_POS)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [camera])

  useFrame((state) => {
    // Debug free camera — skip all scripted camera movement
    if (debugFree) return

    const { appPhase, falconWorldPosition, setEntryAnimDone, setAppPhase } = useStore.getState()
    const t = state.clock.elapsedTime

    // Detect arriving transition — capture camera position at tunnel exit
    if (appPhase === 'arriving' && prevPhase.current !== 'arriving') {
      arrivingStart.current = performance.now()
      arrivingFrom.current.copy(camera.position)
      // Look-from: ahead of the falcon at tunnel exit
      arrivingLookFrom.current.copy(falconWorldPosition)
      arrivingLookFrom.current.z -= 20
    }

    // Detect hyperspace start — capture lobby camera state for smooth sweep
    if (appPhase === 'hyperspace' && prevPhase.current !== 'hyperspace') {
      lastHyperFrame.current = performance.now()
      virtualHyperElapsed.current = 0
      debugFrame.current = 0
      hyperTransFrom.current.copy(camera.position)
      hyperTransUpFrom.current.copy(camera.up)
      // Where the camera is currently looking (≈ the Falcon)
      camera.getWorldDirection(_lerpLookAt)
      hyperTransLookFrom.current.copy(camera.position).addScaledVector(_lerpLookAt, 10)

      if (import.meta.env.DEV) {
        const cp = camera.position
        console.log(`[CAMERA] Hyperspace START — cam=[${cp.x.toFixed(1)}, ${cp.y.toFixed(1)}, ${cp.z.toFixed(1)}] near=${(camera as THREE.PerspectiveCamera).near} far=${(camera as THREE.PerspectiveCamera).far}`)
      }
    }
    prevPhase.current = appPhase

    // ── LOADING / INTRO: chase cam ──────────────────────────────────────────
    if (appPhase === 'loading' || appPhase === 'intro') {
      targetFov.current = 58

      const introTargetX = mousePos.current.x
      introSmoothX.current += (introTargetX - introSmoothX.current) * 0.015
      introSmoothY.current += (-introSmoothX.current - introSmoothY.current) * 0.015

      const mx = introSmoothX.current

      camera.position.set(
        Math.sin(t * 0.11) * 0.4 + mx * 0.35,
        2.0 + Math.sin(t * 0.07) * 0.10,
        8,
      )

      const tilt = mx * Math.abs(mx) * 0.18
      camera.up.set(tilt, 1, 0).normalize()
      camera.lookAt(mx * 0.15, 0.5, -4)
    }

    // ── HYPERSPACE: follow wormhole spline behind Falcon ────────────────────
    if (appPhase === 'hyperspace') {
      // Virtual time: cap per-frame delta so GPU stalls don't skip animation
      const now = performance.now()
      const rawDelta = now - lastHyperFrame.current
      lastHyperFrame.current = now
      virtualHyperElapsed.current += Math.min(rawDelta, 33)
      const transElapsed = virtualHyperElapsed.current

      // ── FOV progression: builds during entry, settles for cruise ──
      const ENTRY_DUR = 4000
      if (transElapsed < ENTRY_DUR) {
        const entryPhase = transElapsed / ENTRY_DUR
        // Slow FOV widen at start, aggressive at peak, ease back
        const fovPull = Math.pow(entryPhase, 1.8)
        targetFov.current = 58 + fovPull * 24 // 58 → 82
      } else {
        // Settle back to cruise FOV
        targetFov.current = 75
      }

      const ft = falconProgress.t
      // Clamp camT to never go behind the Falcon's start position —
      // the pre-entry spline extension is behind the camera and must not be targeted
      const camT = Math.max(ft - CAMERA_T_LAG, FALCON_START_T)
      const lookT = Math.min(ft + CAMERA_T_LOOK_AHEAD, 1)

      // Compute the spline-following camera target
      _lerpTarget.copy(wormholeSpline.getPointAt(camT))
      _tangent.copy(wormholeSpline.getTangentAt(camT))
      _right.crossVectors(_tangent, _up)
      // Fallback when tangent is nearly parallel to world up — prevents NaN
      if (_right.lengthSq() < 0.001) _right.crossVectors(_tangent, _alt)
      _right.normalize()
      _pathUp.crossVectors(_right, _tangent).normalize()
      _lerpTarget.addScaledVector(_pathUp, CAMERA_PATH_UP_OFFSET)

      const splineLook = wormholeSpline.getPointAt(lookT)

      // Smooth transition from lobby camera into spline-following mode.
      // The ship flies through star-streaks for ~3.5s before the wormhole
      // appears, so this transition can take its time.
      const HYPER_CAM_TRANSITION = 1200

      if (transElapsed < HYPER_CAM_TRANSITION) {
        // Slower transition matches the gravitational pull feel
        const p = transElapsed / HYPER_CAM_TRANSITION
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

        camera.position.lerpVectors(hyperTransFrom.current, _lerpTarget, eased)
        _lerpLookAt.lerpVectors(hyperTransLookFrom.current, splineLook, eased)
        camera.lookAt(_lerpLookAt)
        camera.up.copy(hyperTransUpFrom.current).lerp(_pathUp, eased)
      } else {
        camera.position.copy(_lerpTarget)
        _lerpLookAt.copy(splineLook)
        camera.lookAt(_lerpLookAt)
        camera.up.copy(_pathUp)
      }

      // ── Entry camera shake: gravitational stress ──
      if (transElapsed < ENTRY_DUR + 1500) {
        const shakePhase = Math.min(transElapsed / ENTRY_DUR, 1)
        // Envelope: builds slowly, peaks at ~65%, dampens after entry
        const buildUp = Math.pow(Math.min(shakePhase / 0.65, 1), 2)
        const dampDown = transElapsed > ENTRY_DUR
          ? 1 - Math.min((transElapsed - ENTRY_DUR) / 1500, 1)
          : 1
        const envelope = buildUp * dampDown
        // Low-frequency oscillation — gravitational stress, not jitter
        const shakeAmt = envelope * 0.08
        camera.position.x += Math.sin(t * 19.3) * shakeAmt
        camera.position.y += Math.cos(t * 27.1) * shakeAmt * 0.5
      }

      // ── Clamp camera to stay well inside the tube ──
      // After all offsets + shake, ensure the camera never exceeds
      // MAX_CAMERA_OFFSET from the spline centerline to prevent wall clipping.
      const splineCenter = wormholeSpline.getPointAt(camT)
      const offsetFromCenter = camera.position.distanceTo(splineCenter)
      if (offsetFromCenter > MAX_CAMERA_OFFSET) {
        // Pull camera back toward center along the offset direction
        const pull = MAX_CAMERA_OFFSET / offsetFromCenter
        camera.position.lerpVectors(splineCenter, camera.position, pull)
      }

      // Debug: log every 60 frames (~1/sec)
      if (import.meta.env.DEV) {
        debugFrame.current++
        if (debugFrame.current % 60 === 1) {
          const cp = camera.position
          // Distance from camera to spline center — if > TUBE_RADIUS we clip
          const splineCenter = wormholeSpline.getPointAt(camT)
          const distToCenter = cp.distanceTo(splineCenter)
          console.log(`[CAMERA] pos=[${cp.x.toFixed(1)}, ${cp.y.toFixed(1)}, ${cp.z.toFixed(1)}] camT=${camT.toFixed(4)} distToSpline=${distToCenter.toFixed(2)} fov=${camera.fov.toFixed(0)} elapsed=${transElapsed.toFixed(0)}ms`)
        }
      }
    }

    // ── ARRIVING: smooth transition to establishing shot ───────────────────
    if (appPhase === 'arriving' || (appPhase === 'main' && !entryDone.current)) {
      targetFov.current = 55

      const elapsed = performance.now() - arrivingStart.current
      const duration = 2000 // ms
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic

      // Lerp camera position from tunnel exit to establishing shot
      camera.position.lerpVectors(arrivingFrom.current, ESTABLISHING_POS, eased)

      // Lerp lookAt from tunnel forward to sun
      _lerpLookAt.lerpVectors(arrivingLookFrom.current, ESTABLISHING_LOOK, eased)
      camera.lookAt(_lerpLookAt)

      // Reset camera up
      camera.up.set(0, 1, 0)

      if (progress >= 1 && !entryDone.current) {
        entryDone.current = true
        setEntryAnimDone(true)
        // Camera rig owns the arriving→main transition
        setAppPhase('main')
      }
    }

    // ── MAIN (after entry): mouse parallax on establishing shot ────────────
    if (appPhase === 'main' && entryDone.current) {
      const storeState = useStore.getState()

      // ── GUIDED ORBIT CAMERA ───────────────────────────────────────────────
      if (storeState.cameraMode === 'guidedOrbit' && storeState.guidedOrbitPlanet) {
        const planetPos = planetWorldPositions[storeState.guidedOrbitPlanet]
        if (planetPos) {
          const progress = storeState.guidedOrbitProgress

          // Camera slowly pans around the planet at 1/5 the Falcon orbit speed
          // Start from an angle that puts the planet on the RIGHT side of frame
          const APPROACH_END = 0.15
          const orbitT = progress > APPROACH_END
            ? (progress - APPROACH_END) / (1 - APPROACH_END)
            : 0
          const camAngle = orbitT * Math.PI * 2 * 0.2  // slow pan

          // Camera at ~5 units from planet, on the "camera-left" side
          // so planet sits on the right portion of the screen
          const CAM_RADIUS = 5.2
          const CAM_HEIGHT = 1.8

          // Base camera angle offset: π/3 puts camera to the left of the orbit
          const baseAngle = Math.PI * 0.6
          const camX = planetPos.x + Math.cos(baseAngle + camAngle) * CAM_RADIUS
          const camY = planetPos.y + CAM_HEIGHT
          const camZ = planetPos.z + Math.sin(baseAngle + camAngle) * CAM_RADIUS

          // Smooth camera movement
          _lerpTarget.set(camX, camY, camZ)
          camera.position.lerp(_lerpTarget, 0.04)

          // Look at a point slightly toward planet from its center (planet on right)
          _lerpLookAt.set(
            planetPos.x + 0.8,
            planetPos.y,
            planetPos.z,
          )
          camera.lookAt(_lerpLookAt)
          camera.up.set(0, 1, 0)

          targetFov.current = 52
        }
        return
      }

      if (storeState.cameraMode === 'flight') {
        // ── FLIGHT CHASE CAM ─────────────────────────────────────────────
        const { falconOrientation, flightSpeed, isBoosting } = storeState
        const dt = state.delta

        // Desired position: behind and above the falcon
        _chaseOffset.set(0, CHASE_HEIGHT, CHASE_DISTANCE)
        _chaseOffset.applyQuaternion(falconOrientation)
        _desiredCamPos.copy(falconWorldPosition).add(_chaseOffset)

        // Look-ahead target: in front of the falcon
        _lookAhead.set(0, 0, -CHASE_LOOK_AHEAD)
        _lookAhead.applyQuaternion(falconOrientation)
        _desiredLook.copy(falconWorldPosition).add(_lookAhead)

        if (!chaseInitialized.current) {
          // Snap on first frame to avoid lerp from orbit position
          camera.position.copy(_desiredCamPos)
          chaseLookTarget.current.copy(_desiredLook)
          chaseInitialized.current = true
        }

        // Smooth follow with exponential decay
        const posLerp = 1 - Math.exp(-CHASE_POS_SPEED * dt)
        const lookLerp = 1 - Math.exp(-CHASE_LOOK_SPEED * dt)
        camera.position.lerp(_desiredCamPos, posLerp)
        chaseLookTarget.current.lerp(_desiredLook, lookLerp)
        camera.lookAt(chaseLookTarget.current)

        // Camera up follows falcon banking (slow for cinematic lag)
        _falconUp.set(0, 1, 0).applyQuaternion(falconOrientation)
        camera.up.lerp(_falconUp, 0.05)

        // FOV: widen during boost
        targetFov.current = isBoosting ? BOOST_FOV : BASE_FOV

        // Subtle camera shake at high speed
        const shakeAmt = (flightSpeed / FLIGHT.MAX_BOOST_SPEED) * CHASE_SHAKE
        camera.position.x += Math.sin(t * 37.7) * Math.cos(t * 71.3) * shakeAmt
        camera.position.y += Math.cos(t * 53.1) * Math.sin(t * 29.7) * shakeAmt
      } else {
        // ── ORBIT / JOURNEY parallax ─────────────────────────────────────
        targetFov.current = 55
        if (storeState.cameraMode !== 'orbit' || !storeState.entryAnimDone) {
          _lerpTarget.copy(ESTABLISHING_POS)
          _lerpTarget.x += mousePos.current.x * 0.6
          _lerpTarget.y += mousePos.current.y * 0.3
          camera.position.lerp(_lerpTarget, 0.03)
          camera.lookAt(ESTABLISHING_LOOK)
        }
      }
    }

    // ── Animate FOV ────────────────────────────────────────────────────────
    if (Math.abs(camera.fov - targetFov.current) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov.current, 0.03)
      camera.updateProjectionMatrix()
    }
  })

  // Debug free camera — always show OrbitControls, target wherever camera looks
  if (debugFree) {
    return <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
  }

  // OrbitControls — only active when entry is done and in orbit mode
  if (!entryAnimDone) return null
  if (cameraMode !== 'orbit') return null

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.6}
      panSpeed={0.8}
      zoomSpeed={1.0}
      minDistance={6}
      maxDistance={420}
      maxPolarAngle={Math.PI * 0.98}
      target={[0, 0, SOLAR_SYSTEM_Z]}
    />
  )
}
