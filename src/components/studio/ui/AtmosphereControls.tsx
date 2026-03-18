import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { Toggle } from './Toggle'
import { ColorPicker } from './ColorPicker'
import { DualSlider } from './DualSlider'
import { Slider } from './Slider'

export function AtmosphereControls() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)
  const atmo = config.atmosphere

  return (
    <ControlSection title="Atmosphere" defaultOpen={false}>
      <Toggle
        label="Enabled"
        value={atmo.enabled}
        onChange={(enabled) => {
          const updates: Partial<typeof config> = { atmosphere: { ...atmo, enabled } }
          if (enabled && config.mode === 'star') {
            updates.atmosphere = { ...atmo, enabled, color: config.fire.colorEdge }
          }
          if (!enabled && config.clouds.enabled) {
            updates.clouds = { ...config.clouds, enabled: false }
          }
          if (!enabled && config.mode === 'star' && config.fire.coronaGlow > 0.3) {
            updates.fire = { ...config.fire, coronaGlow: 0.3 }
          }
          updateConfig(updates as any)
        }}
      />
      {atmo.enabled && config.mode === 'rocky' && config.clouds.enabled && (
        <p className="ctrl-hint">Disabling atmosphere will also disable clouds.</p>
      )}
      {!atmo.enabled && config.mode === 'star' && (
        <p className="ctrl-hint">Stars need atmosphere for a realistic corona effect.</p>
      )}
      {atmo.enabled && config.mode === 'star' && (
        <p className="ctrl-hint">Atmosphere color syncs with fire edge — adjust for custom halos.</p>
      )}
      {atmo.enabled && (
        <>
          <ColorPicker
            label="Color"
            value={atmo.color}
            onChange={(color) =>
              updateConfig({ atmosphere: { ...atmo, color } })
            }
          />
          <DualSlider
            label="Intensity"
            value={atmo.intensity}
            min={0}
            max={2}
            onChange={(intensity) =>
              updateConfig({ atmosphere: { ...atmo, intensity } })
            }
          />
          <Slider
            label="Exponent"
            value={atmo.exponent}
            min={1}
            max={8}
            step={0.1}
            onChange={(exponent) =>
              updateConfig({ atmosphere: { ...atmo, exponent } })
            }
          />
        </>
      )}
    </ControlSection>
  )
}
