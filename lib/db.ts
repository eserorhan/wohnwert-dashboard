import fs from "fs";
import path from "path";
import type { PropertyPin } from "./types";

let _mapData: PropertyPin[] | null = null;
let _mapIndex: Map<number, PropertyPin> | null = null;
let _detailData: Record<number, Record<string, unknown>> | null = null;

export function getMapData(): PropertyPin[] {
  if (!_mapData) {
    const p = path.join(process.cwd(), "public", "data", "properties_map.json");
    const content = fs.readFileSync(p, "utf-8");
    // Replace all NaN values with null before parsing (handles :NaN, , NaN, etc.)
    const sanitizedContent = content.replace(/\bNaN\b/g, "null");
    _mapData = JSON.parse(sanitizedContent) as PropertyPin[];
    _mapIndex = new Map(_mapData.map(pin => [pin.scoutId, pin]));
  }
  return _mapData;
}

export function getMapPin(scoutId: number): PropertyPin | undefined {
  if (!_mapIndex) getMapData();
  return _mapIndex!.get(scoutId);
}

export function getDetailData(): Record<number, Record<string, unknown>> {
  if (!_detailData) {
    const p = path.join(process.cwd(), "public", "data", "properties_detail.json");
    const content = fs.readFileSync(p, "utf-8");
    // Replace NaN values with null before parsing
    const sanitizedContent = content.replace(/:NaN/g, ":null");
    _detailData = JSON.parse(sanitizedContent) as Record<number, Record<string, unknown>>;
  }
  return _detailData;
}

export interface QueryFilters {
  market_type?: string;
  object_type?: string;
  wohnwert_min?: number;
  wohnwert_max?: number;
  price_min?: number;
  price_max?: number;
  size_min?: number;
  size_max?: number;
  rooms_min?: number;
  kreis?: string;
  is_bargain?: boolean;
  total_price_min?: number;
  total_price_max?: number;
  pendel_max_min?: number;
  pendel_ziel?: string;
  oepnv_kategorie?: string;
  search?: string;
  limit?: number;
  offset?: number;
  // WohnWert-Gewichtung (0-100)
  gewicht_preis?: number;
  gewicht_standort?: number;
  gewicht_infrastruktur?: number;
  gewicht_ausstattung?: number;
  gewicht_mobilitaet?: number;
  // Rendite-Filter
  rendite_brutto_min?: number;
  rendite_netto_min?: number;
  rendite_cashflow_min?: number;
  rendite_eigenkapital?: number;
  rendite_zinssatz?: number;
}

export function filterProperties(data: PropertyPin[], filters: QueryFilters): PropertyPin[] {
  // Berechne personalisierte WohnWert-Scores wenn Gewichtung vorhanden
  const hasCustomWeights = filters.gewicht_preis !== undefined;
  let processed = data;
  
  if (hasCustomWeights) {
    const weights = {
      preis: (filters.gewicht_preis ?? 20) / 100,
      standort: (filters.gewicht_standort ?? 20) / 100,
      infrastruktur: (filters.gewicht_infrastruktur ?? 20) / 100,
      ausstattung: (filters.gewicht_ausstattung ?? 20) / 100,
      mobilitaet: (filters.gewicht_mobilitaet ?? 20) / 100,
    };
    
    processed = data.map(p => {
      const detail = p as PropertyPin & { ww_dim_preis?: number; ww_dim_standort?: number; ww_dim_infrastruktur?: number; ww_dim_ausstattung?: number; ww_dim_mobilitaet?: number };
      const personalScore = 
        (detail.ww_dim_preis ?? 50) * weights.preis +
        (detail.ww_dim_standort ?? 50) * weights.standort +
        (detail.ww_dim_infrastruktur ?? 50) * weights.infrastruktur +
        (detail.ww_dim_ausstattung ?? 50) * weights.ausstattung +
        (detail.ww_dim_mobilitaet ?? 50) * weights.mobilitaet;
      
      return { ...p, wohnwert_index: personalScore };
    });
  }
  
  return processed.filter(p => {
    // Text search (PLZ, Stadtteil, Straße, Titel)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const searchable = [
        p.zipCode?.toString(),
        p.geo_ortsteil,
        p.geo_kreis,
        p.title,
        p.inkar_kreis_name,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.market_type && filters.market_type !== "all" && p.market_type !== filters.market_type) return false;
    if (filters.object_type && filters.object_type !== "all" && p.object_type !== filters.object_type) return false;
    if (filters.wohnwert_min !== undefined && (p.wohnwert_index ?? 0) < filters.wohnwert_min) return false;
    if (filters.wohnwert_max !== undefined && (p.wohnwert_index ?? 100) > filters.wohnwert_max) return false;
    if (filters.price_min !== undefined && (p.pricePerSqm ?? 0) < filters.price_min) return false;
    if (filters.price_max !== undefined && (p.pricePerSqm ?? 999) > filters.price_max) return false;
    if (filters.size_min !== undefined && (p.livingSpace ?? 0) < filters.size_min) return false;
    if (filters.rooms_min !== undefined && (p.noRooms ?? 0) < filters.rooms_min) return false;
    if (filters.kreis && filters.kreis !== "all" && p.inkar_kreis_name !== filters.kreis) return false;
    if (filters.is_bargain && !p.is_bargain) return false;
    if (filters.total_price_min !== undefined || filters.total_price_max !== undefined) {
      const absPrice = p.market_type === "Miete" ? (p.baseRent ?? 0) : (p.buyingPrice ?? 0);
      if (filters.total_price_min !== undefined && absPrice < filters.total_price_min) return false;
      if (filters.total_price_max !== undefined && absPrice > filters.total_price_max) return false;
    }
    if (filters.oepnv_kategorie && filters.oepnv_kategorie !== "all") {
      if (p.oepnv_kategorie !== filters.oepnv_kategorie) return false;
    }
    if (filters.pendel_max_min && filters.pendel_max_min < 120) {
      const pendel = filters.pendel_ziel === "koeln"
        ? (p as PropertyPin & { dist_hbf_koeln_km?: number | null }).dist_hbf_koeln_km
        : filters.pendel_ziel === "wuppertal"
          ? (p as PropertyPin & { dist_hbf_wuppertal_km?: number | null }).dist_hbf_wuppertal_km
          : (p as PropertyPin & { dist_hbf_duesseldorf_km?: number | null }).dist_hbf_duesseldorf_km;
      const estimatedMin = (pendel ?? 99) * 3 + 5;
      if (estimatedMin > filters.pendel_max_min) return false;
    }
    
    // Rendite-Filter (nur für Kauf-Objekte)
    if (filters.rendite_brutto_min !== undefined || filters.rendite_netto_min !== undefined || filters.rendite_cashflow_min !== undefined) {
      if (p.market_type !== "Kauf") return false;
      
      const kaufpreis = p.buyingPrice ?? 0;
      if (kaufpreis === 0) return false;
      
      // Geschätzte Vergleichsmiete (4% Bruttorendite als Basis)
      const vergleichsmiete = (p.pricePerSqm ?? 0) * (p.livingSpace ?? 0) * 0.04 / 12;
      
      // Bruttorendite
      const bruttorendite = (vergleichsmiete * 12) / kaufpreis * 100;
      if (filters.rendite_brutto_min !== undefined && bruttorendite < filters.rendite_brutto_min) return false;
      
      // Nettorendite (mit Nebenkosten)
      const nebenkosten = kaufpreis * 0.122; // 12,2% NRW
      const jahreskosten = kaufpreis * 0.01 + kaufpreis * 0.0035; // Instandhaltung + Grundsteuer
      const nettorendite = ((vergleichsmiete * 12) - jahreskosten) / (kaufpreis + nebenkosten) * 100;
      if (filters.rendite_netto_min !== undefined && nettorendite < filters.rendite_netto_min) return false;
      
      // Cashflow
      const eigenkapital = (filters.rendite_eigenkapital ?? 20) / 100;
      const zinssatz = (filters.rendite_zinssatz ?? 3.8) / 100;
      const darlehen = (kaufpreis + nebenkosten) * (1 - eigenkapital);
      const monatsrate = darlehen * (zinssatz + 0.02) / 12; // Zins + 2% Tilgung
      const instandhaltung = kaufpreis * 0.01 / 12;
      const cashflow = vergleichsmiete - monatsrate - instandhaltung;
      if (filters.rendite_cashflow_min !== undefined && cashflow < filters.rendite_cashflow_min) return false;
    }
    
    return true;
  });
}
