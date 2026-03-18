import { useMemo } from 'react'
import * as THREE from 'three'
import { cameraPath, getLookAtTarget } from '../data/cameraPath'

export function useCameraPath() {
  return useMemo(() => ({
    getPosition: (t: number): THREE.Vector3 => {
      return cameraPath.getPointAt(Math.max(0, Math.min(1, t)))
    },
    getLookAt: (t: number): THREE.Vector3 => {
      return getLookAtTarget(t)
    },
    curve: cameraPath,
  }), [])
}
