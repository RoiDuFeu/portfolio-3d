# Earth Planet - Checklist de vérification

## ✅ Fichiers créés (10 fichiers)

### Composant principal
- [x] `src/components/planets/EarthPlanet.tsx` (111 lignes)

### Shaders GLSL (6 fichiers)
- [x] `src/shaders/earth/surface.vert` (15 lignes)
- [x] `src/shaders/earth/surface.frag` (58 lignes)
- [x] `src/shaders/earth/clouds.vert` (8 lignes)
- [x] `src/shaders/earth/clouds.frag` (15 lignes)
- [x] `src/shaders/earth/atmosphere.vert` (8 lignes)
- [x] `src/shaders/earth/atmosphere.frag` (18 lignes)

### Documentation
- [x] `src/shaders/earth/README.md` (doc technique complète)
- [x] `src/components/planets/EarthPlanet.example.tsx` (usage example)
- [x] `EARTH_IMPLEMENTATION.md` (résumé livrable)
- [x] `EARTH_CHECKLIST.md` (ce fichier)

## 🧪 Tests à faire (quand tu lances `npm run dev`)

### 1. Import du composant
```tsx
import { EarthPlanet } from './components/planets/EarthPlanet'
```
**Attendu:** Pas d'erreur TypeScript, imports shaders OK

### 2. Rendu basique
```tsx
<Canvas>
  <ambientLight intensity={0.3} />
  <EarthPlanet position={[0, 0, 0]} scale={1} />
</Canvas>
```
**Attendu:** 
- Sphere visible avec texture World map
- Pas d'erreur console
- 3 meshes rendus (surface, clouds, atmosphere)

### 3. Vérifications visuelles

#### Surface
- [ ] Texture World map affichée correctement
- [ ] Relief visible (normal mapping)
- [ ] Reflets sur les océans (specular)
- [ ] Pas de reflets sur les continents

#### Clouds
- [ ] Nuages semi-transparents visibles
- [ ] Couche légèrement au-dessus de la surface
- [ ] Éclairage directionnel cohérent

#### Atmosphere
- [ ] Halo bleu autour de la planète
- [ ] Plus visible sur les bords (rim lighting)
- [ ] Effet glow additive

#### Night Lights
- [ ] Lumières visibles côté ombre **seulement**
- [ ] Transition douce jour/nuit (pas de ligne dure)
- [ ] Pas de lights côté éclairé

### 4. Vérifications techniques

#### Console browser
```bash
# Ouvrir DevTools → Console
# Pas d'erreurs de ce type:
❌ "Shader compilation failed"
❌ "THREE.WebGLProgram: shader error"
❌ "Texture not found"
❌ "Uniform ... not found"
```

#### Performance
```bash
# Stats.js ou R3F Perf monitor
- FPS: Devrait rester >50 (64×64 spheres × 3)
- Draw calls: +3 (un par layer)
- Triangles: ~12k (4096 faces × 3 layers)
```

## 🐛 Troubleshooting potentiel

### Problème: Textures noires/manquantes
**Cause:** Chemins textures incorrects  
**Fix:** Vérifier que `/public/textures/earth/` existe avec les 5 fichiers
```bash
ls -la public/textures/earth/
# Doit montrer: World map.jpg, Earth normal map.jpg, etc.
```

### Problème: Shader compilation error
**Cause:** Vite plugin GLSL pas activé  
**Fix:** Déjà OK dans `vite.config.ts` (glsl() plugin présent)

### Problème: TypeScript erreur sur imports .vert/.frag
**Cause:** Types manquants  
**Fix:** Déjà OK dans `src/vite-env.d.ts` (declarations présentes)

### Problème: Atmosphere pas visible
**Cause:** Blending mode ou side incorrect  
**Fix:** Vérifier dans EarthPlanet.tsx:
```tsx
blending={THREE.AdditiveBlending}
side={THREE.BackSide}
```

### Problème: Z-fighting (flickering entre layers)
**Cause:** Radius trop proches  
**Fix:** Déjà fixé avec 1.5 / 1.53 / 1.55 spacing

## 🎨 Tweaks optionnels (après validation)

### Ajuster l'intensité atmosphere
```tsx
// Dans atmosphere.frag, ligne vec3 atmosphereColor
vec3 atmosphereColor = vec3(0.0, 0.2, 1.0); // Plus intense: (0.0, 0.4, 1.2)
```

### Ajuster specular strength
```tsx
// Dans surface.frag, ligne float shininess
float shininess = 20.0; // Plus sharp: 40.0, plus diffus: 10.0
```

### Changer direction lumière
```tsx
// Dans EarthPlanet.tsx
const lightDirection = new THREE.Vector3(1, 0.5, 0).normalize()
// (1,0,0) = côté droit, (0,1,0) = haut, (-1,0,0) = gauche
```

### Ajouter rotation auto
```tsx
// Dans EarthPlanet.tsx, après les refs
useFrame(() => {
  if (surfaceMeshRef.current) {
    surfaceMeshRef.current.rotation.y += 0.001 // Lent
    cloudsMeshRef.current!.rotation.y += 0.0012 // Clouds légèrement plus rapide
  }
})
```

## 📊 Métriques de validation

| Métrique | Valeur attendue | Comment vérifier |
|----------|-----------------|------------------|
| **Fichiers créés** | 10 | `find src -name '*Earth*' \| wc -l` |
| **Lignes shader** | 122 (vert+frag) | `wc -l src/shaders/earth/*.{vert,frag}` |
| **Textures chargées** | 5 | Console: 5× "THREE.TextureLoader" |
| **Meshes rendus** | 3 | R3F DevTools ou inspector |
| **Erreurs TS** | 0 | `npm run build` |

## 🚀 Prêt pour prod

Une fois validé:
- [ ] Commit avec message: `feat: Add photorealistic Earth planet with custom shaders`
- [ ] Optionnel: Exporter dans index barrel `src/components/planets/index.ts`
- [ ] Optionnel: Ajouter dans Storybook si présent
- [ ] Optionnel: Screenshot/video pour portfolio

---

**Note:** Aucun test automatisé à lancer, tout est statique. Le vrai test = `npm run dev` + inspection visuelle.
