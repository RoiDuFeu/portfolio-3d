import { useMemo } from 'react'
import * as THREE from 'three'

export function StudioEnvironment() {
  const starPositions = useMemo(() => {
    const count = 2000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[starPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
