import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../../shaders/stars.vert'
import fragmentShader from '../../shaders/stars.frag'

/**
 * Realistic stellar color temperature to RGB.
 * Based on Planck black-body approximation.
 * temp: 2000K (red dwarf) → 10000K (blue-white)
 */
function starColor(temp: number): THREE.Color {
  const color = new THREE.Color()
  if (temp < 3500) {
    // Red/orange dwarfs (M, K type)
    color.setRGB(1.0, 0.5 + (temp - 2000) / 3000, 0.2 + (temp - 2000) / 5000)
  } else if (temp < 5500) {
    // Yellow/white (G, F type — sun-like)
    const t = (temp - 3500) / 2000
    color.setRGB(1.0, 0.85 + t * 0.15, 0.6 + t * 0.35)
  } else if (temp < 8000) {
    // White (A type)
    const t = (temp - 5500) / 2500
    color.setRGB(0.9 + t * 0.1, 0.9 + t * 0.1, 1.0)
  } else {
    // Blue-white (B, O type)
    const t = Math.min((temp - 8000) / 4000, 1)
    color.setRGB(0.7 - t * 0.1, 0.8 - t * 0.1, 1.0)
  }
  return color
}

interface StarLayerProps {
  count: number
  radiusMin: number
  radiusMax: number
  sizeRange: [number, number]
  brightnessRange: [number, number]
  tempRange: [number, number]
}

function StarLayer({
  count,
  radiusMin,
  radiusMax,
  sizeRange,
  brightnessRange,
  tempRange,
}: StarLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { gl } = useThree()

  const [positions, colors, sizes, offsets, brightnesses] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const offsets = new Float32Array(count)
    const brightnesses = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Spherical distribution
      const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      // Realistic brightness distribution: most stars are dim
      // Power law — few bright, many faint
      const rawBright = Math.pow(Math.random(), 3)
      const brightness =
        brightnessRange[0] + rawBright * (brightnessRange[1] - brightnessRange[0])
      brightnesses[i] = brightness

      // Color temperature — brighter stars tend to be hotter
      const tempBias = brightness * 0.6 + Math.random() * 0.4
      const temp =
        tempRange[0] + tempBias * (tempRange[1] - tempRange[0])
      const c = starColor(temp)
      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b

      // Size correlated with brightness
      sizes[i] =
        sizeRange[0] +
        brightness * (sizeRange[1] - sizeRange[0]) +
        Math.random() * 0.5
      offsets[i] = Math.random()
    }

    return [positions, colors, sizes, offsets, brightnesses]
  }, [count, radiusMin, radiusMax, sizeRange, brightnessRange, tempRange])

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_pixelRatio: { value: gl.getPixelRatio() },
    }),
    [gl]
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aOffset" count={count} array={offsets} itemSize={1} />
        <bufferAttribute attach="attributes-aBrightness" count={count} array={brightnesses} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
      />
    </points>
  )
}

export function StarField() {
  return (
    <>
      {/* Background dim stars — very dense, faint carpet */}
      <StarLayer
        count={12000}
        radiusMin={150}
        radiusMax={300}
        sizeRange={[0.3, 1.2]}
        brightnessRange={[0.1, 0.4]}
        tempRange={[2500, 6000]}
      />
      {/* Mid-field stars — moderate density and brightness */}
      <StarLayer
        count={4000}
        radiusMin={80}
        radiusMax={180}
        sizeRange={[0.8, 2.5]}
        brightnessRange={[0.3, 0.7]}
        tempRange={[3000, 8000]}
      />
      {/* Foreground bright stars — sparse, vivid */}
      <StarLayer
        count={800}
        radiusMin={50}
        radiusMax={120}
        sizeRange={[1.5, 5.0]}
        brightnessRange={[0.6, 1.0]}
        tempRange={[4000, 12000]}
      />
    </>
  )
}
