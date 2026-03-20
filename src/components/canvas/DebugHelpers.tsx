import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Debug wireframe helpers — visible when debug free camera is active.
 * Shows:
 *   - Tunnel cylinder wireframe (green)
 *   - Solar system boundary sphere (cyan)
 *   - Sun position marker (yellow)
 *   - Falcon position marker (red)
 *   - Camera target / establishing shot marker (magenta)
 *   - Axis helpers at key positions
 *   - Grid on y=0 plane
 */

const SOLAR_SYSTEM_Z = -2000
const SOLAR_SYSTEM_RADIUS = 130
const TUNNEL_EXIT_Z = SOLAR_SYSTEM_Z + SOLAR_SYSTEM_RADIUS // -1870

// Tunnel params (must match HyperspaceTunnel)
const TUBE_RADIUS = 6
const TUNNEL_GROUP_Z = -50
const TUNNEL_NEAR_LOCAL = -30    // local = world -80
const TUNNEL_FAR_LOCAL = -1450  // local = world -1500
const TUNNEL_LENGTH = TUNNEL_NEAR_LOCAL - TUNNEL_FAR_LOCAL // 1855

interface Props {
  visible: boolean
}

function WireframeSphere({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
    </mesh>
  )
}

function Marker({ position, color, size = 2 }: { position: [number, number, number]; color: string; size?: number }) {
  return (
    <group position={position}>
      {/* Cross marker */}
      <mesh>
        <boxGeometry args={[size, size * 0.1, size * 0.1]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 0.1, size, size * 0.1]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 0.1, size * 0.1, size]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

export function DebugHelpers({ visible }: Props) {
  const falconMarkerRef = useRef<THREE.Group>(null)

  // Update falcon marker position each frame
  useFrame(() => {
    if (!visible || !falconMarkerRef.current) return
    const { falconWorldPosition } = useStore.getState()
    falconMarkerRef.current.position.copy(falconWorldPosition)
  })

  if (!visible) return null

  // Tunnel cylinder center in world space
  // Local center = (NEAR + FAR) / 2 = (35 + -1820) / 2 = -892.5
  // World: -50 + -892.5 = -942.5
  const cylLocalCenter = (TUNNEL_NEAR_LOCAL + TUNNEL_FAR_LOCAL) / 2
  const cylWorldZ = TUNNEL_GROUP_Z + cylLocalCenter

  return (
    <group>
      {/* ── TUNNEL WIREFRAME (green) ─────────────────────────── */}
      <mesh
        position={[0, 0, cylWorldZ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUNNEL_LENGTH, 32, 1, true]} />
        <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.3} />
      </mesh>

      {/* ── SOLAR SYSTEM BOUNDARY (cyan wireframe sphere) ───── */}
      <WireframeSphere
        position={[0, 0, SOLAR_SYSTEM_Z]}
        radius={SOLAR_SYSTEM_RADIUS}
        color="#00ffff"
      />

      {/* ── NEPTUNE ORBIT (outermost planet, ~125 units) ───── */}
      <WireframeSphere
        position={[0, 0, SOLAR_SYSTEM_Z]}
        radius={125}
        color="#4444ff"
      />

      {/* ── SUN MARKER (yellow) ──────────────────────────────── */}
      <Marker position={[0, 0, SOLAR_SYSTEM_Z]} color="#ffff00" size={5} />

      {/* ── LOBBY ORIGIN (white) ─────────────────────────────── */}
      <Marker position={[0, 0, 0]} color="#ffffff" size={3} />

      {/* ── TUNNEL EXIT / FALCON GALAXY POS (orange) ─────────── */}
      <Marker position={[0, 0, TUNNEL_EXIT_Z]} color="#ff8800" size={3} />

      {/* ── ESTABLISHING SHOT CAMERA POS (magenta) ───────────── */}
      <Marker position={[0, 4, TUNNEL_EXIT_Z + 14]} color="#ff00ff" size={2} />

      {/* ── FALCON LIVE POSITION (red, updates each frame) ───── */}
      <group ref={falconMarkerRef}>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#ff0000" wireframe />
        </mesh>
      </group>

      {/* ── AXIS HELPERS ─────────────────────────────────────── */}
      <axesHelper args={[20]} position={[0, 0, 0]} />
      <axesHelper args={[20]} position={[0, 0, SOLAR_SYSTEM_Z]} />
      <axesHelper args={[10]} position={[0, 0, TUNNEL_EXIT_Z]} />

      {/* ── GRID (y=0 plane, around tunnel exit) ─────────────── */}
      <gridHelper
        args={[400, 40, '#333333', '#222222']}
        position={[0, 0, TUNNEL_EXIT_Z]}
      />

      {/* ── GRID (y=0 plane, around lobby) ───────────────────── */}
      <gridHelper
        args={[100, 10, '#333333', '#222222']}
        position={[0, 0, 0]}
      />
    </group>
  )
}
