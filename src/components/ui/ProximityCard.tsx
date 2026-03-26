import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { PLANET_APPROACH_CONFIG } from '../../data/galaxyLayout'
import { projects } from '../../data/projects'
import { solarBodies } from '../../data/solarSystem'

/**
 * C-3PO approach card — slides in from the right when the Falcon
 * enters proximity of a project planet.
 *
 * EXPLORE → triggers planet visit cinematic
 * NEGATIVE → dismisses card for this planet
 */
export function ProximityCard() {
  const targetPlanet = useStore((s) => s.targetPlanet)
  const isFlying = useStore((s) => s.isFlying)
  const planetVisitActive = useStore((s) => s.planetVisitActive)
  const approachCardDismissed = useStore((s) => s.approachCardDismissed)

  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [currentPlanet, setCurrentPlanet] = useState<string | null>(null)

  // Determine if card should show
  const shouldShow =
    targetPlanet !== null &&
    isFlying &&
    !planetVisitActive &&
    !approachCardDismissed.has(targetPlanet)

  useEffect(() => {
    if (shouldShow && targetPlanet) {
      setCurrentPlanet(targetPlanet)
      setExiting(false)
      setVisible(true)
    } else if (visible && !shouldShow) {
      // Slide out
      setExiting(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setExiting(false)
        setCurrentPlanet(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [shouldShow, targetPlanet, visible])

  const handleExplore = useCallback(() => {
    if (!currentPlanet) return
    const config = PLANET_APPROACH_CONFIG[currentPlanet]
    if (!config) return

    const store = useStore.getState()

    // Save pre-visit position
    store.setPreVisitFalconPos(store.falconWorldPosition.clone())

    // Trigger visit
    store.setPlanetVisitActive(true)
    store.setVisitingPlanetName(currentPlanet)
    store.setIsFlying(false)
    store.setCameraMode('planet-visit')
    store.dismissApproachCard(currentPlanet)
    store.setTargetPlanet(null)
  }, [currentPlanet])

  const handleNegative = useCallback(() => {
    if (!currentPlanet) return
    const store = useStore.getState()
    store.dismissApproachCard(currentPlanet)
    store.setTargetPlanet(null)
  }, [currentPlanet])

  // Keyboard shortcuts
  useEffect(() => {
    if (!visible || exiting) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        handleExplore()
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        handleNegative()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, exiting, handleExplore, handleNegative])

  if (!visible || !currentPlanet) return null

  const config = PLANET_APPROACH_CONFIG[currentPlanet]
  if (!config) return null

  const project = projects.find((p) => p.id === config.projectId)
  const body = solarBodies.find((b) => b.name === currentPlanet)

  return (
    <div className={`proximity-card ${exiting ? 'proximity-card-exit' : 'proximity-card-enter'}`}>
      <div className="proximity-card-scanlines" />

      <div className="proximity-card-border-top">
        ┌─── PROTOCOL DROID ─── C-3PO ───┐
      </div>

      <div className="proximity-card-img-wrap">
        <img
          src="/textures/c3po.png"
          alt="C-3PO"
          className="proximity-card-img"
          draggable={false}
        />
      </div>

      <div className="proximity-card-dialogue">
        "{config.c3poDialogue}"
      </div>

      <div className="proximity-card-info">
        <div className="proximity-card-planet">
          PLANET: {body?.displayName?.toUpperCase() || currentPlanet.toUpperCase()}
        </div>
        <div className="proximity-card-project">
          PROJECT: {project?.name?.toUpperCase() || config.projectId.toUpperCase()}
        </div>
        {project?.tagline && (
          <div className="proximity-card-tagline">"{project.tagline}"</div>
        )}
      </div>

      <div className="proximity-card-actions">
        <button
          className="proximity-card-btn proximity-card-btn-explore"
          onClick={handleExplore}
        >
          &gt; EXPLORE [E]
        </button>
        <button
          className="proximity-card-btn proximity-card-btn-negative"
          onClick={handleNegative}
        >
          &gt; NEGATIVE [Q]
        </button>
      </div>

      <div className="proximity-card-border-bot">
        └─────────────────────────────────┘
      </div>
    </div>
  )
}
