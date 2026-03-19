import { useStudioStore } from '../../../store/useStudioStore'
import { ModeControls } from './ModeControls'
import { SurfaceControls } from './SurfaceControls'
import { BiomeControls } from './BiomeControls'
import { ColorControls } from './ColorControls'
import { AtmosphereControls } from './AtmosphereControls'
import { RingControls } from './RingControls'
import { MoonControls } from './MoonControls'
import { CloudControls } from './CloudControls'
import { RealisticControls } from './RealisticControls'

export function ControlPanel() {
  const mode = useStudioStore((s) => s.config.mode)

  return (
    <aside className="studio__controls">
      <ModeControls />
      {mode === 'rocky' ? (
        <>
          {/* Outside-in: atmosphere → clouds → terrain → biome → realistic */}
          <AtmosphereControls />
          <CloudControls />
          <SurfaceControls />
          <BiomeControls />
          <RealisticControls />
          <ColorControls />
        </>
      ) : (
        <>
          {/* Core-outward: fire core → colors → corona → atmosphere */}
          <SurfaceControls />
          <ColorControls />
          <AtmosphereControls />
        </>
      )}
      <RingControls />
      <MoonControls />
    </aside>
  )
}
