"""
WohnWert-Subscores Berechnung

Dieses Script berechnet die 5 WohnWert-Dimensionen:
1. ww_dim_preis - Preis-Leistung (0-100)
2. ww_dim_standort - Standortqualitaet (0-100)
3. ww_dim_infrastruktur - Infrastruktur (0-100)
4. ww_dim_ausstattung - Ausstattung (0-100)
5. ww_dim_mobilitaet - Mobilitaet (0-100)
"""

import json
import pandas as pd
from pathlib import Path

def calculate_preis_score(row):
    score = 50
    if pd.notna(row.get('pricePerSqm')):
        price = row['pricePerSqm']
        if price < 10:
            score += 30
        elif price > 15:
            score -= 20
    if row.get('is_bargain'):
        score += 20
    return max(0, min(100, score))

def calculate_standort_score(row):
    score = 50
    kreis = row.get('inkar_kreis_name', '')
    if 'Duesseldorf' in kreis or 'Koeln' in kreis:
        score += 20
    return max(0, min(100, score))

def calculate_infrastruktur_score(row):
    score = 50
    if pd.notna(row.get('osm_supermarket_nearest_m')):
        dist = row['osm_supermarket_nearest_m']
        if dist < 300:
            score += 25
        elif dist > 1500:
            score -= 20
    return max(0, min(100, score))

def calculate_ausstattung_score(row):
    score = 50
    rooms = row.get('noRooms', 0)
    if rooms >= 4:
        score += 15
    size = row.get('livingSpace', 0)
    if size >= 100:
        score += 15
    return max(0, min(100, score))

def calculate_mobilitaet_score(row):
    score = 50
    if pd.notna(row.get('oepnv_score')):
        score += (row['oepnv_score'] - 50) * 0.5
    kategorie = row.get('oepnv_kategorie', '')
    if kategorie == 'A':
        score += 25
    return max(0, min(100, score))

def main():
    data_dir = Path(__file__).parent.parent / 'public' / 'data'
    map_file = data_dir / 'properties_map.json'
    
    print(f"Lade {map_file}...")
    with open(map_file, 'r', encoding='utf-8') as f:
        properties = json.load(f)
    
    print(f"{len(properties)} Inserate geladen")
    df = pd.DataFrame(properties)
    
    print("Berechne Subscores...")
    df['ww_dim_preis'] = df.apply(calculate_preis_score, axis=1)
    df['ww_dim_standort'] = df.apply(calculate_standort_score, axis=1)
    df['ww_dim_infrastruktur'] = df.apply(calculate_infrastruktur_score, axis=1)
    df['ww_dim_ausstattung'] = df.apply(calculate_ausstattung_score, axis=1)
    df['ww_dim_mobilitaet'] = df.apply(calculate_mobilitaet_score, axis=1)
    
    properties_updated = df.to_dict('records')
    
    print(f"Speichere {map_file}...")
    with open(map_file, 'w', encoding='utf-8') as f:
        json.dump(properties_updated, f, ensure_ascii=False)
    
    print("Fertig!")

if __name__ == '__main__':
    main()
