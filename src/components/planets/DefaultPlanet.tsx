import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'

interface DefaultPlanetProps {
  position: [number, number, number]
  color: string
  size: number
  projectId: string
}

export function DefaultPlanet({ position, color, size, projectId }: DefaultPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
      </mesh>
      <PlanetAtmosphere size={size} color={color} />
    </group>
  )
}
