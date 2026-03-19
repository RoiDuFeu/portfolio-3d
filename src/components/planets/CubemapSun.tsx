import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader imports
import perlinVert from '../../shaders/cubemapSun/perlin.vert'
import perlinFrag from '../../shaders/cubemapSun/perlin.frag'
import sphereVert from '../../shaders/cubemapSun/sphere.vert'
import sphereFrag from '../../shaders/cubemapSun/sphere.frag'
import glowVert from '../../shaders/cubemapSun/glow.vert'
import glowFrag from '../../shaders/cubemapSun/glow.frag'
import raysVert from '../../shaders/cubemapSun/rays.vert'
import raysFrag from '../../shaders/cubemapSun/rays.frag'
import flaresVert from '../../shaders/cubemapSun/flares.vert'
import flaresFrag from '../../shaders/cubemapSun/flares.frag'

interface CubemapSunProps {
  position?: [number, number, number]
  scale?: number
}

const BASE_RADIUS = 3

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Geometry builders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildGlowGeometry(radius: number) {
  const segments = 134
  const positions = new Float32Array(3 * 2 * segments)
  let r = 0
  for (let a = 0; a < segments; a++) {
    const s = (a / segments) * Math.PI * 2
    const sx = Math.sin(s) * radius
    const sy = Math.cos(s) * radius
    // inner ring (vRadial = 0)
    positions[r++] = sx; positions[r++] = sy; positions[r++] = 0.0
    // outer ring (vRadial = 1)
    positions[r++] = sx; positions[r++] = sy; positions[r++] = 1.0
  }
  const indices = new Uint32Array(2 * segments * 3)
  let o = 0
  for (let a = 0; a < segments; a++) {
    const i0 = 2 * a
    const i1 = 2 * a + 1
    const i2 = 2 * ((a + 1) % segments)
    const i3 = i2 + 1
    indices[o++] = i0; indices[o++] = i1; indices[o++] = i2
    indices[o++] = i2; indices[o++] = i1; indices[o++] = i3
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('aPos', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  return geo
}

function buildRaysGeometry(sunRadius: number) {
  const lineCount = 4095
  const lineLength = 8
  const totalVerts = lineCount * lineLength * 2

  const aPos = new Float32Array(totalVerts * 3)
  const aPos0 = new Float32Array(totalVerts * 3)
  const aWireRand = new Float32Array(totalVerts * 4)
  const indices = new Uint32Array(lineCount * (lineLength - 1) * 2 * 3)

  const base = new THREE.Vector3()
  const jitter = new THREE.Vector3()
  const held = new THREE.Vector3()

  let ip = 0, i0 = 0, ir = 0, ii = 0

  const randomUnit = (v: THREE.Vector3) => {
    const z = Math.random() * 2 - 1
    const t = Math.random() * Math.PI * 2
    const r = Math.sqrt(1 - z * z)
    v.set(r * Math.cos(t), r * Math.sin(t), z)
    return v
  }

  let d = 0, p = 0
  for (let v = 0; v < lineCount; v++) {
    if (Math.random() < 0.1 || v === 0) {
      randomUnit(held).normalize()
      d = Math.random()
      p = Math.random()
    }
    base.copy(held)
    randomUnit(jitter).multiplyScalar(0.025)
    base.add(jitter).normalize()

    const rands = [d, p, Math.random(), Math.random()]

    for (let m = 0; m < lineLength; m++) {
      const vertBase = 2 * (v * lineLength + m)
      for (let y = 0; y <= 1; y++) {
        aPos[ip++] = (m + 0.5) / lineLength
        aPos[ip++] = (v + 0.5) / lineCount
        aPos[ip++] = 2 * y - 1

        for (let t = 0; t < 4; t++) aWireRand[ir++] = rands[t]

        aPos0[i0++] = base.x * sunRadius
        aPos0[i0++] = base.y * sunRadius
        aPos0[i0++] = base.z * sunRadius
      }

      if (m < lineLength - 1) {
        const a = vertBase
        const b = vertBase + 1
        const c = vertBase + 2
        const dd = vertBase + 3
        indices[ii++] = a; indices[ii++] = b; indices[ii++] = c
        indices[ii++] = c; indices[ii++] = b; indices[ii++] = dd
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('aPos', new THREE.BufferAttribute(aPos, 3))
  geo.setAttribute('aPos0', new THREE.BufferAttribute(aPos0, 3))
  geo.setAttribute('aWireRandom', new THREE.BufferAttribute(aWireRand, 4))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  return geo
}

function buildFlaresGeometry(sunRadius: number) {
  const lineCount = 2047
  const lineLength = 16

  const aPos = new Float32Array(lineCount * lineLength * 2 * 3)
  const aPos0 = new Float32Array(lineCount * lineLength * 2 * 3)
  const aPos1 = new Float32Array(lineCount * lineLength * 2 * 3)
  const aWireRand = new Float32Array(lineCount * lineLength * 2 * 4)
  const indices = new Uint32Array(lineCount * (lineLength - 1) * 2 * 3)

  const held = new THREE.Vector3()
  const dDir = new THREE.Vector3()
  const f = new THREE.Vector3()
  const pDir = new THREE.Vector3()
  const g = new THREE.Vector3()

  let s = 0, l = 0, c = 0, h = 0, u = 0

  f.set(Math.random(), Math.random(), Math.random()).normalize()

  let m = Math.random(), _p = Math.random()
  for (let y = 0; y < lineCount; y++) {
    if (Math.random() < 0.025 || y === 0) {
      dDir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
      held.copy(dDir)
      g.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(0.4)
      held.add(g).normalize()
      m = Math.random()
      _p = Math.random()
    }

    f.copy(dDir)
    g.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(0.02)
    f.add(g).normalize()

    pDir.copy(held)
    g.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(0.075)
    pDir.add(g).normalize()

    const rands = [m, _p, Math.random(), Math.random()]

    for (let E = 0; E < lineLength; E++) {
      const base = 2 * (y * lineLength + E)
      for (let A = 0; A <= 1; A++) {
        aPos[s++] = (E + 0.5) / lineLength
        aPos[s++] = (y + 0.5) / lineCount
        aPos[s++] = 2 * A - 1

        for (let R = 0; R < 4; R++) aWireRand[l++] = rands[R]

        aPos0[c++] = f.x * sunRadius
        aPos0[c++] = f.y * sunRadius
        aPos0[c++] = f.z * sunRadius
        aPos1[h++] = pDir.x * sunRadius
        aPos1[h++] = pDir.y * sunRadius
        aPos1[h++] = pDir.z * sunRadius
      }

      if (E < lineLength - 1) {
        indices[u++] = base
        indices[u++] = base + 1
        indices[u++] = base + 2
        indices[u++] = base + 2
        indices[u++] = base + 1
        indices[u++] = base + 3
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('aPos', new THREE.BufferAttribute(aPos, 3))
  geo.setAttribute('aPos0', new THREE.BufferAttribute(aPos0, 3))
  geo.setAttribute('aPos1', new THREE.BufferAttribute(aPos1, 3))
  geo.setAttribute('aWireRandom', new THREE.BufferAttribute(aWireRand, 4))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  return geo
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CubemapSun Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CubemapSun({ position, scale = 1 }: CubemapSunProps = {}) {
  const SUN_RADIUS = BASE_RADIUS * scale
  const groupRef = useRef<THREE.Group>(null)
  const sunMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const raysMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const flaresMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const keyLightRef = useRef<THREE.PointLight>(null)
  const fillLightRef = useRef<THREE.PointLight>(null)

  // World-space light direction (fully visible with uVisibility=1)
  const lightDirWorld = useMemo(() => new THREE.Vector3(1, 1, 1).normalize(), [])

  // Perlin cubemap baking setup (off-screen scene)
  const perlin = useMemo(() => {
    const cubeRT = new THREE.WebGLCubeRenderTarget(512, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      generateMipmaps: false
    })
    const cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT)
    const scene = new THREE.Scene()
    const mat = new THREE.ShaderMaterial({
      vertexShader: perlinVert,
      fragmentShader: perlinFrag,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uSpatialFrequency: { value: 6 },
        uTemporalFrequency: { value: 0.1 },
        uH: { value: 1 },
        uContrast: { value: 0.25 },
        uFlatten: { value: 0.72 }
      }
    })
    const geo = new THREE.BoxGeometry(2, 2, 2)
    scene.add(new THREE.Mesh(geo, mat))
    return { cubeRT, cubeCam, scene, mat, geo }
  }, [])

  // Custom geometries
  const glowGeo = useMemo(() => buildGlowGeometry(SUN_RADIUS), [SUN_RADIUS])
  const raysGeo = useMemo(() => buildRaysGeometry(SUN_RADIUS), [SUN_RADIUS])
  const flaresGeo = useMemo(() => buildFlaresGeometry(SUN_RADIUS), [SUN_RADIUS])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      perlin.cubeRT.dispose()
      perlin.mat.dispose()
      perlin.geo.dispose()
      glowGeo.dispose()
      raysGeo.dispose()
      flaresGeo.dispose()
    }
  }, [perlin, glowGeo, raysGeo, flaresGeo])

  // Uniforms
  const sunUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPerlinCube: { value: perlin.cubeRT.texture },
    uFresnelPower: { value: 1.0 },
    uFresnelInfluence: { value: 0.8 },
    uTint: { value: 0.2 },
    uBase: { value: 4.0 },
    uBrightnessOffset: { value: 1.0 },
    uBrightness: { value: 0.8 },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() }
  }), [perlin.cubeRT.texture, lightDirWorld])

  const glowUniforms = useMemo(() => ({
    uViewProjection: { value: new THREE.Matrix4() },
    uRadius: { value: 3.0 },
    uTint: { value: 0.25 },
    uBrightness: { value: 0.12 },
    uFalloffColor: { value: 0.3 },
    uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uCamPos: { value: new THREE.Vector3() },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() }
  }), [lightDirWorld])

  const raysUniforms = useMemo(() => ({
    uViewProjection: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() },
    uWidth: { value: 0.08 },
    uLength: { value: 0.7 },
    uOpacity: { value: 0.08 },
    uNoiseFrequency: { value: 8.0 },
    uNoiseAmplitude: { value: 0.5 },
    uAlphaBlended: { value: 0.4 },
    uHueSpread: { value: 0.2 },
    uHue: { value: 0.2 }
  }), [lightDirWorld])

  const flaresUniforms = useMemo(() => ({
    uViewProjection: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() },
    uWidth: { value: 0.015 },
    uAmp: { value: 0.6 },
    uOpacity: { value: 0.5 },
    uAlphaBlended: { value: 0.7 },
    uHueSpread: { value: 0.16 },
    uHue: { value: 0.0 },
    uNoiseFrequency: { value: 4.0 },
    uNoiseAmplitude: { value: 0.25 }
  }), [lightDirWorld])

  // Scratch objects to avoid per-frame allocations
  const scratch = useMemo(() => ({
    view: new THREE.Matrix4(),
    vp: new THREE.Matrix4(),
    camPos: new THREE.Vector3(),
    camUp: new THREE.Vector3()
  }), [])

  useFrame((state) => {
    const { gl, camera } = state
    const time = state.clock.elapsedTime

    // 1. Bake perlin noise cubemap
    perlin.mat.uniforms.uTime.value = time * 0.01
    perlin.cubeCam.update(gl, perlin.scene)

    // 2. Update sun surface
    if (sunMaterialRef.current) {
      sunMaterialRef.current.uniforms.uTime.value = time * 0.04
      sunMaterialRef.current.uniforms.uLightView.value.copy(lightDirWorld)
    }

    // 3. Compute shared camera matrices
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    scratch.view.copy(camera.matrixWorld).invert()
    scratch.vp.multiplyMatrices(camera.projectionMatrix, scratch.view)
    camera.getWorldPosition(scratch.camPos)
    scratch.camUp.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize()

    // 4. Update glow billboard
    if (glowMaterialRef.current) {
      const u = glowMaterialRef.current.uniforms
      u.uViewProjection.value.copy(scratch.vp)
      u.uCamUp.value.copy(scratch.camUp)
      u.uCamPos.value.copy(scratch.camPos)
      u.uLightView.value.copy(lightDirWorld)
    }

    // 5. Update corona rays
    if (raysMaterialRef.current) {
      const u = raysMaterialRef.current.uniforms
      u.uViewProjection.value.copy(scratch.vp)
      u.uCamPos.value.copy(scratch.camPos)
      u.uTime.value = time
      u.uLightView.value.copy(lightDirWorld)
    }

    // 6. Update solar flares
    if (flaresMaterialRef.current) {
      const u = flaresMaterialRef.current.uniforms
      u.uViewProjection.value.copy(scratch.vp)
      u.uCamPos.value.copy(scratch.camPos)
      u.uTime.value = time
      u.uLightView.value.copy(lightDirWorld)
    }

    // 7. Slow rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003
    }

    // 8. Light breathing
    const pulse = 1 + Math.sin(time * 0.55) * 0.08
    if (keyLightRef.current) keyLightRef.current.intensity = 7.0 * pulse
    if (fillLightRef.current) fillLightRef.current.intensity = 4.0 * (0.94 + Math.sin(time * 0.4 + 1.2) * 0.06)
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Sun surface — perlin cubemap noise */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <shaderMaterial
          ref={sunMaterialRef}
          vertexShader={sphereVert}
          fragmentShader={sphereFrag}
          transparent
          depthWrite
          uniforms={sunUniforms}
        />
      </mesh>

      {/* Solar flares — arcing magma ribbons */}
      <mesh renderOrder={1} geometry={flaresGeo} frustumCulled={false}>
        <shaderMaterial
          ref={flaresMaterialRef}
          vertexShader={flaresVert}
          fragmentShader={flaresFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={flaresUniforms}
        />
      </mesh>

      {/* Glow — camera-facing billboard halo */}
      <mesh renderOrder={2} geometry={glowGeo} frustumCulled={false}>
        <shaderMaterial
          ref={glowMaterialRef}
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={glowUniforms}
        />
      </mesh>

      {/* Corona rays — ribbon strips */}
      <mesh renderOrder={3} geometry={raysGeo} frustumCulled={false}>
        <shaderMaterial
          ref={raysMaterialRef}
          vertexShader={raysVert}
          fragmentShader={raysFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={raysUniforms}
        />
      </mesh>

      {/* Scene lighting */}
      <pointLight ref={keyLightRef} color="#FFA54F" intensity={7.0} distance={600} decay={1} />
      <pointLight ref={fillLightRef} color="#FF8030" intensity={4.0} distance={350} decay={1.5} />
    </group>
  )
}
