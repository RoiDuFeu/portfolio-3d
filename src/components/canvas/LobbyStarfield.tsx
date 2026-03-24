import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { WORMHOLE_DELAY } from '../intro/Wormhole'

/**
 * R3F starfield for the intro lobby — replaces the raw-WebGL HyperspaceCanvas.
 * 2500 stars on a sphere shell with colour-temperature tints and gentle forward drift.
 *
 * During early hyperspace (before the wormhole appears), the stars accelerate
 * dramatically and stretch into long streaks — classic jump-to-lightspeed effect.
 * Once the wormhole fades in, the starfield fades out.
 */

const STAR_COUNT = 2500
const SPEED_IDLE = 0.0002 // world units / ms

// Hyperspace star-streak parameters
const STREAK_ACCEL = 0.15     // how fast stars accelerate (units/ms² ÷ 1000)
const STREAK_MAX_SPEED = 0.8  // max star speed during streak (units/ms)
// Stars fade out after the wormhole starts appearing
const STREAK_FADEOUT_START = WORMHOLE_DELAY * 0.8  // begin fading stars before wormhole
const STREAK_FADEOUT_END = WORMHOLE_DELAY + 800     // fully faded by this time

const STAR_COLORS: [number, number, number][] = [
  [1.0, 1.0, 1.0],
  [0.85, 0.9, 1.0],
  [0.75, 0.85, 1.0],
  [1.0, 0.95, 0.85],
  [1.0, 0.85, 0.7],
  [0.7, 0.8, 1.0],
]

interface Star {
  x: number; y: number; z: number
  br: number
  color: [number, number, number]
  baseSize: number
}

function makeStar(): Star {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(1 - 2 * Math.random())
  const depth = 15 + Math.random() * 80

  const x = Math.sin(phi) * Math.cos(theta) * depth
  const y = Math.sin(phi) * Math.sin(theta) * depth
  const z = -Math.abs(Math.cos(phi)) * depth

  const mag = Math.pow(Math.random(), 3)
  const br = 0.15 + mag * 0.85
  const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]

  return { x, y, z, br, color, baseSize: 0.3 + mag * 2.5 }
}

const vertexShader = /* glsl */ `
  attribute float size;
  varying vec3 vColor;
  varying float vBrightness;
  uniform float uPixelRatio;
  uniform float uStretch;
  void main() {
    vColor = color;
    vBrightness = length(color);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    // Base size + stretch multiplier (elongates stars during hyperspace)
    float s = size * (1.0 + uStretch * 3.0);
    gl_PointSize = s * uPixelRatio * (100.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.8, uStretch > 0.0 ? 12.0 : 4.5);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBrightness;
  uniform float uStretch;
  uniform float uFade;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // Elongate vertically (screen-space Z streak) when stretching
    uv.x *= 1.0 + uStretch * 4.0;
    float d = length(uv) * 2.0;
    float core = exp(-d * d * 8.0);
    float glow = exp(-d * d * 2.0) * 0.3;
    float alpha = (core + glow) * uFade;
    if (alpha < 0.01) discard;
    // Boost brightness during streak
    float boost = 1.0 + uStretch * 2.0;
    gl_FragColor = vec4(vColor * (core + glow * 0.5) * boost, alpha);
  }
`

export function LobbyStarfield() {
  const groupRef = useRef<THREE.Group>(null)
  const lastTs = useRef(0)
  const hyperStart = useRef(0)
  const prevPhase = useRef('loading')

  const { stars, geometry, material } = useMemo(() => {
    const stars = Array.from({ length: STAR_COUNT }, makeStar)
    const posArr = new Float32Array(STAR_COUNT * 3)
    const colArr = new Float32Array(STAR_COUNT * 3)
    const sizeArr = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = stars[i]
      const b = i * 3
      posArr[b] = s.x; posArr[b + 1] = s.y; posArr[b + 2] = s.z
      colArr[b] = s.color[0] * s.br; colArr[b + 1] = s.color[1] * s.br; colArr[b + 2] = s.color[2] * s.br
      sizeArr[i] = s.baseSize
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizeArr, 1))

    const mat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
        uStretch: { value: 0 },
        uFade: { value: 1 },
      },
      vertexShader,
      fragmentShader,
    })

    return { stars, geometry: geo, material: mat }
  }, [])

  useFrame(() => {
    const { appPhase } = useStore.getState()

    // Detect hyperspace start
    if (appPhase === 'hyperspace' && prevPhase.current !== 'hyperspace') {
      hyperStart.current = performance.now()
    }
    prevPhase.current = appPhase

    // Visible during loading, intro, and hyperspace (fades out during wormhole transition)
    if (groupRef.current) {
      groupRef.current.visible = appPhase === 'loading' || appPhase === 'intro' || appPhase === 'hyperspace'
    }

    const now = performance.now()
    const delta = lastTs.current ? Math.min(now - lastTs.current, 50) : 16
    lastTs.current = now

    // ── HYPERSPACE: star-streak acceleration ─────────────────────────────
    if (appPhase === 'hyperspace' && hyperStart.current > 0) {
      const elapsed = now - hyperStart.current

      // Accelerating star speed: ramps up exponentially
      const accelPhase = Math.min(elapsed / 2000, 1) // 0→1 over 2s
      const speed = SPEED_IDLE + accelPhase * accelPhase * STREAK_MAX_SPEED

      // Stretch factor for shader (elongates stars into streaks)
      const stretch = Math.pow(accelPhase, 1.5)
      material.uniforms.uStretch.value = stretch

      // Fade out as wormhole takes over
      if (elapsed > STREAK_FADEOUT_START) {
        const fadeProgress = (elapsed - STREAK_FADEOUT_START) / (STREAK_FADEOUT_END - STREAK_FADEOUT_START)
        material.uniforms.uFade.value = Math.max(1 - fadeProgress, 0)
      } else {
        material.uniforms.uFade.value = 1
      }

      const frameMove = speed * delta
      const pa = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < STAR_COUNT; i++) {
        const s = stars[i]
        // Stars fly toward +Z (past the camera)
        s.z += frameMove

        // Wrap stars that pass the camera back to the far end
        if (s.z > 10) {
          s.z = -80 - Math.random() * 20
          s.x = (Math.random() - 0.5) * 120
          s.y = (Math.random() - 0.5) * 120
        }

        const b = i * 3
        pa[b] = s.x; pa[b + 1] = s.y; pa[b + 2] = s.z
      }

      geometry.attributes.position.needsUpdate = true
      return
    }

    // ── LOADING / INTRO: gentle idle drift ───────────────────────────────
    if (appPhase !== 'loading' && appPhase !== 'intro') return

    // Reset stretch/fade for intro
    material.uniforms.uStretch.value = 0
    material.uniforms.uFade.value = 1

    const frameMove = SPEED_IDLE * delta
    const pa = geometry.attributes.position.array as Float32Array
    const ca = geometry.attributes.color.array as Float32Array
    const sa = geometry.attributes.size.array as Float32Array

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = stars[i]
      s.z -= frameMove

      // Stars drift in -Z (toward tunnel). Wrap back to near the camera when too far.
      if (s.z < -95) {
        Object.assign(s, makeStar())
        s.z = -5 - Math.random() * 10
      } else if (s.z > 0) {
        s.z = -10
      }

      const b = i * 3
      pa[b] = s.x; pa[b + 1] = s.y; pa[b + 2] = s.z
      ca[b] = s.color[0] * s.br; ca[b + 1] = s.color[1] * s.br; ca[b + 2] = s.color[2] * s.br
      sa[i] = s.baseSize
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  )
}
