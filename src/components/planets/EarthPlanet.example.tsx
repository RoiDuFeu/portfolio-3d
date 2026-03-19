/**
 * Example usage of EarthPlanet component
 * 
 * Usage in your scene:
 * 
 * import { EarthPlanet } from './components/planets/EarthPlanet'
 * 
 * function Scene() {
 *   return (
 *     <Canvas>
 *       <ambientLight intensity={0.5} />
 *       <EarthPlanet position={[0, 0, 0]} scale={1} />
 *     </Canvas>
 *   )
 * }
 * 
 * Props:
 * - position: [x, y, z] - Position in 3D space (required)
 * - scale: number - Scale multiplier (default: 1)
 * 
 * Features:
 * - Photorealistic Earth surface with normal mapping
 * - Specular reflections on oceans (with cloud shadow subtraction)
 * - Night city lights with smooth day/night transition
 * - Semi-transparent cloud layer with proper lighting
 * - Blue atmospheric glow (rim lighting effect)
 * 
 * Architecture:
 * - 3 layered meshes:
 *   1. Surface (radius: 1.5 * scale) - Main earth texture
 *   2. Clouds (radius: 1.53 * scale) - Transparent cloud cover
 *   3. Atmosphere (radius: 1.55 * scale) - Blue glow effect
 * 
 * Textures required in /public/textures/earth/:
 * - World map.jpg (diffuse color)
 * - Earth normal map.jpg (surface details)
 * - Earth specular map.jpg (ocean reflectivity)
 * - Earth night lights.jpg (city lights)
 * - Cloud cover.png (alpha cloud layer)
 */

import { EarthPlanet } from './EarthPlanet'

export function EarthPlanetExample() {
  return <EarthPlanet position={[0, 0, 0]} scale={1.5} />
}
