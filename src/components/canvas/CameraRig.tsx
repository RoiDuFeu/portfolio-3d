import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { useCameraPath } from '../../hooks/useCameraPath'

const _targetPos = new THREE.Vector3()
const _targetLookAt = new THREE.Vector3()
const _mouseOffset = new THREE.Vector3()

export function CameraRig() {
  const { camera } = useThree()
  const { getPosition, getLookAt } = useCameraPath()
  const mousePos = useRef({ x: 0, y: 0 })
  const lookAtSmooth = useRef(new THREE.Vector3(0, 0, 0))
  const initialized = useRef(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame(() => {
    const { scrollProgress, cameraMode } = useStore.getState()

    if (cameraMode !== 'journey') return

    // Get target position from spline
    _targetPos.copy(getPosition(scrollProgress))

    // Subtle mouse parallax
    _mouseOffset.set(
      mousePos.current.x * 0.6,
      mousePos.current.y * 0.3,
      0
    )
    _targetPos.add(_mouseOffset)

    // Get lookAt target
    _targetLookAt.copy(getLookAt(scrollProgress))

    // Initialize or smooth-lerp
    if (!initialized.current) {
      camera.position.copy(_targetPos)
      lookAtSmooth.current.copy(_targetLookAt)
      initialized.current = true
    } else {
      camera.position.lerp(_targetPos, 0.03)
      lookAtSmooth.current.lerp(_targetLookAt, 0.03)
    }

    camera.lookAt(lookAtSmooth.current)
  })

  return null
}
