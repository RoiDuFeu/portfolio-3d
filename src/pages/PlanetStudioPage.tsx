import { useEffect } from 'react'
import { TopBar } from '../components/studio/ui/TopBar'
import { ControlPanel } from '../components/studio/ui/ControlPanel'
import { TimelineBar } from '../components/studio/ui/TimelineBar'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import { useStudioStore } from '../store/useStudioStore'
import './PlanetStudioPage.css'

export function PlanetStudioPage() {
  // Keyboard shortcut: Space = play/pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        useStudioStore.getState().togglePlayback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="studio">
      <TopBar />

      <div className="studio__main">
        <ControlPanel />

        <div className="studio__viewport">
          <StudioCanvas />
        </div>
      </div>

      <TimelineBar />
    </div>
  )
}
