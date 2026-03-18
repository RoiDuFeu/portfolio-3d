import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../../shaders/nebula.vert'
import fragmentShader from '../../shaders/nebula.frag'

interface NebulaCloudProps {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color1: string
  color2: string
  opacity: number
}

function NebulaCloud({ position, rotation, scale, color1, color2, opacity }: NebulaCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color1: { value: new THREE.Color(color1) },
      u_color2: { value: new THREE.Color(color2) },
      u_opacity: { value: opacity },
    }),
    [color1, color2, opacity]
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[scale, scale]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function Nebula() {
  return (
    <>
      {/* Emission nebula — reddish/pink HII region */}
      <NebulaCloud
        position={[-50, 20, -100]}
        rotation={[0.3, 0.5, 0.1]}
        scale={140}
        color1="#2a0a0a"
        color2="#4a1020"
        opacity={0.06}
      />
      {/* Reflection nebula — blue dust cloud */}
      <NebulaCloud
        position={[40, -15, -120]}
        rotation={[-0.2, -0.3, 0.15]}
        scale={110}
        color1="#0a1030"
        color2="#081828"
        opacity={0.05}
      />
      {/* Warm diffuse cloud */}
      <NebulaCloud
        position={[0, 30, -90]}
        rotation={[0.6, 0.1, -0.2]}
        scale={90}
        color1="#1a1008"
        color2="#0a0818"
        opacity={0.04}
      />
      {/* Faint deep-space background cloud */}
      <NebulaCloud
        position={[-30, -25, -140]}
        rotation={[0.1, 0.7, 0.3]}
        scale={160}
        color1="#080510"
        color2="#100818"
        opacity={0.03}
      />
    </>
  )
}
