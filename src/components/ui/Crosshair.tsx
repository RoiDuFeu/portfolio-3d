import { useStore } from '../../store/useStore'

/**
 * Star Wars–style targeting reticle.
 * Fixed center screen, only visible during flight mode.
 */
export function Crosshair() {
  const isFlying = useStore((s) => s.isFlying)
  if (!isFlying) return null

  return (
    <div className="crosshair-container">
      {/* Corner brackets */}
      <div className="crosshair-bracket crosshair-tl" />
      <div className="crosshair-bracket crosshair-tr" />
      <div className="crosshair-bracket crosshair-bl" />
      <div className="crosshair-bracket crosshair-br" />
      {/* Center dot */}
      <div className="crosshair-dot" />
    </div>
  )
}
