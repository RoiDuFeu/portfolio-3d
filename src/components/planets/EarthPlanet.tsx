import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader, useFrame } from '@react-three/fiber'

// Preload textures at module level so they start loading immediately
useLoader.preload(THREE.TextureLoader, [
  '/textures/earth/World map.jpg',
  '/textures/earth/Earth normal map.jpg',
  '/textures/earth/Earth specular map.jpg',
  '/textures/earth/Earth night lights.jpg',
  '/textures/earth/Cloud cover.png',
])

// Import shaders
import surfaceVertexShader from '../../shaders/earth/surface.vert'
import surfaceFragmentShader from '../../shaders/earth/surface.frag'
import cloudsVertexShader from '../../shaders/earth/clouds.vert'
import cloudsFragmentShader from '../../shaders/earth/clouds.frag'
import atmosphereVertexShader from '../../shaders/earth/atmosphere.vert'
import atmosphereFragmentShader from '../../shaders/earth/atmosphere.frag'

interface EarthPlanetProps {
  position: [number, number, number]
  scale?: number
}

export function EarthPlanet({ position, scale = 1 }: EarthPlanetProps) {
  const surfaceMeshRef = useRef<THREE.Mesh>(null)
  const cloudsMeshRef = useRef<THREE.Mesh>(null)
  const atmosphereMeshRef = useRef<THREE.Mesh>(null)

  // Load textures with useMemo for performance
  const [worldMap, normalMap, specularMap, nightLights, cloudCover] = useLoader(
    THREE.TextureLoader,
    [
      '/textures/earth/World map.jpg',
      '/textures/earth/Earth normal map.jpg',
      '/textures/earth/Earth specular map.jpg',
      '/textures/earth/Earth night lights.jpg',
      '/textures/earth/Cloud cover.png',
    ]
  )

  // Light direction (simulating sun position)
  const lightDirection = useMemo(() => new THREE.Vector3(1, 0, 0).normalize(), [])

  // Surface material uniforms
  const surfaceUniforms = useMemo(
    () => ({
      uWorldMap: { value: worldMap },
      uNormalMap: { value: normalMap },
      uSpecularMap: { value: specularMap },
      uNightLights: { value: nightLights },
      uCloudCover: { value: cloudCover },
      uLightDirection: { value: lightDirection },
    }),
    [worldMap, normalMap, specularMap, nightLights, cloudCover, lightDirection]
  )

  // Clouds material uniforms
  const cloudsUniforms = useMemo(
    () => ({
      uCloudCover: { value: cloudCover },
      uLightDirection: { value: lightDirection },
    }),
    [cloudCover, lightDirection]
  )

  // Atmosphere material uniforms
  const atmosphereUniforms = useMemo(
    () => ({
      uLightDirection: { value: lightDirection },
    }),
    [lightDirection]
  )

  const baseRadius = 1.5 * scale
  const cloudsRadius = 1.53 * scale
  const atmosphereRadius = 1.55 * scale

  // Auto-rotation with smooth animation
  useFrame(() => {
    if (surfaceMeshRef.current) surfaceMeshRef.current.rotation.y += 0.002
    if (cloudsMeshRef.current) cloudsMeshRef.current.rotation.y += 0.0025 // Clouds slightly faster
  })

  return (
    <group position={position}>
      {/* Earth Surface Layer */}
      <mesh ref={surfaceMeshRef}>
        <sphereGeometry args={[baseRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Clouds Layer */}
      <mesh ref={cloudsMeshRef}>
        <sphereGeometry args={[cloudsRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={cloudsVertexShader}
          fragmentShader={cloudsFragmentShader}
          uniforms={cloudsUniforms}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere Layer */}
      <mesh ref={atmosphereMeshRef}>
        <sphereGeometry args={[atmosphereRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
