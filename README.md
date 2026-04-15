# WohnWert Dashboard

Personalisierte Immobilienbewertung für NRW mit 17.000+ Objekten und Open Data Integration.

## Features

- **17.000+ Immobilien** mit WohnWert-Score (100-Punkte-Skala)
- **SmartSlider** mit Precision-Input (Click-to-Edit)
- **15+ Heatmap-Layer** (WohnWert, Rendite, Subscores, Infrastruktur)
- **Rendite-Rechner** für Kaufobjekte
- **Open Data Integration**: Luftqualität NRW, Lärmkarten NRW
- **Favoriten & Vergleich** bis zu 4 Objekte
- **Responsive Design** für Desktop & Mobile

## Tech Stack

- **Frontend**: Next.js 15.3.1 (Turbopack), TypeScript, TailwindCSS
- **Karten**: MapLibre GL + GeoJSON-Clustering
- **Charts**: Recharts, Radar-Diagramme
- **APIs**: LuftQualität.NRW, OpenStreetMap

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build

# Start
npm start
```

## Daten

- **properties_map.json**: 17.186 Inserate mit 50+ Feldern
- **properties_detail.json**: 105+ Felder pro Inserat
- **Open Data**: Luftqualität (58 Stationen), Lärmkarten (WMS)

## WohnWert-Subscores

Für die personalisierte Gewichtung:

```bash
# Subscores berechnen (einmalig)
scripts\run_subscores.bat

# Oder manuell
python scripts/calculate_wohnwert_subscores.py
```

## Deployment

### Vercel (Empfohlen)

1. **GitHub Repo erstellen**
   ```bash
   git init
   git add .
   git commit -m "Initial WohnWert Dashboard"
   git remote add origin https://github.com/deinname/wohnwert-dashboard.git
   git push -u origin main
   ```

2. **Vercel Deploy**
   - [vercel.com](https://vercel.com) anmelden
   - "Import Project" mit GitHub Repo
   - Automatic HTTPS + Custom Domain möglich

3. **Environment Variables**
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://dein-dashboard.vercel.app`

### Alternative: Netlify, DigitalOcean, VPS

## API Endpoints

- `GET /api/properties` - Filter & Paginierung
- `GET /api/properties/:id` - Detail-Daten
- `GET /api/stats` - Aggregierte Statistiken
- `GET /api/impact` - WohnWert-Impact-Analyse

## Performance

- **Load Time**: <2s nach Warmup
- **API Response**: 57-334ms
- **Memory**: 4GB empfohlen für Build
- **Bundle Size**: ~2MB gzipped

## Contributing

1. Fork
2. Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request

## License

MIT License - siehe [LICENSE](LICENSE) Datei.

## Kontakt

Für Fragen & Feedback: [deine-email@beispiel.com]
