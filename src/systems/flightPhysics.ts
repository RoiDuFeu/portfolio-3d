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
  LINEAR_DRAG: 0.6,
  BRAKE_DRAG: 4.0,

  // Rotation rates (rad/s)
  PITCH_RATE: 1.8,
  YAW_RATE: 1.8,
  ROLL_RATE: 2.5,

  // Auto-banking
  AUTO_BANK_FACTOR: 0.7,
  AUTO_BANK_RETURN: 2.0,

  // Angular smoothing
  ANGULAR_DRAG: 3.0,

  // Mouse
  MOUSE_DEADZONE: 0.05,
} as const

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface FlightInput {
  thrust: number   // -1..1  (W=+1, S=-1)
  roll: number     // -1..1  (A=+1 left, D=-1 right)
  boost: boolean
  brake: boolean
  mouseX: number   // -1..1  NDC
  mouseY: number   // -1..1  NDC
}

export interface FlightState {
  position: THREE.Vector3
  orientation: THREE.Quaternion
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3   // local-space rates (pitch, yaw, roll)
  autoBank: number
  speed: number                     // cached |velocity|
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
    autoBank: 0,
    speed: 0,
  }
}

// ── Reusable scratch objects (zero-alloc per frame) ──────────────────────────

const _forward = new THREE.Vector3()
const _pitchQ = new THREE.Quaternion()
const _yawQ = new THREE.Quaternion()
const _rollQ = new THREE.Quaternion()
const _localRight = new THREE.Vector3()
const _localUp = new THREE.Vector3()
const _localFwd = new THREE.Vector3()

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyDeadzone(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) return 0
  const sign = value > 0 ? 1 : -1
  return sign * (Math.abs(value) - deadzone) / (1 - deadzone)
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
  _localUp.set(0, 1, 0).applyQuaternion(state.orientation)
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

  // Integrate position
  state.position.addScaledVector(state.velocity, safeDt)

  // ── Rotational motion ──────────────────────────────────────────────────────

  // Mouse → target angular rates
  const mx = applyDeadzone(clamp(input.mouseX, -1, 1), c.MOUSE_DEADZONE)
  const my = applyDeadzone(clamp(input.mouseY, -1, 1), c.MOUSE_DEADZONE)

  const targetPitch = -my * c.PITCH_RATE
  const targetYaw = -mx * c.YAW_RATE
  const targetRoll = input.roll * c.ROLL_RATE

  // Smooth angular velocity toward target
  const angLerp = 1 - Math.exp(-c.ANGULAR_DRAG * safeDt)
  state.angularVelocity.x += (targetPitch - state.angularVelocity.x) * angLerp
  state.angularVelocity.y += (targetYaw - state.angularVelocity.y) * angLerp
  state.angularVelocity.z += (targetRoll - state.angularVelocity.z) * angLerp

  // Auto-banking: roll into turns proportional to yaw input
  const bankTarget = -mx * c.AUTO_BANK_FACTOR
  state.autoBank += (bankTarget - state.autoBank) * Math.min(c.AUTO_BANK_RETURN * safeDt, 1)

  // Build incremental rotation quaternions
  _pitchQ.setFromAxisAngle(_localRight, state.angularVelocity.x * safeDt)
  _yawQ.setFromAxisAngle(_localUp, state.angularVelocity.y * safeDt)
  _rollQ.setFromAxisAngle(_localFwd, (state.angularVelocity.z + state.autoBank) * safeDt)

  // Apply: orientation = orientation * yaw * pitch * roll
  state.orientation.multiply(_yawQ).multiply(_pitchQ).multiply(_rollQ)
  state.orientation.normalize()
}
