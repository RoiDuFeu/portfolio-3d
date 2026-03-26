import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'
import { FLIGHT } from '../../systems/flightPhysics'

/**
 * Unified post-processing for the single-canvas scene.
 * Bloom intensity varies by phase and flight speed:
 *   intro/hyperspace → full bloom (tunnel streak glow)
 *   flight           → speed-responsive bloom (engines + motion)
 *   arriving/main    → lighter bloom (subtle planet/sun glow)
 *
 * Vignette intensifies during boost for a tunnel-vision cinematic effect.
 */
export function PostProcessing() {
  const mode = useStore((s) => s.performanceMode)
  const appPhase = useStore((s) => s.appPhase)
  const isFlying = useStore((s) => s.isFlying)
  const isBoosting = useStore((s) => s.isBoosting)
  const flightSpeed = useStore((s) => s.flightSpeed)
  const cfg = PERFORMANCE_CONFIGS[mode]

  if (!cfg.postProcessing) return null

  // Speed-normalized value (0..1) for continuous modulation
  const speedNorm = isFlying ? Math.min(flightSpeed / FLIGHT.MAX_BOOST_SPEED, 1) : 0

  // Bloom: continuous speed response instead of binary boost/no-boost
  let bloomIntensity: number
  if (appPhase === 'loading' || appPhase === 'intro' || appPhase === 'hyperspace') {
    bloomIntensity = cfg.bloomIntensity
  } else if (isFlying) {
    // Base flight bloom + speed-proportional increase + boost jump
    const baseFlight = cfg.bloomIntensity * 0.3
    const speedBoost = speedNorm * cfg.bloomIntensity * 0.25
    const boostExtra = isBoosting ? cfg.bloomIntensity * 0.2 : 0
    bloomIntensity = baseFlight + speedBoost + boostExtra
  } else {
    bloomIntensity = cfg.bloomIntensity * 0.25
  }

  // Vignette: intensifies during boost for tunnel-vision feel
  const vignetteOffset = isFlying && isBoosting ? 0.2 : 0.25
  const vignetteDarkness = isFlying
    ? 0.65 + speedNorm * 0.15 + (isBoosting ? 0.1 : 0)
    : 0.65

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
        offset={vignetteOffset}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
