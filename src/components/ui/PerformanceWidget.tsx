import type { ChangeEvent } from 'react'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS, type PerformanceMode } from '../../utils/performanceConfig'

const MODES: PerformanceMode[] = ['potato', 'balanced', 'ultra']

export function PerformanceWidget() {
  const mode = useStore((s) => s.performanceMode)
  const setPerformanceMode = useStore((s) => s.setPerformanceMode)
  const bumpSceneKey = useStore((s) => s.bumpSceneKey)
  const setIsReloading = useStore((s) => s.setIsReloading)

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as PerformanceMode
    if (next === mode) return
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
    <div className="retro-perf-widget">
      <div className="retro-perf-label">
        <span className="retro-perf-bracket">┌</span> RENDER MODE
      </div>
      <div className="retro-perf-select-wrap">
        <select
          className="retro-perf-select"
          value={mode}
          onChange={handleChange}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {PERFORMANCE_CONFIGS[m].label}
            </option>
          ))}
        </select>
        <span className="retro-perf-arrow">▼</span>
      </div>
    </div>
  )
}
