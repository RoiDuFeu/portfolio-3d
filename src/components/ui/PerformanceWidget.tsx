import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS, type PerformanceMode } from '../../utils/performanceConfig'

const MODES: PerformanceMode[] = ['potato', 'balanced', 'ultra']

export function PerformanceWidget() {
  const mode = useStore((s) => s.performanceMode)
  const setPerformanceMode = useStore((s) => s.setPerformanceMode)
  const bumpSceneKey = useStore((s) => s.bumpSceneKey)
  const setIsReloading = useStore((s) => s.setIsReloading)

  const handleClick = () => {
    const currentIdx = MODES.indexOf(mode)
    const next = MODES[(currentIdx + 1) % MODES.length]
    setIsReloading(true)
    setPerformanceMode(next)
    // Let the overlay render first, then remount the scene
    setTimeout(() => {
      bumpSceneKey()
      // Overlay fades out after scene remounts
      setTimeout(() => setIsReloading(false), 1600)
    }, 80)
  }

  return (
    <div className="retro-perf-widget" onClick={handleClick}>
      <div className="retro-perf-label">
        <span className="retro-perf-bracket">┌</span> RENDER MODE
      </div>
      <div className="retro-perf-select-wrap">
        <span className="retro-perf-value">{PERFORMANCE_CONFIGS[mode].label}</span>
        <span className="retro-perf-arrow">▶</span>
      </div>
    </div>
  )
}
