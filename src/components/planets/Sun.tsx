import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import sunVert from '../../shaders/sun.vert'
import sunFrag from '../../shaders/sun.frag'
import coronaVert from '../../shaders/corona.vert'
import coronaFrag from '../../shaders/corona.frag'
import haloVert from '../../shaders/sunHalo.vert'
import haloFrag from '../../shaders/sunHalo.frag'

const SUN_RADIUS = 3

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  const sunMatRef = useRef<THREE.ShaderMaterial>(null)
  const coronaMatRef1 = useRef<THREE.ShaderMaterial>(null)
  const coronaMatRef2 = useRef<THREE.ShaderMaterial>(null)
  const coronaMatRef3 = useRef<THREE.ShaderMaterial>(null)

  const sunUniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_intensity: { value: 1.0 },
    u_color: { value: new THREE.Color(1.0, 1.0, 1.0) },
  }), [])

  const makeCoronaUniforms = (radius: number) => ({
    u_time: { value: 0 },
    u_radius: { value: radius },
  })

  const coronaUniforms1 = useMemo(() => makeCoronaUniforms(SUN_RADIUS * 1.4), [])
  const coronaUniforms2 = useMemo(() => makeCoronaUniforms(SUN_RADIUS * 2.0), [])
  const coronaUniforms3 = useMemo(() => makeCoronaUniforms(SUN_RADIUS * 3.0), [])

  // Volumetric halo — subtle warm fog (reduced from 20x to 12x)
  const HALO_RADIUS = SUN_RADIUS * 12
  const haloUniforms = useMemo(() => ({
    u_sunRadius: { value: SUN_RADIUS },
    u_haloRadius: { value: HALO_RADIUS },
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y += 0.0003
    if (sunMatRef.current) sunMatRef.current.uniforms.u_time.value = t
    if (coronaMatRef1.current) coronaMatRef1.current.uniforms.u_time.value = t
    if (coronaMatRef2.current) coronaMatRef2.current.uniforms.u_time.value = t
    if (coronaMatRef3.current) coronaMatRef3.current.uniforms.u_time.value = t
  })

  return (
    <group>
      {/* Volumetric halo — subtle warm fog (rendered first, behind everything) */}
      <mesh renderOrder={-1}>
        <icosahedronGeometry args={[HALO_RADIUS, 24]} />
        <shaderMaterial
          vertexShader={haloVert}
          fragmentShader={haloFrag}
          uniforms={haloUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Core sun — procedural plasma */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[SUN_RADIUS, 48]} />
        <shaderMaterial
          ref={sunMatRef}
          vertexShader={sunVert}
          fragmentShader={sunFrag}
          uniforms={sunUniforms}
        />
      </mesh>

      {/* Inner corona — tight, bright streamer rays */}
      <mesh>
        <icosahedronGeometry args={[SUN_RADIUS * 1.4, 48]} />
        <shaderMaterial
          ref={coronaMatRef1}
          vertexShader={coronaVert}
          fragmentShader={coronaFrag}
          uniforms={coronaUniforms1}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mid corona — wider glow with ray structure */}
      <mesh>
        <icosahedronGeometry args={[SUN_RADIUS * 2.0, 32]} />
        <shaderMaterial
          ref={coronaMatRef2}
          vertexShader={coronaVert}
          fragmentShader={coronaFrag}
          uniforms={coronaUniforms2}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer corona — faint, wide halo */}
      <mesh>
        <icosahedronGeometry args={[SUN_RADIUS * 3.0, 16]} />
        <shaderMaterial
          ref={coronaMatRef3}
          vertexShader={coronaVert}
          fragmentShader={coronaFrag}
          uniforms={coronaUniforms3}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Light sources — warm orange */}
      <pointLight color="#FFA54F" intensity={3} distance={400} decay={1} />
      <pointLight color="#FF8030" intensity={1.5} distance={200} decay={2} />
    </group>
  )
}
