import { useMemo } from 'react'
import * as THREE from 'three'

export function StudioEnvironment() {
  const { positions, sizes, colors } = useMemo(() => {
    const count = 4000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = 0.15 + Math.random() * 0.35

      const roll = Math.random()
      if (roll < 0.12) {
        // Hot blue-white star
        colors[i * 3] = 0.7 + Math.random() * 0.2
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2
        colors[i * 3 + 2] = 1.0
      } else if (roll < 0.2) {
        // Warm orange star
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.2
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.2
      } else {
        // White star
        const w = 0.85 + Math.random() * 0.15
        colors[i * 3] = w
        colors[i * 3 + 1] = w
        colors[i * 3 + 2] = w
      }
    }
    return { positions, sizes, colors }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
