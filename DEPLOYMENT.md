# 🚀 Deployment Guide - Portfolio 3D

Guide complet pour déployer le portfolio en production.

## 📦 Build Production

```bash
npm run build
```

Génère le dossier `dist/` optimisé pour production.

### Build Output

```
dist/
├── index.html           # Entry point
├── assets/
│   ├── index-[hash].js  # App bundle
│   ├── index-[hash].css # Styles
│   └── ...              # Chunks
├── textures/            # Assets statiques
└── audio/
```

**Size estimé** : ~500KB (gzipped, sans audio/textures custom)

---

## 🌐 Deployment Options

### Option 1 : Vercel (Recommandé)

**Pourquoi** : Zero-config, CDN global, SSL auto, preview deployments.

#### Setup

1. Install Vercel CLI :
```bash
npm i -g vercel
```

2. Deploy :
```bash
vercel
```

3. Follow prompts → projet auto-détecté (Vite)

4. Production deploy :
```bash
vercel --prod
```

**Custom domain** :
```bash
vercel domains add portfolio.marc.com
```

**Config** (`vercel.json`) :
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

### Option 2 : Netlify

**Pourquoi** : Simple, gratuit, bon pour static sites.

#### Setup

1. Drag & drop `dist/` sur [Netlify Drop](https://app.netlify.com/drop)

OU

2. Git-based :
   - Connect repo GitHub
   - Build command : `npm run build`
   - Publish directory : `dist`

**Custom domain** : Netlify UI → Domain settings

**Config** (`netlify.toml`) :
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3 : GitHub Pages

**Pourquoi** : Gratuit, intégré GitHub.

#### Setup

1. Install gh-pages :
```bash
npm i -D gh-pages
```

2. Add scripts à `package.json` :
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts` :
```ts
export default defineConfig({
  base: '/portfolio-3d/', // Nom du repo
  // ...
})
```

4. Deploy :
```bash
npm run deploy
```

→ Live à `https://username.github.io/portfolio-3d/`

---

### Option 4 : Self-Hosted (VPS)

**Pourquoi** : Contrôle total, peut combiner avec backend futur.

#### Nginx Setup

1. Build :
```bash
npm run build
```

2. Upload `dist/` to server :
```bash
rsync -avz dist/ user@server:/var/www/portfolio
```

3. Nginx config (`/etc/nginx/sites-available/portfolio`) :
```nginx
server {
    listen 80;
    server_name portfolio.marc.com;
    
    root /var/www/portfolio;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. Enable & reload :
```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. SSL (Let's Encrypt) :
```bash
sudo certbot --nginx -d portfolio.marc.com
```

---

## 🔒 Pre-Deployment Checklist

### Performance
- [ ] Build size < 1MB (sans assets lourds)
- [ ] Lighthouse Performance > 90
- [ ] Core Web Vitals : Good
- [ ] Lazy loading pour assets lourds
- [ ] Texture compression activée

### Content
- [ ] Tous les textes relus (typos)
- [ ] Links fonctionnels
- [ ] Infos projets à jour
- [ ] Audio/textures custom intégrés (si prêts)
- [ ] Metadata SEO (voir section suivante)

### Technical
- [ ] No console errors
- [ ] Mobile responsive (ou message desktop-only)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Fallbacks pour WebGL non supporté
- [ ] Analytics intégré (optionnel)

### Legal
- [ ] License assets (textures, audio)
- [ ] Privacy policy (si analytics)
- [ ] Credits (libs, assets sources)

---

## 🎨 SEO & Meta Tags

Update `index.html` avec metadata :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>Marc - Portfolio 3D | Charbonneur de l'Espace</title>
  <meta name="title" content="Marc - Portfolio 3D | Charbonneur de l'Espace" />
  <meta name="description" content="Explorez mes projets dans une galaxie 3D interactive. Développeur full-stack, créatif technologique." />
  <meta name="keywords" content="portfolio, 3D, React, Three.js, développeur, projets, Marc" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://portfolio.marc.com/" />
  <meta property="og:title" content="Marc - Portfolio 3D | Charbonneur de l'Espace" />
  <meta property="og:description" content="Explorez mes projets dans une galaxie 3D interactive." />
  <meta property="og:image" content="https://portfolio.marc.com/og-image.jpg" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://portfolio.marc.com/" />
  <meta property="twitter:title" content="Marc - Portfolio 3D" />
  <meta property="twitter:description" content="Explorez mes projets dans une galaxie 3D interactive." />
  <meta property="twitter:image" content="https://portfolio.marc.com/og-image.jpg" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  
  <link rel="icon" type="image/png" href="/vite.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**OG Image** : Crée un screenshot 1200x630 de la galaxie → `public/og-image.jpg`

---

## 📊 Analytics (Optionnel)

### Google Analytics

```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible (Privacy-friendly)

```html
<script defer data-domain="portfolio.marc.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🚀 CI/CD (GitHub Actions)

Auto-deploy sur push à `main`.

`.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🌍 Custom Domain Setup

### DNS Config (Exemple Cloudflare)

```
Type    Name    Content                     Proxy
A       @       76.76.21.21                 ✅
CNAME   www     cname.vercel-dns.com        ✅
```

### Vercel Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add `portfolio.marc.com`
3. Add DNS records (Vercel te donne les valeurs)
4. Wait propagation (~10 min - 48h)

---

## 🔍 Post-Deployment Testing

Après deploy :

1. **Lighthouse audit** (Chrome DevTools) :
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

2. **Cross-browser** :
   - Chrome ✅
   - Firefox ✅
   - Safari ✅
   - Edge ✅

3. **Device testing** :
   - Desktop (1920x1080, 2560x1440)
   - Laptop (1366x768)
   - Tablet (si mobile optimisé)
   - Mobile (si mobile optimisé)

4. **Load testing** :
   - [WebPageTest](https://www.webpagetest.org/)
   - [GTmetrix](https://gtmetrix.com/)

5. **Functionality** :
   - Toutes les planètes visibles
   - Navigation fonctionne
   - Cartes projet s'ouvrent
   - Audio fonctionne (si présent)
   - No console errors

---

## 🐛 Troubleshooting

### Build fails
- Clear cache : `npm run clean && npm install`
- Check Node version : `node -v` (need >= 18)
- Check dependencies : `npm audit`

### Site loads but broken
- Check `base` in vite.config (pour GH Pages)
- Check 404 errors (Network tab)
- Check CORS (si assets externes)

### Performance issues
- Enable gzip/brotli compression
- Optimize images (WebP, compression)
- Use CDN pour assets lourds
- Lazy load audio/textures

### WebGL not working
- Check browser support
- Add fallback message
- Check GPU acceleration enabled

---

## 📈 Monitoring

### Uptime
- [UptimeRobot](https://uptimerobot.com/) (gratuit)
- [Pingdom](https://www.pingdom.com/)

### Errors
- [Sentry](https://sentry.io/) (error tracking)
- Browser DevTools → Console (avant deploy)

### Performance
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)

---

## 🎉 You're Live!

Portfolio déployé avec succès! 🌌

**Next steps** :
1. Share le lien (socials, CV, LinkedIn)
2. Monitor analytics
3. Gather feedback
4. Iterate (check TODO.md)

**Don't forget** :
- Update régulièrement (nouveaux projets)
- Maintenir performance
- Backup code (git)
- SSL certificate renewal (auto avec Vercel/Netlify)

---

**Bon voyage cosmique!** 🚀✨

*Deployment guide by Artemis for Marc*
