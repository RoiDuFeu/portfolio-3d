import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Retro-styled character cards (R2-D2 & C-3PO) shown when the ship
 * exits the wormhole tunnel. Cards persist until the user picks one:
 *   • R2-D2  → activates free-fly mode (player controls the ship)
 *   • C-3PO  → placeholder (to be implemented later)
 *
 * After card dismissal, the camera rig and falcon handle the cinematic
 * entry based on `pilotChoice` in the store.
 */
export function ArrivalCards() {
  const appPhase = useStore((s) => s.appPhase)
  const setAppPhase = useStore((s) => s.setAppPhase)
  const setEntryAnimDone = useStore((s) => s.setEntryAnimDone)
  const setPilotChoice = useStore((s) => s.setPilotChoice)

  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [selected, setSelected] = useState<'r2d2' | 'c3po' | null>(null)
  const dismissTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Show cards immediately when arriving
  useEffect(() => {
    if (appPhase === 'arriving' && !visible && !fadeOut) {
      setVisible(true)
    }
  }, [appPhase, visible, fadeOut])

  // Cleanup dismiss timers on unmount
  useEffect(() => {
    return () => dismissTimers.current.forEach(clearTimeout)
  }, [])

  const dismiss = useCallback((choice: 'r2d2' | 'c3po') => {
    if (selected) return
    setSelected(choice)

    // Highlight selected card, then fade out
    const t1 = setTimeout(() => {
      setFadeOut(true)

      const t2 = setTimeout(() => {
        setVisible(false)
        setFadeOut(false)

        // Ensure we're in main phase
        if (useStore.getState().appPhase !== 'main') {
          setEntryAnimDone(true)
          setAppPhase('main')
        }

        // Signal the choice — camera rig + falcon handle the cinematic entry
        setPilotChoice(choice)
      }, 800)
      dismissTimers.current.push(t2)
    }, 600)
    dismissTimers.current.push(t1)
  }, [selected, setAppPhase, setEntryAnimDone, setPilotChoice])

  if (!visible) return null

  return (
    <div className={`arrival-overlay ${fadeOut ? 'arrival-fade-out' : 'arrival-fade-in'}`}>
      <div className="arrival-scanlines" />

      <div className="arrival-title">
        SELECT YOUR COPILOT
      </div>

      <div className="arrival-cards">
        {/* R2-D2 Card */}
        <div
          className={`arrival-card arrival-card-left arrival-card-clickable${
            selected === 'r2d2' ? ' arrival-card-selected' : ''
          }${selected === 'c3po' ? ' arrival-card-dimmed' : ''}`}
          onClick={() => dismiss('r2d2')}
          onTouchEnd={(e) => { e.preventDefault(); dismiss('r2d2') }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && dismiss('r2d2')}
        >
          <div className="arrival-card-border-top">
            ┌─── DROID UNIT ─── R2-D2 ───┐
          </div>
          <div className="arrival-card-img-wrap">
            <img src="/textures/r2d2.png" alt="R2-D2" className="arrival-card-img" draggable={false} />
            <div className="arrival-card-scan-line" />
          </div>
          <div className="arrival-card-info">
            <div className="arrival-card-name">R2-D2</div>
            <div className="arrival-card-class">ASTROMECH DROID</div>
            <div className="arrival-card-stats">
              <span>SER. R2-D2</span>
              <span className="arrival-dot" />
              <span>NABOO</span>
            </div>
            <div className="arrival-card-bar">{'█'.repeat(14)}{'░'.repeat(6)}</div>
            <div className="arrival-card-action">&gt; FREE FLY MODE</div>
            <div className="arrival-card-action-sub arrival-card-action-sub-desktop">WASD + MOUSE — TAKE CONTROL</div>
            <div className="arrival-card-action-sub arrival-card-action-sub-mobile">TOUCH JOYSTICKS — TAKE CONTROL</div>
          </div>
          <div className="arrival-card-border-bot">└────────────────────────────┘</div>
        </div>

        {/* C-3PO Card */}
        <div
          className={`arrival-card arrival-card-right arrival-card-clickable${
            selected === 'c3po' ? ' arrival-card-selected' : ''
          }${selected === 'r2d2' ? ' arrival-card-dimmed' : ''}`}
          onClick={() => dismiss('c3po')}
          onTouchEnd={(e) => { e.preventDefault(); dismiss('c3po') }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && dismiss('c3po')}
        >
          <div className="arrival-card-border-top">
            ┌─── DROID UNIT ─── C-3PO ───┐
          </div>
          <div className="arrival-card-img-wrap">
            <img src="/textures/c3po.png" alt="C-3PO" className="arrival-card-img" draggable={false} />
            <div className="arrival-card-scan-line" />
          </div>
          <div className="arrival-card-info">
            <div className="arrival-card-name">C-3PO</div>
            <div className="arrival-card-class">PROTOCOL DROID</div>
            <div className="arrival-card-stats">
              <span>SER. C-3PO</span>
              <span className="arrival-dot" />
              <span>TATOOINE</span>
            </div>
            <div className="arrival-card-bar">{'█'.repeat(18)}{'░'.repeat(2)}</div>
            <div className="arrival-card-action">&gt; GUIDED TOUR</div>
            <div className="arrival-card-action-sub">COMING SOON...</div>
          </div>
          <div className="arrival-card-border-bot">└────────────────────────────┘</div>
        </div>
      </div>

      <div className="arrival-status">
        <span className="arrival-dot" />
        <span>DESTINATION REACHED — CHOOSE YOUR PATH</span>
      </div>
    </div>
  )
}
