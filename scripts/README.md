# WohnWert Dashboard Scripts

## calculate_wohnwert_subscores.py

Berechnet die 5 WohnWert-Dimensionen für jedes Inserat:

### Usage:
```bash
cd scripts
python calculate_wohnwert_subscores.py
```

### Was das Script tut:
1. Lädt `public/data/properties_map.json`
2. Berechnet für jedes Inserat:
   - `ww_dim_preis` - Preis-Leistungs-Score (0-100)
   - `ww_dim_standort` - Standortqualität (0-100)
   - `ww_dim_infrastruktur` - Infrastruktur-Score (0-100)
   - `ww_dim_ausstattung` - Ausstattungs-Score (0-100)
   - `ww_dim_mobilitaet` - Mobilitäts-Score (0-100)
3. Speichert die erweiterten Daten zurück in `properties_map.json`

### Nach der Ausführung:
- Die WohnWert-Gewichtung im Dashboard funktioniert
- Die 5 WohnWert-Subscore-Heatmaps sind verfügbar
- Die Impact-Analyse zeigt echte Veränderungen

### Wichtig:
Das Script muss ausgeführt werden, bevor die WohnWert-Gewichtung im Dashboard getestet wird!
