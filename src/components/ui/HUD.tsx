import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ProjectCard } from './ProjectCard'

export function HUD() {
  const selectedProject = useStore((s) => s.selectedProject)
  const selectProject = useStore((s) => s.selectProject)

  return (
    <>
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
    </>
  )
}
