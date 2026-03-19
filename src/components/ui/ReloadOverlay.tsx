import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'

const MESSAGES = [
  'FLUSHING RENDER PIPELINE...',
  'APPLYING PERFORMANCE SETTINGS...',
  'REBUILDING SCENE GRAPH...',
  'REINITIALIZING GL CONTEXT...',
  'LOADING ASSETS...',
]

export function ReloadOverlay() {
  const isReloading = useStore((s) => s.isReloading)
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isReloading) {
      setProgress(0)
      setMsgIdx(0)
      setVisible(true)

      let p = 0
      timerRef.current = setInterval(() => {
        p += 100 / 28 // reach ~100% over ~1.4s at 50ms steps
        setProgress(Math.min(p, 100))
        setMsgIdx((i) => (i < MESSAGES.length - 1 ? i + 1 : i))
        if (p >= 100) {
          clearInterval(timerRef.current!)
        }
      }, 50)
    } else {
      // Fade out
      setTimeout(() => setVisible(false), 200)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isReloading])

  if (!visible && !isReloading) return null

  const filled = Math.round((progress / 100) * 24)
  const empty = 24 - filled
  const bar = '#'.repeat(filled) + '.'.repeat(empty)

  return (
    <div
      className="retro-reload-overlay"
      style={{ opacity: isReloading ? 1 : 0, transition: 'opacity 0.2s ease' }}
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
