import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Wrapper group for all solar system content.
 * Progressively reveals Three.js children during hyperspace flight:
 *   - Waits 800ms after hyperspace starts
 *   - Reveals one Three.js child every 300ms (spreads GPU shader compilation)
 *   - Reports loading progress to the store
 *   - Sets hyperspaceReady=true when all children are visible
 *   - The falcon loops in the tunnel until ready
 */

const SOLAR_SYSTEM_Z = -2000
const LOAD_START_DELAY = 800
const LOAD_INTERVAL = 300

interface Props {
  children: ReactNode
}

export function SolarSystemZone({ children }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const hyperspaceStart = useRef(0)
  const prevPhase = useRef('intro')
  const loadingStarted = useRef(false)
  const childrenRevealed = useRef(0)
  const allReady = useRef(false)

  useFrame(() => {
    if (!groupRef.current || allReady.current) return
    const { appPhase, setHyperspaceLoadProgress, setHyperspaceReady } = useStore.getState()

    // Detect hyperspace start
    if (appPhase === 'hyperspace' && prevPhase.current === 'intro') {
      hyperspaceStart.current = performance.now()
    }
    prevPhase.current = appPhase

    if (hyperspaceStart.current === 0) return
    const elapsed = performance.now() - hyperspaceStart.current
    if (elapsed < LOAD_START_DELAY) return

    const group = groupRef.current

    // First frame: make group visible but hide all its Three.js children
    if (!loadingStarted.current) {
      loadingStarted.current = true
      group.visible = true
      for (let i = 0; i < group.children.length; i++) {
        group.children[i].visible = false
      }
      childrenRevealed.current = 0
    }

    const totalChildren = group.children.length
    if (totalChildren === 0) {
      // No children yet (R3F hasn't mounted them), wait
      return
    }

    // Progressively reveal children
    const loadElapsed = elapsed - LOAD_START_DELAY
    const shouldReveal = Math.min(
      Math.floor(loadElapsed / LOAD_INTERVAL) + 1,
      totalChildren,
    )

    while (childrenRevealed.current < shouldReveal) {
      const idx = childrenRevealed.current
      if (idx < group.children.length) {
        group.children[idx].visible = true
      }
      childrenRevealed.current++
    }

    // Update progress
    const progress = childrenRevealed.current / totalChildren
    setHyperspaceLoadProgress(progress)

    // All done?
    if (childrenRevealed.current >= totalChildren) {
      allReady.current = true
      setHyperspaceReady(true)
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
