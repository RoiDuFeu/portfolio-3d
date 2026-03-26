import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

/**
 * Wrapper group for all solar system content.
 *
 * All shaders are pre-compiled during the 'loading' phase by AssetPreloader.
 * Shown immediately when the app transitions to 'arriving' (galaxy overview).
 */

const SOLAR_SYSTEM_Z = -2000

interface Props {
  children: ReactNode
}

export function SolarSystemZone({ children }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const { appPhase } = useStore.getState()

    // Show immediately when arriving or main
    if (appPhase === 'arriving' || appPhase === 'main') {
      if (!groupRef.current.visible) {
        groupRef.current.visible = true
        for (let i = 0; i < groupRef.current.children.length; i++) {
          groupRef.current.children[i].visible = true
        }
      }
    }

    // Keep hidden during loading
    if (appPhase === 'loading') {
      if (groupRef.current.visible) groupRef.current.visible = false
    }
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0, SOLAR_SYSTEM_Z]}
      visible={false}
    >
      {children}
    </group>
  )
}
