# 🌌 Portfolio 3D - Project Overview

## Concept Visuel

Un portfolio immersif où chaque projet est une **planète dans une galaxie**. Inspiré par l'univers d'Interstellar, le visiteur voyage dans l'espace pour découvrir tes réalisations.

---

## 🎨 Design Philosophy

### Esthétique
- **Space noir profond** (#000510) - Fond cosmique
- **Étoiles scintillantes** - Skybox immersif avec parallax
- **Planètes réalistes** - Textures, atmosphères, rotations
- **Glow effects** - Halos lumineux au hover
- **UI minimaliste** - Ne pas gêner la vue 3D
- **Glassmorphism** - Cards projet avec blur backdrop

### Couleurs
- **Fertiscale** : Vert/brun (terre, agriculture)
- **godsPlan** : Doré (églises, spiritualité)
- **Le Syndrome** : Violet (musique, créativité)
- **Accents** : Bleu cyan (#88ccff) pour UI

### Typography
- **Headings** : Sans-serif moderne, bold
- **Body** : Inter, lisible
- **Accents** : Gradients sur titres

---

## 🧭 User Journey

### 1. Arrivée (0-5 sec)
- Page charge, galaxie apparaît
- Étoiles en fond, 3 planètes visibles
- Instructions discrètes en bas

### 2. Exploration (5 sec - 2 min)
- **Scroll horizontal** : voyage entre planètes
- **Hover** : planètes brillent et tournent plus vite
- **Mouvement souris** : légère parallax étoiles
- Découverte progressive des projets

### 3. Interaction (2 min+)
- **Click planète** : camera zoom fluide (1-2 sec)
- **Carte projet** : overlay avec détails
- **Timeline** : voir l'évolution (Fertiscale)
- **Audio** : écouter la musique (Le Syndrome)

### 4. Navigation
- **← →** : naviguer au clavier
- **Scroll** : contrôle intuitif
- **Click overlay** : retour galaxie

---

## 🪐 Les Planètes

### 🌱 Fertiscale (Position -15, 0, 0)
**Type** : Planète agricole vivante

**Visuel** :
- Base : terre brune/aride
- Évolution : verdit progressivement avec scroll
- Texture : procédurale (terre + végétation)
- Atmosphère : légère, verte

**Features** :
- Animation verdissement réactive
- Timeline avec milestones
- Glow vert au hover

**Symbolise** : Croissance, transformation, agriculture tech

---

### ⭐ godsPlan (Position 0, 0, 0)
**Type** : Planète spirituelle

**Visuel** :
- Couleur : doré/jaune lumineux
- Texture : simple mais élégante
- Glow : subtil, chaleureux

**Features** :
- Rotation idle calme
- Infos projet au click

**Symbolise** : Spiritualité, guidance, mapping Paris

---

### 🎵 Le Syndrome (Position 15, 0, 0)
**Type** : Planète musicale réactive

**Visuel** :
- Couleur : violet/purple (#9C27B0)
- Particules orbitales (200 points)
- Glow pulsant
- Emissive material

**Features** :
- **Audio reactive** : scale pulse au beat
- Particules réagissent aux fréquences
- Emissive intensity synchro musique
- Rotation dynamique

**Symbolise** : Créativité, musique, expression artistique

---

## 🎬 Animations

### Camera
- **Mouvement scroll** : lerp smooth (0.05)
- **Snap to planet** : GSAP ease power2.inOut (1.5s)
- **Mouse parallax** : rotation subtile (0.05 factor)

### Planètes
- **Rotation idle** : 0.001 rad/frame
- **Rotation hover** : 0.003 rad/frame (3x faster)
- **Scale beat** : 1.0 → 1.3 (lerp 0.2)

### UI
- **Cards** : slide-up (0.4s) + fade-in
- **Overlay** : fade-in (0.3s)
- **Glow** : scale 1.15 → 1.3 (0.3s)

---

## 🔊 Audio Reactive System

### Flow
```
MP3 → Web Audio API → Analyser Node → FFT → Frequencies Array
                                              ↓
                                         Beat Detection
                                              ↓
                                    Visual Sync (React State)
                                              ↓
                            Planet Scale + Particles + Emissive
```

### Metrics
- **FFT Size** : 256 (balance précision/perf)
- **Update Rate** : 50ms (20 FPS audio)
- **Beat Range** : Low frequencies (0-20 bins)
- **Normalization** : 0-1 range

---

## 🎯 Technical Architecture

### Stack
```
React 18 (UI layer)
  ↓
React Three Fiber (3D abstraction)
  ↓
Three.js (WebGL engine)
  ↓
WebGL (GPU rendering)
```

### Data Flow
```
projects.ts (data)
  ↓
Galaxy.tsx (orchestrator)
  ↓
[FertiscalePlanet | Planet | MusicPlanet] (components)
  ↓
[useScroll | useAudio] (hooks)
  ↓
ProjectCard.tsx (UI overlay)
```

### Performance
- **Component isolation** : chaque planète = component distinct
- **Memoization** : useMemo pour calculs lourds (textures, particles)
- **RAF (Request Animation Frame)** : via R3F useFrame
- **Throttle events** : mouse, scroll
- **Lazy loading** : assets on-demand (futur)

---

## 📊 Metrics & KPIs

### Performance Targets
- **FPS** : 60 (desktop), 30+ (mobile)
- **Load Time** : < 3 sec (first paint)
- **Bundle Size** : < 500KB (gzipped, sans assets)
- **Lighthouse** : > 90 performance

### User Engagement
- **Session Duration** : > 2 min (target)
- **Interactions** : > 3 clicks/session
- **Bounce Rate** : < 30%

### Content Coverage
- **Projects Documented** : 3/5 (MVP)
- **Info Completeness** : 80%+
- **Links Functional** : 100%

---

## 🚀 MVP vs. Vision

### MVP (Current) ✅
- 3 planètes fonctionnelles
- Navigation scroll + keyboard
- Audio reactive Le Syndrome
- Timeline Fertiscale
- Cartes projet basiques
- Design Interstellar-inspired

### Vision (Future) 🔮
- 8-10 planètes (tous projets)
- Trajectoires automatiques
- VR support
- Multiplayer (?)
- AI guide (Artemis avatar)
- Custom shaders avancés
- Mobile VIP experience
- Blog intégré

---

## 🎭 Persona Marc

### Tone of Voice
- **Passionné** : projets avec âme
- **Technique** : compétence visible
- **Créatif** : approche originale
- **Humain** : accessible, authentique

### Message
> "Charbonneur de l'espace" - je construis, j'explore, je crée.  
> Chaque projet est un monde à découvrir.

### Différenciation
- Portfolio **unique** (pas template générique)
- **Immersif** (experience, pas juste showcase)
- **Technologie** showcase (Three.js, audio reactive)
- **Storytelling** (timeline, narratives)

---

## 🌟 Competitive Edge

### vs. Portfolios classiques
- ❌ 2D scroll page
- ❌ Static images
- ❌ Text-heavy
- ❌ Template design

✅ **Portfolio 3D**
- 3D immersive
- Interactive planets
- Audio reactive
- Unique experience
- Memorable

### Inspiration Sources
- **Interstellar** (esthétique)
- **No Man's Sky** (exploration)
- **Apple.com** (polish, animations)
- **Bruno Simon** (creative dev portfolio)

---

## 💡 Easter Eggs Ideas (Future)

- **Konami Code** : unlock secret planet
- **Click étoiles** : mini explosions
- **Hidden messages** : dans l'espace profond
- **Artemis avatar** : AI guide flottant
- **Developer console** : ASCII art galaxie

---

## 📝 Brand Identity

### Tagline Options
- "Charbonneur de l'Espace"
- "Building Worlds, One Project at a Time"
- "Explore My Universe"
- "Digital Cosmos, Real Impact"

### Avatar/Logo
- Planet with code symbol
- Constellation spelling "M"
- Rocket + laptop fusion
- Abstract galaxy icon

---

## 🎬 Demo Script (30 sec pitch)

> "Bienvenue dans ma galaxie de projets.  
> Scroll pour voyager entre les planètes.  
> Chaque planète = un projet.  
> Hover pour interagir, click pour explorer.  
> Fertiscale verdit avec le temps.  
> Le Syndrome pulse au rythme de ma musique.  
> Un portfolio qui vit et respire.  
> Bienvenue dans l'espace."

---

**This is not just a portfolio. It's a journey.** 🌌✨

*Crafted with ❤️ by Artemis for Marc*
