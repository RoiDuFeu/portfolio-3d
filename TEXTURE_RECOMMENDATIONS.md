# Texture Assets — Current & Recommendations

## ✅ Current Assets (Verified Present)

### Earth
- ✅ `World map.jpg` — Base color/diffuse map
- ✅ `Earth normal map.jpg` — Surface relief detail
- ✅ `Earth specular map.jpg` — Ocean reflectivity
- ✅ `Earth night lights.jpg` — City lights (night side)
- ✅ `Cloud cover.jpg` — Cloud layer color
- ✅ `Cloud cover.png` — Cloud layer alpha (used in shader)

### Moon
- ✅ `Moon.jpg` — Base color map
- ✅ `Moon normal map.jpg` — Crater detail

### Saturn
- ✅ `Saturn.jpg` — Planet surface texture
- ✅ `Saturn's rings.png` — Ring texture with alpha

---

## 🎨 Enhancement Recommendations

### Priority 1: Resolution Upgrade

**Earth (for close camera approaches)**
- Current: Likely 2K resolution
- Recommended: **4K (4096×2048)** or **8K (8192×4096)** for hero shots
- Sources:
  - NASA Visible Earth: https://visibleearth.nasa.gov/
  - Blue Marble Next Generation (8K): https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry
  - Night lights: NASA Black Marble (2016)

**Saturn Rings**
- Current: Probably 1K-2K
- Recommended: **2K radial texture** with:
  - Cassini Division gap detail
  - Particle density variation
  - Proper alpha gradient (0.0 at inner/outer, 0.9 peak)

### Priority 2: Additional Maps

**Earth — Missing Enhancement Maps**
- **Roughness map** — Separate ocean vs land reflectivity control
- **Height/displacement map** — Actual 3D terrain deformation (mountains, trenches)
- **Emissive map** — Separate control for night lights intensity

**Mars (Currently Procedural)**
- **Diffuse texture** — Real Mars Reconnaissance Orbiter (MRO) data
- **Normal map** — Valles Marineris, Olympus Mons detail
- **Roughness map** — Dust vs rocky terrain variation
- Source: https://astrogeology.usgs.gov/search/map/Mars/Viking/MDIM21/Mars_Viking_MDIM21_ClrMosaic_global_232m

**Saturn**
- **Normal map** — Band turbulence detail
- **Emissive map** — Storm hotspots (e.g., hexagon pole)

### Priority 3: New Assets

**Moon Enhancements**
- **Displacement map** — Real crater depth (for parallax or tessellation)
- Far side texture option (currently only near side visible)

**Sun (Currently Procedural)**
- Optional: **Photosphere texture** from Solar Dynamics Observatory (SDO)
- Use case: Blended with procedural for even richer detail
- Note: Procedural approach is already high quality; texture would be supplemental

---

## 📦 Recommended Texture Specs

### Format
- **JPG** for color maps (no alpha needed)
- **PNG** for alpha channels (clouds, rings)
- Consider **KTX2** for compressed GPU-ready format (smaller, faster)

### Resolution Guidelines
| Asset Type | Min | Good | Best |
|------------|-----|------|------|
| Hero planet (Earth) | 2K | 4K | 8K |
| Secondary planets | 1K | 2K | 4K |
| Rings/clouds | 1K | 2K | 2K |
| Normal maps | Same as diffuse | Same | Same |
| Emissive/spec | 1K | 2K | 2K |

### Compression
- Use basis universal (`.ktx2`) for 80% size reduction with minimal quality loss
- Tools: `toktx` (KTX-Software), `gltf-transform` CLI

---

## 🔗 Asset Sources

### Free High-Quality
- **NASA Visible Earth:** https://visibleearth.nasa.gov/
- **USGS Astrogeology:** https://astrogeology.usgs.gov/
- **Solar System Scope:** https://www.solarsystemscope.com/textures/
- **Planet Pixel Emporium:** http://planetpixelemporium.com/ (free for personal use)

### Premium (If Budget)
- **Quixel Megascans** — Photogrammetry, not planets but technique reference
- **TextureHaven** (now Poly Haven) — PBR materials
- **CGTextures** — Generic space materials

---

## 🚀 Implementation Notes

### Current Shader Support
- ✅ Diffuse map
- ✅ Normal map
- ✅ Specular map (Earth ocean gloss)
- ✅ Emissive map (Earth night lights)
- ✅ Cloud layer with alpha

### Easy Upgrades (No Shader Changes)
- Swap JPG files with higher resolution versions
- Naming convention already correct (e.g., `World map.jpg`)

### Advanced Upgrades (Shader Changes Needed)
- **Displacement mapping** — Requires vertex shader height offset
- **Roughness/metallic** — Requires PBR lighting model
- **Subsurface scattering** — Atmosphere depth (more expensive)

---

## 💾 File Size Budget

| Asset | Current (est.) | 4K Upgrade | 8K Upgrade |
|-------|----------------|------------|------------|
| Earth diffuse | ~5 MB | ~15 MB | ~50 MB |
| Earth normal | ~5 MB | ~15 MB | ~50 MB |
| Earth clouds | ~2 MB | ~8 MB | ~25 MB |
| **Total Earth** | ~20 MB | ~60 MB | ~200 MB |

**With KTX2 compression:**
- 4K: ~12 MB total (80% reduction)
- 8K: ~40 MB total (80% reduction)

**Recommendation:** 4K with KTX2 compression = Best quality/size ratio

---

## ✨ Quick Win: Cloud Animation

Instead of upgrading textures, consider:
- **Dual cloud layers** — Offset UVs, different speeds
- **Cloud noise layer** — Procedural variation over time
- **Storm systems** — Localized animated emissive spots

Already implemented in `EarthPlanet.tsx` shader pipeline, just needs uniform tweaks.

---

**Current setup is production-ready.** Upgrades are optional polish for hero moments.
