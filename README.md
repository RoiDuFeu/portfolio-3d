# 🌌 Portfolio 3D - Marc's Galactic Projects

Un portfolio immersif en 3D représentant mes projets comme des planètes dans une galaxie.

## 🎨 Concept

Inspiré par Interstellar, chaque projet est une planète réaliste avec des caractéristiques uniques :

- **Fertiscale** : Planète qui verdit au fil de sa timeline (agri-tech)
- **godsPlan** : Planète dorée représentant les églises de Paris
- **Le Syndrome** : Planète musicale réactive au beat (audio reactive)

## 🚀 Features

### Navigation
- ✅ Scroll horizontal fluide
- ✅ Navigation clavier (← →)
- ✅ Click sur planète = snap camera avec animation GSAP
- ✅ Hover = glow effect + rotation accélérée

### Visuel
- ✅ Skybox étoilé avec parallax souris
- ✅ Planètes réalistes avec textures procédurales
- ✅ Lighting dynamique
- ✅ Effets atmosphériques

### Audio Reactive (Le Syndrome)
- ✅ Analyse fréquences Web Audio API
- ✅ Planet scale synchro beat
- ✅ Particle system réactif
- ✅ Glow intensity synchro musique

### UI
- ✅ Cartes projet overlay avec infos détaillées
- ✅ Timeline Fertiscale avec milestones
- ✅ Design futuriste Interstellar-inspired

## 🛠️ Stack

- **Vite** - Build tool rapide
- **React 18** + **TypeScript** - Framework
- **@react-three/fiber** - React renderer pour Three.js
- **@react-three/drei** - Helpers R3F
- **Three.js** - WebGL 3D engine
- **GSAP** - Animations caméra fluides
- **Web Audio API** - Analyse audio temps réel

## 📦 Installation

```bash
npm install
```

## 🎵 Audio Setup

Pour activer les features audio reactive sur "Le Syndrome" :

1. Ajoute ton fichier MP3 dans `public/audio/`
2. Nomme-le `lesyndrome.mp3`
3. Recharge l'app

L'audio reactive se lance automatiquement.

## 🎮 Utilisation

```bash
npm run dev
```

Ouvre http://localhost:3024

### Contrôles

- **Scroll horizontal** ou **molette** : naviguer entre planètes
- **← →** : navigation clavier
- **Click planète** : zoom + afficher infos
- **Hover planète** : effet glow
- **Click overlay** : fermer la carte

## 📁 Structure

```
portfolio-3d/
├── src/
│   ├── components/
│   │   ├── Galaxy.tsx           # Scène principale + orchestration
│   │   ├── Planet.tsx           # Planète générique
│   │   ├── FertiscalePlanet.tsx # Planète avec verdissement timeline
│   │   ├── MusicPlanet.tsx      # Planète audio reactive
│   │   ├── ProjectCard.tsx      # Modal info projet
│   │   └── Stars.tsx            # Skybox étoilé
│   ├── data/
│   │   └── projects.ts          # Data projets
│   ├── hooks/
│   │   ├── useScroll.ts         # Scroll horizontal tracker
│   │   └── useAudio.ts          # Web Audio API wrapper
│   ├── App.tsx
│   ├── App.css
│   └── index.css
└── public/
    ├── textures/                # (future textures custom)
    └── audio/
        └── lesyndrome.mp3       # Ta musique ici
```

## 🎯 Prochaines étapes

### Phase 2 - Polish
- [ ] Textures custom haute résolution
- [ ] Plus de planètes (autres projets)
- [ ] Animations entrée/sortie plus smooth
- [ ] Système de "voyage" entre planètes (trajectoire)
- [ ] Easter eggs interactifs

### Phase 3 - Content
- [ ] Détails complets pour chaque projet
- [ ] Screenshots/vidéos dans les cartes
- [ ] Links vers repos/demos
- [ ] Section "About Marc"

### Phase 4 - Performance
- [ ] Optimisation mobile
- [ ] LOD (Level of Detail) pour planètes
- [ ] Lazy loading textures
- [ ] Preloader

### Phase 5 - Advanced
- [ ] Pathfinding automatique caméra
- [ ] Timeline scrubbing interactive (Fertiscale)
- [ ] Music player controls (Le Syndrome)
- [ ] Shader custom (atmosphères, océans)

## 🐛 Notes de dev

- Port configuré sur **3024** pour éviter conflits
- Audio context peut nécessiter interaction user (click) pour démarrer (navigateurs modernes)
- Scroll horizontal = `body.width` étendu à `innerWidth * 3`
- Textures procédurales pour MVP, remplacer par assets réels progressivement

## 📝 License

Projet personnel © 2026 Marc
