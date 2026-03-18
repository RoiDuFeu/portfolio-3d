import * as THREE from 'three'
import { solarBodies, getDisplayOrbit, getBodiesSortedByOrbit } from './solarSystem'

/**
 * Camera path for the realistic solar system experience.
 * Visits all 8 planets — dwells longer on project planets (Earth, Mars, Neptune).
 */

// Section layout: each planet gets a scroll range.
// Project planets get ~15% dwell, decorative planets get ~5%.
// First 8% is establishing shot, last 10% is closing shot.
interface Section {
  name: string
  start: number
  end: number
  orbitRadius: number
  isProject: boolean
}

function buildSections(): Section[] {
  const sorted = getBodiesSortedByOrbit()
  const sections: Section[] = []

  const INTRO = 0.08
  const OUTRO = 0.10
  const BODY_RANGE = 1.0 - INTRO - OUTRO // 0.82

  // Weight: project planets get 3x the scroll budget
  const weights = sorted.map((b) => (b.projectId ? 3 : 1))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let cursor = INTRO
  for (let i = 0; i < sorted.length; i++) {
    const fraction = (weights[i] / totalWeight) * BODY_RANGE
    sections.push({
      name: sorted[i].name,
      start: cursor,
      end: cursor + fraction,
      orbitRadius: getDisplayOrbit(sorted[i]),
      isProject: !!sorted[i].projectId,
    })
    cursor += fraction
  }

  return sections
}

export const sections = buildSections()

function generateWaypoints(): THREE.Vector3[] {
  const points: THREE.Vector3[] = []

  // Establishing shot — far above, seeing the whole system
  points.push(new THREE.Vector3(0, 60, 80))
  points.push(new THREE.Vector3(5, 40, 55))

  // Descent into inner system
  points.push(new THREE.Vector3(10, 20, 30))

  for (const section of sections) {
    const r = section.orbitRadius

    if (section.isProject) {
      // Project planets: approach from above, then sweep close
      points.push(new THREE.Vector3(r * 0.7, 8, r * 0.85))
      points.push(new THREE.Vector3(r * 0.5, 3, r * 0.55))
      points.push(new THREE.Vector3(r * 0.3, 4, r * 0.7))
    } else {
      // Decorative planets: brief flyby
      points.push(new THREE.Vector3(r * 0.6, 6, r * 0.75))
    }
  }

  // Final pullback — wide closing shot
  points.push(new THREE.Vector3(-30, 50, 70))

  return points
}

const waypoints = generateWaypoints()

export const cameraPath = new THREE.CatmullRomCurve3(
  waypoints,
  false,
  'centripetal',
  0.5
)

/**
 * Determine which section (planet) the camera is in based on scroll progress.
 * Returns the index into solarBodies sorted by orbit.
 */
export function getActiveSection(progress: number): number {
  for (let i = 0; i < sections.length; i++) {
    if (progress >= sections[i].start && progress < sections[i].end) {
      return i
    }
  }
  // Before first section or after last
  if (progress < sections[0].start) return 0
  return sections.length - 1
}

/**
 * Get lookAt target based on scroll progress.
 */
export function getLookAtTarget(progress: number): THREE.Vector3 {
  // Establishing shot — look at the sun
  if (progress < 0.08) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Closing shot — look back at the system
  if (progress > 0.92) {
    return new THREE.Vector3(0, 0, 0)
  }

  const sectionIndex = getActiveSection(progress)
  const section = sections[sectionIndex]
  const r = section.orbitRadius

  // Look toward the planet's orbital zone
  return new THREE.Vector3(r * 0.3, 0, r * 0.2)
}
