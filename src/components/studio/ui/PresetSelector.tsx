import { useStudioStore } from '../../../store/useStudioStore'

const proceduralPresets = [
  { key: 'blank', label: 'Blank' },
  { key: 'mercury', label: 'Mercury' },
  { key: 'venus', label: 'Venus' },
  { key: 'earth', label: 'Earth' },
  { key: 'mars', label: 'Mars' },
  { key: 'ice', label: 'Ice World' },
  { key: 'lava', label: 'Lava World' },
  { key: 'sun', label: 'Star' },
  { key: 'red-dwarf', label: 'Red Dwarf' },
  { key: 'saturn', label: 'Gas Giant' },
]

const photoRealisticPresets = [
  { key: 'earth-realistic', label: '🌍 Earth (Realistic)' },
  { key: 'moon-realistic', label: '🌙 Moon (Realistic)' },
  { key: 'saturn-realistic', label: '🪐 Saturn (Realistic)' },
  { key: 'mars-realistic', label: '🔴 Mars (Realistic)' },
  { key: 'sun-realistic', label: '☀️ Sun (Realistic)' },
  { key: 'sun-advanced-realistic', label: '🌞 Sun (Advanced)' },
  { key: 'sun-spectacular-realistic', label: '✨ Sun (Spectacular)' },
]

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
      {proceduralPresets.map(({ key, label }) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
      <option disabled>────────────</option>
      {photoRealisticPresets.map(({ key, label }) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}
