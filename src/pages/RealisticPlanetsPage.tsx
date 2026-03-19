import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EarthPlanet } from '../components/planets/EarthPlanet'
import { RealisticMoon } from '../components/planets/RealisticMoon'
import { RealisticSaturn } from '../components/planets/RealisticSaturn'

export function RealisticPlanetsPage() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        {/* Camera setup */}
        <PerspectiveCamera makeDefault position={[0, 5, 15]} />

        {/* Lighting */}
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        {/* Photorealistic planets side by side */}
        <EarthPlanet position={[-6, 0, 0]} scale={1.5} />
        <RealisticMoon position={[0, 0, 0]} scale={1} />
        <RealisticSaturn position={[6, 0, 0]} scale={1.8} />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white font-mono">
        <h1 className="text-2xl font-bold mb-2">Photorealistic Planets</h1>
        <div className="text-sm space-y-1 opacity-80">
          <p>← Earth (with clouds, normal maps, atmosphere)</p>
          <p>• Moon (8K normal map, crater detail)</p>
          <p>→ Saturn (with translucent rings)</p>
        </div>
      </div>
    </div>
  )
}
