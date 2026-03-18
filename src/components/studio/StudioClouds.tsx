import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'
import { resolveValue } from '../../utils/timeline'

import cloudsVert from '../../shaders/studio/clouds.vert'
import cloudsFrag from '../../shaders/studio/clouds.frag'

export function StudioClouds() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const config = useStudioStore((s) => s.config)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
      u_cloudDensity: { value: 0.4 },
      u_cloudSpeed: { value: 0.3 },
      u_cloudColor: { value: new THREE.Color('#ffffff') },
      u_cloudOpacity: { value: 0.6 },
    }),
    []
  )

  useFrame((state) => {
    if (!matRef.current) return
    const { config: cfg, evolution } = useStudioStore.getState()
    const u = matRef.current.uniforms
    u.u_time.value = state.clock.elapsedTime
    u.u_lightPosition.value.set(...cfg.lightPosition)
    u.u_cloudDensity.value = resolveValue(cfg.clouds.density, evolution)
    u.u_cloudSpeed.value = cfg.clouds.speed
    u.u_cloudColor.value.set(cfg.clouds.color)
    u.u_cloudOpacity.value = resolveValue(cfg.clouds.density, evolution) * 0.7
  })

  if (config.mode !== 'rocky' || !config.clouds.enabled) return null

  const cloudScale = 1.03

  return (
    <mesh scale={[cloudScale, cloudScale, cloudScale]}>
      <icosahedronGeometry args={[config.size, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cloudsVert}
        fragmentShader={cloudsFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
