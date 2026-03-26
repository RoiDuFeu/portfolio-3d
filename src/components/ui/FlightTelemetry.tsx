import { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Debug overlay showing ship inclination, rotation rates, and position.
 * Toggle with [I] key. Lock values with [L] key to freeze the display for debugging.
 * Only visible during flight.
 */
export function FlightTelemetry() {
  const isFlying = useStore((s) => s.isFlying)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lockedRef = useRef(false)
  const lockedValuesRef = useRef<LockedSnapshot | null>(null)

  // Toggle visibility with I, lock/unlock with L
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyI') setVisible((v) => !v)
      if (e.code === 'KeyL') {
        lockedRef.current = !lockedRef.current
        if (lockedRef.current) {
          // Snapshot current values
          const t = useStore.getState().flightTelemetry
          lockedValuesRef.current = {
            pitch: t.pitch,
            yaw: t.yaw,
            roll: t.roll,
            bankAngle: t.bankAngle,
            speed: t.speed,
            euler: { ...t.euler },
            position: { ...t.position },
            orientationQ: { ...t.orientationQ },
            visualQ: { ...t.visualQ },
          }
        } else {
          lockedValuesRef.current = null
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Update at 20fps via requestAnimationFrame (no React re-renders)
  useEffect(() => {
    if (!visible || !isFlying) return
    let raf = 0
    let lastUpdate = 0

    const update = () => {
      raf = requestAnimationFrame(update)
      const now = performance.now()
      if (now - lastUpdate < 50) return // 20fps cap
      lastUpdate = now

      const el = containerRef.current
      if (!el) return

      const locked = lockedRef.current
      const t = locked && lockedValuesRef.current
        ? lockedValuesRef.current
        : useStore.getState().flightTelemetry

      const lockLabel = locked ? 'LOCKED [L]' : 'LIVE [L]'
      const lockColor = locked ? '#ff4444' : '#44ff44'

      el.innerHTML = `
<div class="ft-title">FLIGHT TELEMETRY [I]</div>
<div class="ft-lock" style="color:${lockColor};text-align:center;font-size:10px;margin-bottom:4px">${lockLabel}</div>
<div class="ft-section">POSITION (world)</div>
<div class="ft-row"><span>X</span><span class="ft-val">${t.position.x.toFixed(2)}</span><span class="ft-bar">${bar(t.position.x, 500)}</span></div>
<div class="ft-row"><span>Y</span><span class="ft-val">${t.position.y.toFixed(2)}</span><span class="ft-bar">${bar(t.position.y, 500)}</span></div>
<div class="ft-row"><span>Z</span><span class="ft-val">${t.position.z.toFixed(2)}</span><span class="ft-bar">${bar(t.position.z, 2000)}</span></div>
<div class="ft-section">ORIENTATION (deg)</div>
<div class="ft-row"><span>Pitch</span><span class="ft-val">${t.euler.x.toFixed(1)}\u00B0</span><span class="ft-bar">${bar(t.euler.x, 90)}</span></div>
<div class="ft-row"><span>Yaw</span><span class="ft-val">${t.euler.y.toFixed(1)}\u00B0</span><span class="ft-bar">${bar(t.euler.y, 180)}</span></div>
<div class="ft-row"><span>Roll</span><span class="ft-val">${t.euler.z.toFixed(1)}\u00B0</span><span class="ft-bar">${bar(t.euler.z, 180)}</span></div>
<div class="ft-section">ANGULAR VELOCITY (rad/s)</div>
<div class="ft-row"><span>Pitch \u03C9</span><span class="ft-val">${t.pitch.toFixed(2)}</span><span class="ft-bar">${bar(t.pitch, 2)}</span></div>
<div class="ft-row"><span>Yaw \u03C9</span><span class="ft-val">${t.yaw.toFixed(2)}</span><span class="ft-bar">${bar(t.yaw, 2)}</span></div>
<div class="ft-row"><span>Roll \u03C9</span><span class="ft-val">${t.roll.toFixed(2)}</span><span class="ft-bar">${bar(t.roll, 4)}</span></div>
<div class="ft-section">PHYSICS QUAT (orientation)</div>
<div class="ft-row"><span>X</span><span class="ft-val">${t.orientationQ.x.toFixed(4)}</span><span class="ft-bar">${bar(t.orientationQ.x, 1)}</span></div>
<div class="ft-row"><span>Y</span><span class="ft-val">${t.orientationQ.y.toFixed(4)}</span><span class="ft-bar">${bar(t.orientationQ.y, 1)}</span></div>
<div class="ft-row"><span>Z</span><span class="ft-val">${t.orientationQ.z.toFixed(4)}</span><span class="ft-bar">${bar(t.orientationQ.z, 1)}</span></div>
<div class="ft-row"><span>W</span><span class="ft-val">${t.orientationQ.w.toFixed(4)}</span><span class="ft-bar">${bar(t.orientationQ.w, 1)}</span></div>
<div class="ft-section">VISUAL QUAT (final render)</div>
<div class="ft-row"><span>X</span><span class="ft-val">${t.visualQ.x.toFixed(4)}</span><span class="ft-bar">${bar(t.visualQ.x, 1)}</span></div>
<div class="ft-row"><span>Y</span><span class="ft-val">${t.visualQ.y.toFixed(4)}</span><span class="ft-bar">${bar(t.visualQ.y, 1)}</span></div>
<div class="ft-row"><span>Z</span><span class="ft-val">${t.visualQ.z.toFixed(4)}</span><span class="ft-bar">${bar(t.visualQ.z, 1)}</span></div>
<div class="ft-row"><span>W</span><span class="ft-val">${t.visualQ.w.toFixed(4)}</span><span class="ft-bar">${bar(t.visualQ.w, 1)}</span></div>
<div class="ft-section">STATE</div>
<div class="ft-row"><span>Bank</span><span class="ft-val">${(t.bankAngle * 180 / Math.PI).toFixed(1)}\u00B0</span><span class="ft-bar">${bar(t.bankAngle, 1.5)}</span></div>
<div class="ft-row"><span>Speed</span><span class="ft-val">${t.speed.toFixed(1)}</span><span class="ft-bar">${bar(t.speed, 50)}</span></div>`
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [visible, isFlying])

  if (!visible || !isFlying) return null

  return <div ref={containerRef} className="ft-container" />
}

interface LockedSnapshot {
  pitch: number
  yaw: number
  roll: number
  bankAngle: number
  speed: number
  euler: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  orientationQ: { x: number; y: number; z: number; w: number }
  visualQ: { x: number; y: number; z: number; w: number }
}

/** Tiny ASCII bar: +/- direction, 10 chars wide */
function bar(value: number, max: number): string {
  const norm = Math.min(Math.abs(value) / max, 1)
  const filled = Math.round(norm * 10)
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`
}
