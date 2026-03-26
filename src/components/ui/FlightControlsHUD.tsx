import { useEffect, useState, useRef } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Retro-styled overlay showing flight controls in free-fly mode.
 * Fades out progressively when the ship is moving, reappears when fully stopped.
 */
export function FlightControlsHUD() {
  const isFlying = useStore((s) => s.isFlying)
  const layout = useStore((s) => s.keyboardLayout)
  const [visible, setVisible] = useState(false)
  // 'entering' = CSS enter anim playing, 'active' = JS controls opacity, 'exiting' = CSS exit anim
  const [phase, setPhase] = useState<'entering' | 'active' | 'exiting'>('entering')
  const wasFlying = useRef(false)
  const opacityRef = useRef(0)
  const divRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)

  // Speed threshold: below this the overlay starts fading in
  const SPEED_FADE_THRESHOLD = 0.8
  const FADE_IN_RATE = 2.5
  const FADE_OUT_RATE = 3.0

  // Key labels based on detected layout
  const fwd = layout === 'azerty' ? 'Z' : 'W'
  const left = layout === 'azerty' ? 'Q' : 'A'

  // Show overlay when flight mode activates
  useEffect(() => {
    if (isFlying && !wasFlying.current) {
      setVisible(true)
      setPhase('entering')
      opacityRef.current = 0
    }
    if (!isFlying && wasFlying.current) {
      setPhase('exiting')
      const t = setTimeout(() => setVisible(false), 600)
      wasFlying.current = isFlying
      return () => clearTimeout(t)
    }
    wasFlying.current = isFlying
  }, [isFlying])

  // When CSS enter animation ends, switch to JS-driven opacity
  const handleAnimationEnd = () => {
    if (phase === 'entering') {
      opacityRef.current = 1
      setPhase('active')
    }
  }

  // RAF loop to drive opacity from flightSpeed (only in 'active' phase)
  useEffect(() => {
    if (!visible || !isFlying || phase !== 'active') return

    lastTimeRef.current = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const speed = useStore.getState().flightSpeed

      // Target opacity: 1 when stopped, 0 when moving past threshold
      const targetOpacity = speed < SPEED_FADE_THRESHOLD
        ? 1 - (speed / SPEED_FADE_THRESHOLD)
        : 0

      const rate = targetOpacity > opacityRef.current ? FADE_IN_RATE : FADE_OUT_RATE
      opacityRef.current += (targetOpacity - opacityRef.current) * rate * dt
      opacityRef.current = Math.max(0, Math.min(1, opacityRef.current))

      if (divRef.current) {
        divRef.current.style.opacity = String(opacityRef.current)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible, isFlying, phase])

  if (!visible) return null

  return (
    <div
      ref={divRef}
      className={`fhud-overlay ${phase === 'entering' ? 'fhud-fade-in' : phase === 'exiting' ? 'fhud-fade-out' : ''}`}
      style={{ opacity: phase === 'active' ? opacityRef.current : undefined }}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Title */}
      <div className="fhud-title">
        <span className="fhud-dot" />
        FREE FLY MODE
      </div>

      {/* Two-column controls grid */}
      <div className="fhud-columns">
        {/* Left column — movement */}
        <div className="fhud-col">
          <div className="fhud-col-header">MOVEMENT</div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key">{fwd}</span>
              <span className="fhud-key">S</span>
            </div>
            <div className="fhud-label">THRUST / BRAKE</div>
          </div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key">{left}</span>
              <span className="fhud-key">D</span>
            </div>
            <div className="fhud-label">TURN L / R</div>
          </div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key fhud-key-wide">MOUSE</span>
            </div>
            <div className="fhud-label">PITCH &amp; YAW</div>
          </div>
        </div>

        {/* Divider */}
        <div className="fhud-divider" />

        {/* Right column — actions */}
        <div className="fhud-col">
          <div className="fhud-col-header">ACTIONS</div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key fhud-key-wide">SHIFT</span>
            </div>
            <div className="fhud-label">BOOST</div>
          </div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key fhud-key-wide">SPACE</span>
            </div>
            <div className="fhud-label">BRAKE</div>
          </div>
          <div className="fhud-row">
            <div className="fhud-keys">
              <span className="fhud-key fhud-key-wide">L-CLICK</span>
            </div>
            <div className="fhud-label">FIRE</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fhud-footer">
        [T] EXIT FLIGHT
      </div>
    </div>
  )
}
