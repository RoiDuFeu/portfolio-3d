import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SimpleGlowStarProps {
  position: [number, number, number]
  scale: number
  color: string
  intensity?: number
}

// Shared radial-gradient texture (created once, reused by all instances)
let _glowTexture: THREE.Texture | null = null
function getGlowTexture(): THREE.Texture {
  if (_glowTexture) return _glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  _glowTexture = new THREE.CanvasTexture(canvas)
  return _glowTexture
}

/**
 * Lightweight star for distant/small suns.
 * Renders a glowing emissive sphere + circular billboard glow + single point light.
 */
export function SimpleGlowStar({
  position,
  scale,
  color,
  intensity = 1,
}: SimpleGlowStarProps) {
  const glowRef = useRef<THREE.Sprite>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const baseRadius = 3 * scale
  const threeColor = useMemo(() => new THREE.Color(color), [color])
  const glowMap = useMemo(() => getGlowTexture(), [])

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.1
      glowRef.current.scale.setScalar(baseRadius * 6 * pulse)
    }
    if (lightRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.55 + position[2]) * 0.08
      lightRef.current.intensity = 3.0 * intensity * pulse
    }
  })

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[baseRadius, 24, 16]} />
        <meshBasicMaterial color={threeColor} toneMapped={false} />
      </mesh>

      {/* Circular glow billboard */}
      <sprite ref={glowRef} scale={[baseRadius * 6, baseRadius * 6, 1]}>
        <spriteMaterial
          map={glowMap}
          color={threeColor}
          transparent
          opacity={0.25 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Single point light */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={3.0 * intensity}
        distance={80 * scale}
        decay={2}
      />
    </group>
  )
}
