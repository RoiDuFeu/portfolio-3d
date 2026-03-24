import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { Wormhole } from '../intro/Wormhole'

/**
 * Renders the wormhole in a completely isolated Three.js scene.
 *
 * Architecture:
 *   1. A separate THREE.Scene holds all wormhole objects (via R3F createPortal)
 *   2. useFrame at priority -1 renders that scene to an off-screen FBO
 *      BEFORE the main scene render — so GPU work for the solar system
 *      cannot stall or interfere with the wormhole draw calls
 *   3. A fullscreen quad in the main scene displays the FBO texture
 *   4. The FBO uses HalfFloat so HDR emissive values survive into the
 *      main scene's PostProcessing bloom pass
 *
 * During intro / main phases the quad is invisible and the FBO render
 * is skipped entirely — zero overhead when the wormhole isn't active.
 */

const _clearColor = new THREE.Color()

export function WormholePortal() {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)
  const quadRef = useRef<THREE.Mesh>(null)

  // ── Isolated scene ────────────────────────────────────────────────
  const portalScene = useMemo(() => new THREE.Scene(), [])

  // ── Off-screen render target (HalfFloat = HDR for bloom) ──────────
  const fbo = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType,
        depthBuffer: true,
        stencilBuffer: false,
      }),
    [],
  )

  // Keep FBO resolution in sync with viewport
  useEffect(() => {
    const dpr = gl.getPixelRatio()
    fbo.setSize(
      Math.floor(size.width * dpr),
      Math.floor(size.height * dpr),
    )
  }, [gl, size, fbo])

  useEffect(() => () => fbo.dispose(), [fbo])

  // ── Fullscreen quad material (passthrough + alpha) ────────────────
  const quadMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { tDiffuse: { value: fbo.texture } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(tDiffuse, vUv);
          }
        `,
      }),
    [fbo.texture],
  )

  // ── Render wormhole scene → FBO (priority -1 = before main) ──────
  // All shaders are pre-compiled during the 'loading' phase by AssetPreloader,
  // so no warm-up render is needed here.
  useFrame(({ camera: frameCam }) => {
    const { appPhase } = useStore.getState()

    // Only render while the wormhole is relevant
    const active = appPhase === 'hyperspace' || appPhase === 'arriving'
    if (quadRef.current) quadRef.current.visible = active

    if (!active) return

    // Snapshot current renderer state
    const prevTarget = gl.getRenderTarget()
    gl.getClearColor(_clearColor)
    const prevAlpha = gl.getClearAlpha()

    // Render isolated wormhole scene to FBO
    gl.setRenderTarget(fbo)
    gl.setClearColor(0x000000, 0)
    gl.clear(true, true, false)
    gl.render(portalScene, frameCam)

    // Restore renderer state for main scene / EffectComposer
    gl.setRenderTarget(prevTarget)
    gl.setClearColor(_clearColor, prevAlpha)
  }, -1)

  return (
    <>
      {/* Mount wormhole React tree into the isolated scene */}
      {createPortal(<Wormhole />, portalScene)}

      {/* Fullscreen quad — composited into main scene so bloom picks it up */}
      <mesh
        ref={quadRef}
        renderOrder={-1}
        frustumCulled={false}
        visible={false}
      >
        <planeGeometry args={[2, 2]} />
        <primitive object={quadMat} attach="material" />
      </mesh>
    </>
  )
}
