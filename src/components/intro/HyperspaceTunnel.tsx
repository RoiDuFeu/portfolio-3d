import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Hyperspace tunnel — single opaque cylinder with glowing streaks.
 * The shader renders a dark background with bright lines on top,
 * fully blocking the outside view.
 *
 * Placed inside a group at z=-50 in world space.
 * ALWAYS MOUNTED (visible=false) so the shader is pre-compiled during intro.
 */

const TUBE_RADIUS = 6

const TUBE_Z_FAR = -1450
const TUBE_Z_NEAR = -30
const TUBE_LENGTH = TUBE_Z_NEAR - TUBE_Z_FAR

const FADE_IN = 500

export function HyperspaceTunnel() {
  const meshRef = useRef<THREE.Mesh>(null)
  const activatedRef = useRef(false)
  const startTimeRef = useRef(0)

  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uOpacity;
      uniform float uTime;

      float hash(float n) { return fract(sin(n) * 43758.5453); }

      void main() {
        float angle = vUv.x;
        float along = vUv.y;

        // ── Streaks: vertical lines running along the tunnel ─────
        float streaks = 0.0;
        for (float i = 0.0; i < 60.0; i++) {
          float a = hash(i * 7.13);
          float w = 0.002 + hash(i * 3.77) * 0.006;
          float br = 0.3 + hash(i * 11.3) * 0.7;
          float dist = abs(angle - a);
          dist = min(dist, 1.0 - dist);
          float line = smoothstep(w, 0.0, dist);
          streaks += line * br;
        }

        // ── Ring bands: horizontal glows across the tunnel ───────
        float rings = 0.0;
        for (float i = 0.0; i < 80.0; i++) {
          float z = hash(i * 13.37);
          float w = 0.0008 + hash(i * 5.91) * 0.002;
          float br = 0.2 + hash(i * 9.17) * 0.4;
          float dist = abs(along - z);
          float ring = smoothstep(w, 0.0, dist);
          rings += ring * br;
        }

        // ── Combine onto dark background ─────────────────────────
        float glow = streaks * 0.8 + rings * 0.3;

        // Dark blue-black base color
        vec3 bgColor = vec3(0.005, 0.008, 0.02);

        // Streak color: blue to white based on intensity
        vec3 streakColor = mix(
          vec3(0.2, 0.4, 1.0),
          vec3(0.7, 0.85, 1.0),
          clamp(glow, 0.0, 1.0)
        );

        // Final color: dark bg + bright streaks
        vec3 finalColor = bgColor + streakColor * glow;

        gl_FragColor = vec4(finalColor * uOpacity, uOpacity);
      }
    `,
  }), [])

  useFrame(() => {
    const { appPhase } = useStore.getState()

    if (appPhase === 'hyperspace' && !activatedRef.current) {
      activatedRef.current = true
      startTimeRef.current = performance.now()
      if (meshRef.current) meshRef.current.visible = true
    }

    if (!activatedRef.current) return

    const elapsed = performance.now() - startTimeRef.current
    material.uniforms.uOpacity.value = Math.min(elapsed / FADE_IN, 1)
    material.uniforms.uTime.value = elapsed * 0.001
  })

  return (
    <mesh
      ref={meshRef}
      visible={false}
      position={[0, 0, (TUBE_Z_NEAR + TUBE_Z_FAR) / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 128, 1, true]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
