import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

// ── Bolt tuning ──────────────────────────────────────────────────────────────

const MAX_BOLTS = 20
const BOLT_SPEED = 120          // units/s
const BOLT_LIFETIME = 2.0       // seconds
const BOLT_LENGTH = 3.0
const BOLT_WIDTH = 0.06
const FIRE_COOLDOWN = 0.15      // seconds between shots
const MUZZLE_FLASH_DECAY = 12.0 // intensity decay per second
const FIRE_SHAKE_INTENSITY = 1.2 // camera shake on fire (slightly stronger for punch)

// Bolt spawn offset (in ship-local space, two cannons on the Falcon)
const CANNON_OFFSETS = [
  new THREE.Vector3(0.55, -0.05, -1.5),   // right cannon
  new THREE.Vector3(-0.55, -0.05, -1.5),  // left cannon
]

// ── Types ────────────────────────────────────────────────────────────────────

interface Bolt {
  position: THREE.Vector3
  direction: THREE.Vector3
  age: number
  active: boolean
}

// ── Scratch objects ──────────────────────────────────────────────────────────

const _dir = new THREE.Vector3()
const _pos = new THREE.Vector3()
const _mat4 = new THREE.Matrix4()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3(1, 1, 1)

/**
 * Blaster bolt system — instanced mesh for performance.
 * Left-click fires bolts from the ship toward where the camera points.
 */
export function BlasterBolts() {
  const { camera } = useThree()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const boltsRef = useRef<Bolt[]>([])
  const cooldownRef = useRef(0)
  const cannonToggle = useRef(0)          // alternates between left/right cannon
  const muzzleIntensity = useRef(0)
  const muzzleLightRef = useRef<THREE.PointLight>(null)

  // Pre-allocate bolt pool
  useEffect(() => {
    const pool: Bolt[] = []
    for (let i = 0; i < MAX_BOLTS; i++) {
      pool.push({
        position: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        age: 0,
        active: false,
      })
    }
    boltsRef.current = pool
  }, [])

  // Mouse click listener
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // left click only
      const { isFlying } = useStore.getState()
      if (!isFlying) return
      if (cooldownRef.current > 0) return

      // Find an inactive bolt
      const bolt = boltsRef.current.find((b) => !b.active)
      if (!bolt) return

      const { falconWorldPosition, falconOrientation } = useStore.getState()

      // Fire direction: where the camera is looking
      camera.getWorldDirection(_dir)
      _dir.normalize()

      // Spawn position: ship position + cannon offset (in ship-local space)
      const cannon = CANNON_OFFSETS[cannonToggle.current % CANNON_OFFSETS.length]
      _pos.copy(cannon).applyQuaternion(falconOrientation).add(falconWorldPosition)
      cannonToggle.current++

      bolt.position.copy(_pos)
      bolt.direction.copy(_dir)
      bolt.age = 0
      bolt.active = true

      cooldownRef.current = FIRE_COOLDOWN

      // Camera fire shake — punchy but brief
      useStore.getState().fireShakeIntensity = FIRE_SHAKE_INTENSITY

      // Signal secondary motion recoil on the Falcon body
      useStore.getState().fireRecoilTrigger++

      // Muzzle flash
      muzzleIntensity.current = 8.0
    }

    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [camera])

  // Geometry + material (memoized)
  const geometry = useMemo(
    () => new THREE.BoxGeometry(BOLT_WIDTH, BOLT_WIDTH, BOLT_LENGTH),
    [],
  )
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x4488ff, toneMapped: false }),
    [],
  )

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1)
    const mesh = meshRef.current
    if (!mesh) return

    // Cooldown
    if (cooldownRef.current > 0) {
      cooldownRef.current = Math.max(0, cooldownRef.current - dt)
    }

    // Muzzle flash decay
    if (muzzleLightRef.current) {
      muzzleIntensity.current = Math.max(0, muzzleIntensity.current - MUZZLE_FLASH_DECAY * dt)
      muzzleLightRef.current.intensity = muzzleIntensity.current

      // Position muzzle light at the ship
      const { falconWorldPosition } = useStore.getState()
      muzzleLightRef.current.position.copy(falconWorldPosition)
    }

    // Update bolts
    let activeCount = 0
    for (let i = 0; i < boltsRef.current.length; i++) {
      const bolt = boltsRef.current[i]
      if (!bolt.active) continue

      bolt.age += dt
      if (bolt.age > BOLT_LIFETIME) {
        bolt.active = false
        continue
      }

      // Advance position
      bolt.position.addScaledVector(bolt.direction, BOLT_SPEED * dt)

      // Build instance matrix: position + rotation aligned to direction
      _quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), bolt.direction)
      _mat4.compose(bolt.position, _quat, _scale)
      mesh.setMatrixAt(activeCount, _mat4)
      activeCount++
    }

    mesh.count = activeCount
    if (activeCount > 0) {
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, MAX_BOLTS]}
        frustumCulled={false}
      />
      <pointLight
        ref={muzzleLightRef}
        color="#4488ff"
        intensity={0}
        distance={15}
        decay={2}
      />
    </>
  )
}
