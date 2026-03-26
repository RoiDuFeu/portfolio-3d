import { useRef, useCallback } from 'react'
import { VirtualJoystick } from './VirtualJoystick'
import type { JoystickOutput } from './VirtualJoystick'
import { useStore } from '../../store/useStore'

/**
 * Mobile flight HUD: two virtual joysticks + action buttons.
 *
 * Left stick  → thrust (Y) + roll/turn (X)
 * Right stick → pitch (Y) + yaw (X)  — replaces mouse
 * Buttons     → BOOST, BRAKE
 *
 * Reads the shared flightInputRef from the store (set by UnifiedFalcon).
 */
export function MobileFlightControls() {
  const isFlying = useStore((s) => s.isFlying)
  const boostRef = useRef(false)
  const brakeRef = useRef(false)

  // Left stick: thrust + turn
  const onLeftChange = useCallback((out: JoystickOutput) => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    ref.current.thrust = out.y       // up = forward
    ref.current.roll = -out.x        // left stick X = turn (inverted to match A/D)
    ref.current.yaw = 0
  }, [])

  // Right stick: replaces mouse for pitch + yaw
  const onRightChange = useCallback((out: JoystickOutput) => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    ref.current.mouseX = out.x
    ref.current.mouseY = out.y
  }, [])

  const onBoostStart = useCallback(() => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    boostRef.current = true
    ref.current.boost = true
  }, [])

  const onBoostEnd = useCallback(() => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    boostRef.current = false
    ref.current.boost = false
  }, [])

  const onBrakeStart = useCallback(() => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    brakeRef.current = true
    ref.current.brake = true
  }, [])

  const onBrakeEnd = useCallback(() => {
    const ref = useStore.getState().flightInputRef
    if (!ref) return
    brakeRef.current = false
    ref.current.brake = false
  }, [])

  if (!isFlying) return null

  return (
    <div className="mobile-flight-controls">
      {/* Left joystick — thrust & turn */}
      <VirtualJoystick
        side="left"
        label="THRUST"
        onChange={onLeftChange}
        radius={55}
      />

      {/* Center action buttons */}
      <div className="mobile-action-buttons">
        <button
          className="mobile-action-btn mobile-btn-boost"
          onTouchStart={onBoostStart}
          onTouchEnd={onBoostEnd}
          onTouchCancel={onBoostEnd}
        >
          BOOST
        </button>
        <button
          className="mobile-action-btn mobile-btn-brake"
          onTouchStart={onBrakeStart}
          onTouchEnd={onBrakeEnd}
          onTouchCancel={onBrakeEnd}
        >
          BRAKE
        </button>
      </div>

      {/* Right joystick — pitch & yaw (replaces mouse) */}
      <VirtualJoystick
        side="right"
        label="AIM"
        onChange={onRightChange}
        radius={55}
      />
    </div>
  )
}
