import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export function PauseOverlay() {
  const isPaused = useStore((s) => s.isPaused)
  const setIsPaused = useStore((s) => s.setIsPaused)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        setIsPaused(!useStore.getState().isPaused)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setIsPaused])

  if (!isPaused) return null

  return (
    <div className="pause-overlay">
      <div className="pause-content">
        <div className="pause-title">PAUSED</div>
        <button className="pause-resume" onClick={() => setIsPaused(false)}>
          RESUME
        </button>
        <div className="pause-hint">Press ESC to resume</div>
      </div>
    </div>
  )
}
