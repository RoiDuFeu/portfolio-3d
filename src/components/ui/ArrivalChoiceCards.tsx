import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

/**
 * C-3PO / R2-D2 choice cards shown immediately after arriving in the galaxy.
 *
 *  C-3PO → Guided tour: forced camera, Falcon orbits each project planet while
 *           a text panel describes the project. Scroll-driven.
 *
 *  R2-D2 → Free flight: manual controls unlocked (T key to fly).
 */
export function ArrivalChoiceCards() {
  const showArrivalChoice = useStore((s) => s.showArrivalChoice)
  const setShowArrivalChoice = useStore((s) => s.setShowArrivalChoice)
  const setTourMode = useStore((s) => s.setTourMode)
  const setIsFlying = useStore((s) => s.setIsFlying)
  const setCameraMode = useStore((s) => s.setCameraMode)
  const setGuidedOrbitActive = useStore((s) => s.setGuidedOrbitActive)
  const setGuidedOrbitPlanet = useStore((s) => s.setGuidedOrbitPlanet)
  const setGuidedOrbitProgress = useStore((s) => s.setGuidedOrbitProgress)
  const setShowStarWarsTransition = useStore((s) => s.setShowStarWarsTransition)

  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (showArrivalChoice && !dismissed) {
      // Small delay for dramatic effect after arrival
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
    if (!showArrivalChoice) {
      setVisible(false)
    }
  }, [showArrivalChoice, dismissed])

  if (!showArrivalChoice || dismissed) return null

  function handleC3PO() {
    // Star Wars wipe → then guided orbit of first project planet (Earth)
    setShowStarWarsTransition(true)
    setTourMode('guided')
    setDismissed(true)
    setShowArrivalChoice(false)

    setTimeout(() => {
      setGuidedOrbitPlanet('earth')
      setGuidedOrbitProgress(0)
      setGuidedOrbitActive(true)
      setCameraMode('guidedOrbit')
      setShowStarWarsTransition(false)
    }, 1600)
  }

  function handleR2D2() {
    setTourMode('free')
    setDismissed(true)
    setShowArrivalChoice(false)
    // Unlock flight mode
    setIsFlying(true)
    setCameraMode('flight')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        zIndex: 50,
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Subtle dark vignette behind cards */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* C-3PO card */}
      <ChoiceCard
        character="C-3PO"
        portrait="⬡"
        accentColor="#d4a843"
        title="VISITE GUIDÉE"
        description="Laissez-moi vous présenter chaque projet. Je serai votre guide à travers le système solaire."
        buttonLabel="COMMENCER LA VISITE"
        onClick={handleC3PO}
      />

      {/* R2-D2 card */}
      <ChoiceCard
        character="R2-D2"
        portrait="◎"
        accentColor="#4a9eff"
        title="VOL LIBRE"
        description="Explorez à votre propre rythme. Les commandes manuelles seront déverrouillées."
        buttonLabel="DÉCOLLER"
        onClick={handleR2D2}
      />
    </div>
  )
}

interface ChoiceCardProps {
  character: string
  portrait: string
  accentColor: string
  title: string
  description: string
  buttonLabel: string
  onClick: () => void
}

function ChoiceCard({ character, portrait, accentColor, title, description, buttonLabel, onClick }: ChoiceCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 260,
        background: 'rgba(0, 4, 16, 0.88)',
        border: `1px solid ${hovered ? accentColor : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 2,
        padding: '28px 24px 24px',
        cursor: 'pointer',
        transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 0 24px ${accentColor}44, 0 8px 32px rgba(0,0,0,0.6)`
          : '0 4px 20px rgba(0,0,0,0.5)',
        fontFamily: '"Courier New", Courier, monospace',
        userSelect: 'none',
      }}
    >
      {/* Corner decorations */}
      <CornerDeco color={accentColor} pos="top-left" />
      <CornerDeco color={accentColor} pos="top-right" />
      <CornerDeco color={accentColor} pos="bottom-left" />
      <CornerDeco color={accentColor} pos="bottom-right" />

      {/* Portrait */}
      <div style={{
        fontSize: 52,
        textAlign: 'center',
        marginBottom: 16,
        color: accentColor,
        filter: hovered ? `drop-shadow(0 0 12px ${accentColor})` : 'none',
        transition: 'filter 0.3s ease',
        lineHeight: 1,
      }}>
        {portrait}
      </div>

      {/* Character name */}
      <div style={{
        fontSize: 11,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginBottom: 4,
        textTransform: 'uppercase',
      }}>
        {character}
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
        marginBottom: 16,
      }} />

      {/* Title */}
      <div style={{
        fontSize: 14,
        letterSpacing: '0.2em',
        color: accentColor,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: 700,
      }}>
        {title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.6,
        textAlign: 'center',
        marginBottom: 24,
      }}>
        {description}
      </div>

      {/* Button */}
      <div style={{
        border: `1px solid ${accentColor}`,
        color: hovered ? '#000' : accentColor,
        background: hovered ? accentColor : 'transparent',
        padding: '8px 16px',
        fontSize: 11,
        letterSpacing: '0.2em',
        textAlign: 'center',
        transition: 'background 0.25s ease, color 0.25s ease',
      }}>
        {buttonLabel}
      </div>
    </div>
  )
}

function CornerDeco({ color, pos }: { color: string; pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const size = 10
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
  }
  if (pos === 'top-left') { style.top = 4; style.left = 4; style.borderTopWidth = 1; style.borderLeftWidth = 1 }
  if (pos === 'top-right') { style.top = 4; style.right = 4; style.borderTopWidth = 1; style.borderRightWidth = 1 }
  if (pos === 'bottom-left') { style.bottom = 4; style.left = 4; style.borderBottomWidth = 1; style.borderLeftWidth = 1 }
  if (pos === 'bottom-right') { style.bottom = 4; style.right = 4; style.borderBottomWidth = 1; style.borderRightWidth = 1 }
  return <div style={style} />
}
