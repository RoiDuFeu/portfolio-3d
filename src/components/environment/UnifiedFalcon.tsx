import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Single Millennium Falcon for all scene phases:
 *   intro      → mouse-reactive idle at [0, 0, -4]
 *   hyperspace → cruises through the tunnel, LOOPING until solar system is ready
 *   arriving   → parked at tunnel exit
 *   main       → static, stern faces camera
 */

// Solar system center in world space
const SOLAR_SYSTEM_Z = -2000

// Key positions
const INTRO_POS = new THREE.Vector3(0, 0, -4)
const SOLAR_SYSTEM_RADIUS = 130
const TUNNEL_EXIT = new THREE.Vector3(0, 0, SOLAR_SYSTEM_Z + SOLAR_SYSTEM_RADIUS) // [0, 0, -1870]
const GALAXY_POS = TUNNEL_EXIT

// Tunnel cruise zone — falcon oscillates in this range while loading
// Tunnel is from world z=-80 to z=-1500
const CRUISE_Z_START = -100  // just past tunnel entrance
const CRUISE_Z_END = -1400   // before tunnel exit
const CRUISE_RANGE = CRUISE_Z_END - CRUISE_Z_START // -1300

// Exit flight: from cruise position to TUNNEL_EXIT
const EXIT_DURATION = 2000 // ms

// Reusable vectors
const _away = new THREE.Vector3()

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

  // Hyperspace state
  const hyperspaceStart = useRef(0)
  const prevPhase = useRef<string>('intro')
  const arrivedTriggered = useRef(false)

  // Entry animation: fly from lobby into tunnel (first 1.5s)
  const ENTRY_DURATION = 1500

  // Exit flight state
  const exitStart = useRef(0)
  const exitFromZ = useRef(CRUISE_Z_START)

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

  useFrame((state) => {
    if (!groupRef.current) return

    const { appPhase, setAppPhase, falconWorldPosition, hyperspaceReady } = useStore.getState()
    const t = state.clock.elapsedTime

    // Detect hyperspace start
    if (appPhase === 'hyperspace' && prevPhase.current === 'intro') {
      hyperspaceStart.current = performance.now()
      arrivedTriggered.current = false
      exitStart.current = 0
    }
    prevPhase.current = appPhase

    // ── INTRO: mouse-reactive idle ─────────────────────────────────────────
    if (appPhase === 'intro') {
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

    // ── HYPERSPACE ─────────────────────────────────────────────────────────
    if (appPhase === 'hyperspace') {
      const elapsed = performance.now() - hyperspaceStart.current

      let pz: number

      if (!hyperspaceReady) {
        // Phase A: Entry (fly into tunnel) then cruise/loop
        if (elapsed < ENTRY_DURATION) {
          // Fly from lobby into cruise zone
          const entryProgress = easeInOutCubic(elapsed / ENTRY_DURATION)
          pz = THREE.MathUtils.lerp(INTRO_POS.z, CRUISE_Z_START, entryProgress)
        } else {
          // Cruise: oscillate steadily through the tunnel
          // ~4 seconds per full pass, using a sine wave
          const cruiseTime = (elapsed - ENTRY_DURATION) * 0.001
          const cruisePhase = Math.sin(cruiseTime * 0.8) * 0.5 + 0.5 // 0..1
          pz = CRUISE_Z_START + cruisePhase * CRUISE_RANGE
        }
      } else {
        // Phase B: Solar system ready — fly to tunnel exit
        if (exitStart.current === 0) {
          exitStart.current = performance.now()
          exitFromZ.current = groupRef.current.position.z
        }

        const exitElapsed = performance.now() - exitStart.current
        const exitProgress = Math.min(exitElapsed / EXIT_DURATION, 1)
        const eased = easeOutCubic(exitProgress)

        pz = THREE.MathUtils.lerp(exitFromZ.current, TUNNEL_EXIT.z, eased)

        // Exit tunnel when done
        if (exitProgress >= 1 && !arrivedTriggered.current) {
          arrivedTriggered.current = true
          setAppPhase('arriving')
        }
      }

      groupRef.current.position.set(0, 0, pz)

      // Scale
      const totalProgress = Math.min(elapsed / 3000, 1)
      const scale = THREE.MathUtils.lerp(0.5, 0.4, totalProgress)
      groupRef.current.scale.setScalar(scale)

      // Dampen mouse banking
      const mouseFade = Math.max(1 - totalProgress * 2, 0)
      smoothX.current += (targetX.current - smoothX.current) * 0.03 * mouseFade
      smoothY.current *= 0.98

      const mx = smoothX.current * mouseFade
      const roll = mx * Math.abs(mx) * 0.56 * mouseFade
      const yaw = mx * 0.18 * mouseFade

      groupRef.current.rotation.set(0, Math.PI + yaw, roll)
      falconWorldPosition.copy(groupRef.current.position)
    }

    // ── ARRIVING + MAIN ────────────────────────────────────────────────────
    if (appPhase === 'arriving' || appPhase === 'main') {
      groupRef.current.position.copy(GALAXY_POS)
      groupRef.current.scale.setScalar(0.4)

      _away.copy(groupRef.current.position).multiplyScalar(2).sub(camera.position)
      groupRef.current.lookAt(_away)

      falconWorldPosition.copy(groupRef.current.position)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -4]} scale={0.5}>
      <primitive object={clonedScene} />
      <pointLight color="#4466ff" intensity={14} distance={5} decay={2} position={[0.45, 0.05, 1.2]} />
      <pointLight color="#4466ff" intensity={14} distance={5} decay={2} position={[-0.45, 0.05, 1.2]} />
      <pointLight color="#2244cc" intensity={8} distance={10} decay={2} position={[0, 0.1, 1.8]} />
    </group>
  )
}

useGLTF.preload('/models/millennium-falcon.glb')
