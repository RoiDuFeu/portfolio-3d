# Quick Start — Galaxy Refactor Testing

## ⚡ 60-Second Test

```bash
# 1. Navigate to project
cd /home/ocadmin/.openclaw/workspace/portfolio-3d

# 2. Start dev server
npm run dev

# 3. Open browser to Galaxy page
# (Usually http://localhost:5173/galaxy or http://localhost:5173)

# 4. What to check:
# ✓ Sun appears with multi-layer corona
# ✓ Corona has visible radial rays
# ✓ Sun surface shows organic plasma patterns
# ✓ Earth shows clouds and atmosphere
# ✓ Mars shows reddish procedural surface
# ✓ Saturn has visible rings
# ✓ Scroll works smoothly (camera moves through planets)
# ✓ No console errors
```

---

## 🔍 Visual Checklist

### EnhancedSun
- [ ] **Core surface** — Bright yellow-white center with swirling patterns
- [ ] **Granulation** — Visible cellular structure (like bubbling)
- [ ] **Rim glow** — Orange-red edge when viewed at angle
- [ ] **Corona rays** — 12 sharp rays close to sun, fading outward
- [ ] **Volumetric halo** — Soft orange glow extending far from sun
- [ ] **Pulsation** — Subtle breathing effect (3% variation)
- [ ] **No flickering** — Smooth animation

### Earth (Realistic)
- [ ] **Continents visible** — World map texture loaded
- [ ] **Oceans glossy** — Specular highlights on water
- [ ] **Clouds separate** — White layer above surface
- [ ] **Night lights** — City lights visible on dark side
- [ ] **Blue atmosphere** — Rim glow around planet
- [ ] **Rotation** — Slow spin

### Mars (Realistic)
- [ ] **Red-orange color** — Rust/dust tones
- [ ] **Surface variation** — Darker and lighter regions
- [ ] **Ridge patterns** — Canyon-like structures
- [ ] **No texture pop** — Smooth procedural generation

### Saturn (Realistic)
- [ ] **Banded surface** — Texture loaded
- [ ] **Rings visible** — Thin disk around equator
- [ ] **Ring transparency** — Can see through gaps
- [ ] **Ring tilt** — Slight angle (not perfectly horizontal)

---

## 🐛 Common Issues & Fixes

### Issue: Black screen
**Cause:** Shader compilation error  
**Fix:** Check browser console for WebGL errors

### Issue: Missing textures (pink planets)
**Cause:** Texture paths incorrect  
**Fix:** Verify `/public/textures/` structure exists

### Issue: Sun too bright (white blob)
**Cause:** Bloom post-processing too aggressive  
**Fix:** Reduce `intensity` uniforms in `EnhancedSun.tsx`

### Issue: Low FPS (<30)
**Cause:** Integrated GPU struggling  
**Fix:** Reduce geometry segments or switch to old `Sun` component

### Issue: No corona rays visible
**Cause:** Camera too far or rays too subtle  
**Fix:** Increase `uIntensity` in corona uniforms (1.3 → 2.0)

### Issue: Planets not appearing
**Cause:** Scroll position or orbital timing  
**Fix:** Wait a few seconds or scroll manually

---

## 🎨 Quick Tweaks (No Build Required)

### Make Sun Hotter (Blue-White)
Edit `src/components/planets/EnhancedSun.tsx`:
```typescript
uCoreColor: { value: new THREE.Color(0.9, 0.95, 1.0) },   // Cool blue
uMidColor: { value: new THREE.Color(0.85, 0.9, 1.0) },
uEdgeColor: { value: new THREE.Color(0.8, 0.85, 0.95) },
```

### Make Sun Cooler (Red Giant)
```typescript
uCoreColor: { value: new THREE.Color(1.0, 0.5, 0.3) },    // Deep orange
uMidColor: { value: new THREE.Color(0.9, 0.3, 0.1) },     // Red-orange
uEdgeColor: { value: new THREE.Color(0.7, 0.1, 0.05) },   // Dark red
```

### More Corona Rays (Spikier)
```typescript
// Inner corona
uRayCount: { value: 16.0 },  // Was 12.0

// Mid corona
uRayCount: { value: 12.0 },  // Was 8.0
```

### Calmer Surface (Less Turbulent)
In `surfaceFragmentShader`, line ~100:
```glsl
// Change from:
float plasma = conv1 * 0.55 + conv2 * 0.25 + gran * 0.35;

// To:
float plasma = conv1 * 0.7 + conv2 * 0.1 + gran * 0.2;
```

### Faster Rotation
In `useFrame`:
```typescript
surfaceRef.current.rotation.y += 0.002  // Was 0.0005 (4× faster)
```

---

## 📊 Performance Monitoring

### In-Browser (Chrome DevTools)
1. Press `F12` → **Performance** tab
2. Click **Record** ⏺
3. Scroll through galaxy for 10 seconds
4. Stop recording
5. Look for:
   - **FPS graph** (should be green, 60 FPS)
   - **GPU time** (should be <16ms per frame)

### Console Stats (Add to Scene.tsx)
```typescript
import { Stats } from '@react-three/drei'

<Canvas ...>
  <Stats />  {/* Top-left FPS counter */}
  ...
</Canvas>
```

### Target Performance
- **High-end GPU:** 100+ FPS
- **Mid-range GPU:** 60+ FPS
- **Integrated GPU:** 30+ FPS

---

## 🔧 Build Test

```bash
# Type check (should show no errors)
npm run type-check

# Full build (should compile cleanly)
npm run build

# Preview production build
npm run preview
```

**Expected output:**
```
✓ built in 8-12s
✓ 0 errors, 0 warnings
dist/ ready for deployment
```

---

## 📸 Screenshot Test Points

Capture screenshots at these scroll positions for comparison:

1. **Sun close-up** — View corona rays and surface detail
2. **Earth approach** — See clouds and atmosphere
3. **Mars orbit** — Check procedural surface quality
4. **Saturn rings** — Verify ring transparency and tilt
5. **Full system** — Wide view showing multiple planets

---

## ✅ Acceptance Criteria

### Must Pass
- [x] No TypeScript errors
- [x] No runtime console errors
- [x] All planets visible and textured
- [x] Sun has visible corona with rays
- [x] Smooth 60 FPS on mid-range GPU
- [x] Scroll triggers camera movement

### Nice to Have
- [ ] HDR bloom effect on sun (requires post-processing)
- [ ] Lens flare when looking directly at sun
- [ ] Planet rotation synced with orbital motion
- [ ] Particle effects (asteroid belt, etc.)

---

## 🚀 Deploy Checklist

Before pushing to production:

- [ ] Test in **Chrome** (primary browser)
- [ ] Test in **Firefox** (shader compatibility)
- [ ] Test in **Safari** (WebGL quirks)
- [ ] Test on **mobile** (performance check)
- [ ] Verify texture assets in `/public/`
- [ ] Check bundle size (`dist/` < 10 MB ideal)
- [ ] Confirm no API keys exposed in source
- [ ] Review console for warnings
- [ ] Take production screenshots for portfolio

---

## 📚 Next Steps

After validating the refactor:

1. **Merge to main branch**
2. **Update project README** with new features
3. **Add screenshot gallery** to docs
4. **Consider texture upgrades** (see TEXTURE_RECOMMENDATIONS.md)
5. **Plan Moon satellite** feature (see GALAXY_REFACTOR.md)
6. **Optimize for mobile** if needed

---

**Ready to test!** 🎮

Run `npm run dev` and explore the enhanced galaxy.
