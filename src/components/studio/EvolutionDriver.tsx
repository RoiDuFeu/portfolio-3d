import { useFrame } from '@react-three/fiber'
import { useStudioStore } from '../../store/useStudioStore'

const CYCLE_DURATION = 10 // seconds for a full 0→1 cycle

export function EvolutionDriver() {
  useFrame((_, delta) => {
    const { isPlaying, playbackSpeed } = useStudioStore.getState()
    if (!isPlaying) return

    const increment = (delta / CYCLE_DURATION) * playbackSpeed
    const next = (useStudioStore.getState().evolution + increment) % 1
    useStudioStore.setState({ evolution: next })
  })

  return null
}
