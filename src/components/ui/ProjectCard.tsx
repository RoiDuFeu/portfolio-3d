import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { Project } from '../../types'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
  project: Project
  onClose: () => void
}

export function ProjectCard({ project, onClose }: ProjectCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Enter animation
    const tl = gsap.timeline()
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' },
      '-=0.15'
    )

    return () => { tl.kill() }
  }, [])

  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: onClose,
    })
    tl.to(cardRef.current, { opacity: 0, y: 20, scale: 0.97, duration: 0.25, ease: 'power2.in' })
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.1')
  }

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleClose}>
      <div ref={cardRef} className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>
          ×
        </button>

        <h2 className={styles.title}>{project.name}</h2>
        <p className={styles.tagline}>{project.tagline}</p>
        <span className={styles.category}>{project.category}</span>
        <p className={styles.description}>{project.description}</p>

        {project.techStack && (
          <div className={styles.techStack}>
            {project.techStack.map((tech) => (
              <span key={tech} className={styles.techTag}>
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.timeline && (
          <div className={styles.timeline}>
            <h3>Timeline</h3>
            <ul className={styles.milestones}>
              {project.timeline.milestones.map((milestone, idx) => (
                <li key={idx}>{milestone}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
