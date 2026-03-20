import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import surfaceVertexShader from '../../shaders/coruscant/surface.vert'
import surfaceFragmentShader from '../../shaders/coruscant/surface.frag'
import cloudsVertexShader from '../../shaders/coruscant/clouds.vert'
import cloudsFragmentShader from '../../shaders/coruscant/clouds.frag'
import atmosphereVertexShader from '../../shaders/coruscant/atmosphere.vert'
import atmosphereFragmentShader from '../../shaders/coruscant/atmosphere.frag'

interface CoruscantPlanetProps {
  position: [number, number, number]
  scale?: number
}

export function CoruscantPlanet({ position, scale = 1 }: CoruscantPlanetProps) {
  const surfaceRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  const lightDirection = useMemo(() => new THREE.Vector3(1, 0.2, 0.3).normalize(), [])

  const surfaceUniforms = useMemo(
    () => ({
      uLightDirection: { value: lightDirection },
      uTime: { value: 0 },
    }),
    [lightDirection]
  )

  const cloudsUniforms = useMemo(
    () => ({
      uLightDirection: { value: lightDirection },
      uTime: { value: 0 },
    }),
    [lightDirection]
  )

  const atmosphereUniforms = useMemo(
    () => ({
      uLightDirection: { value: lightDirection },
      uTime: { value: 0 },
    }),
    [lightDirection]
  )

  const baseRadius = 1.5 * scale
  const cloudsRadius = 1.52 * scale
  const atmosphereRadius = 1.53 * scale

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += 0.001
      ;(surfaceRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0015
      ;(cloudsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    }
    if (atmosphereRef.current) {
      ;(atmosphereRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    }
  })

  return (
    <group position={position}>
      {/* Surface — city lights and districts */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[baseRadius, 128, 128]} />
        <shaderMaterial
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Clouds / smog layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[cloudsRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={cloudsVertexShader}
          fragmentShader={cloudsFragmentShader}
          uniforms={cloudsUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[atmosphereRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
