import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

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

// Chase camera offset during hyperspace — y=2 keeps camera inside 6-radius tunnel
const CHASE_OFFSET = new THREE.Vector3(0, 2, 12)

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
  const prevPhase = useRef<string>('intro')

  // FOV animation
  const targetFov = useRef(58)

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
    prevPhase.current = appPhase

    // ── INTRO: chase cam ───────────────────────────────────────────────────
    if (appPhase === 'intro') {
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

    // ── HYPERSPACE: locked behind Falcon through tunnel ────────────────────
    if (appPhase === 'hyperspace') {
      targetFov.current = 70

      // Camera directly follows Falcon + offset (y=2 stays inside tube radius 6)
      _lerpTarget.copy(falconWorldPosition).add(CHASE_OFFSET)
      camera.position.copy(_lerpTarget)

      // Look ahead of the Falcon along the tunnel
      _lerpLookAt.copy(falconWorldPosition)
      _lerpLookAt.z -= 20
      camera.lookAt(_lerpLookAt)

      // Reset camera up (was tilted during intro)
      camera.up.lerp(_up, 0.1)
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
      targetFov.current = 55

      // Only apply parallax when not in orbit mode (OrbitControls takes over)
      const storeState = useStore.getState()
      if (storeState.cameraMode !== 'orbit' || !storeState.entryAnimDone) {
        _lerpTarget.copy(ESTABLISHING_POS)
        _lerpTarget.x += mousePos.current.x * 0.6
        _lerpTarget.y += mousePos.current.y * 0.3
        camera.position.lerp(_lerpTarget, 0.03)
        camera.lookAt(ESTABLISHING_LOOK)
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
