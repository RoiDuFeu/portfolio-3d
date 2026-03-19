import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface UniformSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export function UniformSlider({ label, value, min, max, step, onChange }: UniformSliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label style={{ fontSize: 11, color: 'rgba(160, 190, 255, 0.6)', fontWeight: 400 }}>{label}</Label>
        <span style={{ fontSize: 10, color: 'rgba(160, 190, 255, 0.38)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(typeof v === 'number' ? v : (v as number[])[0])}
        className="w-full"
      />
    </div>
  )
}
