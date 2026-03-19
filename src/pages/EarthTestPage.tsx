import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EarthPlanet } from '../components/planets/EarthPlanet'

export function EarthTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        
        <EarthPlanet position={[0, 0, 0]} scale={2.5} />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={15}
        />
      </Canvas>
    </div>
  )
}
