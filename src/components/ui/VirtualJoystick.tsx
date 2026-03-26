import { useRef, useCallback, useEffect } from 'react'

export interface JoystickOutput {
  x: number // -1..1  (left/right)
  y: number // -1..1  (down/up, already inverted for flight)
}

interface Props {
  /** Called every touch-move frame with normalized values */
  onChange: (out: JoystickOutput) => void
  /** Side of the screen */
  side: 'left' | 'right'
  /** Label shown below the stick */
  label?: string
  /** Radius of the active zone in px (default 60) */
  radius?: number
}

/**
 * Single virtual joystick rendered as a retro-styled touch zone.
 * Works via touchstart/move/end on the outer container —
 * no pointer-lock, no extra DOM overhead per frame.
 */
export function VirtualJoystick({ onChange, side, label, radius = 60 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeTouch = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - origin.current.x
    const dy = cy - origin.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const clamped = Math.min(dist, radius)
    const angle = Math.atan2(dy, dx)

    const nx = (clamped * Math.cos(angle)) / radius
    const ny = (clamped * Math.sin(angle)) / radius

    // Move knob visually
    if (knobRef.current) {
      knobRef.current.style.transform =
        `translate(${nx * radius}px, ${ny * radius}px)`
    }

    // y inverted: pushing up = positive thrust / pitch-up
    onChange({ x: clamp(nx, -1, 1), y: clamp(-ny, -1, 1) })
  }, [onChange, radius])

  const handleEnd = useCallback(() => {
    activeTouch.current = null
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)'
    }
    onChange({ x: 0, y: 0 })
  }, [onChange])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return
    const t = e.changedTouches[0]
    activeTouch.current = t.identifier
    const rect = containerRef.current!.getBoundingClientRect()
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    handleMove(t.clientX, t.clientY)
  }, [handleMove])

  // Use window-level listeners so dragging outside the zone still works
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (activeTouch.current === null) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === activeTouch.current) {
          e.preventDefault() // prevent scroll
          handleMove(t.clientX, t.clientY)
          return
        }
      }
    }

    const onEnd = (e: TouchEvent) => {
      if (activeTouch.current === null) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouch.current) {
          handleEnd()
          return
        }
      }
    }

    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [handleMove, handleEnd])

  return (
    <div
      ref={containerRef}
      className={`vjoystick vjoystick-${side}`}
      onTouchStart={onTouchStart}
    >
      {/* Outer ring */}
      <div className="vjoystick-ring" style={{ width: radius * 2, height: radius * 2 }}>
        {/* Knob */}
        <div ref={knobRef} className="vjoystick-knob" />
      </div>
      {label && <div className="vjoystick-label">{label}</div>}
    </div>
  )
}
