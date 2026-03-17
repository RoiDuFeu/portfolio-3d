import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Stars } from './Stars';
import { Planet } from './Planet';
import { FertiscalePlanet } from './FertiscalePlanet';
import { MusicPlanet } from './MusicPlanet';
import { ProjectCard } from './ProjectCard';
import { projects } from '../data/projects';
import { useScroll } from '../hooks/useScroll';
import { useAudio } from '../hooks/useAudio';

const CameraController = () => {
  const { camera } = useThree();
  const { scrollProgress } = useScroll();
  const mousePosition = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useFrame(() => {
    // Horizontal scroll movement
    const targetX = -30 + scrollProgress * 60; // -30 to 30 range
    camera.position.x += (targetX - camera.position.x) * 0.05;
    
    // Mouse parallax (subtle)
    const targetRotY = mousePosition.current.x * 0.05;
    const targetRotX = mousePosition.current.y * 0.05;
    
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;
    camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;
  });
  
  return null;
};

export const Galaxy = () => {
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);
  const { audioData, updateAudioData } = useAudio(projects.find(p => p.id === 'lesyndrome')?.audioPath);
  const { scrollProgress } = useScroll();
  
  useEffect(() => {
    // Update audio data every frame
    const interval = setInterval(updateAudioData, 50);
    return () => clearInterval(interval);
  }, [updateAudioData]);
  
  useEffect(() => {
    // Setup horizontal scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Create horizontal scrollable area
    const totalWidth = window.innerWidth * 3;
    document.body.style.width = `${totalWidth}px`;
    
    return () => {
      document.body.style.width = '';
    };
  }, []);
  
  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        window.scrollBy({ left: -window.innerWidth * 0.8, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        window.scrollBy({ left: window.innerWidth * 0.8, behavior: 'smooth' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handlePlanetClick = (projectId: string, position: [number, number, number]) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setSelectedProject(project);
    
    // Animate camera to planet
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const camera = (canvas as any).__r3f?.camera;
    if (!camera) return;
    
    gsap.to(camera.position, {
      x: position[0],
      y: position[1],
      z: position[2] + 8,
      duration: 1.5,
      ease: 'power2.inOut'
    });
  };
  
  // Calculate Fertiscale timeline progress (example: based on scroll or time)
  const fertiscaleProgress = Math.min(1, scrollProgress * 2);
  
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#000510']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4488ff" />
        
        {/* Stars background */}
        <Stars />
        
        {/* Planets */}
        <FertiscalePlanet
          position={projects[0].position as [number, number, number]}
          size={2.5}
          timelineProgress={fertiscaleProgress}
          onClick={() => handlePlanetClick('fertiscale', projects[0].position as [number, number, number])}
        />
        
        <Planet
          position={projects[1].position as [number, number, number]}
          size={2}
          color="#FFD700"
          onClick={() => handlePlanetClick('godsplan', projects[1].position as [number, number, number])}
        />
        
        <MusicPlanet
          position={projects[2].position as [number, number, number]}
          size={2.2}
          beat={audioData.beat}
          frequencies={audioData.frequencies}
          onClick={() => handlePlanetClick('lesyndrome', projects[2].position as [number, number, number])}
        />
        
        <CameraController />
      </Canvas>
      
      {/* Overlay UI */}
      {selectedProject && (
        <div
          className="overlay"
          onClick={() => setSelectedProject(null)}
        >
          <ProjectCard
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        </div>
      )}
      
      {/* Instructions */}
      <div className="instructions">
        <p>Scroll horizontally or use ← → arrows</p>
        <p>Click planets to explore</p>
      </div>
    </>
  );
};
