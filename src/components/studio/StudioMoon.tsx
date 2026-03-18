import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStudioStore } from '../../store/useStudioStore'
import type { MoonConfig } from '../../types/studio'

import moonVert from '../../shaders/studio/moon.vert'
import moonFrag from '../../shaders/studio/moon.frag'

interface StudioMoonProps {
  moon: MoonConfig
}

export function StudioMoon({ moon }: StudioMoonProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      u_color: { value: new THREE.Color(moon.color) },
      u_colorSecondary: { value: new THREE.Color(moon.colorSecondary) },
      u_roughness: { value: moon.roughness },
      u_craterStrength: { value: moon.craterStrength },
      u_lightPosition: { value: new THREE.Vector3(30, 20, 30) },
    }),
    []
  )

  useFrame((state) => {
    const { config } = useStudioStore.getState()
    const t = state.clock.elapsedTime

    // Orbit
    if (groupRef.current) {
      const angle = t * moon.orbitSpeed
      groupRef.current.position.set(
        Math.cos(angle) * moon.orbitRadius,
        Math.sin(moon.orbitTilt) * Math.sin(angle) * moon.orbitRadius,
        Math.sin(angle) * moon.orbitRadius
      )
    }

    // Self-rotation (tidally locked — slow spin)
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }

    // Update uniforms
    if (matRef.current) {
      const u = matRef.current.uniforms
      u.u_color.value.set(moon.color)
      u.u_colorSecondary.value.set(moon.colorSecondary)
      u.u_roughness.value = moon.roughness
      u.u_craterStrength.value = moon.craterStrength
      u.u_lightPosition.value.set(...config.lightPosition)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[moon.size, 32]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={moonVert}
          fragmentShader={moonFrag}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  )
}
