import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../../shaders/planet.vert'
import fragmentShader from '../../shaders/mercury.frag'

interface MercuryPlanetProps {
  size: number
}

export function MercuryPlanet({ size }: MercuryPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0002
    if (materialRef.current)
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[size, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
