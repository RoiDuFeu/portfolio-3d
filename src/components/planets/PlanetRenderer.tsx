import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SolarBody } from '../../types'
import { getDisplaySize, getDisplayOrbit, getDisplaySpeed } from '../../data/solarSystem'
import { planetWorldPositions } from '../../utils/planetPositions'

// Project planets (interactive)
import { FertiscalePlanet } from './FertiscalePlanet'
import { GodsPlanPlanet } from './GodsPlanPlanet'
import { MusicPlanet } from './MusicPlanet'

// Realistic decorative planets
import { EarthPlanet } from './EarthPlanet'
import { RealisticMoon } from './RealisticMoon'
import { RealisticMars } from './RealisticMars'
import { RealisticSaturn } from './RealisticSaturn'

// Simple decorative planets
import { MercuryPlanet } from './MercuryPlanet'
import { VenusPlanet } from './VenusPlanet'
import { JupiterPlanet } from './JupiterPlanet'
import { UranusPlanet } from './UranusPlanet'

interface PlanetRendererProps {
  body: SolarBody
}

export function PlanetRenderer({ body }: PlanetRendererProps) {
  const groupRef = useRef<THREE.Group>(null)

  const size = getDisplaySize(body)
  const orbitRadius = getDisplayOrbit(body)
  const orbitSpeed = getDisplaySpeed(body)

  useFrame((state) => {
    if (groupRef.current) {
      const angle = state.clock.elapsedTime * orbitSpeed + body.orbitOffset
      groupRef.current.position.x = Math.cos(angle) * orbitRadius
      groupRef.current.position.z = Math.sin(angle) * orbitRadius
      groupRef.current.position.y = Math.sin(angle * 0.5) * 0.3

      // Publish world position for proximity detection & guided orbit
      if (!planetWorldPositions[body.name]) {
        planetWorldPositions[body.name] = new THREE.Vector3()
      }
      groupRef.current.getWorldPosition(planetWorldPositions[body.name])
    }
  })

  return (
    <group ref={groupRef}>
      {renderPlanet(body, size)}
    </group>
  )
}

function renderPlanet(body: SolarBody, size: number) {
  // Project planets — use their dedicated components
  if (body.projectId) {
    const props = {
      position: [0, 0, 0] as [number, number, number],
      color: body.color,
      size,
      projectId: body.projectId,
    }

    switch (body.projectId) {
      case 'fertiscale':
        // Earth uses realistic rendering (Fertiscale project)
        return <EarthPlanet position={props.position} scale={size / 1.5} />
      case 'godsplan':
        // Mars uses realistic rendering (God's Plan project)
        return <RealisticMars position={props.position} scale={size / 1.5} />
      case 'lesyndrome':
        return <MusicPlanet {...props} />
    }
  }

  // Decorative planets — route by solar name with realistic components where available
  switch (body.name) {
    case 'mercury':
      return <MercuryPlanet size={size} />
    
    case 'venus':
      return <VenusPlanet size={size} atmosphereColor={body.atmosphereColor} />
    
    case 'earth':
      // If Earth doesn't have a project, render realistic version
      return <EarthPlanet position={[0, 0, 0]} scale={size / 1.5} />
    
    case 'mars':
      // If Mars doesn't have a project, render realistic version
      return <RealisticMars position={[0, 0, 0]} scale={size / 1.5} />
    
    case 'jupiter':
      return <JupiterPlanet size={size} atmosphereColor={body.atmosphereColor} />
    
    case 'saturn':
      // Use realistic Saturn with rings
      return <RealisticSaturn position={[0, 0, 0]} scale={size / 1.5} />
    
    case 'uranus':
      return <UranusPlanet size={size} atmosphereColor={body.atmosphereColor} />
    
    default:
      return null
  }
}
