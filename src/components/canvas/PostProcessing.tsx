import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'

export function PostProcessing() {
  const mode = useStore((s) => s.performanceMode)
  const cfg  = PERFORMANCE_CONFIGS[mode]

  if (!cfg.postProcessing) return null

  return (
    <EffectComposer multisampling={cfg.multisampling}>
      <Bloom
        intensity={cfg.bloomIntensity * 0.25}  // main scene uses lighter bloom than intro
        luminanceThreshold={cfg.bloomThreshold + 0.1}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={cfg.bloomRadius}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
