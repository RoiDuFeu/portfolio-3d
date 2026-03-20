import { Canvas } from '@react-three/fiber'
import { Scene } from '../components/canvas/Scene'
import { PerformanceWidget } from '../components/ui/PerformanceWidget'
import { ReloadOverlay } from '../components/ui/ReloadOverlay'
import { RetroUI } from '../components/intro/RetroUI'
import { HyperspaceHUD } from '../components/ui/HyperspaceHUD'
import { useAudio } from '../hooks/useAudio'
import { useStore } from '../store/useStore'
import { PERFORMANCE_CONFIGS } from '../utils/performanceConfig'

function DebugOverlay() {
  const debugFree = useStore((s) => s.debugFreeCamera)
  const appPhase = useStore((s) => s.appPhase)
  const resetScene = useStore((s) => s.resetScene)
  const setAppPhase = useStore((s) => s.setAppPhase)

  if (!debugFree) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        color: '#00ff00',
        padding: '6px 10px',
        borderRadius: 4,
        border: '1px solid #00ff00',
      }}>
        DEBUG — Phase: {appPhase} — [F] free cam [G] reset
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={resetScene} style={btnStyle('#ff4444')}>
          Reset Scene
        </button>
        <button onClick={() => setAppPhase('hyperspace')} style={btnStyle('#ffaa00')} disabled={appPhase !== 'intro'}>
          Trigger Jump
        </button>
      </div>
    </div>
  )
}

const btnStyle = (color: string): React.CSSProperties => ({
  background: 'rgba(0,0,0,0.8)',
  color,
  border: `1px solid ${color}`,
  borderRadius: 4,
  padding: '4px 10px',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
})

export function GalaxyPage() {
  const appPhase = useStore((s) => s.appPhase)
  const sceneKey = useStore((s) => s.sceneKey)
  const mode = useStore((s) => s.performanceMode)
  const cfg = PERFORMANCE_CONFIGS[mode]

  useAudio()

  return (
    <>
      {/* Performance mode selector — always visible */}
      <PerformanceWidget />

      {/* Reload overlay — shown while scene remounts after mode change */}
      <ReloadOverlay />

      {/* Debug overlay — visible when F is pressed */}
      <DebugOverlay />

      {/* Hyperspace loading HUD — shown during tunnel while solar system loads */}
      <HyperspaceHUD />

      {/* Retro HUD prompt — fades out when hyperspace starts */}
      {(appPhase === 'intro' || appPhase === 'hyperspace') && (
        <div
          style={{
            opacity: appPhase === 'intro' ? 1 : 0,
            transition: 'opacity 0.25s ease',
            pointerEvents: appPhase === 'intro' ? 'auto' : 'none',
          }}
        >
          <RetroUI />
        </div>
      )}

      {/* Single unified Canvas — all zones rendered here */}
      <div className="canvas-container">
        <Canvas
          key={sceneKey}
          camera={{ position: [0, 2, 8], fov: 58, near: 0.01, far: 3000 }}
          style={{ width: '100%', height: '100%' }}
          dpr={cfg.dpr}
          gl={{
            antialias: cfg.antialias,
            alpha: false,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true,
          }}
        >
          <color attach="background" args={['#000000']} />
          <Scene />
        </Canvas>
      </div>
    </>
  )
}
