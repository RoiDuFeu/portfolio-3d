import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface RealisticMarsProps {
  position: [number, number, number]
  scale?: number
}

const marsVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const marsFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  uniform vec3 uLightDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = vUv * 8.0;
    float n = fbm(p);
    float ridges = smoothstep(0.35, 0.7, fbm(vUv * 15.0));

    vec3 brightDust = vec3(0.78, 0.39, 0.18);
    vec3 darkBasalt = vec3(0.42, 0.2, 0.11);
    vec3 color = mix(darkBasalt, brightDust, n);

    // Add darker canyon-like streaks
    color = mix(color, vec3(0.26, 0.11, 0.06), ridges * 0.35);

    float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
    float ambient = 0.35;

    gl_FragColor = vec4(color * (ambient + diffuse * 0.75), 1.0);
  }
`

export function RealisticMars({ position, scale = 1 }: RealisticMarsProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const lightDirection = useMemo(() => new THREE.Vector3(1, 0.2, 0.4).normalize(), [])

  const uniforms = useMemo(
    () => ({
      uLightDirection: { value: lightDirection },
    }),
    [lightDirection]
  )

  const radius = 1.5 * scale

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0018
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial vertexShader={marsVertexShader} fragmentShader={marsFragmentShader} uniforms={uniforms} />
      </mesh>
    </group>
  )
}
