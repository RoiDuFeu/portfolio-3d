import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { useFlightControls } from '../../hooks/useFlightControls'
import { createFlightState, stepFlightPhysics, type FlightState } from '../../systems/flightPhysics'
import { galaxyPlanetPlacements, SOLAR_SYSTEM_CENTER_Z } from '../../data/galaxyLayout'
import { getDisplaySize, getBodyByName } from '../../data/solarSystem'
import {
  ENGINE_TUNING,
  createSecondaryMotion,
  stepSecondaryMotion,
  triggerFireRecoil,
  type SecondaryMotionState,
} from '../../systems/falconMotionLayer'

/**
 * Single Millennium Falcon for all scene phases:
 *   loading    → parked at overview position (invisible scene)
 *   arriving   → parked at upper galaxy overview
 *   main       → static / flight mode
 */

// Solar system center in world space
const SOLAR_SYSTEM_Z = -2000

// Upper overview position — elevated above the solar system
const OVERVIEW_POS = new THREE.Vector3(0, 40, SOLAR_SYSTEM_Z + 160) // [0, 40, -1840]

// Flight start position — just above the solar system plane, near the edge
const FLIGHT_START_POS = new THREE.Vector3(0, 2, SOLAR_SYSTEM_Z + 130) // [0, 2, -1870]

// Cinematic swoop duration (must match camera rig)
const SWOOP_DURATION = 1200

// Reusable vectors / objects
const _away = new THREE.Vector3()
const _swoopPos = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _bankQ = new THREE.Quaternion()
const _bankAxis = new THREE.Vector3()
const _lookMat = new THREE.Matrix4()
const _upVec = new THREE.Vector3(0, 1, 0)

/** Camera-style lookAt: makes the object's -Z axis point at the target */
function faceTo(obj: THREE.Object3D, target: THREE.Vector3) {
  _lookMat.lookAt(obj.position, target, _upVec)
  obj.quaternion.setFromRotationMatrix(_lookMat)
}

export function UnifiedFalcon() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/millennium-falcon.glb')
  const { camera } = useThree()
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Flight mode — hook for useFlightControls (needs reactive), getState() for useFrame (needs immediate)
  const isFlyingReactive = useStore((s) => s.isFlying)
  const flightStateRef = useRef<FlightState | null>(null)
  const flightInput = useFlightControls(isFlyingReactive)

  // Expose flight input ref so MobileFlightControls (DOM layer) can write into it
  useEffect(() => {
    useStore.getState().flightInputRef = flightInput
    return () => { useStore.getState().flightInputRef = null }
  }, [flightInput])

  const engineLight1 = useRef<THREE.PointLight>(null)
  const engineLight2 = useRef<THREE.PointLight>(null)
  const engineLight3 = useRef<THREE.PointLight>(null)

  // Rim/forward lighting
  const rimLight = useRef<THREE.PointLight>(null)
  const fillLight = useRef<THREE.PointLight>(null)

  // Secondary motion (visual-only pitch wobble, roll overshoot, recoil)
  const secondaryMotion = useRef<SecondaryMotionState>(createSecondaryMotion())
  const lastRecoilTrigger = useRef(0)

  // Engine glow smoothing (lerped for smooth transitions)
  const engineGlow = useRef({ left: 14, right: 14, rear: 8 })

  // Setup materials
  useEffect(() => {
    // Fix baked-in rotation from Sketchfab GLTF export:
    // The model root has rot=[-PI/2, 0.4085, 0] — the -PI/2 X is Z-up→Y-up conversion,
    // but the 0.4085 Y is an unwanted yaw that causes visible banking.
    // Reset to pure Z-up→Y-up conversion only.
    const sketchfabRoot = clonedScene.children.find(c => c.name === 'Sketchfab_model')
    if (sketchfabRoot) {
      sketchfabRoot.rotation.set(-Math.PI / 2, 0, 0)
    }

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

  // Swoop animation state
  const swoopStartRef = useRef(0)
  const dbgFrame = useRef(0)

  // Planet visit orbit state
  const visitOrbitAngle = useRef(0)

  useFrame((_state, delta) => {
    if (!groupRef.current) return

    const { appPhase, falconWorldPosition, pilotChoice, isFlying, isPaused } = useStore.getState()

    // Skip everything when paused
    if (isPaused) return

    // ── DEBUG: log which block runs ─────────────────────────────────────
    if (import.meta.env.DEV) {
      dbgFrame.current++
      if (dbgFrame.current % 30 === 1) {
        let activeBlock = 'NONE'
        if (appPhase === 'loading') activeBlock = 'LOADING'
        else if ((appPhase === 'arriving' || (appPhase === 'main' && !isFlying)) && !pilotChoice) activeBlock = 'PARKED'
        if (pilotChoice && !isFlying) activeBlock = 'SWOOP'
        if (appPhase === 'main' && isFlying) activeBlock = 'FLIGHT'

        const p = groupRef.current.position
        console.log(
          `[FALCON] %c${activeBlock}%c | phase=${appPhase} pilot=${pilotChoice} isFlying=${isFlying} | pos=[${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}]`,
          'color: #ffaa00; font-weight: bold', 'color: inherit'
        )
      }
    }

    // ── LOADING: park at overview position ─────────────────────────────
    if (appPhase === 'loading') {
      groupRef.current.position.copy(OVERVIEW_POS)
      groupRef.current.scale.setScalar(0.4)
      if (engineLight1.current) engineLight1.current.intensity = 0
      if (engineLight2.current) engineLight2.current.intensity = 0
      if (engineLight3.current) engineLight3.current.intensity = 0
      falconWorldPosition.copy(groupRef.current.position)
    }

    // ── ARRIVING + MAIN (parked, no pilot choice yet) ─────────────────
    if ((appPhase === 'arriving' || (appPhase === 'main' && !isFlying)) && !pilotChoice) {
      groupRef.current.position.copy(OVERVIEW_POS)
      groupRef.current.scale.setScalar(0.4)

      // Face away from camera (camera-style lookAt so -Z is forward)
      _away.copy(groupRef.current.position).multiplyScalar(2).sub(camera.position)
      faceTo(groupRef.current, _away)

      falconWorldPosition.copy(groupRef.current.position)

      const { falconOrientation } = useStore.getState()
      falconOrientation.copy(groupRef.current.quaternion)

      if (engineLight1.current) engineLight1.current.intensity = 2
      if (engineLight2.current) engineLight2.current.intensity = 2
      if (engineLight3.current) engineLight3.current.intensity = 1

      flightStateRef.current = null
      swoopStartRef.current = 0
    }

    // ── CINEMATIC SWOOP: ship descends from overview to flight start ──
    if (pilotChoice && !isFlying) {
      if (swoopStartRef.current === 0) swoopStartRef.current = performance.now()

      const elapsed = performance.now() - swoopStartRef.current
      const progress = Math.min(elapsed / SWOOP_DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic

      // Interpolate position from overview to flight start
      _swoopPos.lerpVectors(OVERVIEW_POS, FLIGHT_START_POS, eased)
      groupRef.current.position.copy(_swoopPos)
      groupRef.current.scale.setScalar(0.4)

      // Face forward toward solar system center (camera-style so -Z is forward)
      _lookTarget.set(0, 0, SOLAR_SYSTEM_Z)
      faceTo(groupRef.current, _lookTarget)

      falconWorldPosition.copy(groupRef.current.position)

      const { falconOrientation } = useStore.getState()
      falconOrientation.copy(groupRef.current.quaternion)

      // Ramp engine lights during descent
      const lightIntensity = 2 + eased * 12
      if (engineLight1.current) engineLight1.current.intensity = lightIntensity
      if (engineLight2.current) engineLight2.current.intensity = lightIntensity
      if (engineLight3.current) engineLight3.current.intensity = lightIntensity * 0.6

      flightStateRef.current = null
    }

    // ── PLANET VISIT: orbit around the target planet ──────────────────
    const { planetVisitActive, visitingPlanetName } = useStore.getState()
    if (planetVisitActive && visitingPlanetName) {
      const placement = galaxyPlanetPlacements.find(
        (p) => p.planetName === visitingPlanetName,
      )
      const body = getBodyByName(visitingPlanetName)
      if (placement && body) {
        const px = placement.position[0]
        const py = placement.position[1]
        const pz = placement.position[2] + SOLAR_SYSTEM_CENTER_Z
        const planetSize = getDisplaySize(body)
        const orbitRadius = planetSize * 2.5
        const orbitSpeed = 0.8 // rad/s → ~8s per revolution

        visitOrbitAngle.current += orbitSpeed * delta

        const ox = px + Math.cos(visitOrbitAngle.current) * orbitRadius
        const oz = pz + Math.sin(visitOrbitAngle.current) * orbitRadius
        const oy = py + Math.sin(visitOrbitAngle.current * 0.3) * 0.3

        groupRef.current.position.set(ox, oy, oz)
        groupRef.current.scale.setScalar(0.08)

        // Face tangent direction (perpendicular to radius)
        const tx = px - Math.sin(visitOrbitAngle.current) * orbitRadius
        const tz = pz + Math.cos(visitOrbitAngle.current) * orbitRadius
        _lookTarget.set(tx, oy, tz)
        faceTo(groupRef.current, _lookTarget)

        falconWorldPosition.copy(groupRef.current.position)

        // Dim engines during orbit
        if (engineLight1.current) engineLight1.current.intensity = 4
        if (engineLight2.current) engineLight2.current.intensity = 4
        if (engineLight3.current) engineLight3.current.intensity = 2
      }
      return
    }

    // ── MAIN (flight mode) ────────────────────────────────────────────
    if (appPhase === 'main' && isFlying) {
      const { falconOrientation, setFlightSpeed, setIsBoosting } = useStore.getState()
      const safeDt = Math.min(delta, 0.1)

      // Initialize flight state on first frame — force perfectly flat
      if (!flightStateRef.current) {
        // Identity quaternion = no pitch, no bank, no roll, facing -Z
        const flatQuat = new THREE.Quaternion()
        flightStateRef.current = createFlightState(groupRef.current.position, flatQuat)

        // Force the visual group flat RIGHT NOW — don't wait for physics
        groupRef.current.quaternion.copy(flatQuat)
        falconOrientation.copy(flatQuat)
        return // skip the first physics tick so no stale delta contaminates
      }

      const inp = flightInput.current

      // Run physics tick
      stepFlightPhysics(flightStateRef.current, inp, delta)

      // ── Fire recoil: detect new shots via store trigger ──
      const currentRecoilTrigger = useStore.getState().fireRecoilTrigger
      if (currentRecoilTrigger !== lastRecoilTrigger.current) {
        triggerFireRecoil(secondaryMotion.current)
        lastRecoilTrigger.current = currentRecoilTrigger
      }

      // ── Secondary motion: visual-only offset on top of physics ──
      const visualOffset = stepSecondaryMotion(
        secondaryMotion.current,
        inp.thrust,
        flightStateRef.current.angularVelocity.y, // actual yaw rate
        inp.boost,
        inp.brake,
        flightStateRef.current.speed,
        safeDt,
      )

      // ── Apply physics orientation + cosmetic bank + manual roll + secondary motion ──
      // 1. Start from physics orientation (no roll in physics)
      // 2. Apply cosmetic auto-bank (ship tilts into mouse turns)
      // 3. Apply manual roll from Q/D (half barrel roll, visual only)
      // 4. Apply secondary motion (subtle pitch/yaw wobble + recoil)
      // Visual roll = auto-bank + manual roll + barrel roll maneuver
      const barrelRollOffset = flightStateRef.current.barrelRollAngle * -flightStateRef.current.barrelRollDir
      const bankQuat = _bankQ.setFromAxisAngle(
        _bankAxis.set(0, 0, -1),
        flightStateRef.current.autoBank + flightStateRef.current.manualRoll + barrelRollOffset,
      )

      groupRef.current.position.copy(flightStateRef.current.position)
      groupRef.current.quaternion
        .copy(flightStateRef.current.orientation)
        .multiply(bankQuat)
        .multiply(visualOffset)
      groupRef.current.scale.setScalar(0.4)

      // Roll input for engine glow side-emphasis (was yaw, now roll)
      const yawInput = inp.roll

      // Update store (transient — no re-render)
      falconWorldPosition.copy(flightStateRef.current.position)
      falconOrientation.copy(flightStateRef.current.orientation)
      useStore.getState().thrustInput = inp.thrust

      // Push telemetry for debug HUD
      const _euler = new THREE.Euler().setFromQuaternion(flightStateRef.current.orientation, 'YXZ')
      const telem = useStore.getState().flightTelemetry
      telem.pitch = flightStateRef.current.angularVelocity.x
      telem.yaw = flightStateRef.current.angularVelocity.y
      telem.roll = flightStateRef.current.angularVelocity.z
      telem.bankAngle = flightStateRef.current.autoBank + flightStateRef.current.manualRoll
      telem.speed = flightStateRef.current.speed
      telem.euler.x = THREE.MathUtils.radToDeg(_euler.x)
      telem.euler.y = THREE.MathUtils.radToDeg(_euler.y)
      telem.euler.z = THREE.MathUtils.radToDeg(_euler.z)
      telem.position.x = flightStateRef.current.position.x
      telem.position.y = flightStateRef.current.position.y
      telem.position.z = flightStateRef.current.position.z
      const physQ = flightStateRef.current.orientation
      telem.orientationQ.x = physQ.x
      telem.orientationQ.y = physQ.y
      telem.orientationQ.z = physQ.z
      telem.orientationQ.w = physQ.w
      const visQ = groupRef.current.quaternion
      telem.visualQ.x = visQ.x
      telem.visualQ.y = visQ.y
      telem.visualQ.z = visQ.z
      telem.visualQ.w = visQ.w

      // Update store (reactive — drives HUD / camera)
      setFlightSpeed(flightStateRef.current.speed)
      setIsBoosting(inp.boost)

      // ── Engine glow: contextual intensity based on thrust vector ──
      const et = ENGINE_TUNING
      let targetLeftGlow: number
      let targetRightGlow: number
      let targetRearGlow: number

      if (inp.boost && inp.thrust > 0) {
        // Boosting: maximum engine output
        targetLeftGlow = et.BASE_INTENSITY * et.BOOST_MULT
        targetRightGlow = et.BASE_INTENSITY * et.BOOST_MULT
        targetRearGlow = et.BASE_INTENSITY * et.BOOST_MULT * 0.7
      } else if (inp.thrust > 0) {
        // Forward thrust
        targetLeftGlow = et.BASE_INTENSITY * et.THRUST_MULT
        targetRightGlow = et.BASE_INTENSITY * et.THRUST_MULT
        targetRearGlow = et.BASE_INTENSITY * et.THRUST_MULT * 0.6
      } else if (inp.brake) {
        // Braking: engines dim
        targetLeftGlow = et.BASE_INTENSITY * et.BRAKE_MULT
        targetRightGlow = et.BASE_INTENSITY * et.BRAKE_MULT
        targetRearGlow = et.BASE_INTENSITY * et.BRAKE_MULT * 0.5
      } else if (inp.thrust < 0) {
        // Reverse: minimal engines
        targetLeftGlow = et.BASE_INTENSITY * et.REVERSE_MULT
        targetRightGlow = et.BASE_INTENSITY * et.REVERSE_MULT
        targetRearGlow = et.BASE_INTENSITY * et.REVERSE_MULT * 0.4
      } else {
        // Idle / coasting
        targetLeftGlow = et.BASE_INTENSITY * et.IDLE_MULT
        targetRightGlow = et.BASE_INTENSITY * et.IDLE_MULT
        targetRearGlow = et.BASE_INTENSITY * et.IDLE_MULT * 0.5
      }

      // Side thruster emphasis during turns: outer engine brightens
      if (Math.abs(yawInput) > 0.1) {
        const turnBoost = Math.abs(yawInput) * (et.TURN_SIDE_BOOST - 1)
        if (yawInput > 0) {
          // Turning left: right engine (outer) brightens
          targetRightGlow *= 1 + turnBoost
        } else {
          // Turning right: left engine (outer) brightens
          targetLeftGlow *= 1 + turnBoost
        }
      }

      // Smooth glow transitions
      const glowLerp = 1 - Math.exp(-et.GLOW_LERP_SPEED * safeDt)
      engineGlow.current.left += (targetLeftGlow - engineGlow.current.left) * glowLerp
      engineGlow.current.right += (targetRightGlow - engineGlow.current.right) * glowLerp
      engineGlow.current.rear += (targetRearGlow - engineGlow.current.rear) * glowLerp

      if (engineLight1.current) engineLight1.current.intensity = engineGlow.current.right
      if (engineLight2.current) engineLight2.current.intensity = engineGlow.current.left
      if (engineLight3.current) engineLight3.current.intensity = engineGlow.current.rear
    }
  })

  return (
    <group ref={groupRef} position={[OVERVIEW_POS.x, OVERVIEW_POS.y, OVERVIEW_POS.z]} scale={0.4}>
      {/* Inner rotation: GLTF model has +Z forward, THREE uses -Z forward */}
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} />
        <pointLight ref={engineLight1} color="#4466ff" intensity={2} distance={5} decay={2} position={[0.45, 0.05, 1.2]} />
        <pointLight ref={engineLight2} color="#4466ff" intensity={2} distance={5} decay={2} position={[-0.45, 0.05, 1.2]} />
        <pointLight ref={engineLight3} color="#2244cc" intensity={1} distance={10} decay={2} position={[0, 0.1, 1.8]} />
      </group>
      {/* Rim light — edge highlights */}
      <pointLight ref={rimLight} color="#6699ff" intensity={0} distance={20} decay={1.5} position={[0, 1.5, -2.5]} />
      {/* Forward fill — backlit glow */}
      <pointLight ref={fillLight} color="#aaccff" intensity={0} distance={25} decay={1.5} position={[0, 0.3, 4]} />
    </group>
  )
}

useGLTF.preload('/models/millennium-falcon.glb')
