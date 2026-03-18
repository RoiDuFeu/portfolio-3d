import { useStudioStore } from '../../../store/useStudioStore'
import type { MoonConfig } from '../../../types/studio'
import { ControlSection } from './ControlSection'
import { Slider } from './Slider'
import { ColorPicker } from './ColorPicker'

export function MoonControls() {
  const moons = useStudioStore((s) => s.config.moons)
  const updateConfig = useStudioStore((s) => s.updateConfig)

  const addMoon = () => {
    if (moons.length >= 3) return
    const newMoon: MoonConfig = {
      id: `moon-${Date.now()}`,
      size: 0.3,
      color: '#b0b0b0',
      colorSecondary: '#787878',
      roughness: 0.85,
      craterStrength: 0.6,
      orbitRadius: 4 + moons.length * 1.5,
      orbitSpeed: 0.3,
      orbitTilt: 0.1,
    }
    updateConfig({ moons: [...moons, newMoon] })
  }

  const removeMoon = (id: string) => {
    updateConfig({ moons: moons.filter((m) => m.id !== id) })
  }

  const updateMoon = (id: string, partial: Partial<MoonConfig>) => {
    updateConfig({
      moons: moons.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    })
  }

  return (
    <ControlSection title="Moons" defaultOpen={false}>
      {moons.map((moon, i) => (
        <div key={moon.id} className="ctrl-moon">
          <div className="ctrl-moon__header">
            <span>Moon {i + 1}</span>
            <button
              type="button"
              className="ctrl-moon__remove"
              onClick={() => removeMoon(moon.id)}
            >
              ×
            </button>
          </div>
          <Slider
            label="Size"
            value={moon.size}
            min={0.1}
            max={0.8}
            step={0.05}
            onChange={(size) => updateMoon(moon.id, { size })}
          />
          <ColorPicker
            label="Highland"
            value={moon.color}
            onChange={(color) => updateMoon(moon.id, { color })}
          />
          <ColorPicker
            label="Lowland"
            value={moon.colorSecondary}
            onChange={(colorSecondary) => updateMoon(moon.id, { colorSecondary })}
          />
          <Slider
            label="Roughness"
            value={moon.roughness}
            min={0.2}
            max={1}
            step={0.05}
            onChange={(roughness) => updateMoon(moon.id, { roughness })}
          />
          <Slider
            label="Craters"
            value={moon.craterStrength}
            min={0}
            max={1.5}
            step={0.05}
            onChange={(craterStrength) => updateMoon(moon.id, { craterStrength })}
          />
          <Slider
            label="Orbit Radius"
            value={moon.orbitRadius}
            min={2}
            max={10}
            step={0.1}
            onChange={(orbitRadius) => updateMoon(moon.id, { orbitRadius })}
          />
          <Slider
            label="Orbit Speed"
            value={moon.orbitSpeed}
            min={0.05}
            max={2}
            step={0.05}
            onChange={(orbitSpeed) => updateMoon(moon.id, { orbitSpeed })}
          />
          <Slider
            label="Orbit Tilt"
            value={moon.orbitTilt}
            min={0}
            max={0.8}
            step={0.01}
            onChange={(orbitTilt) => updateMoon(moon.id, { orbitTilt })}
          />
        </div>
      ))}
      {moons.length < 3 && (
        <button type="button" className="ctrl-moon__add" onClick={addMoon}>
          + Add Moon
        </button>
      )}
    </ControlSection>
  )
}
