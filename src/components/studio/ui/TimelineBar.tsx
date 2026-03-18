import { useStudioStore } from '../../../store/useStudioStore'

export function TimelineBar() {
  const evolution = useStudioStore((s) => s.evolution)
  const isPlaying = useStudioStore((s) => s.isPlaying)
  const playbackSpeed = useStudioStore((s) => s.playbackSpeed)
  const setEvolution = useStudioStore((s) => s.setEvolution)
  const togglePlayback = useStudioStore((s) => s.togglePlayback)
  const setPlaybackSpeed = useStudioStore((s) => s.setPlaybackSpeed)

  return (
    <div className="studio__timeline">
      <button
        type="button"
        className="timeline__play-btn"
        onClick={togglePlayback}
      >
        {isPlaying ? '||' : '\u25B6'}
      </button>

      <input
        type="range"
        className="timeline__slider"
        min={0}
        max={1}
        step={0.001}
        value={evolution}
        onChange={(e) => setEvolution(parseFloat(e.target.value))}
      />

      <span className="timeline__percent">
        {Math.round(evolution * 100)}%
      </span>

      <select
        className="timeline__speed"
        value={playbackSpeed}
        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
      </select>
    </div>
  )
}
