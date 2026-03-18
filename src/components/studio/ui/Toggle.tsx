interface ToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <label className="ctrl-toggle">
      <span className="ctrl-toggle__label">{label}</span>
      <div className={`ctrl-toggle__track ${value ? 'ctrl-toggle__track--on' : ''}`}>
        <div className="ctrl-toggle__thumb" />
      </div>
      <input
        type="checkbox"
        className="ctrl-toggle__input"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}
