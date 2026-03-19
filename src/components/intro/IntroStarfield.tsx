import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'
import * as THREE from 'three'

// ─── Constants ────────────────────────────────────────────────────────────────

const SPREAD_X   = 30
const SPREAD_Y   = 18
const DEPTH      = 75
const WRAP_FRONT = 8    // slightly past camera Z (camera is at ~8)

// Falcon world-space bounding sphere — stars that enter this sphere wrap early
// so they never appear to fly through the hull.
const FALCON_POS = new THREE.Vector3(0, 0, -4)
const FALCON_R2  = 2.8 * 2.8

// ─── Star texture ─────────────────────────────────────────────────────────────

function buildStarTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0.00, 'rgba(255,255,255,1.0)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.35, 'rgba(200,220,255,0.55)')
  g.addColorStop(0.65, 'rgba(150,180,255,0.15)')
  g.addColorStop(1.00, 'rgba(0,0,0,0)')

  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// ─── Geometry factory ─────────────────────────────────────────────────────────

function buildGeometry(starCount: number) {
  const positions = new Float32Array(starCount * 3)
  const colors    = new Float32Array(starCount * 3)

  const palette = [
    [1.00, 0.97, 0.88],
    [1.00, 0.95, 0.82],
    [1.00, 1.00, 1.00],
    [0.98, 0.98, 1.00],
    [0.85, 0.92, 1.00],
    [0.78, 0.88, 1.00],
    [0.65, 0.80, 1.00],
  ]
  const weights = [0.22, 0.18, 0.20, 0.18, 0.12, 0.07, 0.03]
  const cumulative = weights.reduce<number[]>((acc, w, i) => {
    acc.push((acc[i - 1] ?? 0) + w)
    return acc
  }, [])

  for (let i = 0; i < starCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * SPREAD_X
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y
    positions[i * 3 + 2] = -(Math.random() * DEPTH)

    const r = Math.random()
    const idx = cumulative.findIndex((v) => r <= v)
    const col = palette[idx === -1 ? palette.length - 1 : idx]
    const b = 0.75 + Math.random() * 0.25
    colors[i * 3 + 0] = col[0] * b
    colors[i * 3 + 1] = col[1] * b
    colors[i * 3 + 2] = col[2] * b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
  return geo
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IntroStarfield() {
  const pointsRef = useRef<THREE.Points>(null)
  const speedRef  = useRef(3.5)
  const appPhase  = useStore((s) => s.appPhase)
  const mode      = useStore((s) => s.performanceMode)

  // Resolve star count once on mount (component remounts when sceneKey changes)
  const starCount = PERFORMANCE_CONFIGS[mode].starCount

  const texture  = useMemo(() => buildStarTexture(), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(() => buildGeometry(starCount), [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const target = appPhase === 'hyperspace' ? 38 : 2.0
    speedRef.current += (target - speedRef.current) * Math.min(delta * 2.5, 1)

    const pos     = pointsRef.current.geometry.attributes.position.array as Float32Array
    const count   = pointsRef.current.geometry.attributes.position.count
    const clamped = Math.min(delta, 0.05)
    const step    = clamped * speedRef.current

    const tmp = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      const base = i * 3
      pos[base + 2] += step

      tmp.set(pos[base], pos[base + 1], pos[base + 2])
      if (tmp.distanceToSquared(FALCON_POS) < FALCON_R2) {
        pos[base + 2] = -(DEPTH * 0.5 + Math.random() * DEPTH * 0.5)
        pos[base]     = (Math.random() - 0.5) * SPREAD_X
        pos[base + 1] = (Math.random() - 0.5) * SPREAD_Y
        continue
      }

      if (pos[base + 2] > WRAP_FRONT) {
        pos[base + 2] -= DEPTH
        pos[base]      = (Math.random() - 0.5) * SPREAD_X
        pos[base + 1]  = (Math.random() - 0.5) * SPREAD_Y
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={texture}
        vertexColors
        size={0.20}
        sizeAttenuation
        transparent
        alphaTest={0.004}
        depthWrite={false}
      />
    </points>
  )
}
