import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import vertexShader from '../../shaders/planet.vert'
import fragmentShader from '../../shaders/venus.frag'

interface VenusPlanetProps {
  size: number
  atmosphereColor?: string
}

export function VenusPlanet({ size, atmosphereColor = '#F5DEB3' }: VenusPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    // Venus rotates very slowly and retrograde
    if (meshRef.current) meshRef.current.rotation.y -= 0.0001
    if (materialRef.current)
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <PlanetAtmosphere size={size} color={atmosphereColor} intensity={0.9} exponent={3.0} />
    </group>
  )
}
