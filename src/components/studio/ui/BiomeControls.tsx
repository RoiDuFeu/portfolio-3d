import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { DualSlider } from './DualSlider'

export function BiomeControls() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  if (config.mode !== 'rocky') return null

  return (
    <ControlSection title="Biome">
      <DualSlider
        label="Ocean Level"
        value={config.biome.oceanLevel}
        min={0}
        max={0.8}
        onChange={(oceanLevel) =>
          updateConfig({ biome: { ...config.biome, oceanLevel } })
        }
      />
      <DualSlider
        label="Vegetation"
        value={config.biome.vegetation}
        min={0}
        max={1}
        onChange={(vegetation) =>
          updateConfig({ biome: { ...config.biome, vegetation } })
        }
      />
      {config.biome.oceanLevel.base === 0 && config.biome.oceanLevel.evolved === 0 && config.biome.vegetation.base > 0 && (
        <p className="ctrl-hint">Vegetation thrives near water — try raising the ocean level.</p>
      )}
      <DualSlider
        label="Frost"
        value={config.biome.frost}
        min={0}
        max={1}
        onChange={(frost) =>
          updateConfig({ biome: { ...config.biome, frost } })
        }
      />
    </ControlSection>
  )
}
