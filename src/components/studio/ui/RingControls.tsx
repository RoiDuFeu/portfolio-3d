import { useStudioStore } from '../../../store/useStudioStore'
import { ControlSection } from './ControlSection'
import { Toggle } from './Toggle'
import { Slider } from './Slider'
import { ColorPicker } from './ColorPicker'

export function RingControls() {
  const rings = useStudioStore((s) => s.config.rings)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  const update = (partial: Partial<typeof rings>) =>
    updateConfig({ rings: { ...rings, ...partial } })

  return (
    <ControlSection title="Rings" defaultOpen={false}>
      <Toggle
        label="Enabled"
        value={rings.enabled}
        onChange={(enabled) => update({ enabled })}
      />
      {rings.enabled && (
        <>
          <Slider
            label="Inner Radius"
            value={rings.innerRadius}
            min={1.2}
            max={2.5}
            step={0.05}
            onChange={(innerRadius) => update({ innerRadius })}
          />
          <Slider
            label="Outer Radius"
            value={rings.outerRadius}
            min={2}
            max={4.5}
            step={0.05}
            onChange={(outerRadius) => update({ outerRadius })}
          />
          <Slider
            label="Tilt"
            value={rings.tilt}
            min={0}
            max={1.2}
            step={0.01}
            onChange={(tilt) => update({ tilt })}
          />
          <Slider
            label="Opacity"
            value={rings.opacity}
            min={0}
            max={1}
            onChange={(opacity) => update({ opacity })}
          />
          <Slider
            label="Band Count"
            value={rings.bandCount}
            min={3}
            max={20}
            step={1}
            onChange={(bandCount) => update({ bandCount })}
          />
          <ColorPicker
            label="Inner Color"
            value={rings.colorInner}
            onChange={(colorInner) => update({ colorInner })}
          />
          <ColorPicker
            label="Outer Color"
            value={rings.colorOuter}
            onChange={(colorOuter) => update({ colorOuter })}
          />
        </>
      )}
    </ControlSection>
  )
}
