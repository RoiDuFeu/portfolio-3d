import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════════
// Falcon Secondary Motion Layer
// ═══════════════════════════════════════════════════════════════════════════════
//
// Visual-only motion applied ON TOP of the physics orientation.
// Creates the feeling of a heavy ship reacting to forces:
//   - Pitch wobble when acceleration changes
//   - Roll overshoot when banking changes
//   - Fire recoil micro-kick
//
// This layer does NOT affect the physics simulation — it's purely cosmetic.
// The physics orientation is the "truth"; this adds cinematic secondary motion.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Tuning ──────────────────────────────────────────────────────────────────

export const SECONDARY_MOTION = {
  // Pitch response: ship pitches slightly on thrust changes (subtle — no surprise)
  PITCH_ON_ACCEL: 0.02,            // radians — gentle pitch-down on forward thrust
  PITCH_ON_BRAKE: -0.03,           // radians — gentle pitch-up on braking
  PITCH_ON_BOOST: 0.035,           // radians — slightly more on boost
  PITCH_SPRING_K: 12.0,            // stiffness — snappy settle
  PITCH_SPRING_DAMP: 0.85,         // high damping = minimal overshoot

  // Roll wobble: very subtle on turn changes (cosmetic only)
  ROLL_IMPULSE_SCALE: 0.15,        // reduced heavily — no visible wobble
  ROLL_SPRING_K: 16.0,
  ROLL_SPRING_DAMP: 0.9,           // near critically damped — no oscillation

  // Body yaw lag: barely perceptible wobble from acceleration changes
  YAW_IMPULSE_SCALE: 0.08,
  YAW_SPRING_K: 18.0,
  YAW_SPRING_DAMP: 0.9,

  // Fire recoil
  FIRE_RECOIL_PITCH: 0.012,        // pitch kick per shot (radians)
  FIRE_RECOIL_ROLL: 0.004,         // alternating roll kick
  FIRE_RECOIL_DECAY: 12.0,         // fast decay

  // Coupled turn: disabled — turns should not affect pitch
  COUPLED_PITCH_ON_YAW: 0,
} as const

// ── Camera tuning ───────────────────────────────────────────────────────────

export const CAMERA_TUNING = {
  // Chase distances
  DISTANCE_BASE: 8.5,             // base distance behind ship
  DISTANCE_SPEED_SCALE: 3.0,      // extra pullback at max speed
  HEIGHT_BASE: 1.0,               // just above ship — nearly level rear view
  HEIGHT_SPEED_SCALE: 0.3,
  LOOK_AHEAD: 12,

  // Follow speeds (exponential lerp factors)
  POS_FOLLOW_SPEED: 2.8,          // base position follow
  POS_FOLLOW_FAST: 6.0,           // catch-up when camera lags far behind
  POS_LAG_THRESHOLD: 3.0,         // distance before fast follow kicks in
  LOOK_FOLLOW_SPEED: 4.5,

  // FOV
  FOV_BASE: 55,
  FOV_BOOST: 73,
  FOV_SPEED_SCALE: 0.35,          // extra FOV per unit of normalized speed
  FOV_LERP_SPEED: 2.5,            // how fast FOV transitions

  // Camera roll (bank matching)
  ROLL_MATCH_FACTOR: 0.35,        // how much camera rolls with ship bank
  ROLL_LERP_SPEED: 2.0,

  // Up vector
  UP_LERP_SPEED: 0.08,            // how fast camera.up follows ship up

  // Fire shake only (no constant speed shake — the ship shouldn't always vibrate)
  FIRE_SHAKE_AMOUNT: 0.055,
  FIRE_SHAKE_DECAY: 8.0,

  // Positional trail: camera trails behind during acceleration
  TRAIL_AMOUNT: 0.6,              // extra offset when accelerating
  TRAIL_LERP_SPEED: 3.0,
} as const

// ── Engine glow tuning ──────────────────────────────────────────────────────

export const ENGINE_TUNING = {
  BASE_INTENSITY: 14,
  IDLE_MULT: 0.7,
  THRUST_MULT: 1.6,
  BOOST_MULT: 3.2,
  BRAKE_MULT: 0.4,
  REVERSE_MULT: 0.3,
  // Side engine emphasis during turns
  TURN_SIDE_BOOST: 1.4,           // glow boost on the outer engine during turns
  GLOW_LERP_SPEED: 4.0,          // how fast engine glow transitions
} as const

// ── Spring State ────────────────────────────────────────────────────────────

export interface SpringState {
  value: number
  velocity: number
}

export function createSpring(initial = 0): SpringState {
  return { value: initial, velocity: 0 }
}

/**
 * Semi-implicit Euler spring step (stable, cheap).
 * Underdamped (damping < 1) = overshoot + settle.
 * Critically damped (damping ≈ 1) = no overshoot.
 */
export function stepSpring(
  spring: SpringState,
  target: number,
  stiffness: number,
  dampingRatio: number,
  dt: number,
): number {
  const omega = Math.sqrt(stiffness)
  const dampingForce = 2 * dampingRatio * omega

  const error = spring.value - target
  spring.velocity += (-stiffness * error - dampingForce * spring.velocity) * dt
  spring.value += spring.velocity * dt

  return spring.value
}

// ── Secondary Motion State ──────────────────────────────────────────────────

export interface SecondaryMotionState {
  pitchSpring: SpringState
  rollSpring: SpringState
  yawSpring: SpringState

  // Tracking previous frame for delta detection
  prevThrust: number
  prevYawInput: number

  // Fire recoil (decaying impulse)
  fireRecoilIntensity: number
  fireRecoilSign: number        // alternates +1/-1 for left/right cannon feel
}

export function createSecondaryMotion(): SecondaryMotionState {
  return {
    pitchSpring: createSpring(),
    rollSpring: createSpring(),
    yawSpring: createSpring(),
    prevThrust: 0,
    prevYawInput: 0,
    fireRecoilIntensity: 0,
    fireRecoilSign: 1,
  }
}

// ── Scratch quaternion for applying visual offsets ───────────────────────────

const _visualOffset = new THREE.Euler()
const _visualQuat = new THREE.Quaternion()

/**
 * Steps the secondary motion system and returns a quaternion offset
 * to apply on top of the physics orientation.
 *
 * Call this every frame in UnifiedFalcon's useFrame.
 */
export function stepSecondaryMotion(
  motion: SecondaryMotionState,
  thrustInput: number,    // -1..1
  yawInput: number,       // total yaw (mouse + keyboard combined)
  isBoosting: boolean,
  isBraking: boolean,
  speed: number,
  dt: number,
): THREE.Quaternion {
  const safeDt = Math.min(dt, 0.1)
  const c = SECONDARY_MOTION

  // ── Pitch target from thrust state ──
  let pitchTarget = 0
  if (isBoosting && thrustInput > 0) {
    pitchTarget = c.PITCH_ON_BOOST
  } else if (thrustInput > 0) {
    pitchTarget = c.PITCH_ON_ACCEL * thrustInput
  } else if (isBraking) {
    pitchTarget = c.PITCH_ON_BRAKE
  } else if (thrustInput < 0) {
    pitchTarget = c.PITCH_ON_BRAKE * Math.abs(thrustInput) * 0.6
  }

  // Coupled turn: slight pitch-up during turns (coordinated turn feel)
  pitchTarget += Math.abs(yawInput) * c.COUPLED_PITCH_ON_YAW

  stepSpring(motion.pitchSpring, pitchTarget, c.PITCH_SPRING_K, c.PITCH_SPRING_DAMP, safeDt)

  // ── Roll overshoot from yaw changes ──
  const yawDelta = yawInput - motion.prevYawInput
  if (Math.abs(yawDelta) > 0.01) {
    motion.rollSpring.velocity += yawDelta * c.ROLL_IMPULSE_SCALE
  }
  stepSpring(motion.rollSpring, 0, c.ROLL_SPRING_K, c.ROLL_SPRING_DAMP, safeDt)

  // ── Yaw wobble from acceleration changes ──
  const thrustDelta = thrustInput - motion.prevThrust
  if (Math.abs(thrustDelta) > 0.05) {
    motion.yawSpring.velocity += thrustDelta * c.YAW_IMPULSE_SCALE
  }
  stepSpring(motion.yawSpring, 0, c.YAW_SPRING_K, c.YAW_SPRING_DAMP, safeDt)

  // ── Fire recoil decay ──
  motion.fireRecoilIntensity *= Math.max(0, 1 - c.FIRE_RECOIL_DECAY * safeDt)

  // Track for next frame
  motion.prevThrust = thrustInput
  motion.prevYawInput = yawInput

  // ── Compose visual offset quaternion ──
  const recoilPitch = motion.fireRecoilIntensity * c.FIRE_RECOIL_PITCH
  const recoilRoll = motion.fireRecoilIntensity * c.FIRE_RECOIL_ROLL * motion.fireRecoilSign

  _visualOffset.set(
    motion.pitchSpring.value + recoilPitch,   // pitch (x)
    motion.yawSpring.value,                    // yaw (y)
    motion.rollSpring.value + recoilRoll,      // roll (z)
    'YXZ',
  )
  _visualQuat.setFromEuler(_visualOffset)

  return _visualQuat
}

/**
 * Trigger fire recoil — call this when a blaster bolt is fired.
 */
export function triggerFireRecoil(motion: SecondaryMotionState): void {
  motion.fireRecoilIntensity = 1.0
  motion.fireRecoilSign *= -1  // alternate left/right kick
}

// ═══════════════════════════════════════════════════════════════════════════════
// TUNING PRESETS
// ═══════════════════════════════════════════════════════════════════════════════
//
// Three presets for different feel targets. To use a preset, copy its values
// into the constants above. The default values are the "Cinematic" preset.
//
// ── Best Default: CINEMATIC (current values above) ──
// Balanced feel. Visible drift, spring banking, subtle body motion.
// Good for general cinematic piloting.
//
// ── ARCADE ──
// Tighter response, less drift, quicker settling.
// Override these in the constants above:
//   FLIGHT.VELOCITY_ALIGNMENT: 4.0    (less drift)
//   FLIGHT.LINEAR_DRAG: 0.55          (more drag)
//   SECONDARY_MOTION.PITCH_ON_ACCEL: 0.025
//   SECONDARY_MOTION.ROLL_SPRING_DAMP: 0.75  (less oscillation)
//   CAMERA_TUNING.POS_FOLLOW_SPEED: 4.0
//   CAMERA_TUNING.DISTANCE_SPEED_SCALE: 1.5
//   CAMERA_TUNING.FOV_SPEED_SCALE: 0.15
//
// ── HEAVY CINEMATIC FALCON ──
// Maximum weight. Long drift, dramatic springs, loose camera.
// Override these in the constants above:
//   FLIGHT.VELOCITY_ALIGNMENT: 0.9    (heavy drift)
//   FLIGHT.LINEAR_DRAG: 0.3           (momentum persists)
//   SECONDARY_MOTION.PITCH_ON_ACCEL: 0.07
//   SECONDARY_MOTION.PITCH_ON_BOOST: 0.10
//   SECONDARY_MOTION.ROLL_SPRING_DAMP: 0.4  (more oscillation)
//   SECONDARY_MOTION.ROLL_IMPULSE_SCALE: 1.2
//   CAMERA_TUNING.POS_FOLLOW_SPEED: 1.8
//   CAMERA_TUNING.DISTANCE_BASE: 10.5
//   CAMERA_TUNING.DISTANCE_SPEED_SCALE: 5.0
//   CAMERA_TUNING.FOV_BOOST: 78
//   CAMERA_TUNING.FOV_SPEED_SCALE: 0.55
//   CAMERA_TUNING.TRAIL_AMOUNT: 1.0
//
// ═══════════════════════════════════════════════════════════════════════════════
