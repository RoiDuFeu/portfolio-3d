import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import vertexShader from '../../shaders/godsplan.vert'
import fragmentShader from '../../shaders/godsplan.frag'

interface GodsPlanPlanetProps {
  position: [number, number, number]
  color: string
  size: number
  projectId: string
}

export function GodsPlanPlanet({ position, color, size, projectId }: GodsPlanPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
    }),
    []
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0008
    }
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 48]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <PlanetAtmosphere size={size} color={color} intensity={0.5} exponent={4.0} />
    </group>
  )
}
