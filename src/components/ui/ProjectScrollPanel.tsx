import { useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { solarBodies } from '../../data/solarSystem'
import { projects } from '../../data/projects'

/**
 * Scroll-driven project info panel shown during guided orbit.
 *
 * Scroll wheel drives guidedOrbitProgress (0 → 1 = one full orbit).
 *
 * Layout:
 *  - Left 60%: 3D canvas (planet + Falcon, see UnifiedCameraRig guided orbit)
 *  - Right 40%: This panel, slides in as orbit begins
 *
 * Content draws in progressively:
 *  - progress 0.00–0.05: panel slides in from right
 *  - progress 0.05–0.30: project title + tagline appear (typewriter)
 *  - progress 0.30–0.60: description fades in line by line
 *  - progress 0.60–0.85: tech stack badges appear
 *  - progress 0.85–1.00: links / CTA fade in
 *
 * After progress reaches 1.0, further scroll exits guided orbit.
 */

const SCROLL_SENSITIVITY = 0.0008  // how much each scroll tick moves progress

export function ProjectScrollPanel() {
  const guidedOrbitActive = useStore((s) => s.guidedOrbitActive)
  const guidedOrbitPlanet = useStore((s) => s.guidedOrbitPlanet)
  const guidedOrbitProgress = useStore((s) => s.guidedOrbitProgress)
  const setGuidedOrbitProgress = useStore((s) => s.setGuidedOrbitProgress)
  const setGuidedOrbitActive = useStore((s) => s.setGuidedOrbitActive)
  const setGuidedOrbitPlanet = useStore((s) => s.setGuidedOrbitPlanet)
  const setCameraMode = useStore((s) => s.setCameraMode)

  const progressRef = useRef(guidedOrbitProgress)

  // Keep ref in sync for scroll handler
  useEffect(() => {
    progressRef.current = guidedOrbitProgress
  }, [guidedOrbitProgress])

  // Scroll wheel drives orbit progress
  useEffect(() => {
    if (!guidedOrbitActive) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * SCROLL_SENSITIVITY
      const next = Math.min(Math.max(progressRef.current + delta, 0), 1.05)
      progressRef.current = next
      setGuidedOrbitProgress(Math.min(next, 1))

      // Exit guided orbit when scrolled past the end
      if (next > 1.02) {
        setGuidedOrbitActive(false)
        setGuidedOrbitPlanet(null)
        setCameraMode('orbit')
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [guidedOrbitActive, setGuidedOrbitProgress, setGuidedOrbitActive, setGuidedOrbitPlanet, setCameraMode])

  if (!guidedOrbitActive || !guidedOrbitPlanet) return null

  const body = solarBodies.find((b) => b.name === guidedOrbitPlanet)
  const project = body?.projectId ? projects.find((p) => p.id === body.projectId) : null

  if (!project) return null

  const p = guidedOrbitProgress

  // Panel slide-in
  const panelVisible = p > 0.03
  const panelX = panelVisible ? 0 : 60

  // Content reveal thresholds
  const showTitle = p > 0.08
  const showTagline = p > 0.12
  const showDivider = p > 0.18
  const showDesc = p > 0.25
  const showStack = p > 0.55
  const showLinks = p > 0.80
  const showScrollHint = p > 0.02 && p < 0.95

  // Scroll hint opacity: fades in at start, fades out near end
  const hintOpacity = p < 0.15
    ? Math.min(p / 0.05, 1) * 0.5
    : p > 0.85
      ? Math.max(1 - (p - 0.85) / 0.1, 0) * 0.5
      : 0.5

  // Progress bar along bottom (full orbit = full bar)
  const barWidth = Math.min(p * 100, 100)

  return (
    <>
      {/* Scroll capture overlay (transparent, just to intercept scroll events gracefully) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }} />

      {/* Right panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(380px, 38vw)',
          height: '100%',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 40px',
          transform: `translateX(${panelX}px)`,
          transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          fontFamily: '"Courier New", Courier, monospace',
          pointerEvents: panelVisible ? 'auto' : 'none',
        }}
      >
        {/* Vertical border line */}
        <div style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          left: 0,
          width: 1,
          background: `linear-gradient(180deg, transparent, ${project.color}88 30%, ${project.color}88 70%, transparent)`,
          opacity: panelVisible ? 1 : 0,
          transition: 'opacity 0.6s ease 0.3s',
        }} />

        {/* Category */}
        <div style={{
          fontSize: 10,
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          marginBottom: 16,
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'none' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {project.category}
        </div>

        {/* Project name */}
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: project.color,
          letterSpacing: '0.05em',
          marginBottom: 8,
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
          textShadow: `0 0 20px ${project.color}66`,
        }}>
          {project.name}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.15em',
          marginBottom: 24,
          opacity: showTagline ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}>
          {project.tagline}
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, ${project.color}66, transparent)`,
          marginBottom: 24,
          transformOrigin: 'left',
          transform: showDivider ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 0.6s ease 0.1s',
        }} />

        {/* Description */}
        <div style={{
          fontSize: 13,
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 32,
          opacity: showDesc ? 1 : 0,
          transform: showDesc ? 'none' : 'translateY(10px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          {project.description}
        </div>

        {/* Tech stack */}
        {project.techStack && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 32,
            opacity: showStack ? 1 : 0,
            transform: showStack ? 'none' : 'translateY(8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}>
            {project.techStack.map((tech) => (
              <span key={tech} style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: project.color,
                border: `1px solid ${project.color}55`,
                padding: '3px 10px',
                borderRadius: 2,
              }}>
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Links / CTA */}
        {showLinks && project.links && (
          <div style={{
            display: 'flex',
            gap: 12,
            opacity: showLinks ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            {project.links.live && (
              <a href={project.links.live} target="_blank" rel="noreferrer"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  color: project.color,
                  border: `1px solid ${project.color}`,
                  padding: '6px 16px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}>
                VOIR LE PROJET
              </a>
            )}
            {project.links.github && (
              <a href={project.links.github} target="_blank" rel="noreferrer"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '6px 16px',
                  textDecoration: 'none',
                }}>
                GITHUB
              </a>
            )}
          </div>
        )}
      </div>

      {/* Orbit progress bar at bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'rgba(255,255,255,0.08)',
        zIndex: 46,
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          background: project.color,
          boxShadow: `0 0 8px ${project.color}`,
          transition: 'width 0.05s linear',
        }} />
      </div>

      {/* Scroll hint */}
      {showScrollHint && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.4)',
          zIndex: 46,
          opacity: hintOpacity,
          transition: 'opacity 0.5s ease',
          fontFamily: '"Courier New", Courier, monospace',
          pointerEvents: 'none',
          animation: 'pulseHint 2s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes pulseHint {
              0%, 100% { transform: translateX(-50%) translateY(0); }
              50% { transform: translateX(-50%) translateY(-3px); }
            }
          `}</style>
          DÉFILER POUR ORBITER
        </div>
      )}

      {/* Exit hint near end */}
      {p > 0.88 && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.4)',
          zIndex: 46,
          opacity: Math.min((p - 0.88) / 0.1, 1) * 0.6,
          transition: 'opacity 0.3s ease',
          fontFamily: '"Courier New", Courier, monospace',
          pointerEvents: 'none',
        }}>
          ↓ CONTINUER POUR QUITTER
        </div>
      )}
    </>
  )
}
