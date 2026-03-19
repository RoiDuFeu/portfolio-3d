import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  scale?: number
}

export function MillenniumFalcon({ position, scale = 1 }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/millennium-falcon.glb')

  // Clone so multiple instances don't share state
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Boost env map intensity on all PBR materials for hull reflections
  useEffect(() => {
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 1.5
          mat.needsUpdate = true
        }
      })
    })
  }, [clonedScene])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    // Slow cinematic rotation
    groupRef.current.rotation.y += delta * 0.06
    // Subtle floating
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.25
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene} />
      {/* Engine exhaust glow — bloomed by the existing PostProcessing Bloom */}
      <pointLight color="#6699ff" intensity={4} distance={5} decay={2} position={[0.3, 0, -1]} />
      <pointLight color="#6699ff" intensity={4} distance={5} decay={2} position={[-0.3, 0, -1]} />
    </group>
  )
}

useGLTF.preload('/models/millennium-falcon.glb')
