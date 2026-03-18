import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import vertexShader from '../../shaders/planet.vert'
import fragmentShader from '../../shaders/uranus.frag'

interface UranusPlanetProps {
  size: number
  atmosphereColor?: string
}

export function UranusPlanet({ size, atmosphereColor = '#A8D8EA' }: UranusPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    // Uranus rotates on its side but still spins
    if (meshRef.current) meshRef.current.rotation.y += 0.0015
    if (materialRef.current)
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
  })

  // Uranus extreme axial tilt: 97.77°
  const tiltRad = THREE.MathUtils.degToRad(97.77)

  return (
    <group rotation={[tiltRad, 0, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <PlanetAtmosphere size={size} color={atmosphereColor} intensity={0.5} exponent={3.5} />
    </group>
  )
}
