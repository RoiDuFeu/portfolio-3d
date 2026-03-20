import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * R3F starfield for the intro lobby — replaces the raw-WebGL HyperspaceCanvas.
 * 2500 stars on a sphere shell with colour-temperature tints and gentle forward drift.
 * Hidden once the camera enters the solar system zone.
 */

const STAR_COUNT = 2500
const SPEED_IDLE = 0.0002 // world units / ms

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
  void main() {
    vColor = color;
    vBrightness = length(color);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (100.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.8, 4.5);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBrightness;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = exp(-d * d * 8.0);
    float glow = exp(-d * d * 2.0) * 0.3;
    float alpha = core + glow;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * (core + glow * 0.5), alpha);
  }
`

export function LobbyStarfield() {
  const groupRef = useRef<THREE.Group>(null)
  const lastTs = useRef(0)

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
      },
      vertexShader,
      fragmentShader,
    })

    return { stars, geometry: geo, material: mat }
  }, [])

  useFrame(() => {
    const { appPhase } = useStore.getState()

    // Hide once we're in the solar system
    if (groupRef.current) {
      groupRef.current.visible = appPhase === 'intro' || appPhase === 'hyperspace'
    }
    if (appPhase !== 'intro' && appPhase !== 'hyperspace') return

    const now = performance.now()
    const delta = lastTs.current ? Math.min(now - lastTs.current, 50) : 16
    lastTs.current = now

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
