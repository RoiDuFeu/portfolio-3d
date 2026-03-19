import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { Slider } from './Slider'

export function RealisticControls() {
  const { config, updateConfig } = useStudioStore()

  if (config.mode !== 'rocky') return null

  const realistic = config.realistic || {
    enabled: false,
    specularStrength: 0.7,
    nightLightsDensity: 0.3,
    roughness: 0.5,
  }

  const handleToggle = () => {
    updateConfig({
      realistic: {
        ...realistic,
        enabled: !realistic.enabled,
      },
    })
  }

  const handleChange = (key: keyof typeof realistic, value: number) => {
    updateConfig({
      realistic: {
        ...realistic,
        [key]: value,
      },
    })
  }

  return (
    <ControlSection title="Realistic Mode">
      <div className="space-y-3">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-white/70">Enable Realistic</label>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              realistic.enabled ? 'bg-blue-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                realistic.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Sliders (only visible when enabled) */}
        {realistic.enabled && (
          <>
            <Slider
              label="Specular Strength"
              value={realistic.specularStrength}
              onChange={(v) => handleChange('specularStrength', v)}
              min={0}
              max={1}
              step={0.05}
            />

            <Slider
              label="Night Lights Density"
              value={realistic.nightLightsDensity}
              onChange={(v) => handleChange('nightLightsDensity', v)}
              min={0}
              max={1}
              step={0.05}
            />

            <Slider
              label="Roughness"
              value={realistic.roughness}
              onChange={(v) => handleChange('roughness', v)}
              min={0}
              max={1}
              step={0.05}
            />
          </>
        )}
      </div>
    </ControlSection>
  )
}
