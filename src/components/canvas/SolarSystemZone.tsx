import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Wrapper group for all solar system content.
 *
 * All shaders are pre-compiled during the 'loading' phase by AssetPreloader,
 * so this component only manages visibility and hyperspace pacing:
 *
 *   - Hidden during intro (user sees the lobby starfield)
 *   - Shown immediately when hyperspace starts (no delay needed — everything
 *     is already compiled and uploaded to the GPU)
 *   - Signals hyperspaceReady after MIN_READY_DELAY so the Falcon has
 *     enough cruise time through the wormhole tunnel
 */

const SOLAR_SYSTEM_Z = -2000

// Minimum hyperspace time before signalling ready
// Falcon entry 1.5s + ~2 cruise loops (~7.8s) ≈ 9.5s
const MIN_READY_DELAY = 9500

interface Props {
  children: ReactNode
}

export function SolarSystemZone({ children }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  const prevPhase = useRef('loading')
  const hyperspaceStart = useRef(0)
  const readySignalled = useRef(false)

  useFrame(() => {
    if (!groupRef.current) return
    const { appPhase, setHyperspaceLoadProgress, setHyperspaceReady } =
      useStore.getState()

    // ── Detect hyperspace start ───────────────────────────────────
    if (appPhase === 'hyperspace' && prevPhase.current === 'intro') {
      hyperspaceStart.current = performance.now()
      readySignalled.current = false

      // Show immediately — shaders are already compiled during loading
      groupRef.current.visible = true
      for (let i = 0; i < groupRef.current.children.length; i++) {
        groupRef.current.children[i].visible = true
      }
      setHyperspaceLoadProgress(0.5)
    }
    prevPhase.current = appPhase

    // ── During hyperspace: pace the ready signal ─────────────────
    if (appPhase === 'hyperspace' && hyperspaceStart.current > 0) {
      if (!readySignalled.current) {
        const elapsed = performance.now() - hyperspaceStart.current
        const progress = Math.min(elapsed / MIN_READY_DELAY, 1)
        setHyperspaceLoadProgress(0.5 + progress * 0.5)

        if (elapsed >= MIN_READY_DELAY) {
          readySignalled.current = true
          setHyperspaceLoadProgress(1)
          setHyperspaceReady(true)
        }
      }
    }

    // ── Loading / Intro: keep hidden ────────────────────────────
    if (appPhase === 'loading' || appPhase === 'intro') {
      if (groupRef.current.visible) groupRef.current.visible = false
    }
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0, SOLAR_SYSTEM_Z]}
      visible={false}
    >
      {children}
    </group>
  )
}
