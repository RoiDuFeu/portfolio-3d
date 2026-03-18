import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { Toggle } from './Toggle'
import { DualSlider } from './DualSlider'
import { Slider } from './Slider'
import { ColorPicker } from './ColorPicker'

export function CloudControls() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)
  const clouds = config.clouds

  if (config.mode !== 'rocky') return null

  return (
    <ControlSection title="Clouds" defaultOpen={false}>
      <Toggle
        label="Enabled"
        value={clouds.enabled}
        onChange={(enabled) => {
          const updates: Partial<typeof config> = { clouds: { ...clouds, enabled } }
          if (enabled && !config.atmosphere.enabled) {
            updates.atmosphere = { ...config.atmosphere, enabled: true }
          }
          updateConfig(updates as any)
        }}
      />
      {!config.atmosphere.enabled && (
        <p className="ctrl-hint">Enabling clouds will also enable atmosphere.</p>
      )}
      {clouds.enabled && (
        <>
          <DualSlider
            label="Density"
            value={clouds.density}
            min={0}
            max={1}
            onChange={(density) =>
              updateConfig({ clouds: { ...clouds, density } })
            }
          />
          <Slider
            label="Speed"
            value={clouds.speed}
            min={0}
            max={2}
            step={0.05}
            onChange={(speed) =>
              updateConfig({ clouds: { ...clouds, speed } })
            }
          />
          <ColorPicker
            label="Color"
            value={clouds.color}
            onChange={(color) =>
              updateConfig({ clouds: { ...clouds, color } })
            }
          />
        </>
      )}
    </ControlSection>
  )
}
