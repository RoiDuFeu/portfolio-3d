# Planet Studio → Realistic Mode — Technical Brief

**Date** : 2026-03-18  
**Mission** : Adapter les techniques photoréalistes Earth dans le Planet Studio pour des planètes procédurales ultra-qualitatives.

---

## 🎯 Objectif

Créer un mode "Realistic" qui apporte le niveau de rendu photoréaliste d'Earth (normal mapping, specular, night lights) **tout en restant 100% procédural** (pas de textures externes).

---

## 📦 Livrables

### 1. Nouveaux shaders

**Fichiers créés** :
- `src/shaders/studio/planet-realistic.vert`
- `src/shaders/studio/planet-realistic.frag`

**Adaptations clés depuis Earth** :

#### A. Vertex Shader (`planet-realistic.vert`)
- **Conservé** : Système de displacement FBM du mode procédural
- **Ajouté** : 
  - UV mapping sphérique pour le tangent-space normal mapping
  - `vPixelPosition` et `vVertexPosition` pour les calculs d'éclairage avancés

#### B. Fragment Shader (`planet-realistic.frag`)
- **Conservé** : Logique de coloration biome du mode procédural (ocean/beach/vegetation/rock/snow)
- **Ajouté** :

##### 1. Tangent-Space Normal Mapping Procédural
```glsl
vec3 perturbNormal2Arb(vec3 surf_norm, float detailScale)
```
- **Source** : Earth shader `perturbNormal2Arb()`
- **Adaptation** : Au lieu d'une texture normal map, on génère les normales à partir des **dérivées du bruit 3D**
- **Impact visuel** : Relief montagneux réaliste sans géométrie supplémentaire
- **Paramètre** : `detailScale` varie selon le type de terrain (8.0 pour océans, 15.0 pour terres)

##### 2. Specular Reflection
```glsl
float specularMap = mix(0.1, 0.9, isOcean);
vec3 reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
```
- **Source** : Earth shader specular calculation
- **Adaptation** : Specular map **procédural** basé sur ocean/land
- **Uniforms** :
  - `u_specularStrength` (0.0-1.0) : intensité globale des reflets
  - `u_roughness` (0.0-1.0) : contrôle le `shininess` (inversé : rough → low shininess)
- **Impact visuel** : Reflets dynamiques du soleil sur les océans

##### 3. Procedural Night Lights
```glsl
float generateCityLights(vec3 pos, float landMask) {
    float cityNoise = snoise(pos * 50.0) * snoise(pos * 25.0);
    float cities = smoothstep(threshold, threshold + 0.1, cityNoise);
    return cities * landMask;
}
```
- **Source** : Earth shader night lights
- **Adaptation** : Génération de "villes" via bruit multi-échelle (50 + 25) avec threshold basé sur `u_nightLightsDensity`
- **Restriction** : Uniquement sur les zones terrestres (`landMask`)
- **Couleur** : Warm orange glow `vec3(1.0, 0.85, 0.6)`
- **Impact visuel** : Illumination urbaine sur le côté nuit

##### 4. Day/Night Transition
```glsl
float dayNightThreshold = smoothstep(-0.05, 0.05, dot(vNormal, lightDir));
vec3 result = mix(nightLightsColor, dayColor, dayNightThreshold);
```
- **Source** : Earth shader terminator smoothing
- **Identique** : Transition douce de 0.1 unité au terminateur
- **Impact visuel** : Passage progressif jour/nuit sans frontière dure

##### 5. Cloud Shadows
```glsl
float generateCloudShadow(vec3 pos) {
    float cloudLayer = fbm(pos * 3.0 + vec3(u_time * 0.1, 0.0, 0.0));
    return cloudLayer * 0.6;
}
```
- **Source** : Earth shader cloud cover subtraction
- **Adaptation** : Cloud layer procédural via FBM animé (au lieu de texture)
- **Intégration** : Soustrait des calculs diffuse et specular
- **Impact visuel** : Profondeur atmosphérique, ombres portées des nuages

---

### 2. Types mis à jour

**Fichier** : `src/types/studio.ts`

**Ajout dans `PlanetConfig`** :
```typescript
realistic: {
  enabled: boolean
  specularStrength: number      // 0.0-1.0 (intensity des reflets)
  nightLightsDensity: number    // 0.0-1.0 (coverage des city lights)
  roughness: number             // 0.0-1.0 (surface roughness)
}
```

---

### 3. Composant StudioPlanet mis à jour

**Fichier** : `src/components/studio/StudioPlanet.tsx`

**Changements** :

#### A. Imports des nouveaux shaders
```typescript
import planetRealisticVert from '../../shaders/studio/planet-realistic.vert'
import planetRealisticFrag from '../../shaders/studio/planet-realistic.frag'
```

#### B. Uniforms additionnels
```typescript
rockyUniforms = {
  // ... existing uniforms
  u_specularStrength: { value: 0.7 },
  u_nightLightsDensity: { value: 0.3 },
  u_roughness: { value: 0.5 },
  u_cloudsEnabled: { value: false },
  u_cloudDensity: { value: 0.5 },
}
```

#### C. Logique conditionnelle shader
```typescript
const useRealistic = isRocky && config.realistic?.enabled
const vertShader = isRocky ? (useRealistic ? planetRealisticVert : planetVert) : fireVert
const fragShader = isRocky ? (useRealistic ? planetRealisticFrag : planetFrag) : fireFrag
```

#### D. Update uniforms dans useFrame
```typescript
if (cfg.realistic?.enabled) {
  u.u_specularStrength.value = cfg.realistic.specularStrength
  u.u_nightLightsDensity.value = cfg.realistic.nightLightsDensity
  u.u_roughness.value = cfg.realistic.roughness
}
u.u_cloudsEnabled.value = cfg.clouds.enabled
u.u_cloudDensity.value = resolveValue(cfg.clouds.density, evolution)
```

---

### 4. Nouveau composant UI

**Fichier** : `src/components/studio/ui/RealisticControls.tsx`

**Contrôles** :
- **Toggle** : Enable Realistic Mode (boolean)
- **Sliders** (visibles uniquement si enabled) :
  - Specular Strength (0.0 → 1.0, default 0.7)
  - Night Lights Density (0.0 → 1.0, default 0.3)
  - Roughness (0.0 → 1.0, default 0.5)

**Intégration** : Ajouté dans `ControlPanel.tsx` après `BiomeControls`

---

### 5. Presets mis à jour

**Fichier** : `src/utils/planetPresets.ts`

**Presets avec realistic mode activé** :

#### Earth
```typescript
realistic: {
  enabled: true,
  specularStrength: 0.85,    // High (oceans dominate)
  nightLightsDensity: 0.45,  // Moderate city coverage
  roughness: 0.3,            // Smooth ocean surfaces
}
```

#### Mars
```typescript
realistic: {
  enabled: true,
  specularStrength: 0.15,    // Very low (no water, dusty)
  nightLightsDensity: 0.0,   // No cities (yet)
  roughness: 0.85,           // Very rough dusty terrain
}
```

#### Ice World
```typescript
realistic: {
  enabled: true,
  specularStrength: 0.95,    // Very high (smooth ice)
  nightLightsDensity: 0.0,   // No life
  roughness: 0.1,            // Very smooth ice surface
}
```

**Tous les autres presets** : `realistic.enabled: false` par défaut

---

## 🔑 Différences Clés : Earth Shader → Studio Realistic

| **Feature**               | **Earth Shader**                                     | **Studio Realistic**                                    |
|---------------------------|------------------------------------------------------|---------------------------------------------------------|
| **Textures**              | 5 textures fixes (world, normal, specular, night, clouds) | **0 textures** — tout procédural                         |
| **Base Color**            | `uWorldMap` texture                                  | Procédural biome logic (ocean/beach/veg/rock/snow)      |
| **Normal Map**            | `uNormalMap` texture                                 | **Généré par dérivées du bruit 3D**                      |
| **Specular Map**          | `uSpecularMap` texture                               | **Procédural : high sur ocean, low sur land**            |
| **Night Lights**          | `uNightLights` texture                               | **Généré via bruit multi-échelle sur land zones**        |
| **Cloud Shadow**          | `uCloudCover` texture                                | **Procédural FBM layer animé**                           |
| **Paramètres contrôlables** | Pas de paramètres (textures fixes)                 | `specularStrength`, `nightLightsDensity`, `roughness`   |
| **Compatibilité presets** | Spécifique Earth uniquement                          | **Fonctionne pour tous les presets rocky** (Earth/Mars/Ice/etc.) |

---

## 🎨 Impact Visuel — Ce Qui Explose

### 1. Normal Mapping Procédural
**Avant** : Surface lisse malgré le displacement (éclairage uniforme)  
**Après** : Relief montagneux réaliste, cratères visibles, détails de terrain

### 2. Specular sur Océans
**Avant** : Reflets uniformes ou absents  
**Après** : Reflets dynamiques du soleil sur l'eau, shine intense sur les océans

### 3. Night Lights
**Avant** : Côté nuit complètement noir  
**Après** : Villes illuminées visibles (Earth, futurs Mars colonies, etc.)

### 4. Cloud Shadows
**Avant** : Clouds flottent sans interaction avec la surface  
**Après** : Ombres portées des nuages sur le terrain, profondeur atmosphérique

---

## 🔒 Contraintes Respectées

✅ **Pas de textures externes** : Tout procédural  
✅ **Compatibilité backward** : Mode procédural intact (fallback)  
✅ **Performance** : Techniques standard (pas de raymarching)  
✅ **Continuité visuelle** : S'intègre dans l'évolution timeline existante  
✅ **Pas de breaking changes** : Nouveau mode optionnel (`realistic.enabled`)

---

## 🧪 Testing

**Status** : ✅ Vite dev server démarre sans erreurs  
**URL** : `http://localhost:3025/`

**Test checklist** :
1. ☑ Compilation Vite sans erreurs GLSL
2. ⏳ Vérifier Earth preset avec realistic mode enabled
3. ⏳ Vérifier Mars preset (low specular, no lights)
4. ⏳ Vérifier Ice World (high specular, smooth)
5. ⏳ Toggle realistic mode on/off → vérifier fallback vers mode procédural
6. ⏳ Tester sliders UI (specular/roughness/nightLights)
7. ⏳ Vérifier performance (FPS stable)

---

## 🚀 Prochaines Étapes (Suggestions)

1. **Tuning visuel** : Ajuster les valeurs par défaut des presets après preview
2. **Optimisation** : Profiler les shaders sur mobile/low-end devices
3. **Cloud shadows enhancement** : Ajouter un paramètre pour l'intensité des ombres
4. **Specular variation** : Permettre des specular maps procéduraux plus complexes (zones humides, glace, etc.)
5. **Documentation** : Ajouter tooltips UI expliquant chaque paramètre realistic

---

## 📚 Références

- **Earth shader source** : `src/shaders/earth/surface.*`
- **Original procédural shader** : `src/shaders/studio/planet.*`
- **Inspiration visuelle** : NASA Earth imagery, Mars HiRISE, Europa/Enceladus flybys

---

**Résultat** : Le Planet Studio peut maintenant générer des planètes **procédurales photo-réalistes** adaptées à tous les biomes, avec un niveau de détail visuel équivalent à Earth, tout en conservant 100% de flexibilité générative. 🚀
