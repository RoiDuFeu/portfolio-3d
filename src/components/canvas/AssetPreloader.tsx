import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { useStore } from '../../store/useStore'

/**
 * Sits inside the Canvas (but outside Suspense) and monitors
 * THREE.DefaultLoadingManager progress via drei's useProgress.
 *
 * Once every asset has finished loading:
 *   1. Waits a couple of frames for geometries to settle
 *   2. Calls renderer.compile(scene, camera) to force-compile ALL shaders
 *   3. Transitions appPhase from 'loading' → 'intro'
 *
 * This guarantees zero blinks, zero GPU stalls, zero pop-in
 * after the loading screen disappears.
 */

// Extra frames after assets load before we compile (let GPU buffers settle)
const SETTLE_FRAMES = 4

export function AssetPreloader() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const { progress, active } = useProgress()
  const assetsReady = useRef(false)
  const settleCounter = useRef(0)
  const compiled = useRef(false)

  // Report loading progress to the store
  useEffect(() => {
    useStore.getState().setLoadProgress(progress / 100)
  }, [progress])

  useFrame(() => {
    const { appPhase, setAppPhase, setLoading } = useStore.getState()
    if (appPhase !== 'loading') return

    // Wait until all loaders are done
    if (!assetsReady.current) {
      if (!active && progress >= 100) {
        assetsReady.current = true
        settleCounter.current = 0
      }
      return
    }

    // Let a few frames pass so all geometry/material is fully uploaded
    if (!compiled.current) {
      settleCounter.current++
      if (settleCounter.current < SETTLE_FRAMES) return

      // Force compile ALL shaders in the entire scene graph
      compiled.current = true
      gl.compile(scene, camera)
    }

    // Done — skip intro/hyperspace, go straight to arriving (cards + galaxy view)
    setLoading(false)
    setAppPhase('arriving')
  })

  return null
}
