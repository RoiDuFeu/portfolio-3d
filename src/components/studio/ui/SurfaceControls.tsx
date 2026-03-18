import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { Slider } from './Slider'
import { DualSlider } from './DualSlider'

export function SurfaceControls() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  return (
    <ControlSection title="Surface">
      <Slider
        label="Size"
        value={config.size}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(size) => updateConfig({ size })}
      />
      <DualSlider
        label="Rotation Speed"
        value={config.rotationSpeed}
        min={0}
        max={0.02}
        step={0.0005}
        onChange={(rotationSpeed) => updateConfig({ rotationSpeed })}
      />

      {config.mode === 'rocky' && (
        <>
          <DualSlider
            label="Displacement"
            value={config.terrain.displacement}
            min={0}
            max={0.5}
            onChange={(displacement) =>
              updateConfig({ terrain: { ...config.terrain, displacement } })
            }
          />
          <Slider
            label="Noise Frequency"
            value={config.terrain.noiseFrequency}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(noiseFrequency) =>
              updateConfig({ terrain: { ...config.terrain, noiseFrequency } })
            }
          />
          <Slider
            label="Noise Octaves"
            value={config.terrain.noiseOctaves}
            min={1}
            max={6}
            step={1}
            onChange={(noiseOctaves) =>
              updateConfig({ terrain: { ...config.terrain, noiseOctaves } })
            }
          />
          <Slider
            label="Seed"
            value={config.terrain.seed}
            min={0}
            max={100}
            step={1}
            onChange={(seed) =>
              updateConfig({ terrain: { ...config.terrain, seed } })
            }
          />
        </>
      )}

      {config.mode === 'star' && (
        <>
          <DualSlider
            label="Fire Intensity"
            value={config.fire.intensity}
            min={0}
            max={1.5}
            onChange={(intensity) =>
              updateConfig({ fire: { ...config.fire, intensity } })
            }
          />
          <Slider
            label="Corona Glow"
            value={config.fire.coronaGlow}
            min={0}
            max={1.5}
            onChange={(coronaGlow) => {
              const updates: Partial<typeof config> = {
                fire: { ...config.fire, coronaGlow },
              }
              if (coronaGlow > 0.3 && !config.atmosphere.enabled) {
                updates.atmosphere = { ...config.atmosphere, enabled: true, color: config.fire.colorEdge }
              }
              updateConfig(updates as any)
            }}
          />
          {!config.atmosphere.enabled && config.fire.coronaGlow > 0 && (
            <p className="ctrl-hint">
              Raising corona glow will enable atmosphere for a realistic halo.
            </p>
          )}
        </>
      )}
    </ControlSection>
  )
}
