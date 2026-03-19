import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SpectacularSunProps {
  position: [number, number, number]
  scale?: number
}

const SUN_RADIUS = 3

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared GLSL chunks
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
// Surface shader (dramatically boosted)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const surfaceVert = `
varying vec3 vWorld;
varying vec3 vNormalView;
varying vec3 vNormalWorld;
varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;

uniform float uTime;

mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

void setLayers(vec3 p){
    float t = uTime * 0.15;
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

const surfaceFrag = `
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
    vec4 p0 = vec4(vLayer0 * 2.5, 0.0);
    vec4 p1 = vec4(vLayer1 * 2.5, 100.0);
    vec4 p2 = vec4(vLayer2 * 2.5, 200.0);
    float s = (snoise(p0) + snoise(p1) + snoise(p2)) * 0.3333333;
    return s * 0.5 + 0.5;
}

void main(){
    vec3 Vview = normalize((viewMatrix * vec4(vWorld - cameraPosition, 0.0)).xyz);
    float nDotV = max(dot(vNormalView, -Vview), 0.0);
    float fresnel = pow(1.0 - nDotV, uFresnelPower) * uFresnelInfluence;
    
    float brightness = ocean() * uBase + uBrightnessOffset + fresnel;
    brightness *= 1.8;
    
    vec3 col = clamp(brightnessToColor(brightness), 0.0, 1.0);
    float a = getAlpha(normalize(vNormalWorld));
    
    gl_FragColor = vec4(col, a);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Corona Rays shader (radial streamers)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const raysVert = `
varying float vUVY;
varying float vOpacity;
varying vec3  vColor;
varying vec3  vNormal;

uniform float uWidth;
uniform float uLength;
uniform float uTime;
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform vec3  uCamPos;

attribute vec3 aRayPos;
attribute vec4 aRandom;

#define m4  mat4( 0.00, 0.80, 0.60, -0.4, -0.80,  0.36, -0.48, -0.5, -0.60, -0.48, 0.64, 0.2, 0.40, 0.30, 0.20,0.4)

vec4 twistedNoise(vec4 q, float falloff){
  float a = 1.0, f = 1.0;
  vec4 sum = vec4(0);
  for (int i = 0; i < 3; i++) {
    q = m4 * q;
    vec4 s = sin(q.ywxz * f) * a;
    q += s; sum += s;
    a *= falloff; f /= falloff;
  }
  return sum;
}

vec3 hue(float h){
  return 0.6 + 0.6 * cos(6.3 * h + vec3(0.0, 23.0, 21.0));
}

void main(){
  vUVY = aRayPos.z;
  
  float animPhase = fract(uTime * 0.2 * aRandom.y + aRandom.x);
  float size = aRandom.z + 0.5;
  float d = aRayPos.x * uLength * size;
  
  vec3 dir = normalize(aRayPos);
  vec3 pObj = dir + dir * d;
  pObj += twistedNoise(vec4(pObj * uNoiseFrequency, uTime * 0.5), 0.7).xyz * (d * uNoiseAmplitude);
  
  vec3 pWorld = (modelMatrix * vec4(pObj, 1.0)).xyz;
  vec3 toCamera = normalize(pWorld - uCamPos);
  vec3 tangent = normalize(cross(toCamera, dir));
  
  float width = uWidth * aRayPos.z * (1.0 - aRayPos.x) * animPhase;
  pWorld += tangent * width;
  
  vNormal = normalize(pWorld);
  vOpacity = (1.0 - animPhase) * 0.9;
  vColor = hue(aRandom.w * 0.15);
  
  gl_Position = projectionMatrix * viewMatrix * vec4(pWorld, 1.0);
}
`

const raysFrag = `
precision highp float;

${visibilityGLSL}

varying float vUVY;
varying float vOpacity;
varying vec3  vColor;
varying vec3  vNormal;

void main(){
  float alpha = 1.0 - smoothstep(0.0, 1.0, abs(vUVY));
  alpha *= alpha * vOpacity;
  alpha *= getAlpha(vNormal);
  gl_FragColor = vec4(vColor * alpha, alpha);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Atmospheric glow (massively boosted)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const glowVert = `
varying vec3 vNormal;
varying vec3 vPosition;

void main(){
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const glowFrag = `
precision highp float;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 uGlowColor;
uniform float uGlowIntensity;

void main(){
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = 1.0 - abs(dot(vNormal, viewDir));
  float glow = pow(fresnel, 1.8) * uGlowIntensity;
  
  gl_FragColor = vec4(uGlowColor * glow, glow);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SpectacularSun({ position, scale = 1 }: SpectacularSunProps) {
  const groupRef = useRef<THREE.Group>(null)
  const surfaceMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const raysMaterialRef = useRef<THREE.ShaderMaterial>(null)

  const radius = SUN_RADIUS * scale

  // Visibility uniforms (shared)
  const visibilityUniforms = useMemo(() => ({
    uVisibility: { value: 0.4 },
    uDirection: { value: 1.0 },
    uLightView: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
  }), [])

  // Surface uniforms (boosted for dramatic effect)
  const surfaceUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFresnelPower: { value: 1.8 },
    uFresnelInfluence: { value: 1.2 },
    uTint: { value: 1.5 },
    uBase: { value: 0.8 },
    uBrightnessOffset: { value: 0.5 },
    uBrightness: { value: 2.2 },
    ...visibilityUniforms,
  }), [visibilityUniforms])

  // Corona rays geometry
  const raysGeometry = useMemo(() => {
    const rayCount = 64
    const segmentsPerRay = 32
    const positions: number[] = []
    const randoms: number[] = []

    for (let i = 0; i < rayCount; i++) {
      const theta = (i / rayCount) * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      const baseDir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize()

      const r1 = Math.random()
      const r2 = Math.random()
      const r3 = 0.5 + Math.random() * 0.5
      const r4 = Math.random()

      for (let j = 0; j < segmentsPerRay; j++) {
        const t = j / segmentsPerRay
        positions.push(
          baseDir.x * t,
          baseDir.y * t,
          baseDir.z * t
        )
        randoms.push(r1, r2, r3, r4)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('aRayPos', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 4))
    return geo
  }, [])

  const raysUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWidth: { value: 0.15 },
    uLength: { value: 4.5 },
    uNoiseFrequency: { value: 0.8 },
    uNoiseAmplitude: { value: 0.3 },
    uCamPos: { value: new THREE.Vector3() },
    ...visibilityUniforms,
  }), [visibilityUniforms])

  // Glow uniforms (massive boost)
  const glowUniforms = useMemo(() => ({
    uGlowColor: { value: new THREE.Color(1.0, 0.6, 0.2) },
    uGlowIntensity: { value: 3.5 },
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (surfaceMaterialRef.current) {
      surfaceMaterialRef.current.uniforms.uTime.value = t
    }

    if (raysMaterialRef.current) {
      raysMaterialRef.current.uniforms.uTime.value = t
      raysMaterialRef.current.uniforms.uCamPos.value.copy(state.camera.position)
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0002
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Core surface with vivid noise */}
      <mesh>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={surfaceMaterialRef}
          vertexShader={surfaceVert}
          fragmentShader={surfaceFrag}
          uniforms={surfaceUniforms}
          transparent
        />
      </mesh>

      {/* Corona rays */}
      <points geometry={raysGeometry}>
        <shaderMaterial
          ref={raysMaterialRef}
          vertexShader={raysVert}
          fragmentShader={raysFrag}
          uniforms={raysUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Inner glow shell */}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 64, 64]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={glowUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow shell (even bigger) */}
      <mesh>
        <sphereGeometry args={[radius * 1.8, 48, 48]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={{
            uGlowColor: { value: new THREE.Color(1.0, 0.5, 0.15) },
            uGlowIntensity: { value: 2.2 },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Massive ambient halo */}
      <mesh>
        <sphereGeometry args={[radius * 6, 32, 32]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={{
            uGlowColor: { value: new THREE.Color(1.0, 0.45, 0.1) },
            uGlowIntensity: { value: 0.6 },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dramatic lighting */}
      <pointLight color="#FFB060" intensity={8.0} distance={600} decay={1} />
      <pointLight color="#FF7030" intensity={4.5} distance={300} decay={1.5} />
    </group>
  )
}
