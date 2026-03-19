import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Full-screen HTML overlay rendered on top of the 3D intro scene.
 *
 * Interaction:
 *  - Desktop: SPACE bar only (mouse is reserved for rotating the Falcon)
 *  - Mobile:  tap anywhere
 */
export function RetroUI() {
  const appPhase    = useStore((s) => s.appPhase)
  const setAppPhase = useStore((s) => s.setAppPhase)

  // ── Desktop: space bar ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && appPhase === 'intro') {
        e.preventDefault()
        setAppPhase('hyperspace')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [appPhase, setAppPhase])

  // ── Mobile: tap ───────────────────────────────────────────────────────────
  const handleTouch = () => {
    if (appPhase === 'intro') setAppPhase('hyperspace')
  }

  return (
    // pointer-events: none on the wrapper so mouse moves pass through to Three.js.
    <div className="retro-ui">
      {/* CRT scanlines */}
      <div className="retro-scanlines" />

      {/* Top-right corner badge */}
      <div className="retro-corner retro-corner-tr">
        <span>─</span> COORD LOCKED <span>┐</span>
      </div>

      {/* Centre-bottom prompt — pointer-events: auto so mobile tap works */}
      <div className="retro-prompt" onTouchEnd={handleTouch}>
        <div className="retro-status">
          <span className="retro-dot" />
          FALCON UNIT READY — AWAITING JUMP COORDINATES
        </div>

        <div className="retro-main-text">
          PRESS <span className="retro-key">[SPACE]</span> TO START
        </div>
      </div>

      {/* Bottom-left corner badge */}
      <div className="retro-corner retro-corner-bl">
        <span>└</span> HYPERDRIVE: ONLINE <span>─</span>
      </div>

      {/* Bottom-right corner badge */}
      <div className="retro-corner retro-corner-br">
        <span>─</span> SYS OK <span>┘</span>
      </div>
    </div>
  )
}
