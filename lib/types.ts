export interface PropertyPin {
  scoutId: number;
  lat: number;
  lng: number;
  market_type: "Miete" | "Kauf";
  object_type: "Wohnung" | "Haus";
  pricePerSqm: number | null;
  baseRent: number | null;
  buyingPrice: number | null;
  livingSpace: number | null;
  noRooms: number | null;
  zipCode: number;
  geo_kreis: string;
  geo_ortsteil: string | null;
  wohnwert_index: number | null;
  wohnwert_klasse: string | null;
  is24_kategorie: string | null;
  value_score: number | null;
  is_bargain: boolean;
  is_outlier: boolean;
  title: string;
  image_url: string | null;
  osm_oepnv_nearest_m: number | null;
  osm_supermarket_nearest_m: number | null;
  yearConstructed: number | null;
  condition: string | null;
  inkar_kreis_name: string;
  region: string;
  nearest_hbf: string | null;
  nearest_hbf_km: number | null;
  nearest_zentrum_km: number | null;
  nearest_zentrum: string | null;
  pendel_auto_min: number | null;
  pendel_oepnv_min: number | null;
  pendel_fahrrad_min: number | null;
  oepnv_score: number | null;
  oepnv_kategorie: string | null;
  pendel_zone_ddorf: string | null;
  pendel_zone_koeln: string | null;
  dist_hbf_duesseldorf_km: number | null;
  dist_hbf_koeln_km: number | null;
  dist_hbf_wuppertal_km: number | null;
  // Luftqualität
  air_lqi: number | null;
  air_lqi_text: string | null;
  air_score: number | null;
}

export interface PropertyDetail extends PropertyPin {
  address_street: string | null;
  address_location: string | null;
  floor: number | null;
  numberOfFloors: number | null;
  balcony_bool: boolean;
  cellar_bool: boolean;
  lift_bool: boolean;
  garden_bool: boolean;
  hasKitchen_bool: boolean;
  barrierFree_bool: boolean;
  equip_score: number | null;
  building_age_cat: string | null;
  size_cat: string | null;
  totalRent: number | null;
  serviceCharge: number | null;
  deposit_numeric: number | null;
  total_monthly_cost: number | null;
  costcheck_strom: number | null;
  costcheck_internet: number | null;
  mietbelastungsquote: number | null;
  kaufpreis_einkommen_ratio: number | null;
  affordability_score: number | null;
  preis_fairness_score: number | null;
  is24_pricePercentile: number | null;
  ww_dim_preis: number | null;
  ww_dim_standort: number | null;
  ww_dim_infrastruktur: number | null;
  ww_dim_ausstattung: number | null;
  ww_dim_mobilitaet: number | null;
  osm_amenity_score: number | null;
  osm_supermarket_count: number | null;
  osm_school_count: number | null;
  osm_kindergarten_count: number | null;
  osm_doctor_count: number | null;
  osm_pharmacy_count: number | null;
  osm_restaurant_count: number | null;
  osm_park_count: number | null;
  osm_oepnv_count: number | null;
  osm_fitness_count: number | null;
  osm_fitness_nearest_m: number | null;
  osm_bakery_count: number | null;
  osm_school_nearest_m: number | null;
  osm_doctor_nearest_m: number | null;
  osm_park_nearest_m: number | null;
  inkar_verfuegb_einkommen_ew: number | null;
  inkar_arbeitslosenquote: number | null;
  inkar_kaufkraftindex: number | null;
  inkar_aerzte_je_100k: number | null;
  kreis_attraktivitaet: number | null;
  agent_name: string | null;
  agent_company: string | null;
  isPrivateOffer: boolean;
  isNewBuilding: boolean;
  text_lage: string | null;
  text_beschreibung: string | null;
  // Luftqualität (Detail)
  air_station_name: string | null;
  air_station_dist_km: number | null;
}

export interface Filters {
  market_type: "all" | "Miete" | "Kauf";
  object_type: "all" | "Wohnung" | "Haus";
  wohnwert_min: number;
  wohnwert_max: number;
  price_min: number;
  price_max: number;
  total_price_min: number;
  total_price_max: number;
  size_min: number;
  size_max: number;
  rooms_min: number;
  kreis: string;
  is_bargain: boolean;
  pendel_max_min: number;
  pendel_ziel: string;
  oepnv_kategorie: string;
  search: string;
  // WohnWert-Gewichtung (0-100)
  gewicht_preis: number;
  gewicht_standort: number;
  gewicht_infrastruktur: number;
  gewicht_ausstattung: number;
  gewicht_mobilitaet: number;
  // Rendite-Filter (nur für Kauf)
  rendite_brutto_min: number;
  rendite_netto_min: number;
  rendite_cashflow_min: number;
  rendite_eigenkapital: number;
  rendite_zinssatz: number;
}

export interface Stats {
  total: number;
  last_updated: string | null;
  miete: number;
  kauf: number;
  wohnungen: number;
  haeuser: number;
  median_wohnwert: number;
  median_miete_psqm: number;
  oepnv_kategorien?: Record<string, number>;
  pendel_zone_ddorf?: Record<string, number>;
  median_pendel_auto_min?: number;
  median_pendel_oepnv_min?: number;
  median_nearest_hbf_km?: number;
  hbf_verteilung?: Record<string, number>;
  median_kauf_psqm: number;
  median_miete_kalt: number;
  median_kauf_preis: number;
  wohnwert_klassen: Record<string, number>;
  is24_kategorien: Record<string, number>;
  kreise: Record<string, number>;
  bbox: {
    min_lat: number; max_lat: number;
    min_lng: number; max_lng: number;
    center_lat: number; center_lng: number;
  };
  kreis_data: KreisData[];
}

export interface KreisData {
  inkar_kreis_name: string;
  count: number;
  median_ww: number;
  median_psqm_miete: number;
  median_psqm_kauf: number;
  median_miete: number;
  median_kauf: number;
  center_lat: number;
  center_lng: number;
}
