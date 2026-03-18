import { Link } from 'react-router-dom'
import { useStudioStore } from '../../../store/useStudioStore'
import { PresetSelector } from './PresetSelector'
import { SaveLoadPanel } from './SaveLoadPanel'

export function TopBar() {
  const name = useStudioStore((s) => s.config.name)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  return (
    <div className="studio__top-bar">
      <Link to="/" className="studio-back-link">
        &larr; Galaxy
      </Link>

      <span className="studio__title">Planet Studio</span>

      <input
        className="studio-name-input"
        type="text"
        value={name}
        onChange={(e) => updateConfig({ name: e.target.value })}
        placeholder="Planet name..."
      />

      <div className="studio__top-spacer" />

      <PresetSelector />
      <SaveLoadPanel />
    </div>
  )
}
