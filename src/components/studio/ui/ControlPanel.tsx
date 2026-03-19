import { useStudioStore } from '../../../store/useStudioStore'
import { PHOTOREALISTIC_PRESETS } from '../../../utils/planetPresets'
import { ModeControls } from './ModeControls'
import { SurfaceControls } from './SurfaceControls'
import { BiomeControls } from './BiomeControls'
import { ColorControls } from './ColorControls'
import { AtmosphereControls } from './AtmosphereControls'
import { RingControls } from './RingControls'
import { MoonControls } from './MoonControls'
import { CloudControls } from './CloudControls'
import { RealisticControls } from './RealisticControls'
import { Slider } from './Slider'

function PhotorealisticPanel() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)
  const preset = config.photoRealisticPreset
    ? PHOTOREALISTIC_PRESETS[config.photoRealisticPreset]
    : null

  return (
    <div className="ctrl-photo-panel">
      {preset && (
        <div className="ctrl-photo-info">
          <div className="ctrl-photo-info__name">{preset.name}</div>
          <div className="ctrl-photo-info__desc">{preset.description}</div>
        </div>
      )}
      <div className="ctrl-photo-controls">
        <Slider
          label="Size"
          value={config.size}
          min={0.2}
          max={3}
          step={0.01}
          onChange={(v) => updateConfig({ size: v })}
        />
      </div>
    </div>
  )
}

export function ControlPanel() {
  const mode = useStudioStore((s) => s.config.mode)
  const renderMode = useStudioStore((s) => s.config.renderMode)

  if (renderMode === 'photorealistic') {
    return (
      <aside className="studio__controls">
        <PhotorealisticPanel />
      </aside>
    )
  }

  return (
    <aside className="studio__controls">
      <ModeControls />
      {mode === 'rocky' ? (
        <>
          <AtmosphereControls />
          <CloudControls />
          <SurfaceControls />
          <BiomeControls />
          <RealisticControls />
          <ColorControls />
        </>
      ) : (
        <>
          <SurfaceControls />
          <ColorControls />
          <AtmosphereControls />
        </>
      )}
      <RingControls />
      <MoonControls />
    </aside>
  )
}
