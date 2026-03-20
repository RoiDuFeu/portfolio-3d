import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'

/**
 * Unified post-processing for the single-canvas scene.
 * Bloom intensity varies by phase:
 *   intro/hyperspace → full bloom (tunnel streak glow)
 *   arriving/main    → lighter bloom (subtle planet/sun glow)
 */
export function PostProcessing() {
  const mode = useStore((s) => s.performanceMode)
  const appPhase = useStore((s) => s.appPhase)
  const cfg = PERFORMANCE_CONFIGS[mode]

  if (!cfg.postProcessing) return null

  // Intro/hyperspace: full bloom. Main: quarter intensity.
  const bloomIntensity = (appPhase === 'intro' || appPhase === 'hyperspace')
    ? cfg.bloomIntensity
    : cfg.bloomIntensity * 0.25

  return (
    <EffectComposer multisampling={cfg.multisampling}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={cfg.bloomThreshold}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={cfg.bloomRadius}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        offset={0.25}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
