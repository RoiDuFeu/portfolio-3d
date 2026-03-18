import type { AnimatableValue } from '../../../types/studio'

interface DualSliderProps {
  label: string
  value: AnimatableValue
  min: number
  max: number
  step?: number
  onChange: (value: AnimatableValue) => void
}

export function DualSlider({ label, value, min, max, step = 0.01, onChange }: DualSliderProps) {
  return (
    <div className="ctrl-dual-slider">
      <span className="ctrl-dual-slider__label">{label}</span>
      <div className="ctrl-dual-slider__row">
        <div className="ctrl-dual-slider__col">
          <span className="ctrl-dual-slider__sub">Start</span>
          <input
            type="range"
            className="ctrl-slider__input"
            min={min}
            max={max}
            step={step}
            value={value.base}
            onChange={(e) => onChange({ ...value, base: parseFloat(e.target.value) })}
          />
          <span className="ctrl-slider__value">{value.base.toFixed(2)}</span>
        </div>
        <div className="ctrl-dual-slider__col">
          <span className="ctrl-dual-slider__sub">End</span>
          <input
            type="range"
            className="ctrl-slider__input"
            min={min}
            max={max}
            step={step}
            value={value.evolved}
            onChange={(e) => onChange({ ...value, evolved: parseFloat(e.target.value) })}
          />
          <span className="ctrl-slider__value">{value.evolved.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
