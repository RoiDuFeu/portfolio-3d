import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader, useFrame } from '@react-three/fiber'

// Import shaders
import surfaceVertexShader from '../../shaders/saturn/surface.vert'
import surfaceFragmentShader from '../../shaders/saturn/surface.frag'

interface RealisticSaturnProps {
  position: [number, number, number]
  scale?: number
}

export function RealisticSaturn({ position, scale = 1 }: RealisticSaturnProps) {
  const planetMeshRef = useRef<THREE.Mesh>(null)
  const ringsMeshRef = useRef<THREE.Mesh>(null)

  // Load textures
  const [saturnTexture, ringsTexture] = useLoader(THREE.TextureLoader, [
    '/textures/saturn/Saturn.jpg',
    "/textures/saturn/Saturn's rings.png",
  ])

  // Light direction (simulating sun position)
  const lightDirection = useMemo(() => new THREE.Vector3(1, 0, 0).normalize(), [])

  // Saturn surface uniforms
  const surfaceUniforms = useMemo(
    () => ({
      uTexture: { value: saturnTexture },
      uLightDirection: { value: lightDirection },
    }),
    [saturnTexture, lightDirection]
  )

  // Custom ring geometry with radial UV mapping
  const ringGeometry = useMemo(() => {
    const innerRadius = 2.2 * scale
    const outerRadius = 3.5 * scale
    const thetaSegments = 64

    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, 1)

    // Custom UV mapping for radial gradient
    const uvs: number[] = []
    for (let i = 0; i <= thetaSegments; i++) {
      uvs.push(i / thetaSegments, 1) // inner edge
      uvs.push(i / thetaSegments, 0) // outer edge
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))

    return geometry
  }, [scale])

  const baseRadius = 1.5 * scale

  // Auto-rotation with different speeds for planet and rings
  useFrame(() => {
    if (planetMeshRef.current) planetMeshRef.current.rotation.y += 0.001
    if (ringsMeshRef.current) ringsMeshRef.current.rotation.z += 0.0005 // Rings rotate slower
  })

  return (
    <group position={position}>
      {/* Saturn Planet */}
      <mesh ref={planetMeshRef}>
        <sphereGeometry args={[baseRadius, 64, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Saturn Rings */}
      <mesh ref={ringsMeshRef} geometry={ringGeometry} rotation={[Math.PI / 2, 0, 0.1]}>
        <meshBasicMaterial
          map={ringsTexture}
          transparent={true}
          side={THREE.DoubleSide}
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}
