import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ProjectCard } from './ProjectCard'
import { ScrollIndicator } from './ScrollIndicator'

export function HUD() {
  const selectedProject = useStore((s) => s.selectedProject)
  const selectProject = useStore((s) => s.selectProject)

  return (
    <>
      <ScrollIndicator />

      {selectedProject && (
        <ProjectCard
          project={selectedProject}
          onClose={() => selectProject(null)}
        />
      )}

      {/* Planet Studio link */}
      <Link
        to="/studio"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'rgba(100, 150, 255, 0.12)',
          backdropFilter: 'blur(8px)',
          padding: '10px 20px',
          borderRadius: 8,
          border: '1px solid rgba(100, 150, 255, 0.25)',
          zIndex: 50,
          color: 'rgba(160, 190, 255, 0.9)',
          fontSize: '0.82em',
          fontWeight: 500,
          textDecoration: 'none',
          letterSpacing: '0.03em',
          transition: 'all 0.2s',
        }}
      >
        Planet Studio
      </Link>

      {/* Scroll hint — auto-hides after interaction */}
      <div
        style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          padding: '12px 28px',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 50,
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.85em',
          pointerEvents: 'none',
        }}
      >
        Scroll to explore the galaxy
      </div>
    </>
  )
}
