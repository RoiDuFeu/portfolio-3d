import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'
import { resolveValue } from '../../utils/timeline'

import oceanVert from '../../shaders/studio/ocean.vert'
import oceanFrag from '../../shaders/studio/ocean.frag'

export function StudioOcean() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const config = useStudioStore((s) => s.config)

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_waveAmplitude: { value: 0.01 },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
      u_colorDeep: { value: new THREE.Color('#050f28') },
      u_colorShallow: { value: new THREE.Color('#0a3066') },
      u_transparency: { value: 0.85 },
    }),
    []
  )

  useFrame((state) => {
    if (!matRef.current) return
    const { config: cfg, evolution } = useStudioStore.getState()
    const u = matRef.current.uniforms
    u.u_time.value = state.clock.elapsedTime
    u.u_lightPosition.value.set(...cfg.lightPosition)

    const oceanColor = new THREE.Color(cfg.colors.ocean)
    u.u_colorDeep.value.copy(oceanColor).multiplyScalar(0.4)
    u.u_colorShallow.value.copy(oceanColor)
    u.u_transparency.value = 0.85

    // Ocean sphere radius: planet size scaled by ocean level
    const oceanLevel = resolveValue(cfg.biome.oceanLevel, evolution)
    const displacement = resolveValue(cfg.terrain.displacement, evolution)
    const scale = 1.0 + oceanLevel * displacement * 0.3
    matRef.current.userData.targetScale = scale
  })

  // Ocean level determines sphere scale
  const oceanLevel = resolveValue(config.biome.oceanLevel, 0)
  const displacement = resolveValue(config.terrain.displacement, 0)
  const oceanScale = 1.0 + oceanLevel * displacement * 0.3

  if (config.mode !== 'rocky') return null

  return (
    <mesh scale={[oceanScale, oceanScale, oceanScale]}>
      <icosahedronGeometry args={[config.size, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={oceanVert}
        fragmentShader={oceanFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
