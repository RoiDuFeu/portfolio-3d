import { useStore } from '../../store/useStore'
import { getBodiesSortedByOrbit } from '../../data/solarSystem'

const sortedBodies = getBodiesSortedByOrbit()

export function ScrollIndicator() {
  const activeSection = useStore((s) => s.activeSection)

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 50,
      }}
    >
      {sortedBodies.map((body, i) => {
        const isActive = i === activeSection
        const isProject = !!body.projectId
        return (
          <div
            key={body.name}
            style={{
              width: isProject ? 10 : 6,
              height: isProject ? 10 : 6,
              borderRadius: '50%',
              background: isActive
                ? 'rgba(255, 255, 255, 0.9)'
                : isProject
                  ? 'rgba(255, 255, 255, 0.35)'
                  : 'rgba(255, 255, 255, 0.15)',
              border: isProject
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : 'none',
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.4)' : 'scale(1)',
            }}
            title={body.displayName}
          />
        )
      })}
    </div>
  )
}
