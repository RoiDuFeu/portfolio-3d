import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { FLIGHT } from '../../systems/flightPhysics'
import { CAMERA_TUNING } from '../../systems/falconMotionLayer'
import { galaxyPlanetPlacements, SOLAR_SYSTEM_CENTER_Z } from '../../data/galaxyLayout'
import { planetWorldPositions } from '../../utils/planetPositions'

/**
 * Single camera controller for all scene phases:
 *   loading    → static
 *   arriving   → upper galaxy overview with mouse parallax, shows droid cards
 *   main       → cinematic swoop → flight chase cam / orbit
 *
 * After the user picks a copilot (pilotChoice), the camera swoops from the
 * overview down toward the ship over ~1 second, then activates flight mode.
 */

// Solar system center offset
const SOLAR_SYSTEM_Z = -2000

// Upper galaxy overview — elevated position looking down at the solar system
const OVERVIEW_POS = new THREE.Vector3(0, 45, SOLAR_SYSTEM_Z + 160)
const OVERVIEW_LOOK = new THREE.Vector3(0, 0, SOLAR_SYSTEM_Z)

// Camera establishing shot (orbit mode target)
const ESTABLISHING_POS = new THREE.Vector3(0, 4, SOLAR_SYSTEM_Z + 144)
const ESTABLISHING_LOOK = new THREE.Vector3(0, 0, SOLAR_SYSTEM_Z)

// Planet-visit camera: offset so planet is on the LEFT third of screen
const _visitCamPos = new THREE.Vector3()
const _visitLookAt = new THREE.Vector3()

// Reusable vectors
const _lerpTarget = new THREE.Vector3()
const _lerpLookAt = new THREE.Vector3()
const _swoopPos = new THREE.Vector3()
const _swoopLook = new THREE.Vector3()

// Chase camera constants (legacy references for swoop — runtime uses CAMERA_TUNING)
const CHASE_DISTANCE = CAMERA_TUNING.DISTANCE_BASE
const CHASE_HEIGHT = CAMERA_TUNING.HEIGHT_BASE
const CHASE_LOOK_AHEAD = CAMERA_TUNING.LOOK_AHEAD

// Fire shake
const FIRE_SHAKE_AMOUNT = CAMERA_TUNING.FIRE_SHAKE_AMOUNT
const FIRE_SHAKE_DECAY = CAMERA_TUNING.FIRE_SHAKE_DECAY

// Cinematic swoop duration (ms)
const SWOOP_DURATION = 1200

const _chaseOffset = new THREE.Vector3()
const _shipUp = new THREE.Vector3()
const _desiredCamPos = new THREE.Vector3()
const _lookAhead = new THREE.Vector3()
const _desiredLook = new THREE.Vector3()

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function UnifiedCameraRig() {
  const { camera: rawCamera } = useThree()
  const camera = rawCamera as THREE.PerspectiveCamera
  const debugFree = useStore((s) => s.debugFreeCamera)

  // Mouse tracking
  const mousePos = useRef({ x: 0, y: 0 })

  // Transition state
  const entryDone = useRef(false)
  const arrivingStart = useRef(0)
  const prevPhase = useRef<string>('loading')

  // Cinematic swoop state
  const swoopStart = useRef(0)
  const swoopFrom = useRef(new THREE.Vector3())
  const swoopLookFrom = useRef(new THREE.Vector3())
  const swoopDone = useRef(false)

  // FOV animation
  const targetFov = useRef(58)
  const currentFov = useRef(58)

  // Chase camera state (flight mode)
  const chaseLookTarget = useRef(new THREE.Vector3())
  const chaseInitialized = useRef(false)

  // Camera trail state: smoothed trailing offset during acceleration
  const trailAmount = useRef(0)

  // Camera bank roll (smoothed to match ship bank)
  const cameraRoll = useRef(0)

  // Disable OrbitControls via ref so it can't conflict during the
  // one-frame lag between store update and React re-render
  const orbitEnabled = useRef(true)

  // Debug frame counter
  const dbgFrame = useRef(0)

  // Store subscriptions
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
      if (e.code === 'KeyF') {
        const state = useStore.getState()
        const next = !state.debugFreeCamera
        state.setDebugFreeCamera(next)
        if (next) {
          console.log('[DEBUG] Free camera ON')
          const p = camera.position
          console.log(`[DEBUG] Camera pos: [${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}]`)
        } else {
          console.log('[DEBUG] Free camera OFF')
        }
        return
      }

      if (e.code === 'KeyG') {
        useStore.getState().resetScene()
        return
      }

      const state = useStore.getState()
      if (!state.entryAnimDone) return

      if (e.code === 'KeyT') {
        if (state.cameraMode === 'flight') {
          state.setIsFlying(false)
          state.setCameraMode('orbit')
        } else {
          state.setIsFlying(true)
          state.setCameraMode('flight')
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

  // Priority 1 ensures this runs AFTER OrbitControls' useFrame (priority 0),
  // so the camera rig always has the final say on camera.position.
  useFrame((state, frameDelta) => {
    if (debugFree) return

    const storeSnap = useStore.getState()
    if (storeSnap.isPaused) return
    const {
      appPhase, falconWorldPosition,
      setEntryAnimDone, setAppPhase,
      pilotChoice, setPilotChoice,
      setIsFlying, setCameraMode,
      isFlying: storeIsFlying,
    } = storeSnap
    const t = state.clock.elapsedTime

    // ── DEBUG: log state every 30 frames ────────────────────────────────
    if (import.meta.env.DEV) {
      dbgFrame.current++
      if (dbgFrame.current % 30 === 1) {
        const cp = camera.position
        const fp = falconWorldPosition
        let activeBlock = 'NONE'
        if (appPhase === 'loading') activeBlock = 'LOADING'
        else if (appPhase === 'arriving' || (appPhase === 'main' && !entryDone.current && !pilotChoice)) activeBlock = 'ARRIVING'
        if (pilotChoice && swoopStart.current > 0 && !swoopDone.current) activeBlock = 'SWOOP'
        if (appPhase === 'main' && entryDone.current && swoopDone.current) activeBlock = storeSnap.cameraMode === 'flight' ? 'CHASE_CAM' : 'ORBIT'

        console.log(
          `[CAM] %c${activeBlock}%c | phase=${appPhase} pilot=${pilotChoice} isFlying=${storeIsFlying} camMode=${storeSnap.cameraMode} entryDone=${entryDone.current} swoopDone=${swoopDone.current} chaseInit=${chaseInitialized.current} | cam=[${cp.x.toFixed(1)},${cp.y.toFixed(1)},${cp.z.toFixed(1)}] falcon=[${fp.x.toFixed(1)},${fp.y.toFixed(1)},${fp.z.toFixed(1)}] fov=${camera.fov.toFixed(0)}`,
          'color: #00ff88; font-weight: bold', 'color: inherit'
        )
      }
    }

    // ── Detect arriving transition ──────────────────────────────────────
    if (appPhase === 'arriving' && prevPhase.current !== 'arriving') {
      arrivingStart.current = performance.now()
      swoopDone.current = false
      swoopStart.current = 0
      camera.position.copy(OVERVIEW_POS)
      camera.up.set(0, 1, 0)
      camera.lookAt(OVERVIEW_LOOK)
    }

    // Detect pilotChoice being set → start cinematic swoop
    if (pilotChoice && swoopStart.current === 0 && !swoopDone.current) {
      swoopStart.current = performance.now()
      swoopFrom.current.copy(camera.position)
      swoopLookFrom.current.copy(OVERVIEW_LOOK)
      if (import.meta.env.DEV) {
        const cp = camera.position
        console.log(`%c[CAM] ═══ SWOOP START ═══%c from=[${cp.x.toFixed(1)},${cp.y.toFixed(1)},${cp.z.toFixed(1)}] pilot=${pilotChoice}`, 'color: #ff4444; font-weight: bold', 'color: inherit')
      }
    }

    prevPhase.current = appPhase

    // ── LOADING: static ────────────────────────────────────────────────
    if (appPhase === 'loading') {
      targetFov.current = 58
    }

    // ── ARRIVING: overview with mouse parallax ─────────────────────────
    if (appPhase === 'arriving' || (appPhase === 'main' && !entryDone.current && !pilotChoice)) {
      targetFov.current = 55

      _lerpTarget.copy(OVERVIEW_POS)
      _lerpTarget.x += mousePos.current.x * 0.8
      _lerpTarget.y += mousePos.current.y * 0.4
      camera.position.lerp(_lerpTarget, 0.03)
      camera.lookAt(OVERVIEW_LOOK)
      camera.up.set(0, 1, 0)

      const elapsed = performance.now() - arrivingStart.current
      if (elapsed >= 2000 && !entryDone.current) {
        entryDone.current = true
        setEntryAnimDone(true)
        setAppPhase('main')
      }
    }

    // ── CINEMATIC SWOOP: camera descends toward the ship ───────────────
    if (pilotChoice && swoopStart.current > 0 && !swoopDone.current) {
      targetFov.current = 55

      if (appPhase !== 'main') {
        entryDone.current = true
        setEntryAnimDone(true)
        setAppPhase('main')
      }

      const elapsed = performance.now() - swoopStart.current
      const progress = Math.min(elapsed / SWOOP_DURATION, 1)
      const eased = easeOutCubic(progress)

      const { falconOrientation } = useStore.getState()
      _chaseOffset.set(0, CHASE_HEIGHT, CHASE_DISTANCE)
      _chaseOffset.applyQuaternion(falconOrientation)
      const swoopTarget = _swoopPos.copy(falconWorldPosition).add(_chaseOffset)

      _lookAhead.set(0, 0, -CHASE_LOOK_AHEAD)
      _lookAhead.applyQuaternion(falconOrientation)
      const swoopLookTarget = _swoopLook.copy(falconWorldPosition).add(_lookAhead)

      camera.position.lerpVectors(swoopFrom.current, swoopTarget, eased)
      _lerpLookAt.lerpVectors(swoopLookFrom.current, swoopLookTarget, eased)
      camera.lookAt(_lerpLookAt)
      camera.up.set(0, 1, 0)

      if (progress >= 1) {
        swoopDone.current = true

        if (import.meta.env.DEV) {
          const cp = camera.position
          const fp = falconWorldPosition
          console.log(`%c[CAM] ═══ SWOOP DONE ═══%c cam=[${cp.x.toFixed(1)},${cp.y.toFixed(1)},${cp.z.toFixed(1)}] falcon=[${fp.x.toFixed(1)},${fp.y.toFixed(1)},${fp.z.toFixed(1)}] → activating flight=${pilotChoice === 'r2d2'}`, 'color: #00ff00; font-weight: bold', 'color: inherit')
        }

        if (pilotChoice === 'r2d2') {
          orbitEnabled.current = false
          const controls = state.controls as any
          if (controls) controls.enabled = false
          setIsFlying(true)
          setCameraMode('flight')
        }
        setPilotChoice(null)
      }
    }

    // ── PLANET VISIT: fixed cinematic view with planet on the left ─────
    // Must run BEFORE the main flight/orbit block to take priority
    if (storeSnap.planetVisitActive && storeSnap.visitingPlanetName) {
      const placement = galaxyPlanetPlacements.find(
        (p) => p.planetName === storeSnap.visitingPlanetName,
      )
      if (placement) {
        const px = placement.position[0]
        const py = placement.position[1]
        const pz = placement.position[2] + SOLAR_SYSTEM_CENTER_Z

        // Camera offset: to the right and slightly above the planet
        // so the planet appears on the left ~1/3 of the screen
        _visitCamPos.set(px + 8, py + 3, pz + 10)
        _visitLookAt.set(px, py, pz)

        camera.position.lerp(_visitCamPos, 0.04)
        camera.lookAt(_visitLookAt)
        camera.up.set(0, 1, 0)

        targetFov.current = 45
      }
    }

    // ── MAIN (after swoop): flight chase cam or orbit ──────────────────
    if (appPhase === 'main' && entryDone.current && swoopDone.current && !storeSnap.planetVisitActive) {
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
        const { falconOrientation, flightSpeed, isBoosting, thrustInput } = storeState
        const ct = CAMERA_TUNING
        const dt = (isNaN(frameDelta) || frameDelta <= 0) ? 0.016 : Math.min(frameDelta, 0.1)

        // Guard: if quaternion is invalid (NaN/zero), use identity
        const qx = falconOrientation.x, qy = falconOrientation.y
        const qz = falconOrientation.z, qw = falconOrientation.w
        const quatValid = !(isNaN(qx) || isNaN(qy) || isNaN(qz) || isNaN(qw))
          && (qx * qx + qy * qy + qz * qz + qw * qw) > 0.001
        if (!quatValid) {
          if (import.meta.env.DEV) {
            console.error(`[CHASE CAM] BAD quaternion! q=[${qx},${qy},${qz},${qw}] — using identity`)
          }
          falconOrientation.set(0, 0, 0, 1)
        }

        // ── Dynamic chase distance: pull back at speed ──
        const speedNorm = flightSpeed / FLIGHT.MAX_BOOST_SPEED // 0..1
        const dynamicDistance = ct.DISTANCE_BASE + speedNorm * ct.DISTANCE_SPEED_SCALE
        const dynamicHeight = ct.HEIGHT_BASE + speedNorm * ct.HEIGHT_SPEED_SCALE

        // ── Camera trail: extra backward offset during acceleration ──
        const trailTarget = thrustInput > 0 ? thrustInput * ct.TRAIL_AMOUNT * (isBoosting ? 1.5 : 1.0) : 0
        const trailLerp = 1 - Math.exp(-ct.TRAIL_LERP_SPEED * dt)
        trailAmount.current += (trailTarget - trailAmount.current) * trailLerp

        // Chase offset: behind + above ship, following its pitch direction
        _lookAhead.set(0, 0, -1).applyQuaternion(falconOrientation)
        _lookAhead.normalize()

        // Ship's local up for height offset (follows pitch)
        _chaseOffset.set(0, 1, 0).applyQuaternion(falconOrientation)
        _chaseOffset.normalize()

        // Camera position: behind ship along its facing direction + above along its up
        _desiredCamPos.copy(falconWorldPosition)
          .addScaledVector(_lookAhead, -(dynamicDistance + trailAmount.current))
          .addScaledVector(_chaseOffset, dynamicHeight)

        // Look target: ahead of ship along its facing direction
        _desiredLook.copy(falconWorldPosition).addScaledVector(_lookAhead, ct.LOOK_AHEAD)

        // Guard: if any computed position is NaN, snap to safe fallback
        if (isNaN(_desiredCamPos.x)) {
          if (import.meta.env.DEV) {
            console.error(`[CHASE CAM] NaN in _desiredCamPos!`)
          }
          _desiredCamPos.set(falconWorldPosition.x, falconWorldPosition.y + dynamicHeight, falconWorldPosition.z + dynamicDistance)
          _desiredLook.set(falconWorldPosition.x, falconWorldPosition.y, falconWorldPosition.z - ct.LOOK_AHEAD)
        }

        if (!chaseInitialized.current) {
          // First frame: place camera directly behind the ship in world space.
          // Ship starts facing -Z with identity quaternion, so camera goes +Z behind it.
          // Force falconOrientation to identity to prevent stale swoop quaternion
          // from contaminating the chase position computation.
          falconOrientation.set(0, 0, 0, 1)
          const fp = falconWorldPosition
          camera.position.set(fp.x, fp.y + ct.HEIGHT_BASE, fp.z + ct.DISTANCE_BASE)
          chaseLookTarget.current.set(fp.x, fp.y, fp.z - ct.LOOK_AHEAD)
          camera.up.set(0, 1, 0)
          camera.lookAt(chaseLookTarget.current)
          chaseInitialized.current = true
          currentFov.current = ct.FOV_BASE
          // Reset camera roll & trail so flight always starts perfectly flat
          cameraRoll.current = 0
          trailAmount.current = 0
          if (import.meta.env.DEV) {
            const cp = camera.position
            console.log(`[CHASE CAM] init — falcon=[${fp.x.toFixed(1)},${fp.y.toFixed(1)},${fp.z.toFixed(1)}] cam=[${cp.x.toFixed(1)},${cp.y.toFixed(1)},${cp.z.toFixed(1)}]`)
          }
          // Skip follow/roll code on the init frame — camera is already perfectly placed
        } else {

        // ── Asymmetric position follow: faster when lagging far behind ──
        // During loops: snap much tighter so the camera stays locked behind the ship
        const inManeuver = storeState.isLooping || storeState.isBarrelRolling
        const camDist = camera.position.distanceTo(_desiredCamPos)
        const posSpeed = inManeuver
          ? 20.0  // near-instant follow during maneuvers
          : camDist > ct.POS_LAG_THRESHOLD
            ? ct.POS_FOLLOW_FAST
            : ct.POS_FOLLOW_SPEED
        const lookSpeed = inManeuver ? 15.0 : ct.LOOK_FOLLOW_SPEED
        const posLerp = 1 - Math.exp(-posSpeed * dt)
        const lookLerp = 1 - Math.exp(-lookSpeed * dt)

        // Guard: if camera.position is NaN, snap instead of lerp
        if (isNaN(camera.position.x)) {
          camera.position.copy(_desiredCamPos)
          chaseLookTarget.current.copy(_desiredLook)
        } else {
          camera.position.lerp(_desiredCamPos, posLerp)
          chaseLookTarget.current.lerp(_desiredLook, lookLerp)
        }

        // ── Camera up vector ──
        // During loops: follow ship's local up so the camera doesn't flip
        // Normal flight: bank-matched horizon tilt
        if (inManeuver) {
          _shipUp.set(0, 1, 0).applyQuaternion(falconOrientation)
          const upLerp = 1 - Math.exp(-12.0 * dt)
          camera.up.lerp(_shipUp, upLerp)
          camera.up.normalize()
        } else {
          const shipBank = storeState.flightTelemetry.bankAngle
          const targetRoll = -shipBank * ct.ROLL_MATCH_FACTOR
          const rollLerp = 1 - Math.exp(-ct.ROLL_LERP_SPEED * dt)
          cameraRoll.current += (targetRoll - cameraRoll.current) * rollLerp
          camera.up.set(Math.sin(cameraRoll.current), Math.cos(cameraRoll.current), 0)
        }

        camera.lookAt(chaseLookTarget.current)

        } // end else (follow code)

        // ── Dynamic FOV: speed-proportional + boost jump ──
        const speedFov = speedNorm * ct.FOV_SPEED_SCALE * (ct.FOV_BOOST - ct.FOV_BASE)
        targetFov.current = isBoosting
          ? ct.FOV_BOOST
          : ct.FOV_BASE + speedFov

        // Smooth FOV with exponential lerp (feels more cinematic than raw lerp)
        const fovLerp = 1 - Math.exp(-ct.FOV_LERP_SPEED * dt)
        currentFov.current += (targetFov.current - currentFov.current) * fovLerp

        // ── Fire shake (set by BlasterBolts, decays each frame) ──
        const fireShake = storeState.fireShakeIntensity
        if (fireShake > 0.001) {
          camera.position.x += Math.sin(t * 97.3) * fireShake * FIRE_SHAKE_AMOUNT
          camera.position.y += Math.cos(t * 83.7) * fireShake * FIRE_SHAKE_AMOUNT
          // Add subtle forward kick (recoil pushes camera forward briefly)
          camera.position.z -= Math.abs(Math.sin(t * 113.1)) * fireShake * FIRE_SHAKE_AMOUNT * 0.5
          // Decay fire shake (mutate in-place, no re-render)
          useStore.getState().fireShakeIntensity *= Math.max(0, 1 - FIRE_SHAKE_DECAY * dt)
        }
      } else {
        // Leaving flight mode: reset chase state so next entry starts fresh & flat
        chaseInitialized.current = false
        cameraRoll.current = 0
        trailAmount.current = 0
        targetFov.current = 55
        currentFov.current = targetFov.current
        if (storeState.cameraMode !== 'orbit' || !storeState.entryAnimDone) {
          _lerpTarget.copy(ESTABLISHING_POS)
          _lerpTarget.x += mousePos.current.x * 0.6
          _lerpTarget.y += mousePos.current.y * 0.3
          camera.position.lerp(_lerpTarget, 0.03)
          camera.lookAt(ESTABLISHING_LOOK)
        }
      }
    }

    // ── Animate FOV ──────────────────────────────────────────────────────
    if (Math.abs(camera.fov - currentFov.current) > 0.01) {
      camera.fov = currentFov.current
      camera.updateProjectionMatrix()
    }
  }, 1)  // priority 1 = runs AFTER OrbitControls (priority 0)

  if (debugFree) {
    return <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
  }

  if (!entryAnimDone) return null
  if (cameraMode !== 'orbit') return null

  return (
    <OrbitControls
      makeDefault
      enabled={orbitEnabled.current}
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
