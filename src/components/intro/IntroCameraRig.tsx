import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Chase camera that mirrors the Falcon's bank so the viewport tilts
 * with the ship — as if a cinematographer is following it through a manoeuvre.
 *
 * Uses its own mouse tracking (independent of FalconIntro) with a slightly
 * slower lerp so the camera always lags a beat behind the ship, adding depth.
 */
export function IntroCameraRig() {
  const targetX = useRef(0)
  const smoothX = useRef(0)
  const smoothY = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetX.current = (e.clientX / window.innerWidth - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Camera lags even more behind the ship (1.5 %) — depth through asymmetry
    smoothX.current += (targetX.current  - smoothX.current) * 0.015
    smoothY.current += (-smoothX.current - smoothY.current) * 0.015 // subtle vertical coupling

    const mx = smoothX.current

    // ── Position ──────────────────────────────────────────────────────────────
    // Camera drifts laterally with the bank (but less than the ship moves)
    // so the Falcon always stays roughly centred in frame.
    state.camera.position.set(
      Math.sin(t * 0.11) * 0.4 + mx * 0.35,
      2.0 + Math.sin(t * 0.07) * 0.10,
      8,
    )

    // ── Roll (camera.up) ──────────────────────────────────────────────────────
    // When the ship banks right, the camera tilts right too — just enough to
    // feel like you're sharing the manoeuvre, not so much that it's disorienting.
    //
    // mx * |mx|  mirrors the quadratic roll curve used on the Falcon.
    // Tilt sign matches the ship's bank direction so the camera amplifies the roll
    const tilt = mx * Math.abs(mx) * 0.18
    state.camera.up.set(tilt, 1, 0).normalize()

    // ── LookAt ────────────────────────────────────────────────────────────────
    // Look slightly ahead of where the ship is banking toward.
    state.camera.lookAt(
      mx * 0.15,
      0.5,
      -4,
    )
  })

  return null
}
