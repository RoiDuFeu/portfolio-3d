import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface PlanetProps {
  position: [number, number, number];
  size?: number;
  color: string;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
  rotationSpeed?: number;
  children?: React.ReactNode;
}

export const Planet = ({
  position,
  size = 2,
  color,
  onHover,
  onClick,
  rotationSpeed = 0.001,
  children
}: PlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += hovered ? rotationSpeed * 3 : rotationSpeed;
    }
  });
  
  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
    
    // Glow effect on hover
    if (glowRef.current) {
      gsap.to(glowRef.current.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'default';
    
    if (glowRef.current) {
      gsap.to(glowRef.current.scale, {
        x: 1.15,
        y: 1.15,
        z: 1.15,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };
  
  return (
    <group position={position}>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[size * 1.15, 32, 32]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Main planet */}
      <Sphere
        ref={meshRef}
        args={[size, 64, 64]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.3}
        />
      </Sphere>
      
      {children}
    </group>
  );
};
