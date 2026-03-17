# 🧪 Testing Guide - Portfolio 3D

## ✅ Checklist de validation

### 🌌 Scène de base
- [ ] Fond noir/bleu profond espace
- [ ] Skybox étoilé visible et animé
- [ ] 3 planètes visibles au chargement
- [ ] Lighting réaliste (pas trop sombre, pas trop clair)

### 🧭 Navigation
- [ ] **Scroll horizontal** : molette/trackpad déplace la caméra left-right
- [ ] **Flèche gauche** : caméra va à gauche
- [ ] **Flèche droite** : caméra va à droite
- [ ] Mouvement fluide et naturel
- [ ] Parallax étoiles selon mouvement souris (léger)

### 🪐 Planètes - Comportement général
- [ ] Rotation idle permanente (lente)
- [ ] Hover = cursor pointer
- [ ] Hover = glow effect s'intensifie
- [ ] Hover = rotation accélère
- [ ] Click = animation camera snap (1-2 sec) + carte projet s'ouvre

### 🌱 Planète Fertiscale (gauche)
- [ ] Couleur terre/végétation visible
- [ ] Texture procédurale affichée
- [ ] "Verdissement" visible (plus tu scrolles, plus elle verdit)
- [ ] Atmosphère subtile autour
- [ ] Glow vert au hover

### ⭐ Planète godsPlan (centre)
- [ ] Couleur dorée/jaune
- [ ] Rotation idle
- [ ] Glow doré au hover
- [ ] Click ouvre carte avec infos projet

### 🎵 Planète Le Syndrome (droite)
- [ ] Couleur violette/purple
- [ ] Particules visibles autour
- [ ] Glow violet
- [ ] **Si audio présent** :
  - [ ] Taille pulse au beat
  - [ ] Particules réagissent aux fréquences
  - [ ] Emissive intensity change avec beat
- [ ] **Si pas d'audio** :
  - [ ] Animations basiques fonctionnent quand même
  - [ ] Pas d'erreur console

### 📋 Cartes projet
- [ ] Click planète ouvre modal
- [ ] Background blur visible
- [ ] Infos projet complètes affichées
- [ ] Bouton close (×) fonctionne
- [ ] Click overlay (background) ferme la carte
- [ ] Timeline Fertiscale visible et lisible
- [ ] Animation slide-up smooth

### 🎨 Style visuel
- [ ] Palette sombre respectée (Interstellar vibe)
- [ ] Textes lisibles (bon contraste)
- [ ] Pas de UI qui gêne la vue
- [ ] Instructions visibles en bas
- [ ] Design futuriste cohérent

### ⚡ Performance
- [ ] FPS fluide (>30 fps minimum)
- [ ] Pas de lag au scroll
- [ ] Animations smooth
- [ ] Pas d'erreurs console critiques

## 🐛 Problèmes connus / Expected

### Audio
- Le navigateur peut bloquer autoplay audio
- Besoin d'un click user pour démarrer le contexte audio
- Si pas de fichier `lesyndrome.mp3`, la planète fonctionne quand même (sans audio reactive)

### Scroll
- Sur certains OS, scroll horizontal peut être moins intuitif
- Utiliser les flèches clavier en fallback

### Mobile
- Non optimisé pour mobile dans ce MVP
- Desktop first, mobile = bonus phase 2

## 🎯 Points à valider avec Marc

1. **Feel général** : l'ambiance Interstellar est là ?
2. **Navigation** : intuitive ? Fluide ?
3. **Planètes** : réalisme satisfaisant pour MVP ?
4. **Audio reactive** : beat detection ok ? (si audio fourni)
5. **Cartes projet** : infos suffisantes ? Design ok ?
6. **Performances** : lag quelque part ?
7. **Priorités phase 2** : quoi améliorer en premier ?

## 🔧 Debug rapide

### Console errors
Ouvre DevTools (F12) → Console. Vérifie :
- Pas d'erreur rouge critique
- Warning audio context = normal (besoin click)
- 404 audio = normal si fichier pas fourni

### Performance check
DevTools → Performance → Record 10 sec de navigation
- FPS doit rester au-dessus de 30
- Pas de frame drop majeur

### Three.js inspector
Extension Chrome "Three.js Editor" pour debug 3D

## 📊 Metrics attendus

- **Load time** : < 3 sec
- **FPS** : 30-60 (desktop)
- **Scroll latency** : < 50ms
- **Camera animation** : 1-2 sec (spec)
- **Hover response** : instantané

---

**Test complet = 10 min max**

Ready to show Marc! 🚀
