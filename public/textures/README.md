# 🎨 Textures Custom

## Phase 2 - Assets réels

Pour remplacer les textures procédurales par des assets custom :

### Fertiscale
- `fertiscale_base.jpg` - Texture de base terre/végétation (2048x2048)
- `fertiscale_green.jpg` - Texture verdoyante (2048x2048)
- `fertiscale_normal.jpg` - Normal map (optionnel)

### godsPlan
- `godsplan_diffuse.jpg` - Texture dorée/église (2048x2048)
- `godsplan_emissive.jpg` - Emissive map pour glow (optionnel)

### Le Syndrome
- `lesyndrome_diffuse.jpg` - Texture violette/musicale (2048x2048)
- `lesyndrome_particle.png` - Sprite pour particules (256x256, transparent)

## Sources recommandées

### Free textures
- [Solar System Scope](https://www.solarsystemscope.com/textures/) - Textures planètes réalistes
- [Poly Haven](https://polyhaven.com/textures) - Textures PBR gratuites
- [CC0 Textures](https://cc0textures.com/) - Library textures libres

### Tools
- [Materialize](http://boundingboxsoftware.com/materialize/) - Générer normal/height maps
- [Photoshop/GIMP](https://www.gimp.org/) - Édition textures
- [Substance Designer](https://substance3d.adobe.com/) - Création procédurale avancée

## Format optimal

- **Size:** 2048x2048 (balance qualité/perf)
- **Format:** JPG (diffuse), PNG (alpha/emissive)
- **Compression:** 80-90% quality
- **Color space:** sRGB

## Intégration code

Exemple pour remplacer texture procédurale Fertiscale :

```tsx
import textureUrl from '/textures/fertiscale_base.jpg';

const texture = useLoader(THREE.TextureLoader, textureUrl);

<meshStandardMaterial
  map={texture}
  roughness={0.8}
  metalness={0.2}
/>
```

## Notes

- Les textures actuelles sont **procédurales** (générées par code)
- Avantage : légères, pas de chargement
- Inconvénient : moins de détails/réalisme
- Phase 2 : remplacer progressivement par assets custom

---

**Priority order pour Phase 2:**
1. Fertiscale (base + green states)
2. Le Syndrome (texture + particle sprite)
3. godsPlan (texture dorée custom)
