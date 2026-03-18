import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SolarBody } from '../../types'
import { getDisplaySize, getDisplayOrbit, getDisplaySpeed } from '../../data/solarSystem'
import { FertiscalePlanet } from './FertiscalePlanet'
import { GodsPlanPlanet } from './GodsPlanPlanet'
import { MusicPlanet } from './MusicPlanet'
import { MercuryPlanet } from './MercuryPlanet'
import { VenusPlanet } from './VenusPlanet'
import { JupiterPlanet } from './JupiterPlanet'
import { SaturnPlanet } from './SaturnPlanet'
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
        return <FertiscalePlanet {...props} />
      case 'godsplan':
        return <GodsPlanPlanet {...props} />
      case 'lesyndrome':
        return <MusicPlanet {...props} />
    }
  }

  // Decorative planets — route by solar name
  switch (body.name) {
    case 'mercury':
      return <MercuryPlanet size={size} />
    case 'venus':
      return <VenusPlanet size={size} atmosphereColor={body.atmosphereColor} />
    case 'jupiter':
      return <JupiterPlanet size={size} atmosphereColor={body.atmosphereColor} />
    case 'saturn':
      return <SaturnPlanet size={size} atmosphereColor={body.atmosphereColor} />
    case 'uranus':
      return <UranusPlanet size={size} atmosphereColor={body.atmosphereColor} />
    default:
      return null
  }
}
