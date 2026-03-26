import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { solarBodies } from '../../data/solarSystem'
import { projects } from '../../data/projects'

/**
 * Non-blocking choice overlay shown when the Falcon enters proximity of a
 * project planet during free flight.
 *
 *  C-3PO → Guided orbit visit of the planet (Star Wars wipe → forced camera)
 *  R2-D2 → Dismiss and continue flying
 */
export function PlanetProximityCards() {
  const showPlanetChoice = useStore((s) => s.showPlanetChoice)
  const nearPlanet = useStore((s) => s.nearPlanet)
  const setShowPlanetChoice = useStore((s) => s.setShowPlanetChoice)
  const setCameraMode = useStore((s) => s.setCameraMode)
  const setGuidedOrbitActive = useStore((s) => s.setGuidedOrbitActive)
  const setGuidedOrbitPlanet = useStore((s) => s.setGuidedOrbitPlanet)
  const setGuidedOrbitProgress = useStore((s) => s.setGuidedOrbitProgress)
  const setShowStarWarsTransition = useStore((s) => s.setShowStarWarsTransition)
  const setIsFlying = useStore((s) => s.setIsFlying)
  const setNearPlanet = useStore((s) => s.setNearPlanet)

  const [hoverC3PO, setHoverC3PO] = useState(false)
  const [hoverR2D2, setHoverR2D2] = useState(false)

  if (!showPlanetChoice || !nearPlanet) return null

  const body = solarBodies.find((b) => b.name === nearPlanet)
  const project = body?.projectId ? projects.find((p) => p.id === body.projectId) : null

  function handleC3PO() {
    if (!nearPlanet) return
    setShowPlanetChoice(false)
    setIsFlying(false)
    setShowStarWarsTransition(true)

    setTimeout(() => {
      setGuidedOrbitPlanet(nearPlanet)
      setGuidedOrbitProgress(0)
      setGuidedOrbitActive(true)
      setCameraMode('guidedOrbit')
      setShowStarWarsTransition(false)
    }, 1600)
  }

  function handleR2D2() {
    setShowPlanetChoice(false)
    setNearPlanet(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 20,
        zIndex: 50,
        animation: 'slideUp 0.5s ease forwards',
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Context label */}
      <div
        style={{
          position: 'absolute',
          top: -28,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
        }}
      >
        {body?.displayName ?? nearPlanet}{project ? ` — ${project.tagline}` : ''}
      </div>

      {/* C-3PO mini card */}
      <MiniCard
        label="C-3PO"
        sublabel="VISITE GUIDÉE"
        emoji="⬡"
        color="#d4a843"
        hovered={hoverC3PO}
        onMouseEnter={() => setHoverC3PO(true)}
        onMouseLeave={() => setHoverC3PO(false)}
        onClick={handleC3PO}
      />

      {/* R2-D2 mini card */}
      <MiniCard
        label="R2-D2"
        sublabel="CONTINUER LE VOL"
        emoji="◎"
        color="#4a9eff"
        hovered={hoverR2D2}
        onMouseEnter={() => setHoverR2D2(true)}
        onMouseLeave={() => setHoverR2D2(false)}
        onClick={handleR2D2}
      />
    </div>
  )
}

interface MiniCardProps {
  label: string
  sublabel: string
  emoji: string
  color: string
  hovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}

function MiniCard({ label, sublabel, emoji, color, hovered, onMouseEnter, onMouseLeave, onClick }: MiniCardProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        background: 'rgba(0, 4, 16, 0.85)',
        border: `1px solid ${hovered ? color : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 0 16px ${color}44` : 'none',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 22, color, filter: hovered ? `drop-shadow(0 0 6px ${color})` : 'none', transition: 'filter 0.25s' }}>
        {emoji}
      </span>
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: hovered ? color : 'rgba(255,255,255,0.7)', transition: 'color 0.25s', marginTop: 2 }}>{sublabel}</div>
      </div>
    </div>
  )
}
