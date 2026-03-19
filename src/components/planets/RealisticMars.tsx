import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import surfaceVert from '../../shaders/mars/surface.vert'
import surfaceFrag from '../../shaders/mars/surface.frag'
import atmosphereVert from '../../shaders/mars/atmosphere.vert'
import atmosphereFrag from '../../shaders/mars/atmosphere.frag'

interface RealisticMarsProps {
  position: [number, number, number]
  scale?: number
}

export function RealisticMars({ position, scale = 1 }: RealisticMarsProps) {
  const surfaceRef = useRef<THREE.Mesh>(null)

  const [marsTexture, normalMap] = useLoader(THREE.TextureLoader, [
    '/textures/mars/mars_color.jpg',
    '/textures/mars/mars_normal.png',
  ])

  // Light direction pointing from the Sun (at origin) toward Mars
  const lightDirection = useMemo(() => new THREE.Vector3(1, 0.1, 0.3).normalize(), [])

  const surfaceUniforms = useMemo(() => ({
    uTexture:        { value: marsTexture },
    uNormalMap:      { value: normalMap },
    uLightDirection: { value: lightDirection },
  }), [marsTexture, normalMap, lightDirection])

  const atmosphereUniforms = useMemo(() => ({
    u_lightDir: { value: lightDirection },
  }), [lightDirection])

  const radius      = 1.5 * scale
  const atmosRadius = radius * 1.025

  useFrame(() => {
    if (surfaceRef.current) surfaceRef.current.rotation.y += 0.0016
  })

  return (
    <group position={position}>
      {/* Surface with real NASA-derived texture + normal map */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVert}
          fragmentShader={surfaceFrag}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Thin CO2 atmosphere — pinkish-orange haze rim */}
      <mesh>
        <sphereGeometry args={[atmosRadius, 32, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVert}
          fragmentShader={atmosphereFrag}
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
