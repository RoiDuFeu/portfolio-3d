interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="ctrl-color">
      <span className="ctrl-color__label">{label}</span>
      <div className="ctrl-color__row">
        <input
          type="color"
          className="ctrl-color__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="ctrl-color__hex">{value}</span>
      </div>
    </div>
  )
}
