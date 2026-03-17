# 🤝 Contributing to Portfolio 3D

Merci de contribuer au portfolio cosmique de Marc! 🌌

## 🎯 Philosophy

Ce projet vise à créer une expérience immersive et unique. Chaque contribution doit :

1. **Améliorer l'expérience utilisateur**
2. **Maintenir les performances**
3. **Respecter l'esthétique Interstellar**
4. **Être maintenable et documentée**

## 🚀 Quick Start

```bash
git clone <repo>
cd portfolio-3d
npm install
npm run dev
```

## 📁 Structure du projet

```
portfolio-3d/
├── src/
│   ├── components/     # Composants React/R3F
│   ├── data/          # Data projets et config
│   ├── hooks/         # Custom hooks
│   └── App.tsx        # Point d'entrée
├── public/
│   ├── textures/      # Assets textures
│   └── audio/         # Fichiers audio
└── docs/              # Documentation
```

## 🛠️ Development Guidelines

### Code Style

- **TypeScript strict** : toujours typer explicitement
- **Functional components** : pas de class components
- **Hooks** : logique réutilisable dans custom hooks
- **Props interfaces** : définir toutes les interfaces en haut de fichier
- **Comments** : expliquer le "pourquoi", pas le "quoi"

Exemple :

```tsx
interface MyComponentProps {
  position: [number, number, number];
  color: string;
  onClick?: () => void;
}

export const MyComponent = ({ position, color, onClick }: MyComponentProps) => {
  // Use memo for expensive calculations
  const computedValue = useMemo(() => {
    // Complex logic here
  }, [dependencies]);
  
  return (
    <mesh position={position} onClick={onClick}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
};
```

### Performance Best Practices

1. **useMemo** pour calculs lourds
2. **useCallback** pour fonctions passées en props
3. **Avoid inline functions** dans render loops
4. **Throttle/debounce** pour events fréquents
5. **LOD** pour objets complexes
6. **Texture compression** (JPG pour diffuse, PNG pour alpha)

### Git Workflow

1. **Branch naming** :
   - `feature/nom-feature` (nouvelles features)
   - `fix/nom-bug` (bug fixes)
   - `refactor/nom` (refactoring)
   - `docs/nom` (documentation)

2. **Commits** :
   - Messages clairs et descriptifs
   - Format : `type: description courte`
   - Exemples :
     - `feat: add music player controls`
     - `fix: correct camera snap animation`
     - `refactor: optimize planet rendering`
     - `docs: update README with new features`

3. **Pull Requests** :
   - Décrire clairement ce qui change
   - Screenshots/GIFs si changements visuels
   - Mentionner issues liées (`Fixes #123`)
   - Tester localement avant PR

## 🎨 Adding a New Planet

Pour ajouter un nouveau projet/planète :

1. **Data** : Ajoute le projet dans `src/data/projects.ts`
2. **Component** : Crée `src/components/MonProjetPlanet.tsx` (si custom)
3. **Galaxy** : Importe et ajoute dans `src/components/Galaxy.tsx`
4. **Texture** : Ajoute assets dans `public/textures/`
5. **Tests** : Vérifie hover, click, navigation
6. **Doc** : Update README avec le nouveau projet

Template :

```tsx
export const projects: Project[] = [
  // ... existing projects
  {
    id: 'mon-projet',
    name: 'Mon Projet',
    tagline: 'Tagline courte',
    description: 'Description complète...',
    category: 'Category',
    position: [20, 0, 0], // Position dans l'espace
    color: '#FF5733'
  }
];
```

## 🎵 Audio Integration

Pour ajouter audio reactive à une planète :

1. Place MP3 dans `public/audio/nom-projet.mp3`
2. Update projet data avec `audioPath`
3. Use `useAudio` hook dans component
4. Sync visual effects avec `audioData.beat` et `audioData.frequencies`

Exemple :

```tsx
const { audioData, updateAudioData } = useAudio('/audio/mon-projet.mp3');

useEffect(() => {
  const interval = setInterval(updateAudioData, 50);
  return () => clearInterval(interval);
}, [updateAudioData]);

// Use audioData.beat (0-1) pour scale, emissive, etc.
```

## 🐛 Bug Reports

Quand tu report un bug :

1. **Description claire** du problème
2. **Steps to reproduce** (étapes pour reproduire)
3. **Expected behavior** (comportement attendu)
4. **Actual behavior** (ce qui se passe vraiment)
5. **Screenshots/Console errors** si applicable
6. **Environment** (browser, OS, device)

Template :

```markdown
**Bug:** Planète ne rotate pas au hover

**Steps:**
1. Hover sur planète Fertiscale
2. Attends 2 secondes
3. Rien ne change

**Expected:** Rotation devrait accélérer
**Actual:** Rotation reste constante

**Console:** `TypeError: meshRef.current is null`

**Env:** Chrome 120, macOS 14.1, Desktop
```

## 💡 Feature Requests

Pour proposer une nouvelle feature :

1. **Description** de la feature
2. **Use case** (pourquoi c'est utile)
3. **Mockup/Sketch** si applicable
4. **Priority** (low/medium/high)
5. **Feasibility** (technical considerations)

## 🧪 Testing

Avant chaque PR :

1. **Visual check** : teste tous les features affectés
2. **Console** : 0 erreurs critiques
3. **Performance** : FPS reste > 30
4. **Responsive** : teste différentes tailles fenêtre
5. **Navigation** : scroll, keyboard, click fonctionnent

Checklist rapide :
- [ ] Hover planètes fonctionne
- [ ] Click ouvre cartes projet
- [ ] Scroll horizontal fluide
- [ ] Pas d'erreur console
- [ ] FPS stable

## 📚 Documentation

Documentation nécessaire pour chaque feature :

1. **Code comments** : pourquoi, pas quoi
2. **README update** : si feature user-facing
3. **CHANGELOG** : toujours update
4. **TODO** : retire items complétés

## 🎯 Review Process

Chaque PR sera reviewée selon :

1. **Code quality** : lisible, maintenable
2. **Performance** : pas de régression
3. **Design consistency** : respecte l'esthétique
4. **Documentation** : bien documenté
5. **Tests** : features testées

## 🌟 Best Contributors

Hall of fame des contributeurs (à venir)...

---

## 📞 Questions?

- Check `README.md` pour setup de base
- Check `QUICK_START.md` pour usage rapide
- Check `TODO.md` pour roadmap
- Check `TESTING.md` pour checklist validation

Pas de réponse? Ouvre une issue! 🚀

---

**Merci de contribuer à ce projet cosmique!** 🌌✨

*Maintenu avec ❤️ par Artemis pour Marc*
