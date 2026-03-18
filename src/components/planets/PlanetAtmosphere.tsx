import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import atmosphereVert from '../../shaders/atmosphere.vert'
import atmosphereFrag from '../../shaders/atmosphere.frag'

interface PlanetAtmosphereProps {
  size: number
  color: string
  intensity?: number
  exponent?: number
}

export function PlanetAtmosphere({
  size,
  color,
  intensity = 0.6,
  exponent = 4.0,
}: PlanetAtmosphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_color: { value: new THREE.Color(color) },
      u_intensity: { value: intensity },
      u_exponent: { value: exponent },
    }),
    []
  )

  useFrame(() => {
    if (!materialRef.current) return
    const u = materialRef.current.uniforms
    u.u_color.value.set(color)
    u.u_intensity.value = intensity
    u.u_exponent.value = exponent
  })

  return (
    <mesh scale={[1.04, 1.04, 1.04]}>
      <icosahedronGeometry args={[size, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVert}
        fragmentShader={atmosphereFrag}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
