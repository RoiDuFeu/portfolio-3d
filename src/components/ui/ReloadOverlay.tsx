import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'

const MESSAGES = [
  'FLUSHING RENDER PIPELINE...',
  'APPLYING PERFORMANCE SETTINGS...',
  'REBUILDING SCENE GRAPH...',
  'REINITIALIZING GL CONTEXT...',
  'LOADING ASSETS...',
]

const TOTAL_DURATION = 1400 // ms — total time for the bar to fill
const TICK = 16 // ms — use ~60fps for smooth animation
const STEPS = TOTAL_DURATION / TICK

export function ReloadOverlay() {
  const isReloading = useStore((s) => s.isReloading)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (isReloading) {
      setProgress(0)
      setMsgIdx(0)
      setVisible(true)
      setFading(false)

      startRef.current = performance.now()

      const tick = () => {
        const elapsed = performance.now() - startRef.current
        const t = Math.min(elapsed / TOTAL_DURATION, 1)
        // Ease-out for a smooth deceleration feel
        const eased = 1 - (1 - t) * (1 - t)
        setProgress(eased * 100)

        // Cycle messages based on progress
        const idx = Math.min(
          Math.floor(t * MESSAGES.length),
          MESSAGES.length - 1
        )
        setMsgIdx(idx)

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
        // When t >= 1, bar is at 100% — we just stop and wait for isReloading to flip
      }

      rafRef.current = requestAnimationFrame(tick)
    } else if (visible) {
      // isReloading turned off — ensure we show 100% then fade
      setProgress(100)
      setMsgIdx(MESSAGES.length - 1)
      // Brief pause at 100% so the user sees it complete, then fade
      setTimeout(() => {
        setFading(true)
        setTimeout(() => {
          setVisible(false)
          setFading(false)
        }, 300)
      }, 250)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isReloading])

  if (!visible) return null

  const filled = Math.round((progress / 100) * 24)
  const empty = 24 - filled
  const bar = '#'.repeat(filled) + '.'.repeat(empty)

  return (
    <div
      className="retro-reload-overlay"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div className="retro-reload-box">
        <div className="retro-reload-title">
          ┌─ SYSTEM REINITIALIZING ─────────────┐
        </div>
        <div className="retro-reload-spacer" />
        <div className="retro-reload-msg">
          &gt; {MESSAGES[msgIdx]}
        </div>
        <div className="retro-reload-spacer" />
        <div className="retro-reload-bar">
          [{bar}] {Math.round(progress)}%
        </div>
        <div className="retro-reload-spacer" />
        <div className="retro-reload-footer">
          └────────────────────────────────────┘
        </div>
      </div>
    </div>
  )
}
