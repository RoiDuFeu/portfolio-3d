import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import vertexShader from '../../shaders/planet.vert'
import fragmentShader from '../../shaders/saturn.frag'
import ringsVert from '../../shaders/studio/rings.vert'
import ringsFrag from '../../shaders/studio/rings.frag'

interface SaturnPlanetProps {
  size: number
  atmosphereColor?: string
}

export function SaturnPlanet({ size, atmosphereColor = '#F0E6C8' }: SaturnPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const ringMatRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  )

  const ringUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_colorInner: { value: new THREE.Color('#C4A55A') },
      u_colorOuter: { value: new THREE.Color('#8B7D5B') },
      u_bandCount: { value: 12.0 },
      u_opacity: { value: 0.75 },
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y += 0.0025
    if (materialRef.current) materialRef.current.uniforms.u_time.value = t
    if (ringMatRef.current) ringMatRef.current.uniforms.u_time.value = t
  })

  // Saturn axial tilt: 26.73°
  const tiltRad = THREE.MathUtils.degToRad(26.73)

  return (
    <group rotation={[tiltRad, 0, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 48]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Rings: inner at 1.2x, outer at 2.3x planet radius */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 2.3, 128, 1]} />
        <shaderMaterial
          ref={ringMatRef}
          vertexShader={ringsVert}
          fragmentShader={ringsFrag}
          uniforms={ringUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <PlanetAtmosphere size={size} color={atmosphereColor} intensity={0.3} exponent={4.5} />
    </group>
  )
}
