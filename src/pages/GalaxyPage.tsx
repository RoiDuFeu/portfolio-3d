import { useRef, useState, useEffect } from 'react'
import { Scene } from '../components/canvas/Scene'
import { HUD } from '../components/ui/HUD'
import { PerformanceWidget } from '../components/ui/PerformanceWidget'
import { ReloadOverlay } from '../components/ui/ReloadOverlay'
import { useScrollTrigger } from '../hooks/useScrollTrigger'
import { useAudio } from '../hooks/useAudio'
import { solarBodies } from '../data/solarSystem'
import { RetroUI } from '../components/intro/RetroUI'
import { IntroScene } from '../components/intro/IntroScene'
import { HyperspaceCanvas } from '../components/intro/HyperspaceCanvas'
import { useStore } from '../store/useStore'

export function GalaxyPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const appPhase = useStore((s) => s.appPhase)
  const sceneKey = useStore((s) => s.sceneKey)

  useScrollTrigger(scrollContainerRef)
  useAudio()

  // Delayed unmount: keep IntroScene alive during the cross-dissolve,
  // then remove it once the fade-out finishes.
  const [showIntro, setShowIntro] = useState(true)
  useEffect(() => {
    if (appPhase === 'main') {
      const timer = setTimeout(() => setShowIntro(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [appPhase])

  const scrollHeight = `${solarBodies.length * 150 + 400}vh`

  return (
    <>
      {/* Tube tunnel — always mounted; idle drift until Space, then full warp sequence */}
      <HyperspaceCanvas />

      {/* Performance mode selector — always visible, retro style */}
      <PerformanceWidget />

      {/* Reload overlay — shown while scene remounts after mode change */}
      <ReloadOverlay />

      {/* Falcon intro scene — transparent bg so tube canvas shows through.
          Stays mounted during hyperspace; cross-dissolves into galaxy on 'main'. */}
      {showIntro && (
        <div
          style={{
            opacity: appPhase === 'main' ? 0 : 1,
            transition: 'opacity 1.2s ease',
            pointerEvents: appPhase === 'main' ? 'none' : 'auto',
          }}
        >
          <IntroScene />
        </div>
      )}

      {/* Retro HUD prompt — fades out the moment the jump starts */}
      {appPhase !== 'main' && (
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

      {/* Main galaxy experience — fades in under the hyperspace flash */}
      <div
        style={{
          opacity: appPhase === 'main' ? 1 : 0,
          transition: 'opacity 1.8s ease',
          pointerEvents: appPhase === 'main' ? 'auto' : 'none',
        }}
      >
        {/* Scroll container — invisible, drives the camera journey */}
        <div ref={scrollContainerRef} style={{ height: scrollHeight }}>
          <div style={{ height: '100%' }} />
        </div>

        {/* Fixed canvas layer — key=sceneKey forces remount on mode change */}
        <Scene key={sceneKey} />

        {/* UI overlays */}
        <HUD />
      </div>
    </>
  )
}
