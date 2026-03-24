import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { wormholeTubeSpline, WORMHOLE_TUBE_RADIUS, falconProgress } from '../../utils/wormholeSpline'

/**
 * Cinematic hyperspace wormhole.
 *
 * Layers (back → front):
 *   1. BackSide wall — domain-warped multi-layer vortex with HDR bloom values
 *   2. Inner energy layer — smaller tube, brighter, adds volumetric depth
 *   3. Speed particles — bright sparks inside the tube
 *   4. Near-camera streaks — large bright particles close to the flight path
 *   5. Destination glow — emissive sphere at the spline exit (bright focal point)
 *
 * ALWAYS MOUNTED (visible=false) so geometry is pre-built during intro.
 */

// Delay before the wormhole appears — the ship accelerates through
// star-streaks first (classic jump-to-lightspeed), THEN enters the tunnel.
export const WORMHOLE_DELAY = 3500
// Smooth fade-in duration (after delay) — ramps opacity with an ease curve
const FADE_IN = 800
// Progressive reveal: the visible depth of the tube grows from 0 to full
// over this duration, so it "extends" from the camera outward.
const REVEAL_DURATION = 1500
// Maximum view distance (roughly the arc length of the tube)
const MAX_REVEAL_DIST = 2000
const NUM_PARTICLES = 400
const NUM_NEAR_STREAKS = 80

// ─── Particle builder ───────────────────────────────────────────────────────

function buildParticles(count: number, radiusMin: number, radiusMax: number, sizeMin: number, sizeMax: number) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const speeds = new Float32Array(count) // brightness variation seed

  const _t = new THREE.Vector3()
  const _up = new THREE.Vector3(0, 1, 0)
  const _alt = new THREE.Vector3(1, 0, 0)
  const _right = new THREE.Vector3()
  const _pathUp = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const point = wormholeTubeSpline.getPointAt(t)
    _t.copy(wormholeTubeSpline.getTangentAt(t))

    _right.crossVectors(_t, _up)
    if (_right.lengthSq() < 0.001) _right.crossVectors(_t, _alt)
    _right.normalize()
    _pathUp.crossVectors(_right, _t).normalize()

    const angle = Math.random() * Math.PI * 2
    const radius = (radiusMin + Math.random() * (radiusMax - radiusMin)) * WORMHOLE_TUBE_RADIUS

    positions[i * 3] = point.x + Math.cos(angle) * radius * _right.x + Math.sin(angle) * radius * _pathUp.x
    positions[i * 3 + 1] = point.y + Math.cos(angle) * radius * _right.y + Math.sin(angle) * radius * _pathUp.y
    positions[i * 3 + 2] = point.z + Math.cos(angle) * radius * _right.z + Math.sin(angle) * radius * _pathUp.z

    sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin)
    speeds[i] = Math.random()
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  return geo
}

// ─── GLSL noise shared by both wall shaders ─────────────────────────────────

const GLSL_NOISE = /* glsl */ `
  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash2(i);
    float b = hash2(i + vec2(1.0, 0.0));
    float c = hash2(i + vec2(0.0, 1.0));
    float d = hash2(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  // Domain warping — offsets UVs with noise for organic asymmetry
  vec2 warp(vec2 p, float t) {
    return p + vec2(
      fbm(p * 0.7 + t * 0.08) * 0.5,
      fbm(p * 0.6 - t * 0.12 + 3.0) * 0.4
    );
  }
`

// ─── Component ──────────────────────────────────────────────────────────────

// Max delta per frame (ms) — prevents GPU stalls from skipping animation
const MAX_FRAME_DELTA = 33

export function Wormhole() {
  const groupRef = useRef<THREE.Group>(null)
  const activatedRef = useRef(false)
  const hyperStartRef = useRef(0) // when hyperspace began (for delay tracking)
  const lastFrameRef = useRef(0)
  const virtualElapsedRef = useRef(0)
  const debugFrameCount = useRef(0)

  const resources = useMemo(() => {
    // ── Geometry ──
    const outerTube = new THREE.TubeGeometry(wormholeTubeSpline, 200, WORMHOLE_TUBE_RADIUS, 16, false)
    const innerTube = new THREE.TubeGeometry(wormholeTubeSpline, 200, WORMHOLE_TUBE_RADIUS * 0.55, 12, false)
    const particleGeo = buildParticles(NUM_PARTICLES, 0.15, 0.75, 0.02, 0.08)
    const nearStreakGeo = buildParticles(NUM_NEAR_STREAKS, 0.0, 0.25, 0.06, 0.2)

    // ── Destination glow sphere ──
    const glowGeo = new THREE.SphereGeometry(3.5, 16, 16)
    const exitPoint = wormholeTubeSpline.getPointAt(0.98)

    // ── Outer wall: cinematic vortex with domain warping ──
    const outerWallMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uEntryIntensity: { value: 0 },
        uRevealDist: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vFogFactor;
        varying float vViewDist;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPos.z;
          vViewDist = dist;
          vFogFactor = exp2(-0.0000015 * dist * dist);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uTime;
        uniform float uEntryIntensity;
        uniform float uRevealDist;
        varying vec2 vUv;
        varying float vFogFactor;
        varying float vViewDist;

        ${GLSL_NOISE}

        void main() {
          float along = vUv.x;
          float around = vUv.y;
          float angle = around * 6.2832;
          float t = uTime;
          float ei = uEntryIntensity; // 0→1 during entry, ~0.15 cruise

          // ── Domain-warped coordinates — warp amplified during entry ──
          vec2 baseUV = vec2(angle, along * 10.0);
          vec2 warpedRaw = warp(baseUV, t);
          vec2 warpDelta = warpedRaw - baseUV;
          warpDelta *= (1.0 + ei * 2.5); // stronger distortion during pull
          vec2 warped = baseUV + warpDelta;

          // ── Layer 1: Large-scale spiral arms ──
          float twist1 = warped.x * 3.0 + along * 20.0 - t * (1.0 + ei * 0.8);
          float arm1 = sin(twist1);
          float armWidth1 = 0.25 + fbm(vec2(along * 3.0, t * 0.15)) * 0.35;
          arm1 = smoothstep(-armWidth1 * 0.5, armWidth1, arm1);

          // ── Layer 2: Counter-rotating secondary arms ──
          float twist2 = warped.x * 2.0 - along * 14.0 + t * (0.55 + ei * 0.4);
          float arm2 = sin(twist2);
          arm2 = smoothstep(0.05, 0.6, arm2);

          // ── Layer 3: Turbulent flow field ──
          vec2 flowUV = vec2(angle * 0.8, along * 6.0 - t * (0.35 + ei * 0.3));
          float flow = fbm(warp(flowUV, t * (0.25 + ei * 0.2)));

          // ── Layer 4: Fine energy filaments — faster during pull ──
          float fineAngle = angle + fbm(vec2(angle * 2.0, along * 5.0 - t * 0.4)) * (1.8 + ei * 1.2);
          float filament1 = sin(fineAngle * 10.0 + along * 45.0 - t * (3.5 + ei * 2.0));
          filament1 = pow(max(filament1, 0.0), 5.0);

          float filament2 = sin(angle * 7.0 - along * 35.0 + t * (2.8 + ei * 1.5));
          filament2 = pow(max(filament2, 0.0), 6.0);

          // ── Combine intensity ──
          float intensity = 0.0;
          intensity += arm1 * 0.35;
          intensity += arm2 * 0.2;
          intensity += flow * 0.25;
          intensity += filament1 * (0.2 + ei * 0.1);
          intensity += filament2 * (0.12 + ei * 0.08);

          // ── Depth compression — stronger during entry ──
          float compressionPow = 1.8 - ei * 0.6; // tighter compression at peak
          float depthBoost = 0.6 + pow(along, compressionPow) * (0.6 + ei * 0.4);
          // During entry, boost the entrance section so the tunnel mouth glows
          depthBoost += ei * (1.0 - along) * 0.6;
          intensity *= depthBoost;

          // ── Volumetric light shafts ──
          float shaftAngle = angle + fbm(vec2(along * 2.0, t * 0.1)) * 0.8;
          float shaft = pow(max(sin(shaftAngle * 1.5 + along * 6.0 - t * 0.25), 0.0), 6.0);
          intensity += shaft * 0.15 * depthBoost;

          // ── Temporal pulsing — more aggressive during entry ──
          float pulse1 = (0.85 - ei * 0.1) + (0.15 + ei * 0.1) * sin(t * 1.1 + along * 5.0);
          float pulse2 = 0.92 + 0.08 * sin(t * 0.6 - along * 3.0 + angle * 1.5);
          float pulse3 = 0.95 + 0.05 * sin(t * (2.3 + ei * 3.0) + angle * 4.0);
          intensity *= pulse1 * pulse2 * pulse3;

          // ── Brightness boost during gravitational pull ──
          intensity *= 1.0 + ei * 0.5;

          // ── Color ramp (HDR values for bloom pickup) ──
          vec3 voidBlack  = vec3(0.003, 0.005, 0.02);
          vec3 deepBlue   = vec3(0.015, 0.04, 0.15);
          vec3 midBlue    = vec3(0.06, 0.18, 0.48);
          vec3 brightBlue = vec3(0.15, 0.40, 0.90);
          vec3 cyan       = vec3(0.30, 0.65, 1.10);
          vec3 white      = vec3(1.10, 1.20, 1.40);

          vec3 color = voidBlack;
          color = mix(color, deepBlue,   smoothstep(0.04, 0.18, intensity));
          color = mix(color, midBlue,    smoothstep(0.15, 0.35, intensity));
          color = mix(color, brightBlue, smoothstep(0.28, 0.55, intensity));
          color = mix(color, cyan,       smoothstep(0.45, 0.72, intensity));
          color = mix(color, white,      smoothstep(0.68, 0.95, intensity) * (0.45 + ei * 0.2));

          // ── Cyan rim on spiral edges ──
          float edge = fwidth(intensity) * 25.0;
          color += vec3(0.05, 0.15, 0.35) * edge * smoothstep(0.2, 0.5, intensity);

          // Progressive reveal — fade out fragments beyond the reveal distance
          float revealFade = 1.0 - smoothstep(uRevealDist * 0.7, uRevealDist, vViewDist);

          float fog = clamp(vFogFactor, 0.0, 1.0);
          gl_FragColor = vec4(color * fog, uOpacity * revealFade);
        }
      `,
    })

    // ── Inner energy layer: brighter, more chaotic, smaller tube ──
    const innerWallMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uEntryIntensity: { value: 0 },
        uRevealDist: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vFogFactor;
        varying float vViewDist;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPos.z;
          vViewDist = dist;
          vFogFactor = exp2(-0.000002 * dist * dist);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uTime;
        uniform float uEntryIntensity;
        uniform float uRevealDist;
        varying vec2 vUv;
        varying float vFogFactor;
        varying float vViewDist;

        ${GLSL_NOISE}

        void main() {
          float along = vUv.x;
          float angle = vUv.y * 6.2832;
          float t = uTime;
          float ei = uEntryIntensity;

          // Fast-moving energy streams — accelerated during pull
          float stream1 = sin(angle * 5.0 + along * 30.0 - t * (4.0 + ei * 3.0));
          stream1 = pow(max(stream1, 0.0), 4.0);

          float stream2 = sin(angle * 3.0 - along * 22.0 + t * (2.5 + ei * 2.0));
          stream2 = pow(max(stream2, 0.0), 5.0);

          // Turbulent base — more chaotic during entry
          vec2 uv = warp(vec2(angle, along * 8.0 - t * 0.5), t * (0.3 + ei * 0.3));
          float turb = fbm(uv) * (0.5 + ei * 0.3);

          float intensity = stream1 * 0.4 + stream2 * 0.3 + turb * 0.3;
          float innerDepth = 0.5 + pow(along, 2.0) * 0.8;
          // During entry, boost entrance so the tunnel mouth is bright
          innerDepth += ei * (1.0 - along) * 0.5;
          intensity *= innerDepth;
          intensity *= (0.8 + 0.2 * sin(t * 1.5 + along * 8.0));
          intensity *= 1.0 + ei * 0.6; // brighter during pull

          vec3 color = mix(
            vec3(0.05, 0.15, 0.4),
            vec3(0.4, 0.7, 1.2),
            smoothstep(0.1, 0.6, intensity)
          );
          color = mix(color, vec3(0.9, 1.0, 1.3), smoothstep(0.5, 0.9, intensity) * (0.4 + ei * 0.2));

          // Progressive reveal
          float revealFade = 1.0 - smoothstep(uRevealDist * 0.7, uRevealDist, vViewDist);

          float fog = clamp(vFogFactor, 0.0, 1.0);
          gl_FragColor = vec4(color * intensity * fog, uOpacity * (0.35 + ei * 0.15) * revealFade);
        }
      `,
    })

    // ── Speed particles ──
    const particleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uRevealDist: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aSpeed;
        varying float vFogFactor;
        varying float vBrightness;
        varying float vViewDist;
        uniform float uTime;
        void main() {
          vBrightness = 0.6 + 0.4 * sin(uTime * (2.0 + aSpeed * 3.0) + aSpeed * 40.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          vViewDist = dist;
          vFogFactor = exp2(-0.0000025 * dist * dist);
          gl_PointSize = aSize * (350.0 / max(-mvPosition.z, 1.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uRevealDist;
        varying float vFogFactor;
        varying float vBrightness;
        varying float vViewDist;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float glow = 1.0 - d * 2.0;
          glow = pow(glow, 2.0);
          float revealFade = 1.0 - smoothstep(uRevealDist * 0.7, uRevealDist, vViewDist);
          // HDR bright core for bloom
          vec3 color = mix(vec3(0.2, 0.4, 0.8), vec3(1.2, 1.3, 1.5), glow);
          gl_FragColor = vec4(color * glow * vBrightness, uOpacity * clamp(vFogFactor, 0.0, 1.0) * glow * revealFade);
        }
      `,
    })

    // ── Near-camera streaks: larger, brighter, elongated ──
    const nearStreakMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uRevealDist: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aSpeed;
        varying float vFogFactor;
        varying float vBrightness;
        varying float vViewDist;
        uniform float uTime;
        void main() {
          vBrightness = 0.5 + 0.5 * sin(uTime * (1.5 + aSpeed * 4.0) + aSpeed * 60.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          vViewDist = dist;
          vFogFactor = exp2(-0.000002 * dist * dist);
          // Larger point size for near streaks
          gl_PointSize = aSize * (500.0 / max(-mvPosition.z, 1.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uRevealDist;
        varying float vFogFactor;
        varying float vBrightness;
        varying float vViewDist;
        void main() {
          // Elongated shape — compressed vertically for streak feel
          vec2 uv = gl_PointCoord - 0.5;
          uv.y *= 0.4; // stretch horizontally
          float d = length(uv);
          if (d > 0.5) discard;
          float glow = 1.0 - d * 2.0;
          glow = pow(glow, 1.5);
          float revealFade = 1.0 - smoothstep(uRevealDist * 0.7, uRevealDist, vViewDist);
          vec3 color = mix(vec3(0.15, 0.3, 0.7), vec3(1.5, 1.6, 1.8), pow(glow, 2.0));
          float fog = clamp(vFogFactor, 0.0, 1.0);
          gl_FragColor = vec4(color * glow * vBrightness, uOpacity * fog * glow * 0.6 * revealFade);
        }
      `,
    })

    // ── Destination glow ──
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          // Bright core that fades at edges — gravitational lens look
          float facing = dot(vNormal, vViewDir);
          float core = pow(max(facing, 0.0), 2.0);
          float halo = pow(max(facing, 0.0), 0.5) * 0.3;
          float pulse = 0.9 + 0.1 * sin(uTime * 1.8);
          // HDR white-blue for intense bloom
          vec3 coreColor = vec3(2.0, 2.2, 2.8) * core * pulse;
          vec3 haloColor = vec3(0.3, 0.5, 1.0) * halo;
          gl_FragColor = vec4(coreColor + haloColor, uOpacity * (core + halo));
        }
      `,
    })

    return {
      outerTube, innerTube, outerWallMat, innerWallMat,
      particleGeo, particleMat,
      nearStreakGeo, nearStreakMat,
      glowGeo, glowMat, exitPoint,
    }
  }, [])

  // Priority -2: update uniforms BEFORE WormholePortal renders the FBO at -1.
  // This eliminates the one-frame lag where the FBO would capture stale uniforms,
  // preventing a dark flash on the first hyperspace frame.
  useFrame(() => {
    const { appPhase } = useStore.getState()

    // Track when hyperspace started (for delay calculation)
    if (appPhase === 'hyperspace' && hyperStartRef.current === 0) {
      hyperStartRef.current = performance.now()
    }

    // Wait for the delay before activating the wormhole visuals —
    // during this time the ship accelerates through star-streaks
    if (appPhase === 'hyperspace' && !activatedRef.current) {
      const sinceHyper = performance.now() - hyperStartRef.current
      if (sinceHyper < WORMHOLE_DELAY) return

      activatedRef.current = true
      lastFrameRef.current = performance.now()
      virtualElapsedRef.current = 17
      if (groupRef.current) groupRef.current.visible = true
    }

    if (!activatedRef.current) return

    // Virtual time: cap per-frame delta so GPU stalls don't skip animation
    const now = performance.now()
    const rawDelta = now - lastFrameRef.current
    lastFrameRef.current = now
    virtualElapsedRef.current += Math.min(rawDelta, MAX_FRAME_DELTA)

    const elapsed = virtualElapsedRef.current
    // Smooth ease-in opacity: ease-out-quad for a natural ramp
    const rawOpacity = Math.min(elapsed / FADE_IN, 1)
    const opacity = rawOpacity * (2 - rawOpacity) // ease-out-quad
    const time = elapsed * 0.001

    // Progressive reveal distance — grows from 0 to MAX_REVEAL_DIST
    // Uses ease-out-cubic for a fast start that gradually decelerates
    const revealRaw = Math.min(elapsed / REVEAL_DURATION, 1)
    const revealEased = 1 - Math.pow(1 - revealRaw, 3) // ease-out-cubic
    const revealDist = revealEased * MAX_REVEAL_DIST

    const ei = falconProgress.entryIntensity

    resources.outerWallMat.uniforms.uOpacity.value = opacity
    resources.outerWallMat.uniforms.uTime.value = time
    resources.outerWallMat.uniforms.uEntryIntensity.value = ei
    resources.outerWallMat.uniforms.uRevealDist.value = revealDist
    resources.innerWallMat.uniforms.uOpacity.value = opacity
    resources.innerWallMat.uniforms.uTime.value = time
    resources.innerWallMat.uniforms.uEntryIntensity.value = ei
    resources.innerWallMat.uniforms.uRevealDist.value = revealDist
    resources.particleMat.uniforms.uOpacity.value = opacity
    resources.particleMat.uniforms.uTime.value = time
    resources.particleMat.uniforms.uRevealDist.value = revealDist
    resources.nearStreakMat.uniforms.uOpacity.value = opacity
    resources.nearStreakMat.uniforms.uTime.value = time
    resources.nearStreakMat.uniforms.uRevealDist.value = revealDist
    resources.glowMat.uniforms.uOpacity.value = opacity * Math.min(elapsed / 2000, 1) // slow reveal
    resources.glowMat.uniforms.uTime.value = time

    // Debug: log every 60 frames (~1/sec)
    if (import.meta.env.DEV) {
      debugFrameCount.current++
      if (debugFrameCount.current % 60 === 1) {
        console.log(`[WORMHOLE] elapsed=${elapsed.toFixed(0)}ms opacity=${opacity.toFixed(2)} ei=${ei.toFixed(2)} t=${falconProgress.t.toFixed(4)} visible=${groupRef.current?.visible}`)
      }
    }
  }, -2)

  return (
    <group ref={groupRef} visible={false}>
      {/* Outer vortex wall — main cinematic effect */}
      <mesh geometry={resources.outerTube} material={resources.outerWallMat} />
      {/* Inner energy layer — additive depth */}
      <mesh geometry={resources.innerTube} material={resources.innerWallMat} />
      {/* Speed sparks */}
      <points geometry={resources.particleGeo} material={resources.particleMat} />
      {/* Near-camera foreground streaks */}
      <points geometry={resources.nearStreakGeo} material={resources.nearStreakMat} />
      {/* Bright destination focal point */}
      <mesh
        geometry={resources.glowGeo}
        material={resources.glowMat}
        position={[resources.exitPoint.x, resources.exitPoint.y, resources.exitPoint.z]}
      />
    </group>
  )
}
