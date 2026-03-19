import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AdvancedRealisticSunProps {
  position: [number, number, number]
  scale?: number
}

const SUN_RADIUS = 3

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Visibility include (shared across all shaders)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const visibilityGLSL = `
uniform float uVisibility;
uniform float uDirection;
uniform vec3  uLightView;

float getAlpha(vec3 n){
  float nDotL = dot(n, uLightView) * uDirection;
  return smoothstep(1.0, 1.5, nDotL + uVisibility * 2.5);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4D Simplex Noise (Ashima Arts)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const simplex4dGLSL = `
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
float mod289(float x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
float permute(float x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r){ return 1.79284291400159 - 0.85373472095314 * r; }

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w   = 1.5 - dot(abs(p.xyz), ones.xyz);
  s     = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

#define F4 0.309016994374947451

float snoise(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i  = floor(v + dot(v, vec4(F4)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  
  vec4 i0;
  vec3 isX  = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x   = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y  += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z  += isYZ.z;
  i0.w  += 1.0 - isYZ.z;
  
  vec4 i3 = clamp(i0,     0.0, 1.0);
  vec4 i2 = clamp(i0-1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0-2.0, 0.0, 1.0);
  
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  
  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1  = permute(permute(permute(permute(
               i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
               + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
               + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);
  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));
  
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
  m0 = m0 * m0; m1 = m1 * m1;
  
  return 49.0 * (
    dot(m0*m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) +
    dot(m1*m1, vec2(dot(p3, x3), dot(p4, x4)))
  );
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sun Sphere Shader (surface with rotating noise layers)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sunSphereVertexShader = `
varying vec3 vWorld;
varying vec3 vNormalView;
varying vec3 vNormalWorld;
varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;

uniform float uTime;

mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

void setLayers(vec3 p){
    float t = uTime;
    vec3 p1 = p;
    p1.yz = rot(t) * p1.yz;
    vLayer0 = p1;
    p1 = p;
    p1.zx = rot(t + 2.094) * p1.zx;
    vLayer1 = p1;
    p1 = p;
    p1.xy = rot(t - 4.188) * p1.xy;
    vLayer2 = p1;
}

void main(){
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalView = normalize(normalMatrix * normal);
    vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    setLayers(normalize(normal));
    gl_Position = projectionMatrix * viewMatrix * world;
}
`

const sunSphereFragmentShader = `
precision highp float;

${visibilityGLSL}
${simplex4dGLSL}

varying vec3 vWorld;
varying vec3 vNormalView;
varying vec3 vNormalWorld;
varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;

uniform float uFresnelPower;
uniform float uFresnelInfluence;
uniform float uTint;
uniform float uBase;
uniform float uBrightnessOffset;
uniform float uBrightness;

vec3 brightnessToColor(float b){
  b *= uTint;
  return (vec3(b, b*b, b*b*b*b) / uTint) * uBrightness;
}

float ocean(){
    vec4 p0 = vec4(vLayer0, 0.0);
    vec4 p1 = vec4(vLayer1, 100.0);
    vec4 p2 = vec4(vLayer2, 200.0);
    float s = (snoise(p0) + snoise(p1) + snoise(p2)) * 0.3333333;
    return s * 0.5 + 0.5;
}

void main(){
    vec3 Vview = normalize((viewMatrix * vec4(vWorld - cameraPosition, 0.0)).xyz);
    float nDotV = dot(vNormalView, -Vview);
    float fresnel = pow(1.0 - nDotV, uFresnelPower) * uFresnelInfluence;
    
    float brightness = ocean() * uBase + uBrightnessOffset + fresnel;
    vec3 col = clamp(brightnessToColor(brightness), 0.0, 1.0);
    float a = getAlpha(normalize(vNormalWorld));
    
    gl_FragColor = vec4(col, a);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Glow Shader (atmospheric halo)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const glowVertexShader = `
varying float vRadial;
varying vec3 vWorld;

uniform float uRadius;
uniform vec3 uCamUp;
uniform vec3 uCamPos;

void main(){
  vRadial = position.z;
  vec3 side = normalize(cross(normalize(-uCamPos), uCamUp));
  vec3 p = position.x * side + position.y * uCamUp;
  p *= 1.0 + position.z * uRadius;
  vec4 world = vec4(p, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const glowFragmentShader = `
precision highp float;

${visibilityGLSL}

varying float vRadial;
varying vec3 vWorld;

uniform float uTint;
uniform float uBrightness;
uniform float uFalloffColor;

vec3 brightnessToColor(float b){
  b *= uTint;
  return (vec3(b, b*b, b*b*b*b) / (uTint)) * uBrightness;
}

void main(){
    float alpha = (1.0 - vRadial);
    alpha *= alpha;
    float brightness = 1.0 + alpha * uFalloffColor;
    alpha *= getAlpha(normalize(vWorld));
    gl_FragColor.xyz = brightnessToColor(brightness) * alpha;
    gl_FragColor.w = alpha;
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AdvancedRealisticSun({ position, scale = 1 }: AdvancedRealisticSunProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null)

  const radius = SUN_RADIUS * scale

  // Shared visibility uniforms
  const visibilityUniforms = useMemo(() => ({
    uVisibility: { value: 0.5 },
    uDirection: { value: 1.0 },
    uLightView: { value: new THREE.Vector3(1, 0, 0).normalize() },
  }), [])

  // Sun sphere uniforms
  const sphereUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFresnelPower: { value: 2.5 },
      uFresnelInfluence: { value: 0.8 },
      uTint: { value: 1.2 },
      uBase: { value: 0.6 },
      uBrightnessOffset: { value: 0.3 },
      uBrightness: { value: 1.5 },
      ...visibilityUniforms,
    }),
    [visibilityUniforms]
  )

  // Glow uniforms
  const glowUniforms = useMemo(
    () => ({
      uRadius: { value: 8.0 },
      uCamUp: { value: new THREE.Vector3(0, 1, 0) },
      uCamPos: { value: new THREE.Vector3(0, 0, 10) },
      uTint: { value: 1.1 },
      uBrightness: { value: 0.8 },
      uFalloffColor: { value: 0.5 },
      ...visibilityUniforms,
    }),
    [visibilityUniforms]
  )

  // Create glow geometry manually (billboard quad disk)
  const glowGeometry = useMemo(() => {
    const segments = 32
    const positions: number[] = []
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle)
      const y = Math.sin(angle)
      
      positions.push(0, 0, 0)
      positions.push(x, y, 1)
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.1

    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.0003
    }

    if (sphereMaterialRef.current) {
      sphereMaterialRef.current.uniforms.uTime.value = t
    }

    // Update camera-dependent uniforms for glow
    if (glowMaterialRef.current) {
      glowMaterialRef.current.uniforms.uCamPos.value.copy(state.camera.position)
      glowMaterialRef.current.uniforms.uCamUp.value.set(0, 1, 0).applyQuaternion(state.camera.quaternion)
    }
  })

  return (
    <group position={position}>
      {/* Main sun sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={sphereMaterialRef}
          vertexShader={sunSphereVertexShader}
          fragmentShader={sunSphereFragmentShader}
          uniforms={sphereUniforms}
          transparent
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh geometry={glowGeometry}>
        <shaderMaterial
          ref={glowMaterialRef}
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={glowUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Lighting */}
      <pointLight color="#FFA040" intensity={4.5} distance={500} decay={1} />
      <pointLight color="#FF6020" intensity={2.5} distance={240} decay={2} />
    </group>
  )
}
