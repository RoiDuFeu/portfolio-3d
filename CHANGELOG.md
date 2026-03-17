# Changelog - Portfolio 3D

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-17 - MVP Prototype

### 🎉 Initial Release

#### ✨ Features
- **3D Galaxy scene** with Three.js + React Three Fiber
- **Horizontal scroll navigation** with keyboard support (← →)
- **3 interactive planets** representing projects:
  - Fertiscale (greening timeline animation)
  - godsPlan (golden planet)
  - Le Syndrome (music-reactive planet)
- **Stars skybox** with mouse parallax
- **Camera animations** with GSAP (snap to planet on click)
- **Hover effects** on planets (glow + rotation acceleration)
- **Project cards overlay** with detailed info
- **Audio reactive features** for Le Syndrome:
  - Beat detection (Web Audio API)
  - Planet scale synced to beat
  - Particle system reacting to frequencies
  - Emissive intensity synced to music
- **Responsive UI** with Interstellar-inspired design

#### 🛠️ Technical Stack
- Vite 8.0
- React 18 + TypeScript
- @react-three/fiber 9.x
- @react-three/drei
- Three.js
- GSAP 3.x
- Web Audio API

#### 📁 Architecture
- Component-based structure
- Custom hooks for scroll and audio
- Procedural textures for planets
- Modular design for easy extension

#### 🎨 Visual Design
- Dark space theme (#000510)
- Realistic planet rendering
- Dynamic lighting
- Atmospheric effects
- Glassmorphism UI elements

#### 🎯 Deliverables
- ✅ Functional prototype
- ✅ 3 planets with unique features
- ✅ Navigation system
- ✅ Project info cards
- ✅ Audio reactive system
- ✅ Documentation (README, TESTING)

### 📝 Notes
- Port configured to 3024 (avoid conflicts)
- Desktop-first approach
- Procedural textures as placeholder (custom textures coming in Phase 2)
- Audio file not included (add `public/audio/lesyndrome.mp3` to activate audio features)

### 🐛 Known Issues
- None critical for MVP
- Audio context may require user interaction (browser security)
- Mobile not optimized (planned for Phase 2)

### 🔜 Next Steps (Phase 2)
- Custom high-res textures
- More planets (additional projects)
- Smoother enter/exit animations
- Mobile optimization
- Advanced shader effects

---

## Roadmap

### Phase 2 - Polish (Next)
- Custom planet textures
- More projects/planets
- Journey animation between planets
- Interactive easter eggs
- Performance optimizations

### Phase 3 - Content
- Complete project details
- Screenshots/videos in cards
- Links to repos/demos
- "About Marc" section

### Phase 4 - Performance
- Mobile optimization
- LOD (Level of Detail)
- Texture lazy loading
- Preloader

### Phase 5 - Advanced
- Automatic camera pathfinding
- Interactive timeline scrubbing (Fertiscale)
- Music player controls (Le Syndrome)
- Custom shaders (atmospheres, oceans)
- VR support (?)

---

**Maintained by:** Artemis 🌙  
**For:** Marc's Portfolio
