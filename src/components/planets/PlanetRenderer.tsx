import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SolarBody } from '../../types'
import { getDisplaySize, getDisplayOrbit, getDisplaySpeed } from '../../data/solarSystem'

// Project planets (interactive)
import { EarthPlanet } from './EarthPlanet'
import { RealisticMars } from './RealisticMars'
import { MusicPlanet } from './MusicPlanet'

interface PlanetRendererProps {
  body: SolarBody
  /** Fixed galaxy position. When set, orbit animation is skipped. */
  position?: [number, number, number]
}

/** Pulsing beacon ring to make project planets findable from afar */
function PlanetBeacon({ size, color }: { size: number; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  const beaconColor = useMemo(() => new THREE.Color(color), [color])

  useFrame((state) => {
    const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15
    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse
    }
    if (glowRef.current) {
      glowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 1.2) * 1
    }
  })

  return (
    <>
      <mesh ref={ringRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[size * 2.2, size * 2.4, 64]} />
        <meshBasicMaterial color={beaconColor} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={glowRef} color={beaconColor} intensity={3} distance={30} decay={2} />
    </>
  )
}

export function PlanetRenderer({ body, position }: PlanetRendererProps) {
  const groupRef = useRef<THREE.Group>(null)

  const size = getDisplaySize(body)
  const orbitRadius = getDisplayOrbit(body)
  const orbitSpeed = getDisplaySpeed(body)

  useFrame((state) => {
    if (groupRef.current && !position) {
      const angle = state.clock.elapsedTime * orbitSpeed + body.orbitOffset
      groupRef.current.position.x = Math.cos(angle) * orbitRadius
      groupRef.current.position.z = Math.sin(angle) * orbitRadius
      groupRef.current.position.y = Math.sin(angle * 0.5) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {renderPlanet(body, size)}
      {body.projectId && <PlanetBeacon size={size} color={body.color} />}
    </group>
  )
}

function renderPlanet(body: SolarBody, size: number) {
  const props = {
    position: [0, 0, 0] as [number, number, number],
    color: body.color,
    size,
    projectId: body.projectId!,
  }

  switch (body.projectId) {
    case 'fertiscale':
      return <EarthPlanet position={props.position} scale={size / 1.5} />
    case 'godsplan':
      return <RealisticMars position={props.position} scale={size / 1.5} />
    case 'lesyndrome':
      return <MusicPlanet {...props} />
    default:
      return null
  }
}
