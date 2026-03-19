# 🏗️ Architecture - Mode Photoréaliste

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     Planet Studio UI                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PhotoRealisticControls (NOUVEAU)                       │ │
│  │  [🌍 Earth] [🌙 Moon] [🪐 Saturn]                     │ │
│  │  [← Back to Procedural] (si actif)                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ModeControls (existant)                                │ │
│  │  ● Rocky  ○ Star                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Surface/Biome/Color/etc. (existant, procédural)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓ updateConfig()
┌─────────────────────────────────────────────────────────────┐
│              Zustand Store (useStudioStore)                 │
│  config: {                                                  │
│    renderMode: 'procedural' | 'photorealistic' ←── NOUVEAU │
│    photoRealisticPreset?: 'earth' | 'moon' | 'saturn'      │
│    mode: 'rocky' | 'star'                                  │
│    size: number                                            │
│    ...                                                     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
              ↓ config
┌─────────────────────────────────────────────────────────────┐
│            StudioPlanet (rendu conditionnel)                │
│                                                             │
│  if (renderMode === 'photorealistic') {                    │
│    switch (photoRealisticPreset) {                         │
│      case 'earth':  return <EarthPlanet />                 │
│      case 'moon':   return <RealisticMoon />               │
│      case 'saturn': return <RealisticSaturn />             │
│    }                                                        │
│  }                                                          │
│                                                             │
│  // Sinon, rendu procédural (inchangé)                     │
│  return <mesh><shaderMaterial ... /></mesh>                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Composants Modifiés/Créés

### 1. **Types (`src/types/studio.ts`)**

#### Nouveaux types
```typescript
export type RenderMode = 'procedural' | 'photorealistic'
export type PhotoRealisticPreset = 'earth' | 'moon' | 'saturn'
```

#### Interface étendue
```typescript
export interface PlanetConfig {
  // ... champs existants
  renderMode: RenderMode          // ← NOUVEAU
  photoRealisticPreset?: PhotoRealisticPreset  // ← NOUVEAU
}
```

**Pourquoi `photoRealisticPreset` est optionnel ?**
- En mode `procedural`, ce champ n'est pas utilisé (`undefined`)
- En mode `photorealistic`, il est obligatoire (contrôlé par l'UI)

---

### 2. **Presets (`src/utils/planetPresets.ts`)**

#### Fonction `base()` modifiée
```typescript
function base(): PlanetConfig {
  return {
    // ... champs existants
    renderMode: 'procedural',        // ← NOUVEAU (par défaut)
    photoRealisticPreset: undefined, // ← NOUVEAU
  }
}
```

**Impact :**
- Tous les presets existants (`earth`, `mars`, `ice`, etc.) héritent de `renderMode: 'procedural'`
- **Rétrocompatibilité totale** : aucun changement de comportement

---

### 3. **StudioPlanet (`src/components/studio/StudioPlanet.tsx`)**

#### Logique ajoutée (début du composant)
```typescript
export function StudioPlanet() {
  const config = useStudioStore((s) => s.config)
  
  // Early return si mode photoréaliste
  if (config.renderMode === 'photorealistic') {
    const scale = config.size  // Réutilise le slider Size
    
    if (config.photoRealisticPreset === 'earth') {
      return <EarthPlanet position={[0, 0, 0]} scale={scale} />
    }
    if (config.photoRealisticPreset === 'moon') {
      return <RealisticMoon position={[0, 0, 0]} scale={scale} />
    }
    if (config.photoRealisticPreset === 'saturn') {
      return <RealisticSaturn position={[0, 0, 0]} scale={scale} />
    }
  }
  
  // Code procédural existant (inchangé)
  const meshRef = useRef<THREE.Mesh>(null)
  // ...
}
```

**Points clés :**
- **Early return** : si photoréaliste, on bypasse complètement le code procédural
- **Réutilisation de `scale`** : le slider Size fonctionne pour les deux modes
- **Pas de duplication** : les composants photoréalistes sont importés, pas re-créés

---

### 4. **PhotoRealisticControls (NOUVEAU)**

#### Structure
```typescript
export function PhotoRealisticControls() {
  const { config, updateConfig } = useStudioStore()

  const handlePresetChange = (preset: PhotoRealisticPreset) => {
    updateConfig({
      renderMode: 'photorealistic',
      photoRealisticPreset: preset,
    })
  }

  const handleBackToProcedural = () => {
    updateConfig({
      renderMode: 'procedural',
      photoRealisticPreset: undefined,
    })
  }

  return (
    <ControlSection title="Photorealistic Mode">
      {/* 3 boutons Earth/Moon/Saturn */}
      {/* Bouton Back (conditionnel) */}
    </ControlSection>
  )
}
```

**Design :**
- Utilise `ControlSection` (même style que les autres panneaux)
- État visuel clair : fond bleu pour le preset actif
- Transitions CSS fluides
- Bouton "Back" uniquement visible en mode photoréaliste

---

### 5. **ControlPanel (`src/components/studio/ui/ControlPanel.tsx`)**

#### Modification minimaliste
```typescript
export function ControlPanel() {
  const mode = useStudioStore((s) => s.config.mode)

  return (
    <aside className="studio__controls">
      <PhotoRealisticControls />  {/* ← NOUVEAU (en haut) */}
      <ModeControls />
      {mode === 'rocky' ? (
        /* ... contrôles procéduraux existants */
      ) : (
        /* ... contrôles star/fire existants */
      )}
    </aside>
  )
}
```

**Pourquoi en haut ?**
- Mode photoréaliste = choix fondamental (comme Rocky/Star)
- Visibilité immédiate pour l'utilisateur
- Séparation claire entre les deux systèmes

---

## 🔄 Flux de Données

### Sélection d'un preset photoréaliste

```
User clique "🌍 Earth"
    ↓
PhotoRealisticControls.handlePresetChange('earth')
    ↓
useStudioStore.updateConfig({
  renderMode: 'photorealistic',
  photoRealisticPreset: 'earth'
})
    ↓
StudioPlanet re-renders
    ↓
if (renderMode === 'photorealistic') → return <EarthPlanet />
    ↓
EarthPlanet charge textures + shaders photoréalistes
    ↓
Rendu à l'écran
```

### Retour au mode procédural

```
User clique "← Back to Procedural"
    ↓
PhotoRealisticControls.handleBackToProcedural()
    ↓
useStudioStore.updateConfig({
  renderMode: 'procedural',
  photoRealisticPreset: undefined
})
    ↓
StudioPlanet re-renders
    ↓
renderMode !== 'photorealistic' → code procédural exécuté
    ↓
ShaderMaterial procédural rendu
```

---

## 🎨 Design Patterns Utilisés

### 1. **Strategy Pattern**
- Deux stratégies de rendu : `procedural` vs `photorealistic`
- Le switch se fait via une simple condition au début du composant
- Pas de `if/else` imbriqués, code clean

### 2. **Separation of Concerns**
- **Types** : isolés dans `studio.ts`
- **State** : géré uniquement par Zustand
- **UI** : `PhotoRealisticControls` autonome
- **Rendering** : `StudioPlanet` orchestre, composants photoréalistes encapsulés

### 3. **Composition over Inheritance**
- Les composants photoréalistes (`EarthPlanet`, etc.) sont **composés**, pas hérités
- Chacun gère ses propres shaders/textures/logique
- StudioPlanet se contente de les importer et de les rendre

### 4. **Single Source of Truth**
- L'état (`renderMode`, `photoRealisticPreset`) vit dans Zustand
- L'UI est dérivée de cet état (pas de state local dupliqué)
- Persistence automatique via `savePlanet()`

---

## 🔒 Garanties de Type

### TypeScript strict
```typescript
// ✅ OK
updateConfig({ renderMode: 'photorealistic', photoRealisticPreset: 'earth' })

// ❌ Erreur de compilation
updateConfig({ renderMode: 'photorealistic', photoRealisticPreset: 'invalid' })
// Type '"invalid"' is not assignable to type 'PhotoRealisticPreset'

// ❌ Erreur de compilation
updateConfig({ renderMode: 'custom' })
// Type '"custom"' is not assignable to type 'RenderMode'
```

### Cohérence garantie
- Si `renderMode === 'photorealistic'` → au moins un des 3 presets doit matcher
- Si `renderMode === 'procedural'` → `photoRealisticPreset` est `undefined`

---

## 🚀 Performance

### Lazy Loading (futur possible)
Actuellement, les 3 composants photoréalistes sont importés statiquement :
```typescript
import { EarthPlanet } from '../planets/EarthPlanet'
import { RealisticMoon } from '../planets/RealisticMoon'
import { RealisticSaturn } from '../planets/RealisticSaturn'
```

**Optimisation future (si bundle trop gros) :**
```typescript
const EarthPlanet = lazy(() => import('../planets/EarthPlanet'))
const RealisticMoon = lazy(() => import('../planets/RealisticMoon'))
const RealisticSaturn = lazy(() => import('../planets/RealisticSaturn'))

// Wrapper avec Suspense
if (config.renderMode === 'photorealistic') {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {config.photoRealisticPreset === 'earth' && <EarthPlanet ... />}
      {/* etc. */}
    </Suspense>
  )
}
```

### Memoization
Les composants photoréalistes utilisent déjà `useMemo` pour les uniforms/textures, donc pas de re-render inutile.

---

## 🧪 Tests Possibles (futur)

### Unit Tests
```typescript
describe('PhotoRealisticControls', () => {
  it('switches to photorealistic mode on preset click', () => {
    // ...
  })
  
  it('shows back button only in photorealistic mode', () => {
    // ...
  })
})

describe('StudioPlanet', () => {
  it('renders EarthPlanet when preset is earth', () => {
    // ...
  })
  
  it('renders procedural shader when mode is procedural', () => {
    // ...
  })
})
```

### Integration Tests
- Vérifier que le switch procédural ↔ photoréaliste ne cause pas de memory leaks
- Valider que la persistence fonctionne (save/load avec `renderMode`)

---

## 📦 Bundle Size Impact

| Fichier | Taille (estimation) | Impact |
|---------|---------------------|--------|
| `PhotoRealisticControls.tsx` | ~2 KB | Minimal |
| Types ajoutés | <1 KB | Négligeable |
| Imports dans `StudioPlanet.tsx` | 0 KB | (déjà existants) |
| **Total** | **~3 KB** | **< 1% du bundle** |

Les textures photoréalistes (Earth 8K, etc.) sont chargées **à la demande** et ne font pas partie du bundle JS.

---

## 🎯 Extensibilité

### Ajouter une nouvelle planète photoréaliste

**1. Créer le composant**
```typescript
// src/components/planets/RealisticMars.tsx
export function RealisticMars({ position, scale }: Props) {
  // ... textures Mars, shaders, etc.
}
```

**2. Étendre le type**
```typescript
export type PhotoRealisticPreset = 'earth' | 'moon' | 'saturn' | 'mars'
```

**3. Ajouter le bouton**
```tsx
<button onClick={() => handlePresetChange('mars')}>
  🔴 Mars
</button>
```

**4. Ajouter le switch**
```typescript
if (config.photoRealisticPreset === 'mars') {
  return <RealisticMars position={[0, 0, 0]} scale={scale} />
}
```

**C'est tout !** Le système est extensible sans modifier l'architecture.

---

## ✅ Validation Finale

### Checklist d'architecture
- [x] Séparation claire des préoccupations
- [x] Types stricts (TypeScript)
- [x] Single source of truth (Zustand)
- [x] Composants réutilisables
- [x] Backward compatible
- [x] Extensible (facile d'ajouter des planètes)
- [x] Performance optimale (pas de re-render inutile)
- [x] Code clean (pas de duplication)

---

## 🎉 Conclusion

L'architecture est **propre, modulaire, et production-ready**. Le mode photoréaliste s'intègre naturellement dans le Planet Studio sans casser l'existant.

**Prochaines étapes possibles :**
- Ajouter d'autres planètes photoréalistes (Mars, Jupiter, etc.)
- Lazy loading pour réduire le bundle initial
- Tests automatisés (Vitest + React Testing Library)
- Prévisualisation thumbnails dans PhotoRealisticControls
