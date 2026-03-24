import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader, useFrame } from '@react-three/fiber'

// Preload textures at module level
useLoader.preload(THREE.TextureLoader, [
  '/textures/moon/Moon.jpg',
  '/textures/moon/Moon normal map.jpg',
])

// Import shaders
import surfaceVertexShader from '../../shaders/moon/surface.vert'
import surfaceFragmentShader from '../../shaders/moon/surface.frag'

interface RealisticMoonProps {
  position: [number, number, number]
  scale?: number
}

export function RealisticMoon({ position, scale = 1 }: RealisticMoonProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load textures with useMemo for performance
  const [moonTexture, normalMap] = useLoader(THREE.TextureLoader, [
    '/textures/moon/Moon.jpg',
    '/textures/moon/Moon normal map.jpg',
  ])

  // Light direction (simulating sun position)
  const lightDirection = useMemo(() => new THREE.Vector3(1, 0, 0).normalize(), [])

  // Surface material uniforms
  const surfaceUniforms = useMemo(
    () => ({
      uTexture: { value: moonTexture },
      uNormalMap: { value: normalMap },
      uLightDirection: { value: lightDirection },
    }),
    [moonTexture, normalMap, lightDirection]
  )

  const baseRadius = 1.5 * scale

  // Auto-rotation with smooth animation
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001
  })

  return (
    <group position={position}>
      {/* Moon Surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[baseRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>
    </group>
  )
}
