# WohnWert Dashboard - Deployment Guide

## Schnellstart für Freunde-Testing (Vercel)

### Schritt 1: GitHub Repository

```bash
# Falls noch nicht geschehen
git init
git add .
git commit -m "WohnWert Dashboard - Ready for Testing"
git remote add origin https://github.com/deinname/wohnwert-dashboard.git
git push -u origin main
```

### Schritt 2: Vercel Setup (5 Minuten)

1. **Vercel Account**: [vercel.com/signup](https://vercel.com/signup)
2. **GitHub Integration**: Verbinde dein GitHub Account
3. **Import Project**: 
   - Wähle `wohnwert-dashboard` Repo
   - Framework: `Next.js` (wird automatisch erkannt)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**: Klick auf "Deploy" - 2 Minuten warten

### Schritt 3: WohnWert-Subscores aktivieren

**Wichtig:** Nach dem Deployment einmalig ausführen:

```bash
# SSH zum Vercel Server (oder lokal vor dem Push)
python scripts/calculate_wohnwert_subscores.py

# Oder im Vercel Dashboard:
# Functions Tab -> calculate_wohnwert_subscores -> Run
```

### Schritt 4: Testing-Link teilen

Dein Dashboard ist jetzt live unter:
- **Primary URL**: `https://dein-dashboard.vercel.app`
- **Preview URLs**: Für jeden Branch

## Alternative Hosting Optionen

### Netlify (Kostenlos)

```bash
# Build
npm run build

# Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=.next
```

### DigitalOcean App Platform ($5/Monat)

```dockerfile
# Dockerfile (für DigitalOcean)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Eigene VPS (Hetzner/DigitalOcean)

```bash
# Ubuntu Server Setup
sudo apt update
sudo apt install -y nodejs npm nginx
git clone https://github.com/deinname/wohnwert-dashboard.git
cd wohnwert-dashboard
npm install
npm run build
pm2 start npm --name "wohnwert" -- start
```

## Performance Optimierung

### Vercel Optimierungen

```json
// vercel.json (bereits konfiguriert)
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["fra1"]
}
```

### Caching

```javascript
// app/api/properties/route.ts
export async function GET(req: NextRequest) {
  // Cache für 5 Minuten
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

## Custom Domain Setup

### Vercel

1. **Domain Settings** in Vercel Dashboard
2. **DNS Records**: 
   ```
   A @ 76.76.21.21
   CNAME www cname.vercel-dns.com
   ```

### SSL

- **Automatisch** bei Vercel/Netlify
- **Let's Encrypt** bei VPS

## Monitoring & Analytics

### Vercel Analytics

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Google Analytics

```javascript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

## Security

### Environment Variables

```bash
# .env.local (nicht in Git!)
NEXT_PUBLIC_API_URL=https://dein-dashboard.vercel.app
NODE_ENV=production
```

### Rate Limiting

```javascript
// app/api/properties/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Backup Strategy

### Daten-Backup

```bash
# Automatisches Backup der JSON-Files
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf "wohnwert-backup-$DATE.tar.gz" public/data/
aws s3 cp "wohnwert-backup-$DATE.tar.gz" s3://dein-backup-bucket/
```

### Database Backup (falls später)

```sql
-- PostgreSQL Backup
pg_dump wohnwert_db > wohnwert_$(date +%Y%m%d).sql
```

## Troubleshooting

### Häufige Probleme

1. **Build Timeout**: `vercel.json` mit `maxDuration: 30`
2. **Memory Issues**: `NODE_OPTIONS=--max-old-space-size=4096`
3. **CORS Issues**: `next.config.js` mit Headers
4. **404 Errors**: `trailingSlash: true` in `next.config.js`

### Debug Logging

```javascript
// app/api/properties/route.ts
export async function GET(req: NextRequest) {
  console.log('API Call:', req.url);
  // ... rest of code
}
```

## Next Steps

1. **Freunde einladen** mit Vercel Link
2. **Feedback sammeln** via Google Forms
3. **Analytics auswerten** für User-Verhalten
4. **Features priorisieren** basierend auf Feedback
5. **Scale-Up** bei Bedarf zu DigitalOcean/VPS

---

**Support**: Bei Fragen melde dich bei mir!
