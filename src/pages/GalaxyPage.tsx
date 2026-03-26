import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../components/canvas/Scene'
import { PerformanceWidget } from '../components/ui/PerformanceWidget'
import { ReloadOverlay } from '../components/ui/ReloadOverlay'
import { LoadingScreen } from '../components/ui/LoadingScreen'
// RetroUI and HyperspaceHUD removed — ship starts directly at galaxy view
import { ArrivalCards } from '../components/ui/ArrivalCards'
import { FlightControlsHUD } from '../components/ui/FlightControlsHUD'
import { Crosshair } from '../components/ui/Crosshair'
import { ProximityCard } from '../components/ui/ProximityCard'
import { PlanetVisitOverlay } from '../components/ui/PlanetVisitOverlay'
import { PauseOverlay } from '../components/ui/PauseOverlay'
import { FlightTelemetry } from '../components/ui/FlightTelemetry'
import { DebugTimeline } from '../components/ui/DebugTimeline'
import { MobileFlightControls } from '../components/ui/MobileFlightControls'
import { useAudio } from '../hooks/useAudio'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { PERFORMANCE_CONFIGS } from '../utils/performanceConfig'
import { detectKeyboardLayout } from '../utils/keyboardLayout'

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
  const isMobile = useIsMobile()

  useAudio()

  // Detect keyboard layout on mount (AZERTY vs QWERTY)
  useEffect(() => {
    detectKeyboardLayout().then((layout) => {
      useStore.getState().setKeyboardLayout(layout)
    })
  }, [])

  return (
    <>
      {/* Loading screen — shown while all assets load and shaders compile */}
      <LoadingScreen />

      {/* Performance mode selector — hidden during loading */}
      {appPhase !== 'loading' && <PerformanceWidget />}

      {/* Reload overlay — shown while scene remounts after mode change */}
      <ReloadOverlay />

      {/* Debug overlay — visible when F is pressed */}
      <DebugOverlay />

      {/* Droid selection cards — R2-D2 & C-3PO */}
      <ArrivalCards />

      {/* Flight controls HUD — shown briefly when free-fly activates */}
      <FlightControlsHUD />

      {/* Targeting reticle — visible during flight mode (hidden on mobile via CSS) */}
      <Crosshair />

      {/* C-3PO approach card — shown when near a project planet */}
      <ProximityCard />

      {/* Planet visit cinematic overlay — wipe + project detail */}
      <PlanetVisitOverlay />

      {/* Mobile flight controls — virtual joysticks + action buttons */}
      {isMobile && <MobileFlightControls />}

      {/* Pause overlay — ESC to toggle */}
      <PauseOverlay />

      {/* Flight telemetry debug — press I to toggle */}
      <FlightTelemetry />

      {/* Debug timeline — press H to toggle */}
      <DebugTimeline />

      {/* Single unified Canvas — all zones rendered here.
          Mounted immediately so assets start loading during the loading screen. */}
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
