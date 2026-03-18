import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import { useStore } from '../../store/useStore'
import vertexShader from '../../shaders/music.vert'
import fragmentShader from '../../shaders/music.frag'

interface MusicPlanetProps {
  position: [number, number, number]
  color: string
  size: number
  projectId: string
}

export function MusicPlanet({ position, color, size, projectId }: MusicPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Create 1D frequency DataTexture
  const frequencyTexture = useMemo(() => {
    const data = new Uint8Array(128)
    const texture = new THREE.DataTexture(data, 128, 1, THREE.RedFormat)
    texture.needsUpdate = true
    return texture
  }, [])

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_beat: { value: 0 },
      u_energy: { value: 0 },
      u_frequencies: { value: frequencyTexture },
    }),
    [frequencyTexture]
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
    if (materialRef.current) {
      const store = useStore.getState()
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
      materialRef.current.uniforms.u_beat.value = store.beat
      materialRef.current.uniforms.u_energy.value = store.energy

      // Update frequency texture from store
      const freqs = store.frequencies
      const texData = frequencyTexture.image.data as Uint8Array
      for (let i = 0; i < Math.min(freqs.length, texData.length); i++) {
        texData[i] = Math.floor(freqs[i] * 255)
      }
      frequencyTexture.needsUpdate = true
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
      <PlanetAtmosphere size={size} color={color} intensity={0.7} exponent={3.0} />
    </group>
  )
}
