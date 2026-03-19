import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Hyperspace tunnel rendered in the same R3F scene as the Falcon.
 * Hidden during idle — appears when appPhase becomes 'hyperspace'.
 * Stars in tube formation streak from ahead (-Z) past the camera (+Z).
 *
 * Transitions:
 *   - Fade in:  cylinder opacity 0→1 over 800ms, star brightness 0→1 over 600ms
 *   - Fade out: speed decelerates when appPhase leaves 'hyperspace'
 */

const STAR_COUNT  = 3000
const TUBE_RADIUS = 6
const TUBE_LENGTH = 300
const TUBE_Z_FAR  = -270   // far ahead of Falcon
const TUBE_Z_NEAR = 30     // behind camera

// Falcon sits at [0, 0, -4] at scale 0.5 — keep stars clear of the hull
const MIN_INTERIOR_R = 2.0

const FADE_IN_CYL   = 800   // ms — cylinder opacity ramp
const FADE_IN_STARS  = 600   // ms — star brightness ramp

function randomRadius() {
  const isWall = Math.random() < 0.70
  return isWall
    ? TUBE_RADIUS * 0.60 + Math.random() * TUBE_RADIUS * 0.30  // wall: r ∈ [3.6, 5.4]
    : MIN_INTERIOR_R + Math.random() * (TUBE_RADIUS * 0.55 - MIN_INTERIOR_R)  // interior: r ∈ [2.0, 3.3]
}

export function HyperspaceTunnel() {
  const appPhase     = useStore((s) => s.appPhase)
  const speedRef     = useRef(0)
  const activatedRef = useRef(false)
  const startTimeRef = useRef(0)
  const cylMatRef    = useRef<THREE.MeshBasicMaterial>(null)

  const stars = useMemo(() =>
    Array.from({ length: STAR_COUNT }, () => {
      const r = randomRadius()
      const a = Math.random() * Math.PI * 2
      return {
        x: r * Math.cos(a),
        y: r * Math.sin(a),
        z: TUBE_Z_FAR + Math.random() * TUBE_LENGTH,
        br: 0.55 + Math.random() * 0.45,
      }
    }),
  [])

  const geometry = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 6)
    const col = new Float32Array(STAR_COUNT * 6)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!activatedRef.current) return

    // Track elapsed since activation
    if (startTimeRef.current === 0) startTimeRef.current = performance.now()
    const elapsed = performance.now() - startTimeRef.current

    // ── Fade in cylinder ────────────────────────────────────────────────
    if (cylMatRef.current) {
      cylMatRef.current.opacity = Math.min(elapsed / FADE_IN_CYL, 1)
    }

    // ── Star brightness fade-in ─────────────────────────────────────────
    const starFade = Math.min(elapsed / FADE_IN_STARS, 1)

    // ── Speed: accelerate during hyperspace, decelerate when leaving ────
    const targetSpeed = appPhase === 'hyperspace' ? 60 : 0
    const clamped = Math.min(delta, 0.05)
    speedRef.current += (targetSpeed - speedRef.current) * Math.min(clamped * 2, 1)
    const step    = speedRef.current * clamped
    const tailLen = Math.max(step * 3, 0.01)

    const pa = geometry.attributes.position.array as Float32Array
    const ca = geometry.attributes.color.array    as Float32Array

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = stars[i]
      s.z += step // move toward camera (+Z)

      if (s.z > TUBE_Z_NEAR) {
        s.z = TUBE_Z_FAR + Math.random() * 30
        const r = randomRadius()
        const a = Math.random() * Math.PI * 2
        s.x = r * Math.cos(a)
        s.y = r * Math.sin(a)
      }

      const b = i * 6
      pa[b]   = s.x;  pa[b+1] = s.y;  pa[b+2] = s.z
      pa[b+3] = s.x;  pa[b+4] = s.y;  pa[b+5] = s.z - tailLen

      ca[b]   = s.br * starFade; ca[b+1] = s.br * starFade; ca[b+2] = 1.0 * starFade
      ca[b+3] = 0;               ca[b+4] = 0;               ca[b+5] = 0.04 * starFade
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate    = true
  })

  // Activate once, stay visible through the rest of IntroScene's lifetime
  if (appPhase === 'hyperspace') activatedRef.current = true
  if (!activatedRef.current) return null

  return (
    <group>
      {/* Tunnel wall — dark cylinder viewed from inside, fades in */}
      <mesh
        position={[0, 0, TUBE_Z_FAR + TUBE_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 64, 1, true]} />
        <meshBasicMaterial
          ref={cylMatRef}
          color="#010510"
          side={THREE.BackSide}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Streak stars */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
    </group>
  )
}
