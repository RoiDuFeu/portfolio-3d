import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useShaderStore } from '@/store/useShaderStore'
import { SUN_UNIFORM_RANGES } from '@/utils/shaderDefaults'
import { UniformSlider } from './UniformSlider'
import { ColorPickerField } from './ColorPickerField'

function SurfaceSection() {
  const surface = useShaderStore((s) => s.uniforms.surface)
  const update = useShaderStore((s) => s.updateSurface)
  const ranges = SUN_UNIFORM_RANGES.surface

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(ranges).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={surface[key as keyof typeof surface]}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

function PerlinSection() {
  const perlin = useShaderStore((s) => s.uniforms.perlin)
  const update = useShaderStore((s) => s.updatePerlin)
  const ranges = SUN_UNIFORM_RANGES.perlin

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(ranges).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={perlin[key as keyof typeof perlin]}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

function GlowSection() {
  const glow = useShaderStore((s) => s.uniforms.glow)
  const update = useShaderStore((s) => s.updateGlow)
  const ranges = SUN_UNIFORM_RANGES.glow

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(ranges).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={glow[key as keyof typeof glow]}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

function CoronaSection() {
  const rays = useShaderStore((s) => s.uniforms.rays)
  const update = useShaderStore((s) => s.updateRays)
  const ranges = SUN_UNIFORM_RANGES.rays

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(ranges).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={rays[key as keyof typeof rays]}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

function FlaresSection() {
  const flares = useShaderStore((s) => s.uniforms.flares)
  const update = useShaderStore((s) => s.updateFlares)
  const ranges = SUN_UNIFORM_RANGES.flares

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(ranges).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={flares[key as keyof typeof flares]}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

function LightsSection() {
  const lights = useShaderStore((s) => s.uniforms.lights)
  const update = useShaderStore((s) => s.updateLights)
  const ranges = SUN_UNIFORM_RANGES.lights

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ColorPickerField
        label="Key Light"
        value={lights.keyColor}
        onChange={(v) => update({ keyColor: v })}
      />
      {Object.entries(ranges).filter(([key]) => key.startsWith('key')).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={lights[key as keyof typeof lights] as number}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
      <Separator style={{ margin: '12px 0', opacity: 0.15 }} />
      <ColorPickerField
        label="Fill Light"
        value={lights.fillColor}
        onChange={(v) => update({ fillColor: v })}
      />
      {Object.entries(ranges).filter(([key]) => key.startsWith('fill')).map(([key, range]) => (
        <UniformSlider
          key={key}
          label={range.label}
          value={lights[key as keyof typeof lights] as number}
          min={range.min}
          max={range.max}
          step={range.step}
          onChange={(v) => update({ [key]: v })}
        />
      ))}
    </div>
  )
}

export function ShaderEditorPanel() {
  const reset = useShaderStore((s) => s.resetToDefaults)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(10, 14, 30, 0.92)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(100, 150, 255, 0.12)',
      }}>
        <div>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'rgba(160, 190, 255, 0.9)',
            margin: 0,
          }}>Shader Editor</h3>
          <p style={{
            fontSize: 10,
            color: 'rgba(160, 190, 255, 0.4)',
            marginTop: 2,
          }}>CubemapSun</p>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={reset}
          style={{
            fontSize: 10,
            color: 'rgba(160, 190, 255, 0.55)',
          }}
        >
          Reset
        </Button>
      </div>

      {/* Tabs + Content */}
      <Tabs defaultValue="surface" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(100, 150, 255, 0.08)',
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="surface">Surface</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="lights">Lights</TabsTrigger>
          </TabsList>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px 32px',
        }}>
          <TabsContent value="surface">
            <Accordion type="multiple" defaultValue={['surface', 'perlin']} className="w-full">
              <AccordionItem value="surface">
                <AccordionTrigger>Surface</AccordionTrigger>
                <AccordionContent>
                  <SurfaceSection />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="perlin">
                <AccordionTrigger>Noise</AccordionTrigger>
                <AccordionContent>
                  <PerlinSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="effects">
            <Accordion type="multiple" defaultValue={['glow', 'corona', 'flares']} className="w-full">
              <AccordionItem value="glow">
                <AccordionTrigger>Glow</AccordionTrigger>
                <AccordionContent>
                  <GlowSection />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="corona">
                <AccordionTrigger>Corona Rays</AccordionTrigger>
                <AccordionContent>
                  <CoronaSection />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="flares">
                <AccordionTrigger>Solar Flares</AccordionTrigger>
                <AccordionContent>
                  <FlaresSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="lights">
            <LightsSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
