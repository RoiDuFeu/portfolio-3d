import { IntroScene } from './IntroScene'
import { RetroUI } from './RetroUI'

/**
 * Full-screen intro experience: 3D scene (Falcon + stars) + HTML retro overlay.
 * Mounted when appPhase is 'intro' or 'hyperspace'.
 */
export function Intro() {
  return (
    <>
      <IntroScene />
      <RetroUI />
    </>
  )
}
