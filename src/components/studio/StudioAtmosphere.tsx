import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'
import { resolveValue } from '../../utils/timeline'
import atmosphereVert from '../../shaders/atmosphere.vert'
import atmosphereFrag from '../../shaders/atmosphere.frag'

export function StudioAtmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      u_color: { value: new THREE.Color('#4488ff') },
      u_intensity: { value: 0.6 },
      u_exponent: { value: 4.0 },
    }),
    []
  )

  useFrame(() => {
    const { config, evolution } = useStudioStore.getState()
    if (!config.atmosphere.enabled) return

    if (materialRef.current) {
      const u = materialRef.current.uniforms
      u.u_color.value.set(config.atmosphere.color)
      u.u_intensity.value = resolveValue(config.atmosphere.intensity, evolution)
      u.u_exponent.value = config.atmosphere.exponent
    }

    if (meshRef.current) {
      const s = 1.04
      meshRef.current.scale.set(s, s, s)
    }
  })

  const config = useStudioStore((s) => s.config)
  if (!config.atmosphere.enabled) return null

  return (
    <mesh ref={meshRef} scale={[1.04, 1.04, 1.04]}>
      <icosahedronGeometry args={[config.size, 32]} />
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
