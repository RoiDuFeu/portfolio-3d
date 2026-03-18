interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 0.01, onChange }: SliderProps) {
  return (
    <div className="ctrl-slider">
      <div className="ctrl-slider__header">
        <span className="ctrl-slider__label">{label}</span>
        <span className="ctrl-slider__value">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        className="ctrl-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
