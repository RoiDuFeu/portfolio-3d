import * as THREE from 'three'

// ── Tuning constants ─────────────────────────────────────────────────────────
export const FLIGHT = {
  // Thrust (units/s²)
  FORWARD_THRUST: 30,
  REVERSE_THRUST: 15,
  BOOST_MULTIPLIER: 3.0,

  // Speed limits (units/s)
  MAX_SPEED: 18,
  MAX_BOOST_SPEED: 50,

  // Drag (per-second decay factor)
  LINEAR_DRAG: 0.5,
  BRAKE_DRAG: 4.0,

  // Rotation rates (rad/s)
  PITCH_RATE: 3.0,               // mouse up/down
  YAW_RATE: 2.0,                 // A/D + mouse left/right

  // Mouse contribution to yaw (added on top of A/D)
  MOUSE_YAW_RATE: 1.2,           // how much mouse X contributes to yaw

  // Angular smoothing — higher = snappier response, lower = floatier
  ANGULAR_DRAG: 5.0,

  // Mouse
  MOUSE_DEADZONE: 0.05,

  // Cosmetic auto-bank: ship tilts visually when yawing (no physics effect)
  AUTO_BANK_AMOUNT: 0.45,        // max bank angle in radians (~25°) during turns
  AUTO_BANK_SPEED: 4.0,          // how fast it banks into the turn
  AUTO_BANK_RETURN: 3.0,         // how fast it levels out

  // Velocity alignment: how fast lateral drift corrects toward facing direction.
  // Higher = ship goes exactly where it points. Lower = drift/slide on turns.
  VELOCITY_ALIGNMENT: 4.0,       // tight — ship goes where you point it


  // Manual roll (Q/D): visual barrel roll + bank-coupled turning
  MANUAL_ROLL_MAX: Math.PI / 2,  // 90° — half barrel roll
  MANUAL_ROLL_SPEED: 1.5,        // how fast it rolls into position
  MANUAL_ROLL_RETURN: 3.5,       // how fast it returns to level

  // Maneuvers (double-tap triggered)
  BARREL_ROLL_SPEED: 9.0,       // rad/s — full 360° in ~0.7s
  BARREL_ROLL_STRAFE: 12.0,     // lateral strafe speed during barrel roll (units/s)
  LOOP_SPEED: 5.5,              // rad/s — full 360° in ~1.15s
} as const

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface FlightInput {
  thrust: number   // -1..1  (W=+1, S=-1)
  roll: number     // -1..1  (Q=+1 roll left, D=-1 roll right) — visual only
  yaw: number      // legacy — unused, kept for compat
  boost: boolean
  brake: boolean
  mouseX: number   // -1..1  NDC — mouse yaw contribution
  mouseY: number   // -1..1  NDC — mouse pitch
  triggerBarrelRoll: number  // 0 = none, +1 = left, -1 = right (consumed by physics)
  triggerLoop: boolean       // consumed by physics
}

export interface FlightState {
  position: THREE.Vector3
  orientation: THREE.Quaternion
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3   // local-space rates (pitch, yaw, 0)
  yawAngle: number                 // accumulated yaw in radians
  pitchAngle: number               // accumulated pitch in radians
  autoBank: number                 // cosmetic bank angle from yaw (visual only)
  manualRoll: number               // cosmetic roll from Q/D keys (visual only, ±PI/2 max)
  speed: number                    // cached |velocity|
  // Maneuver state
  barrelRollAngle: number          // current progress (0 = inactive, 0→2π = rolling)
  barrelRollDir: number            // +1 left, -1 right
  loopAngle: number                // current progress (0 = inactive, 0→2π = looping)
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createFlightState(
  pos: THREE.Vector3,
  quat: THREE.Quaternion,
): FlightState {
  return {
    position: pos.clone(),
    orientation: quat.clone().normalize(),
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    yawAngle: 0,
    pitchAngle: 0,
    autoBank: 0,
    manualRoll: 0,
    speed: 0,
    barrelRollAngle: 0,
    barrelRollDir: 0,
    loopAngle: 0,
  }
}

// ── Reusable scratch objects (zero-alloc per frame) ──────────────────────────

const _forward = new THREE.Vector3()
const _localFwd = new THREE.Vector3()
const _localRight = new THREE.Vector3()
const _lateral = new THREE.Vector3()
const _euler = new THREE.Euler()

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyDeadzone(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) return 0
  const sign = value > 0 ? 1 : -1
  const normalized = (Math.abs(value) - deadzone) / (1 - deadzone)
  // Cubic curve: gentle near center, strong at edges
  return sign * normalized * normalized * normalized
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

// ── Core physics tick ────────────────────────────────────────────────────────

export function stepFlightPhysics(
  state: FlightState,
  input: FlightInput,
  dt: number,
): void {
  const c = FLIGHT

  // Cap dt to avoid physics explosion on tab-switch / lag spikes
  const safeDt = Math.min(dt, 0.1)

  // ── Local axes from current orientation ──
  _localFwd.set(0, 0, -1).applyQuaternion(state.orientation)
  _localRight.set(1, 0, 0).applyQuaternion(state.orientation)

  // ── Linear motion ──────────────────────────────────────────────────────────

  if (input.thrust !== 0) {
    const thrustMag = input.thrust > 0
      ? c.FORWARD_THRUST * (input.boost ? c.BOOST_MULTIPLIER : 1)
      : c.REVERSE_THRUST

    _forward.copy(_localFwd).multiplyScalar(input.thrust * thrustMag * safeDt)
    state.velocity.add(_forward)
  }

  // Drag
  const drag = input.brake ? c.BRAKE_DRAG : c.LINEAR_DRAG
  const dragFactor = Math.max(0, 1 - drag * safeDt)
  state.velocity.multiplyScalar(dragFactor)

  // Speed clamp
  const maxSpd = input.boost ? c.MAX_BOOST_SPEED : c.MAX_SPEED
  state.speed = state.velocity.length()
  if (state.speed > maxSpd) {
    state.velocity.setLength(maxSpd)
    state.speed = maxSpd
  }

  // ── Velocity alignment: ship goes where it points ─────────────────────────
  // High alignment = arcade feel. Lateral drift bleeds off quickly.
  if (state.speed > 0.5) {
    const fwdSpeed = state.velocity.dot(_localFwd)
    const lateralDecay = Math.exp(-c.VELOCITY_ALIGNMENT * safeDt)

    _lateral.copy(state.velocity).addScaledVector(_localFwd, -fwdSpeed)
    _lateral.multiplyScalar(lateralDecay)

    state.velocity.copy(_localFwd).multiplyScalar(fwdSpeed).add(_lateral)
    state.speed = state.velocity.length()
  }

  // Integrate position
  state.position.addScaledVector(state.velocity, safeDt)

  // ── Rotational motion ──────────────────────────────────────────────────────

  // Pitch: mouse Y only
  const my = applyDeadzone(clamp(input.mouseY, -1, 1), c.MOUSE_DEADZONE)
  const targetPitch = my * c.PITCH_RATE

  // Yaw: mouse X + Q/D keyboard — flat turn only, no pitch change
  const mx = applyDeadzone(clamp(input.mouseX, -1, 1), c.MOUSE_DEADZONE)
  const targetYaw = -mx * c.MOUSE_YAW_RATE + input.roll * c.YAW_RATE

  // Smooth angular velocity toward targets (no roll — ever)
  const angLerp = 1 - Math.exp(-c.ANGULAR_DRAG * safeDt)
  state.angularVelocity.x += (targetPitch - state.angularVelocity.x) * angLerp
  state.angularVelocity.y += (targetYaw - state.angularVelocity.y) * angLerp
  state.angularVelocity.z = 0  // no roll in physics

  // ── Cosmetic auto-bank: visual tilt from MOUSE yaw only ────────────────────
  // Does NOT include roll-coupled yaw (Q/D already has its own manualRoll).
  // This prevents auto-bank from stacking with manual roll and flipping the ship.
  const bankTarget = clamp(mx, -1, 1) * c.AUTO_BANK_AMOUNT
  const bankSpeed = Math.abs(bankTarget) > Math.abs(state.autoBank)
    ? c.AUTO_BANK_SPEED   // banking into the turn
    : c.AUTO_BANK_RETURN  // leveling out
  const bankLerp = 1 - Math.exp(-bankSpeed * safeDt)
  state.autoBank += (bankTarget - state.autoBank) * bankLerp

  // ── Manual roll: Q/D visual-only half barrel roll ─────────────────────────
  const rollTarget = -input.roll * c.MANUAL_ROLL_MAX
  const rollSpeed = Math.abs(rollTarget) > Math.abs(state.manualRoll)
    ? c.MANUAL_ROLL_SPEED    // rolling into position
    : c.MANUAL_ROLL_RETURN   // returning to level
  const rollLerp = 1 - Math.exp(-rollSpeed * safeDt)
  state.manualRoll += (rollTarget - state.manualRoll) * rollLerp

  // ── Maneuvers: barrel roll & loop ────────────────────────────────────────
  const TWO_PI = Math.PI * 2

  // Trigger barrel roll (double-tap Q/D)
  if (input.triggerBarrelRoll !== 0 && state.barrelRollAngle === 0 && state.loopAngle === 0) {
    state.barrelRollAngle = 0.001  // start
    state.barrelRollDir = input.triggerBarrelRoll
    input.triggerBarrelRoll = 0    // consume
  }

  // Trigger loop (double-tap Space)
  if (input.triggerLoop && state.loopAngle === 0 && state.barrelRollAngle === 0) {
    state.loopAngle = 0.001  // start
    input.triggerLoop = false // consume
  }

  // Advance barrel roll + strafe sideways
  if (state.barrelRollAngle > 0) {
    state.barrelRollAngle += c.BARREL_ROLL_SPEED * safeDt
    // Strafe: add lateral velocity in the roll direction (persists after roll ends)
    state.velocity.addScaledVector(_localRight, -state.barrelRollDir * c.BARREL_ROLL_STRAFE * safeDt)
    if (state.barrelRollAngle >= TWO_PI) {
      state.barrelRollAngle = 0  // done
      state.barrelRollDir = 0
    }
  }

  // Advance loop
  if (state.loopAngle > 0) {
    state.loopAngle += c.LOOP_SPEED * safeDt
    if (state.loopAngle >= TWO_PI) {
      state.loopAngle = 0  // done
    }
  }

  // Accumulate yaw and pitch as plain angles — no quaternion drift
  state.yawAngle += state.angularVelocity.y * safeDt
  state.pitchAngle += state.angularVelocity.x * safeDt

  // Rebuild orientation from angles + loop offset
  const loopPitch = state.pitchAngle + state.loopAngle
  _euler.set(loopPitch, state.yawAngle, 0, 'YXZ')
  state.orientation.setFromEuler(_euler)

}
