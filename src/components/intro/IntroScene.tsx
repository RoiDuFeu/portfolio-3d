import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { IntroCameraRig } from './IntroCameraRig'
import { FalconIntro } from './FalconIntro'
import { HyperspaceTunnel } from './HyperspaceTunnel'
import { useStore } from '../../store/useStore'
import { PERFORMANCE_CONFIGS } from '../../utils/performanceConfig'

export function IntroScene() {
  const mode = useStore((s) => s.performanceMode)
  const cfg  = PERFORMANCE_CONFIGS[mode]

  return (
    // canvas-container uses 100dvh so iOS Safari chrome is handled correctly
    <div className="canvas-container" style={{ zIndex: 10 }}>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 58, near: 0.01, far: 600 }}
        style={{ width: '100%', height: '100%' }}
        dpr={cfg.dpr}
        gl={{ antialias: cfg.antialias, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* No solid background — tube canvas below shows through the transparent sky */}

        <Suspense fallback={null}>
          <IntroCameraRig />
          <FalconIntro />
          <HyperspaceTunnel />

          <ambientLight color="#1a2244" intensity={0.15} />
          <directionalLight position={[-3, 6, -20]} intensity={0.5} color="#99bbff" />

          <Environment preset="night" background={false} />

          {cfg.postProcessing && (
            <EffectComposer multisampling={cfg.multisampling}>
              <Bloom
                intensity={cfg.bloomIntensity}
                luminanceThreshold={cfg.bloomThreshold}
                luminanceSmoothing={0.4}
                mipmapBlur
                radius={cfg.bloomRadius}
              />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <Vignette offset={0.25} darkness={0.65} blendFunction={BlendFunction.NORMAL} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
