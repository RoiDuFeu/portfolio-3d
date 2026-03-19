# 🚀 Planètes Photoréalistes - Documentation Technique

## Vue d'ensemble

Trois composants photoréalistes ajoutés au portfolio-3d utilisant des textures haute-résolution et des shaders GLSL custom :

- **Earth** (déjà existant) : texture 2K + clouds + atmosphere + normal mapping
- **Moon** (nouveau) : texture 2K + **normal map 8K** pour cratères ultra-détaillés
- **Saturn** (nouveau) : texture 2K + anneaux translucides avec UV mapping radial

## 📁 Architecture

```
src/
├── components/planets/
│   ├── EarthPlanet.tsx         (existant - photoréaliste)
│   ├── RealisticMoon.tsx       (nouveau)
│   ├── RealisticSaturn.tsx     (nouveau)
│   └── SaturnPlanet.tsx        (procédural pour galaxie)
│
├── shaders/
│   ├── earth/                  (existant)
│   │   ├── surface.vert
│   │   ├── surface.frag        (perturbNormal2Arb pour normal mapping)
│   │   ├── clouds.vert/frag
│   │   └── atmosphere.vert/frag
│   │
│   ├── moon/                   (nouveau)
│   │   ├── surface.vert
│   │   └── surface.frag        (réutilise perturbNormal2Arb d'Earth)
│   │
│   ├── saturn/                 (nouveau - photoréaliste)
│   │   ├── surface.vert
│   │   └── surface.frag
│   │
│   └── saturn-procedural.frag  (nouveau - pour galaxie)
│
├── pages/
│   └── RealisticPlanetsPage.tsx (nouveau - page de test)
│
└── utils/
    └── planetPresets.ts        (export PHOTOREALISTIC_PRESETS ajouté)
```

## 🌙 Moon - Détails techniques

### Textures
- **Albedo** : `/textures/moon/Moon.jpg` (2048×1024)
- **Normal map** : `/textures/moon/Moon normal map.jpg` (8192×4096) 🔥

### Shader features
- **Normal mapping tangent-space** : fonction `perturbNormal2Arb()` réutilisée d'EarthPlanet
- **Diffuse lighting** : pas de specular (surface mate/poudreuse)
- **Ambient light** : 15% pour visibilité (pas d'atmosphère)
- **Rotation** : 0.001 rad/frame (lente, comme tidally-locked)

### Props
```typescript
interface RealisticMoonProps {
  position: [number, number, number]
  scale?: number  // default: 1
}
```

## 🪐 Saturn - Détails techniques

### Architecture 2-layers
1. **Planète** : sphere avec texture bands
2. **Anneaux** : RingGeometry avec UV mapping radial custom

### Textures
- **Planète** : `/textures/saturn/Saturn.jpg` (2048×1024)
- **Rings** : `/textures/saturn/Saturn's rings.png` (125×2048, gradient vertical)

### UV Mapping rings (crucial !)
```typescript
const ringGeometry = new THREE.RingGeometry(2.2 * scale, 3.5 * scale, 64, 1)

// Custom radial UV mapping (sinon texture mal mappée)
const uvs: number[] = []
for (let i = 0; i <= 64; i++) {
  uvs.push(i / 64, 1)  // inner edge
  uvs.push(i / 64, 0)  // outer edge
}
ringGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
```

### Shader features
- **Planète** : diffuse lighting simple (pas de specular, planète gazeuse)
- **Rings** : 
  - Material : `MeshBasicMaterial` avec `transparent: true`
  - `side: THREE.DoubleSide` (visible des deux côtés)
  - `opacity: 0.9` (légèrement translucide)
  - Rotation : `rotation.x = Math.PI / 2` (horizontal)
  - Tilt : `rotation.z = 0.1` (inclinaison réaliste)

### Rotations indépendantes
```typescript
useFrame(() => {
  planetMeshRef.current.rotation.y += 0.001   // planète
  ringsMeshRef.current.rotation.z += 0.0005   // anneaux plus lents
})
```

### Props
```typescript
interface RealisticSaturnProps {
  position: [number, number, number]
  scale?: number  // default: 1
}
```

## 🔗 Intégration

### Option choisie : Nouveaux presets photoréalistes

Dans `src/utils/planetPresets.ts` :

```typescript
export interface PhotoRealisticPreset {
  type: 'photorealistic'
  component: 'EarthPlanet' | 'RealisticMoon' | 'RealisticSaturn'
  name: string
  scale: number
  description: string
}

export const PHOTOREALISTIC_PRESETS = {
  earth: {
    type: 'photorealistic',
    component: 'EarthPlanet',
    name: 'Earth (Photorealistic)',
    scale: 1.5,
    description: 'High-resolution Earth with cloud layers, normal mapping, and atmospheric scattering',
  },
  moon: {
    type: 'photorealistic',
    component: 'RealisticMoon',
    name: 'Moon (Photorealistic)',
    scale: 1.0,
    description: '8K normal-mapped lunar surface with authentic crater detail',
  },
  saturn: {
    type: 'photorealistic',
    component: 'RealisticSaturn',
    name: 'Saturn (Photorealistic)',
    scale: 2.0,
    description: 'Saturn with translucent ring system and band structures',
  },
}
```

### Page de test

**Route** : `http://localhost:5224/realistic-planets`

Affiche les 3 planètes côte à côte avec :
- Camera : `PerspectiveCamera` à `[0, 5, 15]`
- Lighting : `ambientLight(0.1)` + `directionalLight([10,10,10], 1.5)`
- Controls : `OrbitControls` avec damping

## 🎨 Qualité visuelle

### Moon ✅
- ✅ Cratères ultra-détaillés via normal map 8K
- ✅ Surface mate (pas de specular)
- ✅ Gris lunar authentique
- ⚠️ **Performance** : normal map 8K peut être lourd sur GPU faibles (potentiellement downscale à 4K si lag)

### Saturn ✅
- ✅ Anneaux translucides avec bandes visibles
- ✅ Rotation planète + rotation anneaux indépendantes
- ✅ Tilt des anneaux réaliste (0.1 rad ≈ 5.7°)
- ✅ Bandes de couleur sur planète (via texture)

### Earth ✅ (déjà existant)
- ✅ Clouds layer séparée
- ✅ Atmosphere glow
- ✅ Normal mapping continents
- ✅ Specular sur océans
- ✅ Night lights

## 🚦 État du projet

### ✅ Livrables complétés
1. ✅ `RealisticSaturn.tsx` + shaders `saturn/`
2. ✅ `RealisticMoon.tsx` + shaders `moon/`
3. ✅ Presets photoréalistes dans `planetPresets.ts`
4. ✅ Page de test `/realistic-planets`
5. ✅ Routing dans `App.tsx`
6. ✅ Shader procédural `saturn-procedural.frag` pour galaxie
7. ✅ Backward compatibility (Saturn procédural pour `PlanetRenderer`)

### ⚠️ Build status
- **Build TypeScript** : Erreurs pré-existantes (non liées aux nouveaux composants) :
  - `DustParticles.tsx` : BufferAttribute warnings
  - `StarField.tsx` : BufferAttribute warnings
  - `tsconfig` : `erasableSyntaxOnly` unknown option
  - Unused variables dans anciens composants

- **Dev server** : ✅ Fonctionne (`localhost:5224`)
- **Nouveaux composants** : ✅ Aucune erreur de compilation

## 🔧 Next steps (optionnel)

### Intégration Planet Studio
Pour intégrer les presets photoréalistes dans Planet Studio, ajouter :

1. **Type extension** dans `src/types/studio.ts` :
```typescript
renderMode: 'procedural' | 'photorealistic'
photoRealisticPreset: 'earth' | 'moon' | 'saturn' | null
```

2. **Conditional rendering** dans `StudioPlanet.tsx` :
```typescript
if (config.renderMode === 'photorealistic') {
  if (config.photoRealisticPreset === 'earth') 
    return <EarthPlanet position={[0,0,0]} scale={config.size} />
  if (config.photoRealisticPreset === 'moon') 
    return <RealisticMoon position={[0,0,0]} scale={config.size} />
  if (config.photoRealisticPreset === 'saturn') 
    return <RealisticSaturn position={[0,0,0]} scale={config.size} />
}
// Fallback : shader procédural
```

3. **UI Controls** : dropdown "Photorealistic Preset" dans `ModeControls.tsx`

### Performance optimizations
- [ ] Downscale Moon normal map de 8K à 4K si lag
- [ ] Lazy loading textures avec Suspense
- [ ] LOD (Level of Detail) pour rings Saturn selon distance camera

## 📝 Techniques réutilisables

### Normal mapping tangent-space
Fonction `perturbNormal2Arb()` dans `earth/surface.frag` et `moon/surface.frag` :
- Calcule tangent-space avec `dFdx`/`dFdy`
- Applique normal map en espace tangent
- **Réutilisable** pour toute planète avec relief détaillé

### Ring geometry UV mapping
Technique dans `RealisticSaturn.tsx` :
- **Crucial** pour mapper textures verticales (gradients) sur RingGeometry
- Loop de 0→64 segments : `(i/64, 1)` inner, `(i/64, 0)` outer
- **Réutilisable** pour tout système d'anneaux (Jupiter, Uranus, Neptun...)

### Shader modulaire
Structure séparée (`shaders/planet/`) permet :
- Maintenance facile
- Réutilisation de fragments (noise, perturbNormal, etc.)
- Pas de collision entre shaders procéduraux et photoréalistes

---

**🚀 Mission accomplie !** Saturn et Moon photoréalistes intégrés avec qualité visuelle top et architecture propre.
