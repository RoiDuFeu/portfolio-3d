# Galaxy Scene Architecture

## Component Hierarchy

```
GalaxyPage
├── ScrollContainer (invisible driver)
├── Scene (fixed canvas)
│   ├── Camera
│   ├── Lighting
│   ├── SpaceBackground
│   │   ├── Stars
│   │   ├── Nebula
│   │   └── Milky Way
│   ├── EnhancedSun ⭐ NEW
│   │   ├── Surface (IcoSphere 80 segments)
│   │   │   └── Procedural Shader (domain warping + FBM)
│   │   ├── Corona Layer 1 (IcoSphere 64 segments)
│   │   │   └── Ray Shader (12 rays, polar coords)
│   │   ├── Corona Layer 2 (IcoSphere 48 segments)
│   │   │   └── Ray Shader (8 rays, slower)
│   │   ├── Corona Layer 3 (IcoSphere 32 segments)
│   │   │   └── Ray Shader (6 rays, slowest)
│   │   ├── Volumetric Halo (IcoSphere 32 segments)
│   │   │   └── Glow Shader (animated noise)
│   │   └── Point Lights (×2)
│   ├── OrbitRings
│   └── PlanetRenderer (×8)
│       ├── Mercury (simple procedural)
│       ├── Venus (simple procedural)
│       ├── Earth → EarthPlanet ⭐ REALISTIC
│       │   ├── Surface (shader + textures)
│       │   ├── Clouds (animated alpha)
│       │   └── Atmosphere (backface glow)
│       ├── Mars → RealisticMars ⭐ REALISTIC
│       │   └── Procedural FBM (ridges + dust)
│       ├── Jupiter (simple procedural)
│       ├── Saturn → RealisticSaturn ⭐ REALISTIC
│       │   ├── Planet (shader + texture)
│       │   └── Rings (custom geometry + alpha)
│       ├── Uranus (simple procedural)
│       └── Neptune → MusicPlanet (project audio)
└── HUD (UI overlay)
```

---

## EnhancedSun Layer Stack (Front to Back)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│          Camera View                            │
│                                                 │
│  ┌────────────────────────────────┐             │
│  │  Volumetric Halo (11× radius) │ ← BackSide  │
│  │  └─ Exponential falloff        │   render   │
│  │     └─ Animated noise          │   order -1 │
│  └────────────────────────────────┘             │
│                                                 │
│     ┌─────────────────────────┐                 │
│     │ Outer Corona (4× radius)│ ← BackSide     │
│     │ └─ 6 rays, slow rotation│   additive     │
│     └─────────────────────────┘   blending     │
│                                                 │
│        ┌──────────────────┐                     │
│        │ Mid Corona (2.2×)│ ← BackSide          │
│        │ └─ 8 rays, medium│   additive          │
│        └──────────────────┘                     │
│                                                 │
│          ┌────────────┐                         │
│          │Inner Corona│ ← BackSide              │
│          │ (1.3× rad) │   additive              │
│          │ └─ 12 rays │                         │
│          └────────────┘                         │
│                                                 │
│            ╔════════╗                           │
│            ║ SURFACE║ ← Opaque                  │
│            ║  (1.0×)║   solid                   │
│            ║  Core  ║                           │
│            ╚════════╝                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Rendering Order:**
1. Halo (behind everything, renderOrder -1)
2. Outer corona (BackSide, additive)
3. Mid corona (BackSide, additive)
4. Inner corona (BackSide, additive)
5. Surface (opaque, final layer)

**Why BackSide?** Renders only the back-facing triangles, creating perfect volumetric shells that don't obscure the surface.

---

## Shader Data Flow

### Surface Shader

```
Input:
├── position (vertex)
├── normal (vertex)
├── uv (vertex)
└── uniforms
    ├── uTime
    ├── uCoreColor
    ├── uMidColor
    └── uEdgeColor

Processing:
├── Domain warp coordinates
├── Multi-layer noise (conv1 + conv2 + gran)
├── Solar flare hotspots
├── Color gradient mapping
├── Fresnel rim calculation
└── Pulsation modulation

Output:
└── RGB color (HDR 1.4× intensity)
```

### Corona Shader

```
Input:
├── vWorldPosition (from vertex)
├── vNormal (from vertex)
└── uniforms
    ├── uTime
    ├── uRadius
    ├── uColor
    ├── uIntensity
    └── uRayCount

Processing:
├── Polar coordinates (atan, length)
├── Ray pattern (sin(angle × count)^3)
├── Noise variation (FBM along rays)
├── Fresnel effect (view angle)
└── Radial falloff

Output:
└── RGBA (color + alpha for additive blend)
```

### Halo Shader

```
Input:
├── vWorldPosition
└── uniforms
    ├── uSunRadius
    ├── uHaloRadius
    └── uTime

Processing:
├── Distance calculation
├── Normalized radius
├── Exponential falloff (smoothstep + pow)
├── Animated noise variation
└── Color gradient

Output:
└── RGBA (subtle orange-yellow glow)
```

---

## Planet Renderer Logic

```typescript
function renderPlanet(body: SolarBody, size: number) {
  // Priority 1: Project planets (interactive)
  if (body.projectId) {
    switch (body.projectId) {
      case 'fertiscale':
        return <EarthPlanet ... />      // Realistic
      case 'godsplan':
        return <RealisticMars ... />    // Realistic
      case 'lesyndrome':
        return <MusicPlanet ... />      // Audio
    }
  }

  // Priority 2: Decorative planets
  switch (body.name) {
    case 'earth':
      return <EarthPlanet ... />        // Realistic fallback
    case 'mars':
      return <RealisticMars ... />      // Realistic fallback
    case 'saturn':
      return <RealisticSaturn ... />    // Realistic
    default:
      return <SimplePlanet ... />       // Procedural
  }
}
```

**Scale Normalization:**  
Realistic components expect `scale` prop (1.0 = 1.5 units).  
Simple components expect `size` prop (direct radius).  
Conversion: `scale = size / 1.5`

---

## Performance Budget

### Triangle Allocation

| Component | Segments | Triangles | % of Total |
|-----------|----------|-----------|------------|
| Sun surface | 80 | ~3,800 | 43% |
| Corona 1 | 64 | ~2,400 | 27% |
| Corona 2 | 48 | ~1,400 | 16% |
| Corona 3 | 32 | ~600 | 7% |
| Halo | 32 | ~600 | 7% |
| **Total Sun** | — | **~8,800** | **100%** |

**Planet Budget (per planet):**
- Realistic: 2,000-4,000 tris (multi-layer)
- Simple: 500-1,000 tris (single sphere)
- **Total scene:** ~30,000-40,000 tris

**Comfortable for 60+ FPS on mid-range GPUs.**

---

## Shader Uniform Updates (Per Frame)

```typescript
useFrame((state) => {
  const t = state.clock.elapsedTime

  // Surface rotation
  surfaceRef.current.rotation.y += 0.0005

  // Time uniforms (independent speeds)
  surfaceMaterial.uTime = t
  corona1.uTime = t
  corona2.uTime = t * 0.8    // 20% slower
  corona3.uTime = t * 0.6    // 40% slower
  halo.uTime = t
})
```

**Why different speeds?**  
Creates **parallax effect** and depth perception as layers rotate independently.

---

## Texture Loading Strategy

### Earth (Multi-Layer)
```typescript
const [worldMap, normalMap, specularMap, nightLights, cloudCover] = 
  useLoader(THREE.TextureLoader, [
    '/textures/earth/World map.jpg',
    '/textures/earth/Earth normal map.jpg',
    '/textures/earth/Earth specular map.jpg',
    '/textures/earth/Earth night lights.jpg',
    '/textures/earth/Cloud cover.png',
  ])
```

**Load time:** ~500ms for 6 textures (2K resolution)  
**Caching:** Three.js TextureLoader caches automatically

### Saturn (Planet + Rings)
```typescript
const [saturnTexture, ringsTexture] = useLoader(THREE.TextureLoader, [
  '/textures/saturn/Saturn.jpg',
  "/textures/saturn/Saturn's rings.png",
])
```

**Custom ring geometry:**  
Radial UV mapping for proper texture orientation.

---

## Additive Blending Explained

```typescript
blending={THREE.AdditiveBlending}
depthWrite={false}
```

**How it works:**
1. Fragment color is **added** to framebuffer (not replaced)
2. Multiple corona layers **accumulate** brightness
3. `depthWrite: false` prevents occlusion conflicts
4. Result: Soft, glowing, layered effect

**Color Math:**
```
finalColor = backgroundColor + coronaColor
```

If 3 corona layers overlap:
```
result = bg + corona1 + corona2 + corona3
```

Creates **realistic light accumulation** similar to HDR photography.

---

## Data Flow Summary

```
solarBodies (data)
    ↓
GalaxyPage.tsx (scroll driver)
    ↓
Scene.tsx (composition)
    ↓
┌──────────────┬──────────────────┐
│              │                  │
EnhancedSun    PlanetRenderer     Other
(hardcoded)    (data-driven loop) (static)
    ↓               ↓
  Shaders      Route by name/project
    ↓               ↓
  Uniforms     Realistic or Simple
    ↓               ↓
useFrame       Component-specific
(animate)      (props)
```

---

## File Organization

```
portfolio-3d/
├── src/
│   ├── pages/
│   │   └── GalaxyPage.tsx          (top-level page)
│   ├── components/
│   │   ├── canvas/
│   │   │   └── Scene.tsx           (composition layer)
│   │   └── planets/
│   │       ├── EnhancedSun.tsx     ⭐ NEW
│   │       ├── PlanetRenderer.tsx  ⭐ UPDATED
│   │       ├── EarthPlanet.tsx
│   │       ├── RealisticMars.tsx
│   │       ├── RealisticSaturn.tsx
│   │       └── ... (simple planets)
│   ├── shaders/
│   │   ├── earth/
│   │   ├── moon/
│   │   └── saturn/
│   ├── data/
│   │   └── solarSystem.ts          (planet config)
│   └── types/
│       └── index.ts                (TypeScript defs)
└── public/
    └── textures/
        ├── earth/
        ├── moon/
        └── saturn/
```

---

**This architecture delivers modular, maintainable, and performant 3D solar system rendering.**
