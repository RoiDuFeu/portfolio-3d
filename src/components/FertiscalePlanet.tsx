import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface FertiscalePlanetProps {
  position: [number, number, number];
  size?: number;
  timelineProgress?: number; // 0 to 1
  onClick?: () => void;
}

export const FertiscalePlanet = ({
  position,
  size = 2,
  timelineProgress = 0.5,
  onClick
}: FertiscalePlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Create procedural texture that "greens" over time
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base color (earth-like)
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    
    // Progress from brown/desert to green/lush
    const brownAmount = Math.max(0, 1 - timelineProgress * 1.5);
    const greenAmount = Math.min(1, timelineProgress * 1.2);
    
    gradient.addColorStop(0, `rgb(${100 * brownAmount + 50 * greenAmount}, ${60 * brownAmount + 150 * greenAmount}, ${40 * brownAmount + 50 * greenAmount})`);
    gradient.addColorStop(0.5, `rgb(${80 * brownAmount + 40 * greenAmount}, ${100 * brownAmount + 180 * greenAmount}, ${60 * brownAmount + 40 * greenAmount})`);
    gradient.addColorStop(1, `rgb(${120 * brownAmount + 30 * greenAmount}, ${80 * brownAmount + 140 * greenAmount}, ${50 * brownAmount + 30 * greenAmount})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some "continent" patterns
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = greenAmount > 0.3 ? '#2d5016' : '#8B4513';
      ctx.beginPath();
      ctx.arc(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 40 + 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [timelineProgress]);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
    
    if (glowRef.current) {
      // Pulse glow slightly
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });
  
  const greenColor = useMemo(() => {
    return new THREE.Color().lerpColors(
      new THREE.Color('#8B7355'), // Brown
      new THREE.Color('#4CAF50'), // Green
      timelineProgress
    );
  }, [timelineProgress]);
  
  return (
    <group position={position}>
      {/* Glow */}
      <Sphere ref={glowRef} args={[size * 1.15, 32, 32]}>
        <meshBasicMaterial
          color={greenColor}
          transparent
          opacity={0.25}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Planet */}
      <Sphere
        ref={meshRef}
        args={[size, 64, 64]}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <meshStandardMaterial
          map={texture}
          roughness={0.8}
          metalness={0.2}
        />
      </Sphere>
      
      {/* Atmosphere */}
      <Sphere args={[size * 1.05, 32, 32]}>
        <meshBasicMaterial
          color={greenColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};
