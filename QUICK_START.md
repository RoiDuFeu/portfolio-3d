# 🚀 Quick Start - Portfolio 3D

## ⚡ TL;DR

```bash
cd portfolio-3d
npm install  # (déjà fait)
npm run dev  # (déjà lancé sur port 3024)
```

→ **Ouvre http://localhost:3024**

---

## 🎮 Premiers pas (30 secondes)

1. **Ouvre le navigateur** → `http://localhost:3024`
2. **Bouge la souris** → les étoiles bougent légèrement (parallax)
3. **Scroll horizontal** (molette ou trackpad) → la caméra voyage dans l'espace
4. **Appuie sur →** → avance vers la droite
5. **Hover une planète** → elle brille et tourne plus vite
6. **Click une planète** → zoom + carte projet s'ouvre
7. **Click overlay** → ferme la carte

**C'est tout !** 🎉

---

## 🪐 Les 3 planètes

### 🌱 Gauche : Fertiscale (verte/brune)
- Agri-tech project
- Verdit progressivement avec le scroll
- Timeline avec milestones
- Texture procédurale terre/végétation

### ⭐ Centre : godsPlan (dorée)
- App églises Paris
- Planète simple mais élégante
- Infos projet au click

### 🎵 Droite : Le Syndrome (violette)
- Projet musical
- Particules autour
- **Audio reactive** si tu ajoutes `public/audio/lesyndrome.mp3`

---

## 🎵 Activer l'audio reactive

Pour voir la planète musicale **pulser au beat** :

1. Exporte ta musique en MP3
2. Place-la ici : `public/audio/lesyndrome.mp3`
3. Reload la page
4. Clique sur la planète violette

→ Elle va **grossir/rétrécir** avec le beat ! 🎶

---

## 🐛 Debug rapide

### La page est noire ?
- Check console (F12) → erreurs ?
- Attends 2-3 sec (chargement Three.js)

### Les planètes ne bougent pas ?
- Essaye de scroll horizontal
- Utilise les flèches ← →
- Refresh la page

### Audio ne marche pas ?
- Vérifie que `lesyndrome.mp3` existe
- Les navigateurs bloquent autoplay → click quelque part d'abord
- Check console → warnings audio context = normal

### Perfs mauvaises ?
- Ferme d'autres onglets lourds
- Active accélération GPU (chrome://gpu)
- Utilise Chrome/Edge (meilleur support WebGL)

---

## 📸 Screenshots / GIFs

*(À ajouter après validation visuelle)*

- Vue d'ensemble galaxie
- Hover effect planète
- Carte projet Fertiscale
- Planète musicale en action

---

## 🔧 Commandes dev

```bash
npm run dev       # Lance dev server (port 3024)
npm run build     # Build production
npm run preview   # Preview du build
npm run lint      # ESLint check
npm run clean     # Clean cache
```

---

## 💡 Tips

- **Scroll horizontal** peut sembler bizarre au début → utilise les flèches si besoin
- **Mouvement souris** crée un léger parallax sur les étoiles (subtil mais classe)
- **Click plusieurs fois** sur différentes planètes pour voir les animations camera
- **Timeline Fertiscale** : scroll pour voir la progression du verdissement
- **Musique** : si tu la mets en boucle, c'est hypnotique 🌀

---

## 📞 Feedback

Ce que Marc doit valider :

1. ✅ L'ambiance "Interstellar" est capturée ?
2. ✅ Navigation intuitive ?
3. ✅ Les planètes ont du "caractère" ?
4. ✅ Audio reactive impressionnant ? (si testé)
5. ✅ Infos projets assez complètes ?
6. ❓ Quoi améliorer en priorité ?

---

**Enjoy the cosmic journey!** 🌌✨

*Built with ❤️ by Artemis for Marc*
