import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { wormholeTubeSpline, WORMHOLE_TUBE_RADIUS } from '../../utils/wormholeSpline'

/**
 * Wireframe wormhole tunnel — inspired by bobbyroe/flythru-wireframe-wormhole.
 *
 * Layers:
 *   1. EdgesGeometry wireframe of the tube — red glowing lines
 *   2. Scattered wireframe boxes along the path — HSL color gradient
 *   3. Destination glow sphere at exit
 *
 * Visible immediately when hyperspace starts (no delay).
 * Fog fades distant geometry to black.
 */

/** Delay (ms) before the wormhole appears after hyperspace starts */
export const WORMHOLE_DELAY = 2500

const NUM_BOXES = 55
const BOX_SIZE = 0.15

export function Wormhole() {
  const groupRef = useRef<THREE.Group>(null)
  const boxesRef = useRef<THREE.Group>(null)

  const resources = useMemo(() => {
    // ── Tube wireframe ──
    const tubeGeo = new THREE.TubeGeometry(wormholeTubeSpline, 222, WORMHOLE_TUBE_RADIUS, 16, false)
    const edges = new THREE.EdgesGeometry(tubeGeo, 0.2)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 })

    // ── Scattered wireframe boxes along the tube ──
    const boxGeo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE)
    const boxEdges = new THREE.EdgesGeometry(boxGeo, 0.2)

    const boxes: { position: THREE.Vector3; rotation: THREE.Euler; color: THREE.Color }[] = []
    for (let i = 0; i < NUM_BOXES; i++) {
      const p = (i / NUM_BOXES + Math.random() * 0.1) % 1
      const pos = wormholeTubeSpline.getPointAt(p)

      // Get local frame to scatter boxes inside the tube
      const tangent = wormholeTubeSpline.getTangentAt(p)
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(tangent, up)
      if (right.lengthSq() < 0.001) right.crossVectors(tangent, new THREE.Vector3(1, 0, 0))
      right.normalize()
      const pathUp = new THREE.Vector3().crossVectors(right, tangent).normalize()

      // Random offset inside tube radius
      const angle = Math.random() * Math.PI * 2
      const radius = (Math.random() * 0.6 + 0.1) * WORMHOLE_TUBE_RADIUS
      pos.addScaledVector(right, Math.cos(angle) * radius)
      pos.addScaledVector(pathUp, Math.sin(angle) * radius)

      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )
      // HSL gradient: blue-to-red based on position along path
      const color = new THREE.Color().setHSL(0.7 - p * 0.7, 1, 0.5)

      boxes.push({ position: pos, rotation, color })
    }

    // ── Destination glow sphere ──
    const glowGeo = new THREE.SphereGeometry(4, 16, 16)
    const exitPoint = wormholeTubeSpline.getPointAt(0.98)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    // Dispose tube solid geo (we only keep the edges)
    tubeGeo.dispose()

    return { edges, lineMat, boxEdges, boxes, glowGeo, glowMat, exitPoint }
  }, [])

  // Show/hide based on appPhase
  // During 'loading' the group stays visible (scale 0) so gl.compile() can
  // pre-compile its shaders — avoids GPU stall on first hyperspace frame.
  useFrame(() => {
    if (!groupRef.current) return
    const { appPhase } = useStore.getState()
    const show = appPhase === 'hyperspace' || appPhase === 'arriving'

    if (appPhase === 'loading') {
      // Keep in the scene graph for shader compilation, but invisible to the eye
      groupRef.current.visible = true
      groupRef.current.scale.setScalar(0.0001)
    } else {
      groupRef.current.visible = show
      if (show) groupRef.current.scale.setScalar(1)
    }

    // Slowly rotate boxes for visual interest
    if (boxesRef.current && show) {
      const children = boxesRef.current.children
      for (let i = 0; i < children.length; i++) {
        children[i].rotation.x += 0.003
        children[i].rotation.y += 0.005
      }
    }
  }, -2)

  return (
    <group ref={groupRef}>
      {/* Wireframe tube — red glowing edges */}
      <lineSegments geometry={resources.edges} material={resources.lineMat} />

      {/* Scattered wireframe boxes */}
      <group ref={boxesRef}>
        {resources.boxes.map((box, i) => (
          <lineSegments
            key={i}
            geometry={resources.boxEdges}
            position={box.position}
            rotation={box.rotation}
          >
            <lineBasicMaterial color={box.color} />
          </lineSegments>
        ))}
      </group>

      {/* Destination glow */}
      <mesh
        geometry={resources.glowGeo}
        material={resources.glowMat}
        position={[resources.exitPoint.x, resources.exitPoint.y, resources.exitPoint.z]}
      />
    </group>
  )
}
