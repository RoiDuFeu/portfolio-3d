import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Black backdrop with gentle idle starfield. Always mounted.
 *
 * Handles phase timing (triggering 'main' and canvas dissolve).
 * The visual tunnel effect is rendered by HyperspaceTunnel inside IntroScene.
 */

const STAR_COUNT   = 4000

// Timing (ms from hyperspace trigger)
const DECEL_START  = 2750
const TRIGGER_MAIN = 2750
const FADE_END     = 3950

// Speed constants (world units / ms)
const SPEED_IDLE   = 0.0002

function makeStar() {
  const r = Math.sqrt(Math.random()) * 4.8  // uniform area distribution
  const a = Math.random() * Math.PI * 2
  const z = Math.pow(Math.random(), 2) * 200
  return {
    x:  r * Math.cos(a),
    y:  r * Math.sin(a),
    z,
    br: 0.55 + Math.random() * 0.45,
  }
}

export function HyperspaceCanvas() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const appPhase    = useStore((s) => s.appPhase)
  const setAppPhase = useStore((s) => s.setAppPhase)

  const animRef = useRef({
    phase: 'idle' as 'idle' | 'running' | 'done',
    hyperspaceStart: 0,
    mainTriggered: false,
  })

  // React to appPhase — kick off the jump sequence
  useEffect(() => {
    if (appPhase === 'hyperspace' && animRef.current.phase === 'idle') {
      animRef.current.phase           = 'running'
      animRef.current.hyperspaceStart = performance.now()
    }
  }, [appPhase])

  // Three.js lifecycle — mount once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.05,
      2000,
    )
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, 100)

    // ── Stars: LineSegments (head + tail per star) ─────────────────────────
    const stars  = Array.from({ length: STAR_COUNT }, makeStar)
    const posArr = new Float32Array(STAR_COUNT * 6) // 2 vertices × 3 floats
    const colArr = new Float32Array(STAR_COUNT * 6)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colArr, 3))
    const mat = new THREE.LineBasicMaterial({ vertexColors: true })
    scene.add(new THREE.LineSegments(geo, mat))

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation loop ────────────────────────────────────────────────────
    let raf: number
    let lastTs = 0

    const draw = (ts: number) => {
      const delta = lastTs ? Math.min(ts - lastTs, 50) : 16
      lastTs = ts

      const anim = animRef.current
      if (anim.phase === 'done') return

      // ── Speed (units / ms) ───────────────────────────────────────────
      let speedPerMs: number = SPEED_IDLE

      if (anim.phase === 'running') {
        const elapsed = ts - anim.hyperspaceStart
        // Speed stays at SPEED_IDLE — tunnel effect is in IntroScene

        // Trigger galaxy fade-in
        if (elapsed >= TRIGGER_MAIN && !anim.mainTriggered) {
          anim.mainTriggered = true
          setAppPhase('main')
        }

        // Canvas dissolve (starts at DECEL_START, finishes at FADE_END)
        if (elapsed >= DECEL_START) {
          const fp = Math.min((elapsed - DECEL_START) / (FADE_END - DECEL_START), 1)
          canvas.style.opacity = String(1 - fp)
          if (fp >= 1) {
            canvas.style.opacity = '0'
            anim.phase = 'done'
            return
          }
        }
      }

      // ── Camera gentle drift ─────────────────────────────────────────
      camera.position.x = 0
      camera.position.y = 0

      const frameMove = speedPerMs * delta

      // ── Update star positions & colours ─────────────────────────────
      // Tail offset: signed, with a minimum that projects to ~2 px on-screen
      // for close stars so dots remain visible during idle.
      const tailOffset = frameMove >= 0
        ? Math.max(frameMove * 4, 0.001)   // forward  → tail further from camera
        : Math.min(frameMove * 4, -0.001)  // backward → tail closer to camera

      const pa = (geo.attributes.position as THREE.Float32BufferAttribute).array as Float32Array
      const ca = (geo.attributes.color    as THREE.Float32BufferAttribute).array as Float32Array

      for (let i = 0; i < STAR_COUNT; i++) {
        const s = stars[i]
        s.z -= frameMove // positive speed → z decreases → star approaches camera

        // Wrap: flew past camera → reset far ahead
        if (s.z < -10) {
          s.z = 200
          const r = Math.sqrt(Math.random()) * 4.8
          const a = Math.random() * Math.PI * 2
          s.x = r * Math.cos(a)
          s.y = r * Math.sin(a)
        } else if (s.z > 210) {
          s.z = -10
        }

        const b = i * 6
        // Head: current position, blue-tinted white
        pa[b]   = s.x;  pa[b+1] = s.y;  pa[b+2] = s.z
        // Tail: previous position, near-black
        pa[b+3] = s.x;  pa[b+4] = s.y;  pa[b+5] = s.z + tailOffset

        ca[b]   = s.br; ca[b+1] = s.br; ca[b+2] = 1.0  // head: blue-tinted white
        ca[b+3] = 0;    ca[b+4] = 0;    ca[b+5] = 0.04 // tail: near-black
      }

      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate    = true

      renderer.render(scene, camera)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // zIndex 8: below IntroScene (10) so the Falcon renders on top,
  // but above default-stacked elements.
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 8, pointerEvents: 'none' }}
    />
  )
}
