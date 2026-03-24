import * as THREE from 'three'

/**
 * Wormhole flight path — a CatmullRomCurve3 from the Falcon's idle
 * position to the solar system boundary.
 *
 * The Falcon accelerates through a star-streak for ~2s before the
 * wormhole tunnel appears ahead. The visual tube is built from a
 * separate sub-spline (`wormholeTubeSpline`) that starts at the
 * tunnel mouth — well ahead of the Falcon's 2s position — so the
 * player sees the ship fly INTO the tunnel rather than already
 * being inside it.
 *
 * World-space: z ≈ -4 (Falcon start) → z ≈ -1870 (exit).
 */
const points = [
  // ── Falcon starts here ──
  new THREE.Vector3(0, 0, -4),
  new THREE.Vector3(0, 0.5, -18),
  // Wormhole mouth — tube geometry starts here
  new THREE.Vector3(0.5, 1, -40),
  new THREE.Vector3(1, 1.5, -60),
  new THREE.Vector3(2, 2, -100),
  // First sweeping curve
  new THREE.Vector3(10, 5, -190),
  new THREE.Vector3(18, 2, -280),
  new THREE.Vector3(16, -4, -370),
  // Dive and curve left
  new THREE.Vector3(4, -10, -450),
  new THREE.Vector3(-10, -8, -530),
  new THREE.Vector3(-18, 0, -620),
  // Rise and corkscrew
  new THREE.Vector3(-14, 10, -710),
  new THREE.Vector3(-2, 16, -790),
  new THREE.Vector3(12, 10, -870),
  // Tight S-curve
  new THREE.Vector3(18, -2, -950),
  new THREE.Vector3(6, -12, -1030),
  new THREE.Vector3(-10, -10, -1110),
  // Another sweep
  new THREE.Vector3(-18, 2, -1190),
  new THREE.Vector3(-12, 14, -1270),
  // Descent toward exit
  new THREE.Vector3(2, 12, -1360),
  new THREE.Vector3(14, 4, -1450),
  new THREE.Vector3(10, -8, -1540),
  new THREE.Vector3(-4, -6, -1630),
  // Straighten for exit
  new THREE.Vector3(-6, 0, -1730),
  new THREE.Vector3(-2, 1, -1810),
  new THREE.Vector3(0, 0, -1870),
]

export const wormholeSpline = new THREE.CatmullRomCurve3(points)

export const WORMHOLE_TUBE_RADIUS = 6

// ── Find the spline t where a given z is reached ──────────────────
function findTForZ(targetZ: number, lo = 0, hi = 0.5): number {
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const p = wormholeSpline.getPointAt(mid)
    if (p.z > targetZ) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Spline t where the Falcon idles (z ≈ -4) */
export const FALCON_START_T = findTForZ(-4)

/**
 * Spline t where the visual tunnel begins (z ≈ -80).
 * The tube geometry is built from this point onward so the player
 * sees the ship fly INTO the tunnel mouth during the hyperspace jump.
 */
export const TUBE_MOUTH_T = findTForZ(-80)

// Forward-only cruise parameters
export const ENTRY_T = FALCON_START_T + 0.048
export const CRUISE_SPEED = 0.078
export const WAIT_T = 0.88 + FALCON_START_T

/**
 * Sub-spline for the visual tunnel tube — starts at the mouth (z ≈ -40)
 * and runs to the exit. Built by sampling the main spline from TUBE_MOUTH_T
 * onward so geometry and particles only exist ahead of the tunnel entrance.
 */
function buildTubeSpline(): THREE.CatmullRomCurve3 {
  const SAMPLES = 200
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = TUBE_MOUTH_T + (1 - TUBE_MOUTH_T) * (i / SAMPLES)
    pts.push(wormholeSpline.getPointAt(t))
  }
  return new THREE.CatmullRomCurve3(pts)
}

export const wormholeTubeSpline = buildTubeSpline()

/**
 * Mutable ref shared between UnifiedFalcon (writer),
 * UnifiedCameraRig (reader), and Wormhole (reader).
 *
 * entryIntensity: 0 → 1 during gravitational pull, settles to ~0.2 cruise.
 * Used by the wormhole shader to ramp up distortion / brightness.
 */
export const falconProgress = { t: FALCON_START_T, entryIntensity: 0.15 }

// ── Debug: log spline parameters at startup ──────────────────────────
if (import.meta.env.DEV) {
  const pStart = wormholeSpline.getPointAt(FALCON_START_T)
  const pMouth = wormholeSpline.getPointAt(TUBE_MOUTH_T)
  const pEntry = wormholeSpline.getPointAt(ENTRY_T)
  const pWait = wormholeSpline.getPointAt(WAIT_T)
  const pEnd = wormholeSpline.getPointAt(1)
  console.log('[WORMHOLE] Spline parameters:')
  console.log(`  FALCON_START_T = ${FALCON_START_T.toFixed(4)} → pos [${pStart.x.toFixed(1)}, ${pStart.y.toFixed(1)}, ${pStart.z.toFixed(1)}]`)
  console.log(`  TUBE_MOUTH_T   = ${TUBE_MOUTH_T.toFixed(4)} → pos [${pMouth.x.toFixed(1)}, ${pMouth.y.toFixed(1)}, ${pMouth.z.toFixed(1)}]`)
  console.log(`  ENTRY_T        = ${ENTRY_T.toFixed(4)} → pos [${pEntry.x.toFixed(1)}, ${pEntry.y.toFixed(1)}, ${pEntry.z.toFixed(1)}]`)
  console.log(`  WAIT_T         = ${WAIT_T.toFixed(4)} → pos [${pWait.x.toFixed(1)}, ${pWait.y.toFixed(1)}, ${pWait.z.toFixed(1)}]`)
  console.log(`  END            = 1.0000 → pos [${pEnd.x.toFixed(1)}, ${pEnd.y.toFixed(1)}, ${pEnd.z.toFixed(1)}]`)
  console.log(`  TUBE_RADIUS    = ${WORMHOLE_TUBE_RADIUS}`)
  console.log(`  Full arc len   ≈ ${wormholeSpline.getLength().toFixed(0)}`)
  console.log(`  Tube arc len   ≈ ${wormholeTubeSpline.getLength().toFixed(0)}`)
}
