import { useEffect, useState, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { PLANET_APPROACH_CONFIG } from '../../data/galaxyLayout'
import { projects } from '../../data/projects'

/**
 * Full-screen overlay for the planet visit cinematic:
 *   Phase A — Star Wars horizontal wipe transition
 *   Phase B — Project detail card on the right half
 *   ESC or button → reverse wipe → back to flight
 */

type VisitPhase = 'idle' | 'wipe-in' | 'wipe-hold' | 'showing' | 'wipe-out'

export function PlanetVisitOverlay() {
  const planetVisitActive = useStore((s) => s.planetVisitActive)
  const visitingPlanetName = useStore((s) => s.visitingPlanetName)

  const [phase, setPhase] = useState<VisitPhase>('idle')
  const [showDetail, setShowDetail] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // Trigger wipe-in when visit becomes active
  // Timeline: wipe-in (800ms) → wipe-hold (600ms, camera repositions) → showing (wipe removed, card slides in)
  useEffect(() => {
    if (!planetVisitActive || !visitingPlanetName) return

    clearTimers()
    setPhase('wipe-in')
    setShowDetail(false)

    // After wipe covers screen, hold briefly for camera to reposition
    timersRef.current.push(setTimeout(() => {
      setPhase('wipe-hold')
    }, 900))

    // Then remove the wipe and show the detail card
    timersRef.current.push(setTimeout(() => {
      setPhase('showing')
      setShowDetail(true)
    }, 1500))

    return clearTimers
  }, [planetVisitActive, visitingPlanetName, clearTimers])

  const handleReturn = useCallback(() => {
    if (phase !== 'showing') return
    clearTimers()
    setShowDetail(false)
    setPhase('wipe-out')

    timersRef.current.push(setTimeout(() => {
      const store = useStore.getState()

      // Restore flight
      store.setPlanetVisitActive(false)
      store.setVisitingPlanetName(null)
      store.setIsFlying(true)
      store.setCameraMode('flight')

      setPhase('idle')
    }, 900))
  }, [phase, clearTimers])

  // ESC to return
  useEffect(() => {
    if (phase !== 'showing') return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleReturn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleReturn])

  if (phase === 'idle') return null

  // Look up project data
  const config = visitingPlanetName ? PLANET_APPROACH_CONFIG[visitingPlanetName] : null
  const project = config ? projects.find((p) => p.id === config.projectId) : null

  return (
    <div className="planet-visit-root">
      {/* Star Wars wipe — covers screen during transitions */}
      {(phase === 'wipe-in' || phase === 'wipe-hold' || phase === 'wipe-out') && (
        <div
          className={`sw-wipe ${
            phase === 'wipe-in' ? 'sw-wipe-in' :
            phase === 'wipe-hold' ? 'sw-wipe-hold' :
            phase === 'wipe-out' ? 'sw-wipe-out' : ''
          }`}
        />
      )}

      {/* Project detail card — right half */}
      {showDetail && project && (
        <div className="planet-visit-detail planet-visit-detail-enter">
          <div className="planet-visit-scanlines" />

          <div className="planet-visit-header">
            ┌─── PROJECT FILE ───────────────────┐
          </div>

          <div className="planet-visit-name">
            {project.name.toUpperCase()}
          </div>

          <div className="planet-visit-separator">
            {'═'.repeat(36)}
          </div>

          <div className="planet-visit-category">
            {project.category}
          </div>

          <div className="planet-visit-description">
            {project.description}
          </div>

          {project.techStack && project.techStack.length > 0 && (
            <div className="planet-visit-section">
              <div className="planet-visit-section-title">TECH STACK:</div>
              {project.techStack.map((tech) => (
                <div key={tech} className="planet-visit-list-item">
                  ▸ {tech}
                </div>
              ))}
            </div>
          )}

          {project.timeline && project.timeline.milestones.length > 0 && (
            <div className="planet-visit-section">
              <div className="planet-visit-section-title">MILESTONES:</div>
              {project.timeline.milestones.map((ms) => (
                <div key={ms} className="planet-visit-list-item">
                  ▸ {ms}
                </div>
              ))}
            </div>
          )}

          <button
            className="planet-visit-return-btn"
            onClick={handleReturn}
          >
            &gt; RETURN TO FLIGHT [ESC]
          </button>

          <div className="planet-visit-footer">
            └────────────────────────────────────┘
          </div>
        </div>
      )}
    </div>
  )
}
