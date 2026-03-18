import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../../shaders/milkyway.vert'
import fragmentShader from '../../shaders/milkyway.frag'

export function MilkyWay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({ u_time: { value: 0 } }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[280, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
