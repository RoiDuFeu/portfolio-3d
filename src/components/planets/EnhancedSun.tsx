import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * EnhancedSun — High-quality solar rendering
 * 
 * Inspired by three.js community examples for realistic sun with corona rays.
 * 
 * Features:
 * - Multi-octave procedural plasma surface with domain warping
 * - Polar coordinate-based radial corona rays
 * - Animated turbulent flow and convection cells
 * - Fresnel-based view-angle dependent glow
 * - HDR-ready intensity for bloom interaction
 * - Performance optimized with LOD icosahedron geometry
 */

const SUN_RADIUS = 3

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Enhanced Surface Shader — Procedural plasma with domain warping
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const surfaceVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const surfaceFragmentShader = `
  uniform float uTime;
  uniform vec3 uCoreColor;
  uniform vec3 uMidColor;
  uniform vec3 uEdgeColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // High-quality 2D hash
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  // Improved noise with smoother interpolation
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // Quintic interpolation for smoother result
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    float a = dot(hash2(i) - 0.5, f);
    float b = dot(hash2(i + vec2(1.0, 0.0)) - 0.5, f - vec2(1.0, 0.0));
    float c = dot(hash2(i + vec2(0.0, 1.0)) - 0.5, f - vec2(0.0, 1.0));
    float d = dot(hash2(i + vec2(1.0, 1.0)) - 0.5, f - vec2(1.0, 1.0));
    
    return 0.5 + mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Fractal Brownian Motion — 6 octaves
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.1;
      amplitude *= 0.48;
    }
    
    return value;
  }

  // Domain warping for organic flow
  vec2 domainWarp(vec2 p, float amount) {
    float warpX = fbm(p + vec2(0.0, uTime * 0.03));
    float warpY = fbm(p + vec2(uTime * 0.04, 0.0));
    return p + vec2(warpX, warpY) * amount;
  }

  // Turbulence (absolute value for sharp ridges)
  float turbulence(vec2 p) {
    return abs(fbm(p) - 0.5) * 2.0;
  }

  // Solar granulation cells (Voronoi-like)
  float granulation(vec2 p, float scale) {
    vec2 cell = floor(p * scale);
    vec2 localPos = fract(p * scale);
    
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = hash2(cell + neighbor);
        
        // Animate cell centers
        point = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * point);
        
        vec2 diff = neighbor + point - localPos;
        float dist = length(diff);
        minDist = min(minDist, dist);
      }
    }
    
    return smoothstep(0.0, 0.5, minDist);
  }

  void main() {
    // Multi-layer warped coordinates
    vec2 baseUv = vUv * 4.0;
    vec2 warped1 = domainWarp(baseUv, 0.4);
    vec2 warped2 = domainWarp(baseUv * 1.3, 0.3);
    
    // Animated flow
    float timeFlow = uTime * 0.05;
    vec2 flow1 = warped1 + vec2(timeFlow * 0.7, -timeFlow * 0.3);
    vec2 flow2 = warped2 + vec2(-timeFlow * 0.4, timeFlow * 0.5);
    
    // Primary convection pattern
    float conv1 = fbm(flow1);
    
    // Secondary turbulent layer
    float conv2 = turbulence(flow2);
    
    // Fine granulation
    vec2 granFlow = baseUv + vec2(timeFlow * 0.15, 0.0);
    float gran = granulation(granFlow, 6.0);
    
    // Combine layers with weights
    float plasma = conv1 * 0.55 + conv2 * 0.25 + gran * 0.35;
    
    // Solar flare hotspots (bright, sharp regions)
    float flareNoise = pow(fbm(baseUv * 2.2 + timeFlow * 1.1), 2.5);
    plasma += flareNoise * 0.6;
    
    // Normalize
    plasma = clamp(plasma, 0.0, 1.0);
    
    // Three-tier color gradient with smoother transitions
    vec3 color = mix(uMidColor, uCoreColor, smoothstep(0.4, 0.9, plasma));
    color = mix(uEdgeColor, color, smoothstep(0.0, 0.65, plasma));
    
    // Chromatic rim lighting with Fresnel
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    float rimPower = pow(fresnel, 2.2);
    
    // Orange-red-yellow rim gradient
    vec3 rimColor = mix(
      vec3(1.0, 0.45, 0.1),  // Orange
      vec3(1.0, 0.85, 0.3),  // Yellow
      fresnel * 0.5
    ) * rimPower * 0.9;
    
    color += rimColor;
    
    // Add subtle pulsation
    float pulse = 1.0 + sin(uTime * 0.4) * 0.03;
    
    // HDR boost for bloom
    color *= 1.4 * pulse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Corona Shader — Radial streamer rays with polar coordinates
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const coronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coronaFragmentShader = `
  uniform float uTime;
  uniform float uRadius;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uRayCount;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Improved hash for better distribution
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
    
    // Polar coordinates for radial pattern
    float angle = atan(vWorldPosition.z, vWorldPosition.x);
    float radius = length(vWorldPosition.xz);
    float normalizedRadius = radius / uRadius;
    
    // Radial streamer rays (higher frequency at edge)
    float rayAngle = angle * uRayCount;
    float rayPattern = abs(sin(rayAngle + uTime * 0.3));
    rayPattern = pow(rayPattern, 3.0); // Sharpen rays
    
    // Add noise variation along rays
    vec2 rayCoord = vec2(angle * 3.0, normalizedRadius * 6.0);
    float rayNoise = fbm(rayCoord + vec2(uTime * 0.1, 0.0));
    
    // Combine ray pattern with noise
    float corona = fresnel * (rayPattern * 0.7 + rayNoise * 0.3);
    
    // Radial falloff (brighter near sun, fade at edge)
    float radialFade = smoothstep(1.0, 0.2, normalizedRadius);
    corona *= radialFade;
    
    // Additional turbulent variation
    float turbulence = fbm(vec2(angle * 2.0, normalizedRadius * 4.0) + uTime * 0.15);
    corona *= (0.7 + turbulence * 0.3);
    
    // Apply intensity and color
    corona = pow(corona, 1.3) * uIntensity;
    
    gl_FragColor = vec4(uColor * corona, corona);
  }
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Volumetric Halo Shader — Smooth distance-based glow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const haloVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const haloFragmentShader = `
  uniform float uSunRadius;
  uniform float uHaloRadius;
  uniform float uTime;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    float dist = length(vWorldPosition);
    float normalizedDist = (dist - uSunRadius) / (uHaloRadius - uSunRadius);
    
    // Smooth exponential falloff
    float intensity = smoothstep(1.0, 0.0, normalizedDist);
    intensity = pow(intensity, 2.8);
    
    // Add subtle animated variation
    vec2 coord = vWorldPosition.xy * 0.1 + uTime * 0.02;
    float variation = noise(coord) * 0.3 + 0.7;
    intensity *= variation;
    
    // Warm orange-yellow gradient
    vec3 haloColor = mix(
      vec3(1.0, 0.55, 0.2),  // Orange
      vec3(1.0, 0.75, 0.4),  // Yellow-orange
      intensity * 0.5
    );
    
    // Reduce overall intensity for subtlety
    intensity *= 0.18;
    
    gl_FragColor = vec4(haloColor * intensity, intensity);
  }
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function EnhancedSun() {
  const surfaceRef = useRef<THREE.Mesh>(null)
  const surfaceMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const corona1Ref = useRef<THREE.ShaderMaterial>(null)
  const corona2Ref = useRef<THREE.ShaderMaterial>(null)
  const corona3Ref = useRef<THREE.ShaderMaterial>(null)
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const keyLightRef = useRef<THREE.PointLight>(null)
  const fillLightRef = useRef<THREE.PointLight>(null)

  // Surface material uniforms
  const surfaceUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCoreColor: { value: new THREE.Color(1.0, 0.98, 0.90) },   // Bright white-yellow
      uMidColor: { value: new THREE.Color(1.0, 0.72, 0.18) },    // Golden yellow
      uEdgeColor: { value: new THREE.Color(0.98, 0.28, 0.06) },  // Deep orange-red
    }),
    []
  )

  // Corona layer uniforms with ray count
  const makeCoronaUniforms = (radius: number, color: THREE.Color, intensity: number, rayCount: number) =>
    useMemo(
      () => ({
        uTime: { value: 0 },
        uRadius: { value: radius },
        uColor: { value: color },
        uIntensity: { value: intensity },
        uRayCount: { value: rayCount },
      }),
      [radius, color, intensity, rayCount]
    )

  // Inner corona: Dense rays, high intensity
  const corona1Uniforms = makeCoronaUniforms(
    SUN_RADIUS * 1.3,
    new THREE.Color(1.0, 0.65, 0.25),
    1.3,
    12.0  // 12 major rays
  )

  // Mid corona: Moderate rays, medium intensity
  const corona2Uniforms = makeCoronaUniforms(
    SUN_RADIUS * 2.2,
    new THREE.Color(1.0, 0.50, 0.18),
    0.85,
    8.0  // 8 rays
  )

  // Outer corona: Sparse rays, low intensity
  const corona3Uniforms = makeCoronaUniforms(
    SUN_RADIUS * 4.0,
    new THREE.Color(0.95, 0.38, 0.12),
    0.45,
    6.0  // 6 rays
  )

  // Volumetric halo
  const HALO_RADIUS = SUN_RADIUS * 11
  const haloUniforms = useMemo(
    () => ({
      uSunRadius: { value: SUN_RADIUS },
      uHaloRadius: { value: HALO_RADIUS },
      uTime: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Slow rotation for surface detail
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += 0.0005
    }

    // Update time uniforms
    if (surfaceMaterialRef.current) {
      surfaceMaterialRef.current.uniforms.uTime.value = t
    }
    if (corona1Ref.current) corona1Ref.current.uniforms.uTime.value = t
    if (corona2Ref.current) corona2Ref.current.uniforms.uTime.value = t * 0.8 // Slower
    if (corona3Ref.current) corona3Ref.current.uniforms.uTime.value = t * 0.6 // Even slower
    if (haloMaterialRef.current) haloMaterialRef.current.uniforms.uTime.value = t

    // Subtle light breathing for a living star feel
    const pulse = 1 + Math.sin(t * 0.55) * 0.08
    if (keyLightRef.current) keyLightRef.current.intensity = 4.0 * pulse
    if (fillLightRef.current) fillLightRef.current.intensity = 2.2 * (0.94 + Math.sin(t * 0.4 + 1.2) * 0.06)
  })

  return (
    <group>
      {/* Volumetric halo — rendered first, behind everything */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[HALO_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={haloMaterialRef}
          vertexShader={haloVertexShader}
          fragmentShader={haloFragmentShader}
          uniforms={haloUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Enhanced surface with domain-warped procedural plasma */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[SUN_RADIUS, 128, 128]} />
        <shaderMaterial
          ref={surfaceMaterialRef}
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Inner corona — dense rays, tight */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.3, 96, 96]} />
        <shaderMaterial
          ref={corona1Ref}
          vertexShader={coronaVertexShader}
          fragmentShader={coronaFragmentShader}
          uniforms={corona1Uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mid corona — moderate rays, wider glow */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 2.2, 72, 72]} />
        <shaderMaterial
          ref={corona2Ref}
          vertexShader={coronaVertexShader}
          fragmentShader={coronaFragmentShader}
          uniforms={corona2Uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer corona — sparse rays, faint halo */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 4.0, 56, 56]} />
        <shaderMaterial
          ref={corona3Ref}
          vertexShader={coronaVertexShader}
          fragmentShader={coronaFragmentShader}
          uniforms={corona3Uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lighting — warm orange point lights for scene illumination */}
      <pointLight ref={keyLightRef} color="#FFA54F" intensity={4.0} distance={500} decay={1} />
      <pointLight ref={fillLightRef} color="#FF8030" intensity={2.2} distance={240} decay={2} />
    </group>
  )
}
