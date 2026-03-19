# Earth Shaders - Technical Documentation

## Overview
Photorealistic Earth rendering system with 3-layer architecture adapted from [threejs-planets-tutorial-series](https://github.com/franky-adl/threejs-planets-tutorial-series).

## Architecture

### 1. Surface Shader (`surface.vert` + `surface.frag`)
**Purpose:** Main Earth surface with realistic lighting

**Features:**
- **Normal Mapping:** Tangent-space normal mapping using `perturbNormal2Arb()` function
  - Computes TBN matrix from screen-space derivatives (dFdx/dFdy)
  - Enhances surface detail without additional geometry
- **Diffuse Lighting:** Standard Lambertian diffuse with normal-mapped normals
- **Specular Reflections:**
  - Phong specular model (shininess: 20.0)
  - Warm specular color (1.0, 0.8, 0.3) simulating sun reflection
  - **Cloud Shadow Subtraction:** Specular strength reduced by cloud alpha channel
- **Night Lights:** City lights texture blended in shadowed areas
- **Day/Night Transition:** `smoothstep(-0.05, 0.05, ...)` creates smooth transition zone

**Uniforms:**
- `uWorldMap`: Diffuse color texture (World map.jpg)
- `uNormalMap`: Normal map for surface details
- `uSpecularMap`: Specular intensity map (oceans = bright)
- `uCloudCover`: Cloud texture (used for shadow casting)
- `uNightLights`: City lights texture
- `uLightDirection`: Directional light vector (normalized)

**Varyings:**
- `vUv`: Texture coordinates
- `vPixelPosition`: World-space position (for view calculations)
- `vNormal`: World-space normal
- `vVertexPosition`: Clip-space position (for derivative-based TBN)

### 2. Clouds Shader (`clouds.vert` + `clouds.frag`)
**Purpose:** Semi-transparent cloud layer with directional lighting

**Features:**
- **Alpha Transparency:** PNG cloud texture with alpha channel
- **Diffuse Lighting:** Simple Lambertian diffuse on cloud normals
- **Shadow Projection:** Cloud alpha used in surface shader to darken specular

**Uniforms:**
- `uCloudCover`: Cloud texture (Cloud cover.png)
- `uLightDirection`: Directional light vector

**Rendering Properties:**
- `transparent: true`
- `depthWrite: false` (prevents z-fighting with surface)

### 3. Atmosphere Shader (`atmosphere.vert` + `atmosphere.frag`)
**Purpose:** Blue atmospheric glow (rim lighting)

**Features:**
- **Edge Detection:** Fresnel-like effect using `1.0 - dot(vNormal, viewDirection)`
- **Directional Fade:** Atmosphere only visible on lit side
- **Smooth Falloff:** `smoothstep(0.0, 0.2, ...)` creates fuzzy edge

**Uniforms:**
- `uLightDirection`: Directional light vector

**Rendering Properties:**
- `transparent: true`
- `blending: THREE.AdditiveBlending` (glowing effect)
- `side: THREE.BackSide` (render inner surface for rim effect)
- `depthWrite: false`

## Adaptations from Vanilla Three.js

### Changes for React Three Fiber:
1. **Uniform Naming:** Prefixed with `u` (e.g., `uWorldMap`) for consistency
2. **Varying Naming:** Prefixed with `v` (e.g., `vUv`) following R3F conventions
3. **Auto-injected Uniforms:** `cameraPosition` available automatically in R3F shaders
4. **No Manual Uniform Updates:** R3F handles uniform synchronization
5. **ShaderMaterial vs RawShaderMaterial:** Using `shaderMaterial` for built-in uniforms

### Preserved Logic:
- `perturbNormal2Arb()` function (critical for normal mapping)
- Cloud shadow subtraction in specular calculation
- Day/night transition smoothstep thresholds
- Atmosphere edge detection math
- All texture sampling and lighting calculations

## Performance Considerations

- **High-res Textures:** 6000×3000 JPG textures loaded via `THREE.TextureLoader`
- **useMemo Optimization:** Textures and uniforms memoized to prevent re-creation
- **Geometry Complexity:** 64×64 sphere segments (balanced quality/performance)
- **No useFrame:** Static lighting (rotation handled by parent if needed)

## Light Direction

Current implementation uses static light direction:
```typescript
const lightDirection = new THREE.Vector3(1, 0, 0).normalize()
```

**To animate:** Pass dynamic `lightDirection` via props and update uniforms in parent component.

## Radius Layering

- **Surface:** `1.5 * scale`
- **Clouds:** `1.53 * scale` (+2% buffer to prevent z-fighting)
- **Atmosphere:** `1.55 * scale` (+3.3% for visible glow)

## Texture Requirements

All textures must be in `/public/textures/earth/`:
- `World map.jpg` (6000×3000)
- `Earth normal map.jpg` (6000×3000)
- `Earth specular map.jpg` (6000×3000)
- `Earth night lights.jpg` (6000×3000)
- `Cloud cover.png` (6000×3000, with alpha)

## References

- Original tutorial: [threejs-planets-tutorial-series](https://github.com/franky-adl/threejs-planets-tutorial-series)
- Shader source: `/tmp/threejs-planets-tuto/Shaders/`
- Normal mapping technique: Screen-space derivative-based TBN matrix
