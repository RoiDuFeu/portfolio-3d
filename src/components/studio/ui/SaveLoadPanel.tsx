import { useState } from 'react'
import { useStudioStore } from '../../../store/useStudioStore'
import { exportPlanetJSON, importPlanetJSON } from '../../../utils/persistence'

export function SaveLoadPanel() {
  const [showLoad, setShowLoad] = useState(false)
  const config = useStudioStore((s) => s.config)
  const savedPlanets = useStudioStore((s) => s.savedPlanets)
  const save = useStudioStore((s) => s.save)
  const load = useStudioStore((s) => s.load)
  const deletePlanet = useStudioStore((s) => s.deletePlanet)
  const setConfig = useStudioStore((s) => s.setConfig)

  const handleExport = () => {
    const json = exportPlanetJSON(config)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = importPlanetJSON(reader.result as string)
          setConfig(imported)
        } catch {
          // Invalid JSON
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="studio-save-load">
      <button type="button" className="studio-btn" onClick={save}>
        Save
      </button>
      <button
        type="button"
        className="studio-btn"
        onClick={() => setShowLoad(!showLoad)}
      >
        Load
      </button>
      <button type="button" className="studio-btn studio-btn--ghost" onClick={handleExport}>
        Export
      </button>
      <button type="button" className="studio-btn studio-btn--ghost" onClick={handleImport}>
        Import
      </button>

      {showLoad && (
        <div className="studio-load-dropdown">
          {savedPlanets.length === 0 ? (
            <div className="studio-load-dropdown__empty">No saved planets</div>
          ) : (
            savedPlanets.map((p) => (
              <div key={p.id} className="studio-load-dropdown__item">
                <button
                  type="button"
                  className="studio-load-dropdown__name"
                  onClick={() => {
                    load(p.id)
                    setShowLoad(false)
                  }}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  className="studio-load-dropdown__delete"
                  onClick={() => deletePlanet(p.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
