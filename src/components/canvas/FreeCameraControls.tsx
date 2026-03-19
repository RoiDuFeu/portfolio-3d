import { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useStore } from '../../store/useStore'

/**
 * Free camera mode for galaxy roaming.
 * - V: toggle journey/orbit
 * - R: reset camera when in orbit mode
 */
export function FreeCameraControls() {
  const { camera } = useThree()
  const cameraMode = useStore((s) => s.cameraMode)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = useStore.getState()

      if (e.code === 'KeyV') {
        state.setCameraMode(state.cameraMode === 'orbit' ? 'journey' : 'orbit')
      }

      if (e.code === 'KeyR' && state.cameraMode === 'orbit') {
        camera.position.set(0, 50, 60)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [camera])

  if (cameraMode !== 'orbit') return null

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.6}
      panSpeed={0.8}
      zoomSpeed={1.0}
      minDistance={6}
      maxDistance={420}
      maxPolarAngle={Math.PI * 0.98}
      target={[0, 0, 0]}
    />
  )
}
