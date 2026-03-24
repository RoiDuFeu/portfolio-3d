import { useRef, useEffect } from 'react'
import type { FlightInput } from '../systems/flightPhysics'

const ZERO_INPUT: FlightInput = {
  thrust: 0,
  roll: 0,
  boost: false,
  brake: false,
  mouseX: 0,
  mouseY: 0,
}

/**
 * Captures keyboard + mouse input for flight mode.
 * All state is ref-based — zero re-renders.
 */
export function useFlightControls(enabled: boolean) {
  const input = useRef<FlightInput>({ ...ZERO_INPUT })
  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) {
      // Zero out when disabled
      Object.assign(input.current, ZERO_INPUT)
      keys.current.clear()
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code)

      // Prevent Space from scrolling the page during flight
      if (e.code === 'Space') e.preventDefault()

      updateFromKeys()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code)
      updateFromKeys()
    }

    const onMouseMove = (e: MouseEvent) => {
      input.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1
      input.current.mouseY = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    const onBlur = () => {
      // Release all keys when window loses focus
      keys.current.clear()
      updateFromKeys()
    }

    function updateFromKeys() {
      const k = keys.current
      // Thrust: W=+1, S=-1, both or neither = 0
      const w = k.has('KeyW') ? 1 : 0
      const s = k.has('KeyS') ? 1 : 0
      input.current.thrust = w - s

      // Roll: A=+1 (left), D=-1 (right)
      const a = k.has('KeyA') ? 1 : 0
      const d = k.has('KeyD') ? 1 : 0
      input.current.roll = a - d

      input.current.boost = k.has('ShiftLeft') || k.has('ShiftRight')
      input.current.brake = k.has('Space')
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('blur', onBlur)
      Object.assign(input.current, ZERO_INPUT)
      keys.current.clear()
    }
  }, [enabled])

  return input
}
