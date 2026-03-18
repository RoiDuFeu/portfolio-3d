import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

export function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.6}
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
