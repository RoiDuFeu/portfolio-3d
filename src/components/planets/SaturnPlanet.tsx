import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import vertexShader from '../../shaders/planet.vert'
import fragmentShader from '../../shaders/saturn-procedural.frag'

interface SaturnPlanetProps {
  size: number
  atmosphereColor?: string
}

export function SaturnPlanet({ size, atmosphereColor = '#E6DCC4' }: SaturnPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    // Saturn rotates moderately (10.7 hour day)
    if (meshRef.current) meshRef.current.rotation.y += 0.002
    if (materialRef.current)
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 48]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <PlanetAtmosphere size={size} color={atmosphereColor} intensity={0.3} exponent={4.5} />
    </group>
  )
}
