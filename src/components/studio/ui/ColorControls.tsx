import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { ColorPicker } from './ColorPicker'

export function ColorControls() {
  const config = useStudioStore((s) => s.config)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  if (config.mode === 'rocky') {
    return (
      <ControlSection title="Colors" defaultOpen={false}>
        <ColorPicker
          label="Land Primary"
          value={config.colors.primary}
          onChange={(primary) => updateConfig({ colors: { ...config.colors, primary } })}
        />
        <ColorPicker
          label="Land Secondary"
          value={config.colors.secondary}
          onChange={(secondary) => updateConfig({ colors: { ...config.colors, secondary } })}
        />
        <ColorPicker
          label="Ocean"
          value={config.colors.ocean}
          onChange={(ocean) => updateConfig({ colors: { ...config.colors, ocean } })}
        />
        <ColorPicker
          label="Vegetation"
          value={config.colors.vegetation}
          onChange={(vegetation) => updateConfig({ colors: { ...config.colors, vegetation } })}
        />
        <ColorPicker
          label="Snow"
          value={config.colors.snow}
          onChange={(snow) => updateConfig({ colors: { ...config.colors, snow } })}
        />
        <ColorPicker
          label="Frost"
          value={config.colors.frost}
          onChange={(frost) => updateConfig({ colors: { ...config.colors, frost } })}
        />
      </ControlSection>
    )
  }

  return (
    <ControlSection title="Colors" defaultOpen={false}>
      <p className="ctrl-hint">Gradient flows from core (hottest) to edge (coolest).</p>
      <ColorPicker
        label="Core"
        value={config.fire.colorCore}
        onChange={(colorCore) => updateConfig({ fire: { ...config.fire, colorCore } })}
      />
      <ColorPicker
        label="Mid"
        value={config.fire.colorMid}
        onChange={(colorMid) => updateConfig({ fire: { ...config.fire, colorMid } })}
      />
      <ColorPicker
        label="Edge"
        value={config.fire.colorEdge}
        onChange={(colorEdge) => {
          const updates: Partial<typeof config> = {
            fire: { ...config.fire, colorEdge },
          }
          if (config.atmosphere.enabled) {
            updates.atmosphere = { ...config.atmosphere, color: colorEdge }
          }
          updateConfig(updates as any)
        }}
      />
    </ControlSection>
  )
}
