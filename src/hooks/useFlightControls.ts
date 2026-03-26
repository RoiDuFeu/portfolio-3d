import { useRef, useEffect } from 'react'
import type { FlightInput } from '../systems/flightPhysics'
import { useStore } from '../store/useStore'

const ZERO_INPUT: FlightInput = {
  thrust: 0,
  roll: 0,
  yaw: 0,
  boost: false,
  brake: false,
  mouseX: 0,
  mouseY: 0,
  triggerBarrelRoll: 0,
  triggerLoop: false,
}

// Double-tap window in ms
const DOUBLE_TAP_MS = 300

/**
 * Captures keyboard + mouse input for flight mode.
 * W/S = thrust, A/D = turn left/right, Mouse = pitch + yaw.
 * Double-tap Q/D = 360° barrel roll, double-tap Space = loop.
 * All state is ref-based — zero re-renders.
 *
 * Mouse uses absolute position relative to screen center:
 * center = (0,0), edges = (-1..1).
 *
 * On touch devices, mouse listeners are skipped — the MobileFlightControls
 * component writes directly into the returned input ref.
 */
export function useFlightControls(enabled: boolean, isMobile = false) {
  const input = useRef<FlightInput>({ ...ZERO_INPUT })
  const keys = useRef<Set<string>>(new Set())

  // Double-tap tracking: last press timestamp per key
  const lastTap = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) {
      Object.assign(input.current, ZERO_INPUT)
      keys.current.clear()
      lastTap.current = {}
      return
    }

    // Grace period: ignore mouse for a short time on flight start
    let mouseActive = false
    const GRACE_MS = 500
    const mouseGrace = setTimeout(() => { mouseActive = true }, GRACE_MS)

    const onKeyDown = (e: KeyboardEvent) => {
      if (useStore.getState().isPaused) return

      // Prevent Space from scrolling the page during flight
      if (e.code === 'Space') e.preventDefault()

      // Double-tap detection (only on fresh press, not repeat)
      if (!e.repeat) {
        const now = performance.now()
        const prev = lastTap.current[e.code] || 0

        if (now - prev < DOUBLE_TAP_MS) {
          // Double-tap detected
          if (e.code === 'KeyA') {
            input.current.triggerBarrelRoll = 1   // left barrel roll
            lastTap.current[e.code] = 0           // reset to avoid triple-tap
          } else if (e.code === 'KeyD') {
            input.current.triggerBarrelRoll = -1  // right barrel roll
            lastTap.current[e.code] = 0
          } else if (e.code === 'Space') {
            input.current.triggerLoop = true       // loop
            lastTap.current[e.code] = 0
          }
        } else {
          lastTap.current[e.code] = now
        }
      }

      keys.current.add(e.code)
      updateFromKeys()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code)
      updateFromKeys()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return // mobile uses virtual joystick
      if (!mouseActive) return
      if (useStore.getState().isPaused) return

      // Absolute position relative to screen center, normalized to -1..1
      const halfW = window.innerWidth / 2
      const halfH = window.innerHeight / 2
      const mx = (e.clientX - halfW) / halfW
      const my = -(e.clientY - halfH) / halfH  // invert Y: up = positive

      input.current.mouseX = Math.max(-1, Math.min(1, mx))
      input.current.mouseY = Math.max(-1, Math.min(1, my))
    }

    const onBlur = () => {
      keys.current.clear()
      updateFromKeys()
      // Only reset mouse on desktop — mobile joystick manages its own state
      if (!isMobile) {
        input.current.mouseX = 0
        input.current.mouseY = 0
      }
    }

    function updateFromKeys() {
      const k = keys.current

      // Thrust: W = forward, S = reverse
      const fwd = k.has('KeyW') ? 1 : 0
      const back = k.has('KeyS') ? 1 : 0
      input.current.thrust = fwd - back

      // Roll: Q/A = roll left (+1), D = roll right (-1)
      const left = k.has('KeyA') ? 1 : 0
      const right = k.has('KeyD') ? 1 : 0
      input.current.roll = left - right
      input.current.yaw = 0

      input.current.boost = k.has('ShiftLeft') || k.has('ShiftRight')
      input.current.brake = k.has('Space')
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('blur', onBlur)

    return () => {
      clearTimeout(mouseGrace)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('blur', onBlur)
      Object.assign(input.current, ZERO_INPUT)
      keys.current.clear()
      lastTap.current = {}
    }
  }, [enabled, isMobile])

  return input
}
