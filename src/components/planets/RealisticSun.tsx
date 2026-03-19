import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface RealisticSunProps {
  position: [number, number, number]
  scale?: number
}

const sunVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const sunFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.0, 289.0))) * 45758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 flow = vUv * 6.0 + vec2(uTime * 0.08, -uTime * 0.04);
    float n = fbm(flow);

    vec3 core = vec3(1.0, 0.98, 0.82);
    vec3 mid = vec3(1.0, 0.65, 0.1);
    vec3 edge = vec3(0.93, 0.23, 0.04);

    vec3 color = mix(mid, core, smoothstep(0.45, 0.8, n));
    color = mix(edge, color, smoothstep(0.0, 0.7, n));

    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    color += vec3(1.0, 0.35, 0.05) * rim * 0.55;

    gl_FragColor = vec4(color, 1.0);
  }
`

export function RealisticSun({ position, scale = 1 }: RealisticSunProps) {
  const sunRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  )

  const radius = 1.6 * scale

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    if (sunRef.current) sunRef.current.rotation.y += 0.0009
    if (glowRef.current) glowRef.current.rotation.y -= 0.0004
  })

  return (
    <group position={position}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial vertexShader={sunVertexShader} fragmentShader={sunFragmentShader} uniforms={uniforms} />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.15, 64, 64]} />
        <meshBasicMaterial color={'#ff7a1a'} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
