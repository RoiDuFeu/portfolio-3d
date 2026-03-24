import { useStore } from '../../store/useStore'

/**
 * Full-screen loading overlay shown while all 3D assets, textures,
 * and shaders are being loaded and compiled.
 *
 * Styled to match the Star Wars retro terminal aesthetic
 * used throughout the rest of the UI.
 */
export function LoadingScreen() {
  const appPhase = useStore((s) => s.appPhase)
  const progress = useStore((s) => s.loadProgress)

  if (appPhase !== 'loading') return null

  const pct = Math.round(progress * 100)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      color: '#00ff88',
    }}>
      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Top border decoration */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        fontSize: 11,
        letterSpacing: 3,
        opacity: 0.4,
      }}>
        ┌─ NAVICOMPUTER v3.7 ─────────────────────┐
      </div>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Falcon ASCII silhouette */}
        <div style={{
          fontSize: 10,
          lineHeight: 1.2,
          opacity: 0.25,
          marginBottom: 32,
          letterSpacing: 1,
        }}>
          <pre style={{ margin: 0, fontFamily: 'inherit' }}>{`
    ╭──────────╮
  ╭─┤  ≡≡≡≡≡≡  ├─╮
╭─┤  ╰──────────╯  ├─╮
│  ◄════════════════►  │
╰─┤  ╭──────────╮  ├─╯
  ╰─┤  ≡≡≡≡≡≡  ├─╯
    ╰──────────╯
          `}</pre>
        </div>

        {/* Status title */}
        <div style={{
          fontSize: 14,
          letterSpacing: 4,
          marginBottom: 24,
          textShadow: '0 0 12px #00ff8866',
          animation: 'loadingPulse 2s ease-in-out infinite',
        }}>
          INITIALIZING SYSTEMS
        </div>

        {/* Progress bar */}
        <div style={{
          width: 320,
          height: 8,
          background: 'rgba(0, 255, 136, 0.08)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: 4,
          overflow: 'hidden',
          margin: '0 auto',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)',
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ff88, #00ccff)',
            borderRadius: 4,
            transition: 'width 0.2s ease',
            boxShadow: '0 0 12px #00ff8866',
          }} />
        </div>

        {/* Progress text */}
        <div style={{
          fontSize: 11,
          marginTop: 12,
          letterSpacing: 2,
          opacity: 0.7,
        }}>
          LOADING ASSETS — {pct}%
        </div>

        {/* Sub-status */}
        <div style={{
          fontSize: 10,
          marginTop: 20,
          opacity: 0.35,
          letterSpacing: 1,
        }}>
          {pct < 30 && '▸ Loading textures...'}
          {pct >= 30 && pct < 60 && '▸ Loading 3D models...'}
          {pct >= 60 && pct < 90 && '▸ Compiling shaders...'}
          {pct >= 90 && '▸ Preparing hyperspace coordinates...'}
        </div>
      </div>

      {/* Bottom border decoration */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        fontSize: 11,
        letterSpacing: 3,
        opacity: 0.4,
      }}>
        └────────────────── SYS READY WHEN LOADED ─┘
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
