import { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectCard = ({ project, onClose }: ProjectCardProps) => {
  if (!project) return null;
  
  return (
    <div
      className="project-card"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="close-btn" onClick={onClose}>×</button>
      
      <div className="project-header">
        <h2>{project.name}</h2>
        <p className="tagline">{project.tagline}</p>
      </div>
      
      <div className="project-content">
        <div className="category">{project.category}</div>
        <p className="description">{project.description}</p>
        
        {project.timeline && (
          <div className="timeline">
            <h3>Timeline</h3>
            <div className="timeline-period">
              <strong>Start:</strong> {project.timeline.start}
              {project.timeline.end && <> • <strong>End:</strong> {project.timeline.end}</>}
            </div>
            <div className="milestones">
              <strong>Milestones:</strong>
              <ul>
                {project.timeline.milestones.map((milestone, idx) => (
                  <li key={idx}>{milestone}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
