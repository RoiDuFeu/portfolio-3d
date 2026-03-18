import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import { useStore } from '../../store/useStore'
import vertexShader from '../../shaders/fertiscale.vert'
import fragmentShader from '../../shaders/fertiscale.frag'

interface FertiscalePlanetProps {
  position: [number, number, number]
  color: string
  size: number
  projectId: string
}

export function FertiscalePlanet({ position, color, size, projectId }: FertiscalePlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_timelineProgress: { value: 0.5 },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
    }),
    []
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime

      // Timeline progress driven by scroll proximity
      const scrollProgress = useStore.getState().scrollProgress
      const progress = Math.min(1, scrollProgress * 2.5)
      materialRef.current.uniforms.u_timelineProgress.value = progress
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
      <PlanetAtmosphere size={size} color={color} intensity={0.5} exponent={3.5} />
    </group>
  )
}
