import { useStore } from '../../store/useStore'

/**
 * Star Wars–style loading HUD shown during hyperspace while
 * the solar system compiles in the background.
 * Disappears once hyperspaceReady = true.
 */
export function HyperspaceHUD() {
  const appPhase = useStore((s) => s.appPhase)
  const progress = useStore((s) => s.hyperspaceLoadProgress)
  const ready = useStore((s) => s.hyperspaceReady)

  // Only show during hyperspace while loading
  if (appPhase !== 'hyperspace' || ready) return null

  const pct = Math.round(progress * 100)
  const barWidth = `${pct}%`

  return (
    <div style={{
      position: 'fixed',
      bottom: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      pointerEvents: 'none',
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      color: '#00ff88',
      textAlign: 'center',
      textShadow: '0 0 8px #00ff8866',
    }}>
      <div style={{
        fontSize: 13,
        letterSpacing: 3,
        marginBottom: 10,
        opacity: 0.9,
      }}>
        CALCULATING HYPERSPACE COORDINATES
      </div>

      {/* Progress bar */}
      <div style={{
        width: 280,
        height: 6,
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        margin: '0 auto',
      }}>
        <div style={{
          width: barWidth,
          height: '100%',
          background: 'linear-gradient(90deg, #00ff88, #00ccff)',
          borderRadius: 3,
          transition: 'width 0.15s ease',
          boxShadow: '0 0 10px #00ff8866',
        }} />
      </div>

      <div style={{
        fontSize: 11,
        marginTop: 8,
        opacity: 0.6,
        letterSpacing: 2,
      }}>
        SYSTEMS ONLINE — {pct}%
      </div>
    </div>
  )
}
