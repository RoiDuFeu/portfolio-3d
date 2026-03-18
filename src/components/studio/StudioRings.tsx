import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'

import ringsVert from '../../shaders/studio/rings.vert'
import ringsFrag from '../../shaders/studio/rings.frag'

export function StudioRings() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const config = useStudioStore((s) => s.config)
  const { rings } = config

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_colorInner: { value: new THREE.Color('#c8b080') },
      u_colorOuter: { value: new THREE.Color('#8a7050') },
      u_bandCount: { value: 8 },
      u_opacity: { value: 0.7 },
    }),
    []
  )

  useFrame((state) => {
    if (!matRef.current) return
    const { config: cfg } = useStudioStore.getState()
    const u = matRef.current.uniforms
    u.u_time.value = state.clock.elapsedTime
    u.u_colorInner.value.set(cfg.rings.colorInner)
    u.u_colorOuter.value.set(cfg.rings.colorOuter)
    u.u_bandCount.value = cfg.rings.bandCount
    u.u_opacity.value = cfg.rings.opacity
  })

  if (!rings.enabled) return null

  const innerR = config.size * rings.innerRadius
  const outerR = config.size * rings.outerRadius

  return (
    <mesh rotation={[Math.PI * 0.5 + rings.tilt, 0, 0]}>
      <ringGeometry args={[innerR, outerR, 128]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ringsVert}
        fragmentShader={ringsFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
