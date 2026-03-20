import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CubemapSunUniforms } from '../../types/shaderUniforms'
import { DEFAULT_SUN_UNIFORMS } from '../../utils/shaderDefaults'

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
  uniforms?: CubemapSunUniforms
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
    positions[r++] = sx; positions[r++] = sy; positions[r++] = 0.0
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

export function CubemapSun({ position, scale = 1, uniforms: uOverrides }: CubemapSunProps = {}) {
  const u = uOverrides ?? DEFAULT_SUN_UNIFORMS
  const SUN_RADIUS = BASE_RADIUS * scale
  const groupRef = useRef<THREE.Group>(null)
  const sunMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const raysMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const flaresMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const keyLightRef = useRef<THREE.PointLight>(null)
  const fillLightRef = useRef<THREE.PointLight>(null)

  const lightDirWorld = useMemo(() => new THREE.Vector3(1, 1, 1).normalize(), [])

  // Perlin cubemap baking setup
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
        uSpatialFrequency: { value: u.perlin.spatialFrequency },
        uTemporalFrequency: { value: u.perlin.temporalFrequency },
        uH: { value: 1 },
        uContrast: { value: u.perlin.contrast },
        uFlatten: { value: u.perlin.flatten }
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

  // Cleanup
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
    uFresnelPower: { value: u.surface.fresnelPower },
    uFresnelInfluence: { value: u.surface.fresnelInfluence },
    uTint: { value: u.surface.tint },
    uBase: { value: u.surface.base },
    uBrightnessOffset: { value: u.surface.brightnessOffset },
    uBrightness: { value: u.surface.brightness },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() }
  }), [perlin.cubeRT.texture, lightDirWorld])

  const glowUniforms = useMemo(() => ({
    uViewProjection: { value: new THREE.Matrix4() },
    uRadius: { value: u.glow.radius },
    uTint: { value: u.glow.tint },
    uBrightness: { value: u.glow.brightness },
    uFalloffColor: { value: u.glow.falloffColor },
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
    uWidth: { value: u.rays.width },
    uLength: { value: u.rays.length },
    uOpacity: { value: u.rays.opacity },
    uNoiseFrequency: { value: u.rays.noiseFrequency },
    uNoiseAmplitude: { value: u.rays.noiseAmplitude },
    uAlphaBlended: { value: u.rays.alphaBlended },
    uHueSpread: { value: u.rays.hueSpread },
    uHue: { value: u.rays.hue }
  }), [lightDirWorld])

  const flaresUniforms = useMemo(() => ({
    uViewProjection: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uVisibility: { value: 1.0 },
    uDirection: { value: 1.0 },
    uLightView: { value: lightDirWorld.clone() },
    uWidth: { value: u.flares.width },
    uAmp: { value: u.flares.amp },
    uOpacity: { value: u.flares.opacity },
    uAlphaBlended: { value: u.flares.alphaBlended },
    uHueSpread: { value: u.flares.hueSpread },
    uHue: { value: u.flares.hue },
    uNoiseFrequency: { value: u.flares.noiseFrequency },
    uNoiseAmplitude: { value: u.flares.noiseAmplitude }
  }), [lightDirWorld])

  // Sync uniform overrides into material refs
  useEffect(() => {
    if (sunMaterialRef.current) {
      const s = sunMaterialRef.current.uniforms
      s.uFresnelPower.value = u.surface.fresnelPower
      s.uFresnelInfluence.value = u.surface.fresnelInfluence
      s.uTint.value = u.surface.tint
      s.uBase.value = u.surface.base
      s.uBrightnessOffset.value = u.surface.brightnessOffset
      s.uBrightness.value = u.surface.brightness
    }
  }, [u.surface])

  useEffect(() => {
    if (perlin.mat) {
      const p = perlin.mat.uniforms
      p.uSpatialFrequency.value = u.perlin.spatialFrequency
      p.uTemporalFrequency.value = u.perlin.temporalFrequency
      p.uContrast.value = u.perlin.contrast
      p.uFlatten.value = u.perlin.flatten
    }
  }, [u.perlin, perlin.mat])

  useEffect(() => {
    if (glowMaterialRef.current) {
      const g = glowMaterialRef.current.uniforms
      g.uRadius.value = u.glow.radius
      g.uTint.value = u.glow.tint
      g.uBrightness.value = u.glow.brightness
      g.uFalloffColor.value = u.glow.falloffColor
    }
  }, [u.glow])

  useEffect(() => {
    if (raysMaterialRef.current) {
      const r = raysMaterialRef.current.uniforms
      r.uWidth.value = u.rays.width
      r.uLength.value = u.rays.length
      r.uOpacity.value = u.rays.opacity
      r.uNoiseFrequency.value = u.rays.noiseFrequency
      r.uNoiseAmplitude.value = u.rays.noiseAmplitude
      r.uAlphaBlended.value = u.rays.alphaBlended
      r.uHueSpread.value = u.rays.hueSpread
      r.uHue.value = u.rays.hue
    }
  }, [u.rays])

  useEffect(() => {
    if (flaresMaterialRef.current) {
      const f = flaresMaterialRef.current.uniforms
      f.uWidth.value = u.flares.width
      f.uAmp.value = u.flares.amp
      f.uOpacity.value = u.flares.opacity
      f.uAlphaBlended.value = u.flares.alphaBlended
      f.uHueSpread.value = u.flares.hueSpread
      f.uHue.value = u.flares.hue
      f.uNoiseFrequency.value = u.flares.noiseFrequency
      f.uNoiseAmplitude.value = u.flares.noiseAmplitude
    }
  }, [u.flares])

  // Scratch objects
  const scratch = useMemo(() => ({
    view: new THREE.Matrix4(),
    vp: new THREE.Matrix4(),
    camPos: new THREE.Vector3(),
    camUp: new THREE.Vector3()
  }), [])

  useFrame((state) => {
    // Skip expensive work when the solar system zone is invisible
    // Check parent visibility (SolarSystemZone sets visible=false on its group)
    if (groupRef.current?.parent && !groupRef.current.parent.visible) return

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

    // 3. Camera matrices
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    scratch.view.copy(camera.matrixWorld).invert()
    scratch.vp.multiplyMatrices(camera.projectionMatrix, scratch.view)
    camera.getWorldPosition(scratch.camPos)
    scratch.camUp.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize()

    // 4. Glow billboard
    if (glowMaterialRef.current) {
      const gu = glowMaterialRef.current.uniforms
      gu.uViewProjection.value.copy(scratch.vp)
      gu.uCamUp.value.copy(scratch.camUp)
      gu.uCamPos.value.copy(scratch.camPos)
      gu.uLightView.value.copy(lightDirWorld)
    }

    // 5. Corona rays
    if (raysMaterialRef.current) {
      const ru = raysMaterialRef.current.uniforms
      ru.uViewProjection.value.copy(scratch.vp)
      ru.uCamPos.value.copy(scratch.camPos)
      ru.uTime.value = time
      ru.uLightView.value.copy(lightDirWorld)
    }

    // 6. Solar flares
    if (flaresMaterialRef.current) {
      const fu = flaresMaterialRef.current.uniforms
      fu.uViewProjection.value.copy(scratch.vp)
      fu.uCamPos.value.copy(scratch.camPos)
      fu.uTime.value = time
      fu.uLightView.value.copy(lightDirWorld)
    }

    // 7. Slow rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003
    }

    // 8. Light breathing
    const pulse = 1 + Math.sin(time * 0.55) * 0.08
    if (keyLightRef.current) keyLightRef.current.intensity = u.lights.keyIntensity * pulse
    if (fillLightRef.current) fillLightRef.current.intensity = u.lights.fillIntensity * (0.94 + Math.sin(time * 0.4 + 1.2) * 0.06)
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Sun surface */}
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

      {/* Solar flares */}
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

      {/* Glow billboard */}
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

      {/* Corona rays */}
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
      <pointLight ref={keyLightRef} color={u.lights.keyColor} intensity={u.lights.keyIntensity} distance={u.lights.keyDistance} decay={1} />
      <pointLight ref={fillLightRef} color={u.lights.fillColor} intensity={u.lights.fillIntensity} distance={u.lights.fillDistance} decay={1.5} />
    </group>
  )
}
