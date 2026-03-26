import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../components/canvas/Scene'
import { PerformanceWidget } from '../components/ui/PerformanceWidget'
import { ReloadOverlay } from '../components/ui/ReloadOverlay'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { RetroUI } from '../components/intro/RetroUI'
import { HyperspaceHUD } from '../components/ui/HyperspaceHUD'
import { DebugTimeline } from '../components/ui/DebugTimeline'
import { ArrivalChoiceCards } from '../components/ui/ArrivalChoiceCards'
import { PlanetProximityCards } from '../components/ui/PlanetProximityCards'
import { StarWarsTransition } from '../components/ui/StarWarsTransition'
import { ProjectScrollPanel } from '../components/ui/ProjectScrollPanel'
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
  const entryAnimDone = useStore((s) => s.entryAnimDone)
  const setShowArrivalChoice = useStore((s) => s.setShowArrivalChoice)
  const tourMode = useStore((s) => s.tourMode)

  useAudio()

  // Show arrival choice cards once the entry animation completes
  useEffect(() => {
    if (entryAnimDone && tourMode === 'none') {
      setShowArrivalChoice(true)
    }
  }, [entryAnimDone, tourMode, setShowArrivalChoice])

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

      {/* Hyperspace loading HUD — shown during tunnel */}
      <HyperspaceHUD />

      {/* Debug timeline — press H to toggle */}
      <DebugTimeline />

      {/* Arrival choice (C-3PO / R2-D2) — shown once after wormhole arrival */}
      <ArrivalChoiceCards />

      {/* Planet proximity cards — shown during free flight near a project planet */}
      <PlanetProximityCards />

      {/* Star Wars wipe transition — between modes */}
      <StarWarsTransition />

      {/* Guided orbit text panel — scroll-driven, shown during planet visit */}
      <ProjectScrollPanel />

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
