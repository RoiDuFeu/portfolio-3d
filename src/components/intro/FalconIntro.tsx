import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function FalconIntro() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/millennium-falcon.glb')
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Raw mouse target in normalised space (−1 → +1)
  const targetX = useRef(0)
  const targetY = useRef(0)
  // Smoothed values — intentionally slow so the ship feels heavy/inertial
  const smoothX = useRef(0)
  const smoothY = useRef(0)

  useEffect(() => {
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 2.5
          mat.needsUpdate = true
        }
      })
    })
  }, [clonedScene])

  // Desktop: mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetX.current =  (e.clientX / window.innerWidth  - 0.5) * 2
      targetY.current = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Mobile: touch tracking
  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      targetX.current =  (touch.clientX / window.innerWidth  - 0.5) * 2
      targetY.current = -(touch.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => window.removeEventListener('touchmove', onTouch)
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Lerp — 3 % per frame gives a pleasantly heavy, inertial feel
    smoothX.current += (targetX.current - smoothX.current) * 0.03
    smoothY.current += (targetY.current - smoothY.current) * 0.03

    const mx = smoothX.current
    const my = smoothY.current

    // ── Half-barrel roll response ────────────────────────────────────────────
    //
    //  mx * |mx|  is a quadratic curve:
    //    • near centre  → very gentle tilt (feels relaxed)
    //    • at the edge  → up to ±32° of bank (commits to a turn / half-barrel)
    //
    //  Adding a small yaw that follows the bank makes the nose track the turn,
    //  exactly like a real banked manoeuvre.
    //
    //  mx³ term on pitch: when heavily banked the nose lifts slightly (realistic
    //  — a pilot pulls back to maintain altitude through a bank).

    const roll  =  mx * Math.abs(mx) * 0.56   // quadratic — up to ±0.56 rad (32°)
    const yaw   =  mx * 0.18                   // linear — up to ±0.18 rad (10°)
    const pitch = -my * 0.13 + mx * mx * mx * 0.04

    // Idle animation (very subtle so the mouse dominates when used)
    const idleRoll  = Math.sin(t * 0.22) * 0.03
    const idlePitch = Math.sin(t * 0.17) * 0.018

    groupRef.current.rotation.set(
      idlePitch + pitch,
      Math.PI + yaw,   // Math.PI = base 180° so stern faces the camera
      idleRoll + roll, // positive local-Z with Y=π → right wing dips → right bank ✓
    )

    // Slight lateral drift: ship moves a little in the direction it's banking
    groupRef.current.position.x = mx * Math.abs(mx) * 0.25
    // Altitude drift
    groupRef.current.position.y = Math.sin(t * 0.42) * 0.18 - my * 0.08
  })

  return (
    // Vessel moved further from camera (Z = −4) for a better "chasing from behind" perspective
    <group ref={groupRef} position={[0, 0, -4]} scale={0.5}>
      <primitive object={clonedScene} />
      {/* Engine exhaust glow — local +Z (toward camera) after the 180° yaw */}
      <pointLight color="#4466ff" intensity={14} distance={5} decay={2} position={[ 0.45, 0.05, 1.2]} />
      <pointLight color="#4466ff" intensity={14} distance={5} decay={2} position={[-0.45, 0.05, 1.2]} />
      <pointLight color="#2244cc" intensity={8}  distance={10} decay={2} position={[0, 0.1, 1.8]} />
    </group>
  )
}
