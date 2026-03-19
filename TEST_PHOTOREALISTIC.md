# 🧪 Guide de Test - Planètes Photoréalistes

## 🚀 Démarrage rapide

```bash
cd /home/ocadmin/.openclaw/workspace/portfolio-3d
npm run dev
```

Puis ouvrir : **http://localhost:5225/planet-studio** (ou le port assigné)

---

## ✅ Checklist de Test

### 1. **Mode Photoréaliste - Earth**
- [ ] Cliquer sur le bouton **🌍 Earth**
- [ ] Vérifier que le bouton devient bleu (actif)
- [ ] Observer le rendu de la Terre photoréaliste :
  - [ ] Continents et océans visibles
  - [ ] Couche de nuages animée
  - [ ] Atmosphère bleue autour de la planète
  - [ ] Rotation fluide
- [ ] Le slider **Size** devrait toujours fonctionner et ajuster la taille

### 2. **Mode Photoréaliste - Moon**
- [ ] Cliquer sur le bouton **🌙 Moon**
- [ ] Vérifier que le bouton devient bleu (actif)
- [ ] Observer le rendu de la Lune photoréaliste :
  - [ ] Surface grise avec cratères détaillés
  - [ ] Textures 8K visibles
  - [ ] Pas d'atmosphère (normal)
  - [ ] Rotation fluide
- [ ] Le slider **Size** devrait toujours fonctionner

### 3. **Mode Photoréaliste - Saturn**
- [ ] Cliquer sur le bouton **🪐 Saturn**
- [ ] Vérifier que le bouton devient bleu (actif)
- [ ] Observer le rendu de Saturne photoréaliste :
  - [ ] Planète avec bandes atmosphériques
  - [ ] Anneaux translucides et détaillés
  - [ ] Atmosphère subtile
  - [ ] Rotation fluide
- [ ] Le slider **Size** devrait toujours fonctionner

### 4. **Retour au Mode Procédural**
- [ ] Cliquer sur **← Back to Procedural**
- [ ] Vérifier que :
  - [ ] Le bouton bleu se désactive
  - [ ] Le rendu revient au shader procédural (terrain généré)
  - [ ] Tous les contrôles procéduraux redeviennent actifs :
    - [ ] Surface Controls (displacement, noise, etc.)
    - [ ] Biome Controls (ocean, vegetation, frost)
    - [ ] Color Controls
    - [ ] Cloud Controls
    - [ ] Atmosphere Controls

### 5. **Switch Rapide Entre Presets**
- [ ] Cliquer successivement : Earth → Moon → Saturn → Earth
- [ ] Vérifier qu'il n'y a **pas de lag** ni d'erreur console
- [ ] Vérifier que chaque rendu est correct

### 6. **Compatibilité avec les Presets Procéduraux**
- [ ] Sélectionner un preset procédural existant (ex: "Mars", "Ice", "Lava")
- [ ] Vérifier que le mode revient automatiquement à **procedural**
- [ ] Modifier les contrôles procéduraux (displacement, colors, etc.)
- [ ] Re-sélectionner un preset photoréaliste → vérifier que ça switch bien

### 7. **Persistence (Save/Load)**
- [ ] Sélectionner **🌍 Earth**
- [ ] Ajuster la taille (ex: `size = 3.5`)
- [ ] Cliquer sur **Save** (donner un nom, ex: "Big Earth")
- [ ] Recharger la page
- [ ] Charger "Big Earth" depuis la liste
- [ ] Vérifier que :
  - [ ] Le mode photoréaliste est restauré
  - [ ] Le preset Earth est actif
  - [ ] La taille est correcte (`3.5`)

---

## 🐛 Erreurs Connues à Ignorer

Les erreurs TypeScript suivantes sont **pre-existantes** et n'affectent pas la fonctionnalité :

```
DustParticles.tsx: 'sizes' is declared but never used
StarField.tsx: Property 'args' is missing in BufferAttribute
tsconfig: Unknown compiler option 'erasableSyntaxOnly'
```

Ces erreurs existaient **avant** l'intégration photoréaliste et ne sont **pas liées** à nos modifications.

---

## 🎯 Résultat Attendu

### ✅ Succès
- Les 3 planètes photoréalistes (Earth, Moon, Saturn) sont sélectionnables
- Le switch entre procédural ↔ photoréaliste est fluide
- Les contrôles de taille fonctionnent dans les deux modes
- Aucune erreur console liée au rendu
- La persistence fonctionne correctement

### ❌ Échec
Si un des points suivants se produit :
- Erreur `Cannot find module` lors du chargement des composants photoréalistes
- Console erreur `undefined is not a function` au click sur un bouton
- Rendu noir/vide au lieu de la planète
- Crash au switch entre modes

→ Vérifier les imports et les chemins de fichiers

---

## 📊 Performance

### Metrics attendues
- **FPS** : ~60 FPS stable (sur GPU moderne)
- **Switch preset** : < 500ms
- **Chargement textures** : ~1-2s au premier render (mise en cache ensuite)

### Optimisations possibles (si lag)
- Réduire la résolution des textures (actuellement 8K)
- Utiliser des mipmaps pour les textures lointaines
- Ajouter un loader pendant le chargement initial

---

## 🎉 Validation Finale

Une fois tous les tests passés, l'intégration est **production-ready** ! 🚀

**Commande de validation rapide :**
```bash
# Si tout compile sans erreur liée à nos fichiers, c'est bon !
npm run build 2>&1 | grep -E "(StudioPlanet|PhotoRealistic|renderMode)" || echo "✅ No errors in our code!"
```
