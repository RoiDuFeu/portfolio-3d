import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import GradientColorPicker from 'react-best-gradient-color-picker'
import { Label } from '@/components/ui/label'

const PICKER_STYLES = {
  body: {
    background: 'transparent',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  rbgcpCanvasWrapper: {
    borderRadius: '6px',
    overflow: 'hidden',
  },
  rbgcpHandle: {
    border: '2px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.6)',
  },
  rbgcpControlBtnWrapper: {
    background: 'rgba(100, 150, 255, 0.06)',
    borderRadius: '6px',
    padding: '2px',
  },
  rbgcpControlBtn: {
    background: 'transparent',
    color: 'rgba(160, 190, 255, 0.55)',
    borderRadius: '4px',
    fontSize: '11px',
  },
  rbgcpControlBtnSelected: {
    background: 'rgba(100, 150, 255, 0.2)',
    color: 'rgba(160, 190, 255, 1)',
    borderRadius: '4px',
  },
  rbgcpInput: {
    background: 'rgba(100, 150, 255, 0.08)',
    border: '1px solid rgba(100, 150, 255, 0.18)',
    borderRadius: '4px',
    color: 'rgba(200, 215, 240, 0.9)',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  rbgcpHexInput: {
    background: 'rgba(100, 150, 255, 0.08)',
    border: '1px solid rgba(100, 150, 255, 0.18)',
    borderRadius: '4px',
    color: 'rgba(200, 215, 240, 0.9)',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  rbgcpInputLabel: {
    color: 'rgba(100, 150, 255, 0.5)',
    fontSize: '9px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  rbgcpInputsWrap: {
    gap: '4px',
  },
  rbgcpEyedropperBtn: {
    background: 'rgba(100, 150, 255, 0.08)',
    border: '1px solid rgba(100, 150, 255, 0.18)',
    borderRadius: '4px',
    color: 'rgba(160, 190, 255, 0.7)',
  },
}

interface ColorPickerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const swatchRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const openPicker = useCallback(() => {
    if (!swatchRef.current) return
    const rect = swatchRef.current.getBoundingClientRect()
    const pickerWidth = 236
    const pickerHeight = 330
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = rect.right + 8
    if (left + pickerWidth > vw - 8) left = rect.left - pickerWidth - 8

    let top = rect.top
    if (top + pickerHeight > vh - 8) top = vh - pickerHeight - 8

    setPos({ top, left })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <Label style={{ fontSize: 11, color: 'rgba(160, 190, 255, 0.6)', fontWeight: 400 }}>{label}</Label>

      <button
        ref={swatchRef}
        type="button"
        className="ctrl-color__swatch"
        style={{ background: value }}
        onClick={open ? () => setOpen(false) : openPicker}
        aria-label={`Pick color for ${label}`}
      />

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="color-picker-popover"
            style={{ top: pos.top, left: pos.left }}
          >
            <GradientColorPicker
              value={value}
              onChange={onChange}
              hideGradientControls
              hideAdvancedSliders
              hidePresets
              hideColorGuide
              hideInputType
              disableLightMode
              width={220}
              height={160}
              style={PICKER_STYLES}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
