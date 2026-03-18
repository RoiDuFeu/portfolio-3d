import * as THREE from 'three'
import { solarBodies, getDisplayOrbit } from '../../data/solarSystem'

export function OrbitRings() {
  return (
    <>
      {solarBodies.map((body) => {
        const radius = getDisplayOrbit(body)
        const isProject = !!body.projectId

        // Warm golden tint for inner orbits, cooler for outer
        const warmth = Math.max(0, 1 - radius / 120)
        const r = Math.floor(200 + 55 * warmth)
        const g = Math.floor(200 + 30 * warmth)
        const b = Math.floor(200 - 50 * warmth)
        const color = `rgb(${r},${g},${b})`

        return (
          <mesh key={body.name} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={isProject ? 0.06 : 0.03}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </>
  )
}
