import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'
import { resolveValue } from '../../utils/timeline'

import planetVert from '../../shaders/studio/planet.vert'
import planetFrag from '../../shaders/studio/planet.frag'
import fireVert from '../../shaders/studio/fire.vert'
import fireFrag from '../../shaders/studio/fire.frag'

export function StudioPlanet() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const config = useStudioStore((s) => s.config)
  const isRocky = config.mode === 'rocky'

  const rockyUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_displacement: { value: 0.25 },
      u_noiseFrequency: { value: 1.5 },
      u_noiseSeed: { value: 0 },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
      u_oceanLevel: { value: 0.35 },
      u_vegetation: { value: 0 },
      u_frost: { value: 0 },
      u_colorPrimary: { value: new THREE.Color('#8b7355') },
      u_colorSecondary: { value: new THREE.Color('#a0937a') },
      u_colorOcean: { value: new THREE.Color('#0a3066') },
      u_colorVegetation: { value: new THREE.Color('#1a8c1e') },
      u_colorSnow: { value: new THREE.Color('#e6eaf0') },
      u_colorFrost: { value: new THREE.Color('#c0ddf0') },
    }),
    []
  )

  const fireUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_intensity: { value: 0.8 },
      u_colorCore: { value: new THREE.Color('#fffff0') },
      u_colorMid: { value: new THREE.Color('#ff9a18') },
      u_colorEdge: { value: new THREE.Color('#cc1a02') },
      u_coronaGlow: { value: 0.6 },
    }),
    []
  )

  useFrame((state) => {
    const { config: cfg, evolution } = useStudioStore.getState()
    const t = state.clock.elapsedTime

    if (meshRef.current) {
      meshRef.current.rotation.y += resolveValue(cfg.rotationSpeed, evolution)
    }

    if (!matRef.current) return

    if (cfg.mode === 'rocky') {
      const u = matRef.current.uniforms
      u.u_time.value = t
      u.u_displacement.value = resolveValue(cfg.terrain.displacement, evolution)
      u.u_noiseFrequency.value = cfg.terrain.noiseFrequency
      u.u_noiseSeed.value = cfg.terrain.seed
      u.u_lightPosition.value.set(...cfg.lightPosition)
      u.u_oceanLevel.value = resolveValue(cfg.biome.oceanLevel, evolution)
      u.u_vegetation.value = resolveValue(cfg.biome.vegetation, evolution)
      u.u_frost.value = resolveValue(cfg.biome.frost, evolution)
      u.u_colorPrimary.value.set(cfg.colors.primary)
      u.u_colorSecondary.value.set(cfg.colors.secondary)
      u.u_colorOcean.value.set(cfg.colors.ocean)
      u.u_colorVegetation.value.set(cfg.colors.vegetation)
      u.u_colorSnow.value.set(cfg.colors.snow)
      u.u_colorFrost.value.set(cfg.colors.frost)
    } else {
      const u = matRef.current.uniforms
      u.u_time.value = t
      u.u_intensity.value = resolveValue(cfg.fire.intensity, evolution)
      u.u_colorCore.value.set(cfg.fire.colorCore)
      u.u_colorMid.value.set(cfg.fire.colorMid)
      u.u_colorEdge.value.set(cfg.fire.colorEdge)
      u.u_coronaGlow.value = cfg.fire.coronaGlow
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[config.size, 48]} />
      <shaderMaterial
        key={isRocky ? 'rocky' : 'star'}
        ref={matRef}
        vertexShader={isRocky ? planetVert : fireVert}
        fragmentShader={isRocky ? planetFrag : fireFrag}
        uniforms={isRocky ? rockyUniforms : fireUniforms}
      />
    </mesh>
  )
}
