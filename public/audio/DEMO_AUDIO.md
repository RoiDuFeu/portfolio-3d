# 🎵 Audio Setup for Le Syndrome

## Quick Test (sans audio file)

La planète Le Syndrome fonctionne **sans fichier audio** !  
Les animations de base sont présentes (rotation, particules, glow).

Audio reactive se désactive gracefully si pas de fichier.

---

## Ajouter ton MP3

1. **Exporte ta musique** en MP3 (bonne qualité, ~320 kbps)
2. **Nomme-le** `lesyndrome.mp3`
3. **Place-le ici** : `public/audio/lesyndrome.mp3`
4. **Reload** la page

→ Audio reactive s'active automatiquement ! 🎶

---

## Alternative : Tester avec sample audio

Si tu veux tester l'audio reactive avant d'avoir ton vrai fichier :

### Option 1 : YouTube to MP3
1. Trouve une track sur YouTube
2. Use [yt-dlp](https://github.com/yt-dlp/yt-dlp) :
   ```bash
   yt-dlp -x --audio-format mp3 -o "lesyndrome.mp3" "URL_YOUTUBE"
   ```
3. Move dans `public/audio/`

### Option 2 : Free Music Archives
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/)
- Télécharge un piano track, renomme en `lesyndrome.mp3`

### Option 3 : Generate test tone (dev only)
```bash
# Install ffmpeg
sudo apt install ffmpeg  # Linux
brew install ffmpeg      # macOS

# Generate test tone (440Hz sine wave, 30 sec)
ffmpeg -f lavfi -i "sine=frequency=440:duration=30" -c:a libmp3lame public/audio/lesyndrome.mp3
```

---

## Audio Specs Optimales

Pour best performance :

- **Format** : MP3 (universal support)
- **Bitrate** : 192-320 kbps (balance qualité/taille)
- **Sample Rate** : 44.1 kHz (standard)
- **Duration** : 2-5 min (loop si plus court)
- **File Size** : < 10 MB (pour load rapide)

---

## Testing Audio Reactive

Une fois le fichier en place :

1. **Reload** la page
2. **Scroll** vers la planète violette (droite)
3. **Click** la planète
4. **Observe** :
   - ✅ Planète pulse avec le beat
   - ✅ Particules bougent avec fréquences
   - ✅ Glow intensity change
   - ✅ Emissive brille au beat

### Debug

Si l'audio ne marche pas :

- **Check console** : warnings Web Audio API ?
- **User interaction required** : click quelque part d'abord (navigateurs modernes)
- **File path** : vérifie `lesyndrome.mp3` bien dans `public/audio/`
- **Browser support** : Chrome/Edge meilleurs pour Web Audio API

---

## Advanced : Multiple Tracks

Pour ajouter plusieurs tracks (future feature) :

```typescript
// src/data/projects.ts
{
  id: 'lesyndrome',
  audioPath: '/audio/lesyndrome.mp3',
  audioTracks: [
    { name: 'Track 1', path: '/audio/track1.mp3' },
    { name: 'Track 2', path: '/audio/track2.mp3' }
  ]
}
```

---

## Audio Controls (Phase 2)

Future features :

- **Play/Pause button**
- **Volume slider**
- **Track progress bar**
- **Playlist** (si plusieurs tracks)
- **Waveform visualization**
- **Equalizer visual**

---

**Pour maintenant : le site fonctionne avec ou sans audio !** 🎉

*Audio guide by Artemis*
