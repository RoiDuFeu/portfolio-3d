import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 300

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3] = (Math.random() - 0.5) * 80
      pos[i3 + 1] = (Math.random() - 0.5) * 30
      pos[i3 + 2] = (Math.random() - 0.5) * 80
      sizes[i] = Math.random() * 0.06 + 0.02
    }
    return [pos, sizes]
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.003
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#9999bb"
        size={0.06}
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Distant galaxies rendered as faint, slightly elongated smudges
 * scattered across the far sky.
 */
export function DistantGalaxies() {
  const count = 40

  const meshes = useMemo(() => {
    const items: {
      pos: [number, number, number]
      rot: [number, number, number]
      scale: [number, number, number]
      color: string
      opacity: number
    }[] = []

    for (let i = 0; i < count; i++) {
      const radius = 200 + Math.random() * 80
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      // Slight elongation (elliptical galaxy shape)
      const baseScale = 0.5 + Math.random() * 1.5
      const elongation = 0.4 + Math.random() * 0.6

      // Warm to cool galaxy colors
      const colorChoice = Math.random()
      const color =
        colorChoice < 0.3 ? '#FFE8C0' // warm spiral
        : colorChoice < 0.6 ? '#C0D0FF' // blue elliptical
        : '#E0D0C0' // neutral

      items.push({
        pos: [x, y, z],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: [baseScale, baseScale * elongation, 1],
        color,
        opacity: 0.03 + Math.random() * 0.06,
      })
    }

    return items
  }, [])

  return (
    <>
      {meshes.map((g, i) => (
        <mesh key={i} position={g.pos} rotation={g.rot} scale={g.scale}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            color={g.color}
            transparent
            opacity={g.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  )
}
