import { useRef, useCallback, useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import {
  falconProgress,
  FALCON_START_T,
  ENTRY_T,
  WAIT_T,
  wormholeSpline,
} from '../../utils/wormholeSpline'

/**
 * Debug timeline overlay for the Falcon's wormhole flight.
 * Toggle with [H] key. Shows:
 *   - Scrubable timeline bar with markers for entry/wait/exit
 *   - Play/Pause button
 *   - Speed multiplier slider
 *   - Live telemetry (t, position, phase, elapsed, entryIntensity)
 */
export function DebugTimeline() {
  const show = useStore((s) => s.debugTimeline)
  const paused = useStore((s) => s.debugPaused)
  const speed = useStore((s) => s.debugSpeedMultiplier)
  const manualT = useStore((s) => s.debugManualT)
  const appPhase = useStore((s) => s.appPhase)

  // Poll falconProgress (mutable ref, not reactive) for display
  const [telemetry, setTelemetry] = useState({
    t: FALCON_START_T,
    ei: 0,
    x: 0,
    y: 0,
    z: -4,
  })

  const scrubbing = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Poll telemetry at 10 Hz
  useEffect(() => {
    if (!show) return
    const id = setInterval(() => {
      const t = manualT ?? falconProgress.t
      const pos = wormholeSpline.getPointAt(Math.min(Math.max(t, 0), 1))
      setTelemetry({
        t,
        ei: falconProgress.entryIntensity,
        x: pos.x,
        y: pos.y,
        z: pos.z,
      })
    }, 100)
    return () => clearInterval(id)
  }, [show, manualT])

  // Keyboard toggle: H
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'h' || e.key === 'H') {
        useStore.getState().setDebugTimeline(!useStore.getState().debugTimeline)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleScrub = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    // Map ratio to [0, 1] spline t
    useStore.getState().setDebugManualT(ratio)
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      scrubbing.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      handleScrub(e.clientX)
    },
    [handleScrub],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scrubbing.current) return
      handleScrub(e.clientX)
    },
    [handleScrub],
  )

  const onPointerUp = useCallback(() => {
    scrubbing.current = false
  }, [])

  if (!show) return null

  const currentT = manualT ?? telemetry.t
  const pct = (currentT * 100).toFixed(1)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 200,
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#0f0',
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid #0f0',
        borderRadius: 6,
        padding: '10px 14px',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#0f0', fontWeight: 'bold' }}>
          FALCON TIMELINE DEBUG [H]
        </span>
        <span style={{ color: '#888' }}>
          Phase: <span style={{ color: phaseColor(appPhase) }}>{appPhase}</span>
          {manualT !== null && <span style={{ color: '#ff0' }}> [MANUAL]</span>}
          {paused && <span style={{ color: '#f44' }}> [PAUSED]</span>}
        </span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          height: 28,
          background: '#111',
          borderRadius: 4,
          border: '1px solid #333',
          cursor: 'pointer',
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        {/* Markers */}
        <Marker t={FALCON_START_T} color="#0ff" label="START" />
        <Marker t={ENTRY_T} color="#ff0" label="ENTRY" />
        <Marker t={WAIT_T} color="#f80" label="WAIT" />
        <Marker t={1} color="#f00" label="END" />

        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            background: 'rgba(0,255,0,0.15)',
            borderRight: '2px solid #0f0',
            transition: scrubbing.current ? 'none' : 'width 0.1s',
          }}
        />

        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${pct}%`,
            width: 2,
            height: '100%',
            background: '#0f0',
            boxShadow: '0 0 6px #0f0',
          }}
        />

        {/* T label on playhead */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: `calc(${pct}% + 6px)`,
            fontSize: 9,
            color: '#0f0',
            whiteSpace: 'nowrap',
          }}
        >
          t={currentT.toFixed(4)}
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Play / Pause */}
        <button
          onClick={() => useStore.getState().setDebugPaused(!paused)}
          style={btnStyle(paused ? '#4f4' : '#f44')}
        >
          {paused ? '▶ PLAY' : '⏸ PAUSE'}
        </button>

        {/* Release manual scrub */}
        {manualT !== null && (
          <button
            onClick={() => useStore.getState().setDebugManualT(null)}
            style={btnStyle('#0ff')}
          >
            ✕ RELEASE SCRUB
          </button>
        )}

        {/* Speed slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#888' }}>Speed:</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={speed}
            onChange={(e) =>
              useStore.getState().setDebugSpeedMultiplier(parseFloat(e.target.value))
            }
            style={{ width: 120, accentColor: '#0f0' }}
          />
          <span style={{ minWidth: 40 }}>{speed.toFixed(2)}x</span>
        </div>

        {/* Quick speed buttons */}
        {[0.1, 0.25, 0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => useStore.getState().setDebugSpeedMultiplier(s)}
            style={btnStyle(speed === s ? '#0f0' : '#666')}
          >
            {s}x
          </button>
        ))}

        {/* Telemetry */}
        <div style={{ marginLeft: 'auto', color: '#888', fontSize: 10 }}>
          pos=[{telemetry.x.toFixed(1)}, {telemetry.y.toFixed(1)}, {telemetry.z.toFixed(1)}]
          &nbsp; ei={telemetry.ei.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

function Marker({ t, color, label }: { t: number; color: string; label: string }) {
  const pct = (t * 100).toFixed(2)
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${pct}%`,
          width: 1,
          height: '100%',
          background: color,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: `calc(${pct}% + 2px)`,
          fontSize: 8,
          color,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
    </>
  )
}

function phaseColor(phase: string) {
  switch (phase) {
    case 'intro': return '#0ff'
    case 'hyperspace': return '#f80'
    case 'arriving': return '#ff0'
    case 'main': return '#0f0'
    default: return '#fff'
  }
}

const btnStyle = (color: string): React.CSSProperties => ({
  background: 'rgba(0,0,0,0.9)',
  color,
  border: `1px solid ${color}`,
  borderRadius: 3,
  padding: '3px 8px',
  fontFamily: 'monospace',
  fontSize: 10,
  cursor: 'pointer',
})
