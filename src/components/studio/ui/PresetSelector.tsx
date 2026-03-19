import { useStudioStore } from '../../../store/useStudioStore'

const presets = [
  { key: 'earth-realistic', presetId: 'earth', label: 'Earth' },
  { key: 'moon-realistic', presetId: 'moon', label: 'Moon' },
  { key: 'saturn-realistic', presetId: 'saturn', label: 'Saturn' },
  { key: 'mars-realistic', presetId: 'mars', label: 'Mars' },
  { key: 'sun-cubemap-realistic', presetId: 'sun-cubemap', label: 'Sun' },
]

export function PresetSelector() {
  const loadPreset = useStudioStore((s) => s.loadPreset)
  const photoPreset = useStudioStore((s) => s.config.photoRealisticPreset)

  const activeKey = presets.find((p) => p.presetId === photoPreset)?.key ?? ''

  return (
    <select
      className="studio-select"
      value={activeKey}
      onChange={(e) => {
        if (e.target.value) {
          loadPreset(e.target.value)
        }
      }}
    >
      <option value="" disabled>
        Presets
      </option>
      {presets.map(({ key, label }) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}
