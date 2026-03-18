import { useStudioStore } from '../../../store/useStudioStore'
import type { PlanetMode } from '../../../types/studio'

export function ModeControls() {
  const mode = useStudioStore((s) => s.config.mode)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  const setMode = (m: PlanetMode) => updateConfig({ mode: m })

  return (
    <div className="ctrl-mode">
      <button
        type="button"
        className={`ctrl-mode__btn ${mode === 'rocky' ? 'ctrl-mode__btn--active' : ''}`}
        onClick={() => setMode('rocky')}
      >
        Rocky
      </button>
      <button
        type="button"
        className={`ctrl-mode__btn ${mode === 'star' ? 'ctrl-mode__btn--active' : ''}`}
        onClick={() => setMode('star')}
      >
        Star / Fire
      </button>
    </div>
  )
}
