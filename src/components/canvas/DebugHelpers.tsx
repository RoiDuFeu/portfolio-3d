import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { wormholeSpline, WORMHOLE_TUBE_RADIUS, FALCON_START_T, ENTRY_T, TUBE_MOUTH_T, falconProgress } from '../../utils/wormholeSpline'

/**
 * Debug wireframe helpers — visible when debug free camera is active.
 * Shows:
 *   - Solar system boundary sphere (cyan)
 *   - Sun position marker (yellow)
 *   - Falcon position marker (red)
 *   - Camera target / establishing shot marker (magenta)
 *   - Wormhole spline path (green line)
 *   - Tube radius cross-sections at intervals (green wireframe circles)
 *   - Camera-to-spline distance indicator
 *   - Axis helpers at key positions
 *   - Grid on y=0 plane
 */

const SOLAR_SYSTEM_Z = -2000
const SOLAR_SYSTEM_RADIUS = 130
const TUNNEL_EXIT_Z = SOLAR_SYSTEM_Z + SOLAR_SYSTEM_RADIUS // -1870

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

/** Wormhole spline centerline + tube cross-section rings */
function WormholeSplineViz() {
  const { splineLineGeo, crossSectionGeos, crossSectionPositions, crossSectionQuats } = useMemo(() => {
    // Centerline: sample 200 points along the spline
    const linePoints: THREE.Vector3[] = []
    for (let i = 0; i <= 200; i++) {
      linePoints.push(wormholeSpline.getPointAt(i / 200))
    }
    const splineLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)

    // Cross-section rings every 5% of the spline
    const crossSectionGeos: THREE.BufferGeometry[] = []
    const crossSectionPositions: THREE.Vector3[] = []
    const crossSectionQuats: THREE.Quaternion[] = []
    const _up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const center = wormholeSpline.getPointAt(t)
      const tangent = wormholeSpline.getTangentAt(t)

      // Ring geometry
      const ringGeo = new THREE.RingGeometry(WORMHOLE_TUBE_RADIUS - 0.1, WORMHOLE_TUBE_RADIUS, 24)

      // Orient ring perpendicular to tangent
      const quat = new THREE.Quaternion()
      const lookMat = new THREE.Matrix4().lookAt(
        center,
        center.clone().add(tangent),
        _up,
      )
      quat.setFromRotationMatrix(lookMat)

      crossSectionGeos.push(ringGeo)
      crossSectionPositions.push(center)
      crossSectionQuats.push(quat)
    }

    return { splineLineGeo, crossSectionGeos, crossSectionPositions, crossSectionQuats }
  }, [])

  // Markers at key t values
  const falconStartPos = useMemo(() => wormholeSpline.getPointAt(FALCON_START_T), [])
  const tubeMouthPos = useMemo(() => wormholeSpline.getPointAt(TUBE_MOUTH_T), [])
  const entryEndPos = useMemo(() => wormholeSpline.getPointAt(ENTRY_T), [])

  return (
    <group>
      {/* Spline centerline */}
      <line>
        <primitive object={splineLineGeo} attach="geometry" />
        <lineBasicMaterial color="#00ff00" transparent opacity={0.6} />
      </line>

      {/* Tube cross-section rings */}
      {crossSectionGeos.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          position={crossSectionPositions[i]}
          quaternion={crossSectionQuats[i]}
        >
          <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* FALCON_START_T marker (cyan) */}
      <Marker
        position={[falconStartPos.x, falconStartPos.y, falconStartPos.z]}
        color="#00ffff"
        size={1.5}
      />

      {/* TUBE_MOUTH_T marker — where the tunnel visually begins (orange) */}
      <Marker
        position={[tubeMouthPos.x, tubeMouthPos.y, tubeMouthPos.z]}
        color="#ff8800"
        size={2}
      />

      {/* ENTRY_T end marker (yellow) */}
      <Marker
        position={[entryEndPos.x, entryEndPos.y, entryEndPos.z]}
        color="#ffff00"
        size={1.5}
      />
    </group>
  )
}

/** Shows camera distance to spline center — turns red when close to tube wall */
function CameraProximityIndicator() {
  const lineRef = useRef<THREE.Line>(null)
  const matRef = useRef<THREE.LineBasicMaterial>(null)
  const { camera } = useThree()

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
    return geo
  }, [])

  useFrame(() => {
    if (!lineRef.current || !matRef.current) return
    const ft = falconProgress.t
    const splineCenter = wormholeSpline.getPointAt(Math.max(ft - 0.007, 0))
    const dist = camera.position.distanceTo(splineCenter)

    // Update line endpoints
    const arr = lineGeo.attributes.position.array as Float32Array
    arr[0] = camera.position.x; arr[1] = camera.position.y; arr[2] = camera.position.z
    arr[3] = splineCenter.x; arr[4] = splineCenter.y; arr[5] = splineCenter.z
    lineGeo.attributes.position.needsUpdate = true

    // Color: green when safe, yellow when close, red when clipping
    const ratio = dist / WORMHOLE_TUBE_RADIUS
    if (ratio > 0.7) matRef.current.color.setHex(0xff0000)       // danger
    else if (ratio > 0.5) matRef.current.color.setHex(0xffaa00)  // warning
    else matRef.current.color.setHex(0x00ff00)                    // safe
  })

  return (
    <line ref={lineRef} geometry={lineGeo}>
      <lineBasicMaterial ref={matRef} color="#00ff00" />
    </line>
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

  return (
    <group>
      {/* ── WORMHOLE SPLINE + TUBE VISUALIZATION ───────────── */}
      <WormholeSplineViz />
      <CameraProximityIndicator />

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
