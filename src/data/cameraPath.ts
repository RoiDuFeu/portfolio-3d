import * as THREE from 'three'
import { solarBodies } from './solarSystem'
import { TOUR_ORDER, galaxyPlanetPlacements } from './galaxyLayout'

/**
 * Camera path for the galaxy experience.
 * Flies between planets scattered across the galaxy,
 * dwelling longer on project planets (Earth, Mars, Neptune).
 */

// Section layout: each planet gets a scroll range.
// Project planets get ~15% dwell, decorative planets get ~5%.
// First 8% is establishing shot, last 8% is closing shot.
interface Section {
  name: string
  start: number
  end: number
  position: [number, number, number]
  isProject: boolean
}

function buildSections(): Section[] {
  const sections: Section[] = []

  const INTRO = 0.08
  const OUTRO = 0.08
  const BODY_RANGE = 1.0 - INTRO - OUTRO // 0.84

  // Use tour order for visit sequence
  const tourBodies = TOUR_ORDER.map((name) => {
    const body = solarBodies.find((b) => b.name === name)!
    const placement = galaxyPlanetPlacements.find((p) => p.planetName === name)!
    return { body, placement }
  })

  // Weight: project planets get 3x the scroll budget
  const weights = tourBodies.map(({ body }) => (body.projectId ? 3 : 1))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let cursor = INTRO
  for (let i = 0; i < tourBodies.length; i++) {
    const fraction = (weights[i] / totalWeight) * BODY_RANGE
    sections.push({
      name: tourBodies[i].body.name,
      start: cursor,
      end: cursor + fraction,
      position: tourBodies[i].placement.position,
      isProject: !!tourBodies[i].body.projectId,
    })
    cursor += fraction
  }

  return sections
}

export const sections = buildSections()

function generateWaypoints(): THREE.Vector3[] {
  const points: THREE.Vector3[] = []

  // Establishing shot — far above, seeing the galaxy spread
  points.push(new THREE.Vector3(0, 80, 100))
  points.push(new THREE.Vector3(10, 50, 60))

  for (const section of sections) {
    const [px, py, pz] = section.position

    if (section.isProject) {
      // Project planets: approach from above, sweep close, then pull away
      points.push(new THREE.Vector3(px - 15, py + 12, pz + 20))
      points.push(new THREE.Vector3(px - 5, py + 3, pz + 8))
      points.push(new THREE.Vector3(px + 10, py + 5, pz - 10))
    } else {
      // Decorative planets: brief flyby
      points.push(new THREE.Vector3(px - 8, py + 8, pz + 12))
    }
  }

  // Final pullback — wide closing shot looking back at galaxy center
  points.push(new THREE.Vector3(50, 60, 80))
  points.push(new THREE.Vector3(0, 80, 120))

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
 * Returns the index into the tour order.
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
 * Looks at the current planet's galaxy position.
 */
export function getLookAtTarget(progress: number): THREE.Vector3 {
  // Establishing shot — look at galaxy center
  if (progress < 0.08) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Closing shot — look back at galaxy center
  if (progress > 0.92) {
    return new THREE.Vector3(0, 0, 0)
  }

  const sectionIndex = getActiveSection(progress)
  const section = sections[sectionIndex]
  const [px, py, pz] = section.position

  return new THREE.Vector3(px, py, pz)
}
