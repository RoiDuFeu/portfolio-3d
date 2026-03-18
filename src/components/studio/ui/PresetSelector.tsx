import { useStudioStore } from '../../../store/useStudioStore'
import { PRESETS } from '../../../utils/planetPresets'

const presetEntries = Object.keys(PRESETS).map((key) => ({
  key,
  label: key
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
}))

export function PresetSelector() {
  const loadPreset = useStudioStore((s) => s.loadPreset)

  return (
    <select
      className="studio-select"
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) {
          loadPreset(e.target.value)
          e.target.value = ''
        }
      }}
    >
      <option value="" disabled>
        Presets
      </option>
      {presetEntries.map(({ key, label }) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}
