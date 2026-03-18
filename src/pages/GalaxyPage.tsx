import { useRef } from 'react'
import { Scene } from '../components/canvas/Scene'
import { HUD } from '../components/ui/HUD'
import { useScrollTrigger } from '../hooks/useScrollTrigger'
import { useAudio } from '../hooks/useAudio'
import { solarBodies } from '../data/solarSystem'

export function GalaxyPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useScrollTrigger(scrollContainerRef)
  useAudio()

  // 8 planets across a wider journey — more scroll height needed
  const scrollHeight = `${solarBodies.length * 150 + 400}vh`

  return (
    <>
      {/* Scroll container — invisible, drives the experience */}
      <div ref={scrollContainerRef} style={{ height: scrollHeight }}>
        <div style={{ height: '100%' }} />
      </div>

      {/* Fixed canvas layer */}
      <Scene />

      {/* UI overlays */}
      <HUD />
    </>
  )
}
