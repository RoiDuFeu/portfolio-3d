# 📋 TODO - Portfolio 3D

## 🚀 MVP - DONE ✅

- [x] Setup Vite + React + TypeScript
- [x] Install R3F + Drei + Three.js + GSAP
- [x] Scène 3D galaxie avec lighting
- [x] Skybox étoilé avec parallax souris
- [x] 3 planètes (Fertiscale, godsPlan, Le Syndrome)
- [x] Navigation scroll horizontal + clavier
- [x] Hover effects (glow + rotation)
- [x] Camera snap animation au click
- [x] Cartes projet overlay
- [x] Timeline Fertiscale avec verdissement
- [x] Audio reactive Le Syndrome (beat + frequencies)
- [x] Documentation (README, TESTING, QUICK_START)
- [x] Launch sur port 3024

---

## 🎨 Phase 2 - Polish & UX

### Priorité Haute
- [ ] **Textures custom** pour les 3 planètes
  - [ ] Fertiscale : base + green states (2 textures)
  - [ ] Le Syndrome : texture violette custom + particle sprite
  - [ ] godsPlan : texture dorée réaliste
- [ ] **Audio controls** pour Le Syndrome
  - [ ] Play/Pause button (overlay)
  - [ ] Volume slider
  - [ ] Visualisation waveform
- [ ] **Loading screen** avec progress bar
  - [ ] Preload textures
  - [ ] Preload audio
  - [ ] Animation fade-in

### Priorité Moyenne
- [ ] **Plus de planètes** (autres projets)
  - [ ] Le Mur / Discale
  - [ ] OpenClaw
  - [ ] Hermes
  - [ ] NAS/Media
- [ ] **Animations trajectoires** entre planètes
  - [ ] Path curved entre positions
  - [ ] Camera suit le path
  - [ ] Effet "voyage spatial"
- [ ] **Easter eggs interactifs**
  - [ ] Click étoiles = mini-explosion
  - [ ] Satellites/comètes passent parfois
  - [ ] Messages cachés dans l'espace

### Priorité Basse
- [ ] **Améliorer cartes projet**
  - [ ] Screenshots projets
  - [ ] Vidéos/GIFs démo
  - [ ] Links GitHub/Demo
  - [ ] Tags techno
- [ ] **Section "About Marc"**
  - [ ] Planète centrale "Moi"
  - [ ] Bio + photo
  - [ ] Links sociaux

---

## ⚡ Phase 3 - Performance & Mobile

### Performance Desktop
- [ ] LOD (Level of Detail) pour planètes distantes
- [ ] Frustum culling optimisé
- [ ] Texture compression
- [ ] Lazy loading assets
- [ ] Worker pour audio analysis
- [ ] Throttle mouse events

### Mobile Optimization
- [ ] Responsive layout
- [ ] Touch controls (swipe horizontal)
- [ ] Reduced particles count
- [ ] Simplified shaders
- [ ] Battery-aware performance mode
- [ ] Orientation lock (landscape)

### Metrics Target
- [ ] FPS: 60 (desktop), 30+ (mobile)
- [ ] Load time: < 3 sec
- [ ] Lighthouse score: > 90

---

## 🔬 Phase 4 - Advanced Features

### Shader Magic
- [ ] Custom atmosphere shaders
- [ ] Océans animés (pour futures planètes)
- [ ] Volumetric clouds
- [ ] God rays (autour du soleil futur)
- [ ] Post-processing (bloom, chromatic aberration)

### Interactions Avancées
- [ ] Timeline scrubbing interactive (Fertiscale)
  - [ ] Slider pour naviguer dans le temps
  - [ ] Planète change en live
- [ ] Music player complet (Le Syndrome)
  - [ ] Playlist
  - [ ] Equalizer visuel
  - [ ] Sync lyrics (si applicable)
- [ ] Pathfinding automatique caméra
  - [ ] "Tour guidé" mode
  - [ ] Narration audio (?)

### Content
- [ ] Détails complets tous projets
- [ ] Blog posts / Project stories
- [ ] Image galleries
- [ ] Video embeds
- [ ] External links

---

## 🚀 Phase 5 - Expérimental

### VR Support (?)
- [ ] WebXR integration
- [ ] VR controllers support
- [ ] Teleport between planets
- [ ] Immersive project exploration

### Multiplayer (?)
- [ ] Show other visitors as avatars
- [ ] Collaborative exploration
- [ ] Chat system
- [ ] Leave messages on planets

### AI Integration (?)
- [ ] AI assistant guide (Artemis avatar)
- [ ] Natural language project search
- [ ] Generated project descriptions
- [ ] Dynamic content generation

---

## 🐛 Bugs Connus / Fixes

### Critical
- (aucun pour le moment)

### Non-Critical
- [ ] Audio context warning (expected, browser security)
- [ ] Scroll horizontal peut être non-intuitif sur certains OS
- [ ] Performance peut baisser avec beaucoup d'onglets ouverts

### Enhancement Requests
- [ ] Ajouter son ambiance espace (loop subtil)
- [ ] Transitions plus smooth entre planètes
- [ ] Meilleur feedback visuel au click

---

## 📝 Notes de Dev

### Décisions Architecture
- Textures procédurales pour MVP (phase 2 = custom)
- Audio reactive optionnel (graceful fallback)
- Desktop-first (mobile = bonus)
- Component-based (facile à étendre)

### Conventions Code
- TypeScript strict
- React functional components only
- Hooks pour logique réutilisable
- Props interfaces explicites
- Comments pour logique complexe

### Git Workflow (futur)
- `main` = stable
- `develop` = features
- `feature/*` = nouvelles features
- PR + review avant merge

---

## 🎯 Success Metrics

### User Experience
- [ ] 90%+ users comprennent navigation en < 30 sec
- [ ] Taux rebond < 30%
- [ ] Temps moyen session > 2 min

### Technical
- [ ] Lighthouse Performance > 90
- [ ] Core Web Vitals: Good
- [ ] 0 critical bugs production

### Content
- [ ] Tous projets documentés
- [ ] Links fonctionnels
- [ ] Infos à jour

---

**Last updated:** 2026-03-17  
**Maintainer:** Artemis 🌙  
**Status:** MVP Complete, Phase 2 Ready
