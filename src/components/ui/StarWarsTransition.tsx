import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Classic Star Wars diagonal wipe transition.
 *
 * Phase 1 (0–800ms):  Black diagonal sweeps IN from top-right to bottom-left,
 *                     covering the screen.
 * Phase 2 (800–1600ms): Diagonal sweeps OUT from top-left to bottom-right,
 *                       revealing the new scene.
 *
 * The total duration (1600ms) matches the setTimeout in the card click handlers.
 */
export function StarWarsTransition() {
  const active = useStore((s) => s.showStarWarsTransition)
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle')

  useEffect(() => {
    if (active) {
      setPhase('in')
      const t1 = setTimeout(() => setPhase('hold'), 700)
      const t2 = setTimeout(() => setPhase('out'), 900)
      const t3 = setTimeout(() => setPhase('idle'), 1600)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else {
      setPhase('idle')
    }
  }, [active])

  if (phase === 'idle') return null

  // We use a CSS clip-path polygon wipe.
  // "In" phase: black rectangle grows from right corner to cover screen.
  // "Out" phase: black rectangle shrinks from left corner to reveal screen.

  const clipIn = phase === 'in'
    ? 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)'  // starts collapsed on right
    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'        // fully covers

  const clipOut = phase === 'out'
    ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'  // collapses to left edge
    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'  // fully covers

  const isOut = phase === 'out'
  const clip = isOut ? clipOut : clipIn

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        pointerEvents: 'none',
        background: '#000',
        clipPath: clip,
        transition: isOut
          ? 'clip-path 0.65s cubic-bezier(0.76, 0, 0.24, 1)'
          : phase === 'in'
            ? 'clip-path 0.65s cubic-bezier(0.76, 0, 0.24, 1)'
            : 'none',
      }}
    />
  )
}
