import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface MusicPlanetProps {
  position: [number, number, number];
  size?: number;
  beat?: number; // 0 to 1
  frequencies?: number[]; // array of 0-1 values
  onClick?: () => void;
}

export const MusicPlanet = ({
  position,
  size = 2,
  beat = 0,
  frequencies = [],
  onClick
}: MusicPlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Create particle system for frequency visualization
  const [positions, particleSizes] = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = size * 1.5 + Math.random() * 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    return [positions, sizes];
  }, [size]);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Planet rotation
      meshRef.current.rotation.y += 0.002;
      
      // Beat reaction - scale planet
      const targetScale = 1 + beat * 0.3;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.2
      );
    }
    
    if (particlesRef.current && frequencies.length > 0) {
      // Animate particles based on frequencies
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const freqIndex = Math.floor((i / (positions.length / 3)) * frequencies.length);
        const freq = frequencies[freqIndex] || 0;
        
        // Pulsate outward based on frequency
        const radius = size * 1.5 + freq * 2;
        const theta = (i / (positions.length / 3)) * Math.PI * 2 + state.clock.elapsedTime * 0.5;
        const phi = Math.acos(2 * (i / (positions.length / 3)) - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Rotate particles
      particlesRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group position={position}>
      {/* Particle system */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleSizes.length}
            array={particleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9C27B0"
          size={0.15}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Main planet */}
      <Sphere
        ref={meshRef}
        args={[size, 64, 64]}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <meshStandardMaterial
          color="#9C27B0"
          emissive="#9C27B0"
          emissiveIntensity={0.2 + beat * 0.5}
          roughness={0.4}
          metalness={0.6}
        />
      </Sphere>
      
      {/* Inner glow */}
      <Sphere args={[size * 1.1, 32, 32]}>
        <meshBasicMaterial
          color="#9C27B0"
          transparent
          opacity={0.2 + beat * 0.3}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};
