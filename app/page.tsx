"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import FilterPanel, { DEFAULT_FILTERS } from "@/components/FilterPanel";
import DetailModal from "@/components/DetailModal";
import CompareModal from "@/components/CompareModal";
import { WohnwertBadge } from "@/components/WohnwertBadge";
import type { PropertyPin, PropertyDetail, Filters, Stats } from "@/lib/types";
import { BarChart2, List, Map as MapIcon, TrendingUp, Home, Euro, Bookmark, BookmarkCheck, Download } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Map = dynamic(() => import("@/components/Map"), { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">Karte wird geladen…</div> });

const WW_COLORS: Record<string, string> = {
  exzellent: "#10b981", gut: "#22c55e", durchschnittlich: "#eab308",
  unterdurchschnittlich: "#f97316", mangelhaft: "#ef4444",
};

function buildQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.market_type !== "all") p.set("market_type", f.market_type);
  if (f.object_type !== "all") p.set("object_type", f.object_type);
  if (f.wohnwert_min > 0) p.set("wohnwert_min", String(f.wohnwert_min));
  if (f.wohnwert_max < 100) p.set("wohnwert_max", String(f.wohnwert_max));
  if (f.price_min > 0) p.set("price_min", String(f.price_min));
  if (f.price_max < 50) p.set("price_max", String(f.price_max));
  if (f.total_price_min > 0) p.set("total_price_min", String(f.total_price_min));
  if (f.total_price_max < 2000000) p.set("total_price_max", String(f.total_price_max));
  if (f.size_min > 0) p.set("size_min", String(f.size_min));
  if (f.rooms_min > 1) p.set("rooms_min", String(f.rooms_min));
  if (f.kreis !== "all") p.set("kreis", f.kreis);
  if (f.is_bargain) p.set("is_bargain", "true");
  if (f.oepnv_kategorie !== "all") p.set("oepnv_kategorie", f.oepnv_kategorie);
  if (f.pendel_max_min < 120) {
    p.set("pendel_max_min", String(f.pendel_max_min));
    p.set("pendel_ziel", f.pendel_ziel);
  }
  if (f.search) p.set("search", f.search);
  // WohnWert-Gewichtung
  if (f.gewicht_preis !== 20) p.set("gp", String(f.gewicht_preis));
  if (f.gewicht_standort !== 20) p.set("gs", String(f.gewicht_standort));
  if (f.gewicht_infrastruktur !== 20) p.set("gi", String(f.gewicht_infrastruktur));
  if (f.gewicht_ausstattung !== 20) p.set("ga", String(f.gewicht_ausstattung));
  if (f.gewicht_mobilitaet !== 20) p.set("gm", String(f.gewicht_mobilitaet));
  // Rendite-Filter
  if (f.rendite_brutto_min > 0) p.set("rendite_brutto_min", String(f.rendite_brutto_min));
  if (f.rendite_netto_min > 0) p.set("rendite_netto_min", String(f.rendite_netto_min));
  if (f.rendite_cashflow_min > -500) p.set("rendite_cashflow_min", String(f.rendite_cashflow_min));
  if (f.rendite_eigenkapital !== 20) p.set("rendite_eigenkapital", String(f.rendite_eigenkapital));
  if (f.rendite_zinssatz !== 3.8) p.set("rendite_zinssatz", String(f.rendite_zinssatz));
  p.set("limit", "10000");
  return p.toString();
}

function filtersFromURL(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  const p = new URLSearchParams(window.location.search);
  return {
    market_type: (p.get("mt") ?? DEFAULT_FILTERS.market_type) as Filters["market_type"],
    object_type: (p.get("ot") ?? DEFAULT_FILTERS.object_type) as Filters["object_type"],
    wohnwert_min: Number(p.get("wmin") ?? DEFAULT_FILTERS.wohnwert_min),
    wohnwert_max: Number(p.get("wmax") ?? DEFAULT_FILTERS.wohnwert_max),
    price_min: Number(p.get("pmin") ?? DEFAULT_FILTERS.price_min),
    price_max: Number(p.get("pmax") ?? DEFAULT_FILTERS.price_max),
    total_price_min: Number(p.get("tpmin") ?? DEFAULT_FILTERS.total_price_min),
    total_price_max: Number(p.get("tpmax") ?? DEFAULT_FILTERS.total_price_max),
    size_min: Number(p.get("smin") ?? DEFAULT_FILTERS.size_min),
    size_max: Number(p.get("smax") ?? DEFAULT_FILTERS.size_max),
    rooms_min: Number(p.get("rmin") ?? DEFAULT_FILTERS.rooms_min),
    kreis: p.get("kreis") ?? DEFAULT_FILTERS.kreis,
    is_bargain: p.get("bargain") === "1",
    pendel_max_min: Number(p.get("pendel") ?? DEFAULT_FILTERS.pendel_max_min),
    pendel_ziel: p.get("ziel") ?? DEFAULT_FILTERS.pendel_ziel,
    oepnv_kategorie: p.get("oepnv") ?? DEFAULT_FILTERS.oepnv_kategorie,
    search: p.get("q") ?? DEFAULT_FILTERS.search,
    gewicht_preis: Number(p.get("gp") ?? DEFAULT_FILTERS.gewicht_preis),
    gewicht_standort: Number(p.get("gs") ?? DEFAULT_FILTERS.gewicht_standort),
    gewicht_infrastruktur: Number(p.get("gi") ?? DEFAULT_FILTERS.gewicht_infrastruktur),
    gewicht_ausstattung: Number(p.get("ga") ?? DEFAULT_FILTERS.gewicht_ausstattung),
    gewicht_mobilitaet: Number(p.get("gm") ?? DEFAULT_FILTERS.gewicht_mobilitaet),
    rendite_brutto_min: Number(p.get("rb") ?? DEFAULT_FILTERS.rendite_brutto_min),
    rendite_netto_min: Number(p.get("rn") ?? DEFAULT_FILTERS.rendite_netto_min),
    rendite_cashflow_min: Number(p.get("rc") ?? DEFAULT_FILTERS.rendite_cashflow_min),
    rendite_eigenkapital: Number(p.get("re") ?? DEFAULT_FILTERS.rendite_eigenkapital),
    rendite_zinssatz: Number(p.get("rz") ?? DEFAULT_FILTERS.rendite_zinssatz),
  };
}

function filtersToURL(f: Filters): string {
  const p = new URLSearchParams();
  if (f.market_type !== "all") p.set("mt", f.market_type);
  if (f.object_type !== "all") p.set("ot", f.object_type);
  if (f.wohnwert_min > 0) p.set("wmin", String(f.wohnwert_min));
  if (f.wohnwert_max < 100) p.set("wmax", String(f.wohnwert_max));
  if (f.price_min > 0) p.set("pmin", String(f.price_min));
  if (f.price_max < 50) p.set("pmax", String(f.price_max));
  if (f.total_price_min > 0) p.set("tpmin", String(f.total_price_min));
  if (f.total_price_max < 2000000) p.set("tpmax", String(f.total_price_max));
  if (f.size_min > 0) p.set("smin", String(f.size_min));
  if (f.rooms_min > 1) p.set("rmin", String(f.rooms_min));
  if (f.kreis !== "all") p.set("kreis", f.kreis);
  if (f.is_bargain) p.set("bargain", "1");
  if (f.pendel_max_min < 120) p.set("pendel", String(f.pendel_max_min));
  if (f.pendel_ziel !== "duesseldorf") p.set("ziel", f.pendel_ziel);
  if (f.oepnv_kategorie !== "all") p.set("oepnv", f.oepnv_kategorie);
  if (f.search) p.set("q", f.search);
  // WohnWert-Gewichtung
  if (f.gewicht_preis !== 20) p.set("gp", String(f.gewicht_preis));
  if (f.gewicht_standort !== 20) p.set("gs", String(f.gewicht_standort));
  if (f.gewicht_infrastruktur !== 20) p.set("gi", String(f.gewicht_infrastruktur));
  if (f.gewicht_ausstattung !== 20) p.set("ga", String(f.gewicht_ausstattung));
  if (f.gewicht_mobilitaet !== 20) p.set("gm", String(f.gewicht_mobilitaet));
  // Rendite-Filter
  if (f.rendite_brutto_min > 0) p.set("rb", String(f.rendite_brutto_min));
  if (f.rendite_netto_min > 0) p.set("rn", String(f.rendite_netto_min));
  if (f.rendite_cashflow_min > -500) p.set("rc", String(f.rendite_cashflow_min));
  if (f.rendite_eigenkapital !== 20) p.set("re", String(f.rendite_eigenkapital));
  if (f.rendite_zinssatz !== 3.8) p.set("rz", String(f.rendite_zinssatz));
  return "?" + p.toString();
}

export default function Dashboard() {
  const { favs, toggle: toggleFav, isFav, count: favCount } = useFavorites();
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [properties, setProperties] = useState<PropertyPin[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<PropertyPin | null>(null);
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"map" | "list" | "stats">("map");
  const [sortBy, setSortBy] = useState<"wohnwert" | "price" | "size" | "rooms">("wohnwert");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showCompare, setShowCompare] = useState(false);
  const [compareProps, setCompareProps] = useState<PropertyDetail[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<"dots" | "wohnwert" | "nahversorgung" | "oepnv" | "pendelzeit" | "preis" | "luft" | "rendite_brutto" | "rendite_netto" | "rendite_cashflow" | "ww_preis" | "ww_standort" | "ww_infrastruktur" | "ww_ausstattung" | "ww_mobilitaet">("dots");
  const [showNoiseMap, setShowNoiseMap] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [impactData, setImpactData] = useState<{ total: number; improved: number; worsened: number; unchanged: number; avgDelta: number } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Read filters from URL on mount
  useEffect(() => {
    const fromURL = filtersFromURL();
    setFilters(fromURL);
  }, []);

  // Load stats once
  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats);
  }, []);

  // Update document title with favorite count
  useEffect(() => {
    document.title = favCount > 0 ? `(${favCount}) WohnWert Dashboard` : "WohnWert Dashboard";
  }, [favCount]);

  // Load properties with debounce on filter change + sync URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const qs = filtersToURL(filters);
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const query = buildQuery(filters);
      
      // Fetch properties
      fetch(`/api/properties?${query}`)
        .then(r => r.json())
        .then(d => { setProperties(d.rows ?? []); setTotal(d.total ?? 0); })
        .finally(() => setLoading(false));
      
      // Fetch impact data if custom weights are used
      const isCustomWeights = filters.gewicht_preis !== 20 || filters.gewicht_standort !== 20 || 
                              filters.gewicht_infrastruktur !== 20 || filters.gewicht_ausstattung !== 20 || 
                              filters.gewicht_mobilitaet !== 20;
      
      if (isCustomWeights) {
        fetch(`/api/impact?${query}`)
          .then(r => r.json())
          .then(setImpactData)
          .catch(() => setImpactData(null));
      } else {
        setImpactData(null);
      }
    }, 400);
  }, [filters]);

  // Load detail on selection
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    fetch(`/api/properties/${selected.scoutId}`)
      .then(r => r.json())
      .then(setDetail);
  }, [selected]);

  const handleSelect = useCallback((p: PropertyPin) => {
    setSelected(prev => prev?.scoutId === p.scoutId ? null : p);
  }, []);

  const handleCompare = useCallback(async () => {
    const favIds = Array.from(favs).slice(0, 4);
    if (favIds.length < 2) {
      alert("Bitte mindestens 2 Favoriten markieren, um zu vergleichen.");
      return;
    }
    const details = await Promise.all(
      favIds.map(id => fetch(`/api/properties/${id}`).then(r => r.json()))
    );
    setCompareProps(details.filter(Boolean));
    setShowCompare(true);
  }, [favs]);

  const handleExportCSV = useCallback(() => {
    const favProps = properties.filter(p => favs.has(p.scoutId));
    if (favProps.length === 0) return;
    const headers = ["ScoutID", "Titel", "PLZ", "Stadtteil", "Typ", "Zimmer", "Fläche m²", "Preis €", "€/m²", "WohnWert", "Klasse", "ÖPNV"];
    const rows = favProps.map(p => [
      p.scoutId,
      `"${(p.title ?? "").replace(/"/g, '""')}"`,
      p.zipCode,
      p.geo_ortsteil ?? p.geo_kreis,
      `${p.object_type}/${p.market_type}`,
      p.noRooms,
      p.livingSpace?.toFixed(0),
      p.market_type === "Miete" ? p.baseRent : p.buyingPrice,
      p.pricePerSqm?.toFixed(2),
      p.wohnwert_index,
      p.wohnwert_klasse,
      p.oepnv_kategorie ?? ""
    ].join(";"));
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wohnwert-favoriten-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [properties, favs]);

  const wwKlassenData = stats ? Object.entries(stats.wohnwert_klassen).map(([k, v]) => ({
    name: k === "unterdurchschnittlich" ? "Unter Ø" : k.charAt(0).toUpperCase() + k.slice(1),
    value: v, color: WW_COLORS[k] ?? "#6b7280",
  })) : [];

  const kreisData = stats?.kreis_data.sort((a, b) => (b.median_ww ?? 0) - (a.median_ww ?? 0)).slice(0, 10) ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* Sidebar Filter */}
      <FilterPanel 
        filters={filters} 
        onChange={setFilters} 
        resultCount={total}
        heatmapMode={heatmapMode}
        onHeatmapChange={setHeatmapMode}
        showNoiseMap={showNoiseMap}
        onNoiseMapToggle={() => setShowNoiseMap(!showNoiseMap)}
        onResetMapView={() => {
          if (mapRef) {
            mapRef.flyTo({ center: [6.9163, 51.1124], zoom: 9, duration: 1000 });
          }
        }}
        impactData={impactData}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* KPIs */}
            {stats && (
              <div className="hidden md:flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5">
                  <Home size={14} className="text-slate-500" />
                  <span className="text-slate-400">Miete:</span>
                  <span className="font-semibold text-white">{stats.median_miete_psqm?.toFixed(2)} €/m²</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Euro size={14} className="text-slate-500" />
                  <span className="text-slate-400">Kauf:</span>
                  <span className="font-semibold text-white">{stats.median_kauf_psqm?.toLocaleString("de-DE")} €/m²</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-slate-500" />
                  <span className="text-slate-400">Ø WohnWert:</span>
                  <span className="font-semibold text-white">{stats.median_wohnwert}</span>
                </div>
                {stats.last_updated && (
                  <div className="flex items-center gap-1.5 text-slate-500" title={`Daten vom ${new Date(stats.last_updated).toLocaleString("de-DE")}`}>
                    <span className="text-[10px]">●</span>
                    <span className="text-xs">Stand: {new Date(stats.last_updated).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavOnly(v => !v)}
              title="Favoriten anzeigen"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                showFavOnly ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-slate-700 text-slate-400 hover:text-white"
              }`}>
              {showFavOnly ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              {favCount > 0 && <span className="text-xs">{favCount}</span>}
            </button>
            {favCount >= 2 && (
              <button
                onClick={handleCompare}
                title="Favoriten vergleichen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500"
              >
                <span>⚖️</span>
                <span className="hidden sm:inline">Vergleichen</span>
              </button>
            )}
            {favCount >= 1 && (
              <button
                onClick={handleExportCSV}
                title="Favoriten als CSV exportieren"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-slate-400 hover:text-white hover:border-green-500"
              >
                <Download size={14} />
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {(
                [
                  { v: "map",   icon: <MapIcon size={15} />,  label: "Karte" },
                  { v: "list",  icon: <List size={15} />,      label: "Liste" },
                  { v: "stats", icon: <BarChart2 size={15} />, label: "Stats" },
                ] as { v: "map" | "list" | "stats"; icon: React.ReactNode; label: string }[]
              ).map(({ v, icon, label }) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Initial load overlay */}
          {loading && properties.length === 0 && (
            <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-slate-200 font-medium">Dashboard wird geladen…</div>
                <div className="text-slate-500 text-sm mt-1">17.186 Inserate werden aufbereitet</div>
              </div>
            </div>
          )}
          {/* Filter-change indicator */}
          {loading && properties.length > 0 && (
            <div className="absolute top-3 right-3 z-30 bg-slate-800/90 border border-slate-600 rounded-full px-3 py-1 text-xs text-slate-300 flex items-center gap-2 shadow">
              <div className="w-3 h-3 border border-slate-500 border-t-blue-400 rounded-full animate-spin" />
              Filtern…
            </div>
          )}

          {/* MAP */}
          {view === "map" && (
            <div className="w-full h-full">
              <Map
                properties={showFavOnly ? properties.filter(p => favs.has(p.scoutId)) : properties}
                onSelect={handleSelect}
                selected={selected}
                heatmapMode={heatmapMode}
                onHeatmapChange={setHeatmapMode}
                showNoiseMap={showNoiseMap}
                onNoiseMapToggle={() => setShowNoiseMap(!showNoiseMap)}
                onMapReady={setMapRef}
              />
            </div>
          )}

          {/* LIST */}
          {view === "list" && (
            <div className="h-full overflow-y-auto p-4">
              {/* Sort Controls */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Sortieren:</span>
                {([
                  { key: "wohnwert", label: "WohnWert" },
                  { key: "price", label: "Preis" },
                  { key: "size", label: "Größe" },
                  { key: "rooms", label: "Zimmer" },
                ] as { key: typeof sortBy; label: string }[]).map(s => (
                  <button
                    key={s.key}
                    onClick={() => {
                      if (sortBy === s.key) setSortDir(d => d === "asc" ? "desc" : "asc");
                      else { setSortBy(s.key); setSortDir("desc"); }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      sortBy === s.key ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {s.label}
                    {sortBy === s.key && <span>{sortDir === "desc" ? "↓" : "↑"}</span>}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(showFavOnly ? properties.filter(p => favs.has(p.scoutId)) : properties)
                  .slice()
                  .sort((a, b) => {
                    let av = 0, bv = 0;
                    if (sortBy === "wohnwert") { av = a.wohnwert_index ?? 0; bv = b.wohnwert_index ?? 0; }
                    else if (sortBy === "price") { av = a.pricePerSqm ?? 0; bv = b.pricePerSqm ?? 0; }
                    else if (sortBy === "size") { av = a.livingSpace ?? 0; bv = b.livingSpace ?? 0; }
                    else if (sortBy === "rooms") { av = a.noRooms ?? 0; bv = b.noRooms ?? 0; }
                    return sortDir === "desc" ? bv - av : av - bv;
                  })
                  .slice(0, 200)
                  .map(p => (
                    <PropertyCard key={p.scoutId} property={p} onClick={() => handleSelect(p)} isFav={isFav(p.scoutId)} onToggleFav={e => { e.stopPropagation(); toggleFav(p.scoutId); }} />
                  ))}
              </div>
              {properties.length > 200 && (
                <p className="text-center text-slate-500 text-sm mt-4">Zeige 200 von {properties.length.toLocaleString("de-DE")} — Filter anwenden für mehr Genauigkeit</p>
              )}
            </div>
          )}

          {/* STATS */}
          {view === "stats" && stats && (
            <div className="h-full overflow-y-auto p-4 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Inserate gesamt", value: stats.total.toLocaleString("de-DE"), sub: `${stats.miete.toLocaleString()} Miete / ${stats.kauf.toLocaleString()} Kauf` },
                  { label: "Median Miete", value: `${stats.median_miete_psqm} €/m²`, sub: "Kaltmiete" },
                  { label: "Median Kauf", value: `${stats.median_kauf_psqm.toLocaleString("de-DE")} €/m²`, sub: "Kaufpreis" },
                  { label: "Ø WohnWert", value: stats.median_wohnwert.toString(), sub: "von 100 Punkten" },
                ].map(c => (
                  <div key={c.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="text-2xl font-bold text-white">{c.value}</div>
                    <div className="text-sm font-medium text-slate-300 mt-0.5">{c.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* WohnWert Verteilung */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">WohnWert-Verteilung</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={wwKlassenData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {wwKlassenData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Kreise */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Top 10 Kreise nach WohnWert</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kreisData} layout="vertical" margin={{ top: 0, right: 30, left: 120, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis type="category" dataKey="inkar_kreis_name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={115} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                      formatter={(v: number) => [`${v.toFixed(1)} Punkte`, "WohnWert"]} />
                    <Bar dataKey="median_ww" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {kreisData.map((_, i) => <Cell key={i} fill={`hsl(${220 + i * 4}, 70%, ${65 - i * 2}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ÖPNV Statistiken */}
              {stats.oepnv_kategorien && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">ÖPNV-Qualität</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: "Exzellent", value: stats.oepnv_kategorien["exzellent"] ?? 0 },
                        { name: "Gut",       value: stats.oepnv_kategorien["gut"] ?? 0 },
                        { name: "Ok",        value: stats.oepnv_kategorien["ok"] ?? 0 },
                        { name: "Schlecht",  value: stats.oepnv_kategorien["schlecht"] ?? 0 },
                      ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {(["#10b981","#22c55e","#eab308","#ef4444"]).map((c, i) => <Cell key={i} fill={c} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {stats.pendel_zone_ddorf && (
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">Pendel-Zone Düsseldorf Hbf</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={Object.entries(stats.pendel_zone_ddorf).map(([k, v]) => ({ name: k, value: v }))}
                          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                          <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {stats.median_pendel_auto_min && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Median Pendel Auto",  value: `${stats.median_pendel_auto_min} Min`,  sub: "zum nächsten Hbf" },
                    { label: "Median Pendel ÖPNV",  value: `${stats.median_pendel_oepnv_min} Min`, sub: "inkl. Umstieg" },
                    { label: "Median Hbf-Distanz",  value: `${stats.median_nearest_hbf_km} km`,    sub: "Luftlinie" },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="text-2xl font-bold text-teal-400">{c.value}</div>
                      <div className="text-sm font-medium text-slate-300 mt-0.5">{c.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selected && detail && (
        <DetailModal
          property={detail as PropertyDetail}
          onClose={() => { setSelected(null); setDetail(null); }}
          isFav={isFav(selected.scoutId)}
          onToggleFav={() => toggleFav(selected.scoutId)}
        />
      )}

      {/* Compare Modal */}
      {showCompare && compareProps.length >= 2 && (
        <CompareModal
          properties={compareProps}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => setCompareProps(prev => prev.filter(p => p.scoutId !== id))}
        />
      )}
    </div>
  );
}

function PropertyCard({ property: p, onClick, isFav, onToggleFav }: {
  property: PropertyPin;
  onClick: () => void;
  isFav?: boolean;
  onToggleFav?: (e: React.MouseEvent) => void;
}) {
  const isMiete = p.market_type === "Miete";
  const preis = isMiete
    ? `${p.baseRent?.toLocaleString("de-DE") ?? "–"}€ kalt`
    : `${p.buyingPrice?.toLocaleString("de-DE") ?? "–"}€`;

  return (
    <div onClick={onClick}
      className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-500 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group relative">
      {p.image_url && (
        <div className="h-36 overflow-hidden bg-slate-700">
          <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      {onToggleFav && (
        <button
          onClick={onToggleFav}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors z-10 ${
            isFav ? "bg-amber-500 text-white" : "bg-slate-900/60 text-slate-400 hover:text-amber-400"
          }`}>
          {isFav ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <WohnwertBadge score={p.wohnwert_index} klasse={p.wohnwert_klasse} size="sm" />
          <div className="text-right">
            <div className="text-sm font-bold text-white">{preis}</div>
            <div className="text-xs text-slate-400">{p.pricePerSqm?.toFixed(0)}€/m²</div>
          </div>
        </div>
        <p className="text-sm text-slate-200 truncate font-medium">{p.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{p.zipCode} {p.geo_ortsteil ?? p.geo_kreis}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span>{p.livingSpace?.toFixed(0)}m²</span>
          <span>{p.noRooms} Zi.</span>
          {p.is_bargain && <span className="text-green-400">🏷️ Schnäppchen</span>}
          {p.is_outlier && <span className="text-red-400" title="Verdächtig – möglicher Ausreißer">⚠️</span>}
          {p.oepnv_kategorie && (
            <span className={`px-1 rounded ${
              p.oepnv_kategorie === "exzellent" ? "bg-emerald-900/40 text-emerald-400" :
              p.oepnv_kategorie === "gut" ? "bg-green-900/40 text-green-400" :
              p.oepnv_kategorie === "ok" ? "bg-yellow-900/40 text-yellow-400" :
              "bg-red-900/40 text-red-400"
            }`}>🚇 {p.oepnv_kategorie}</span>
          )}
        </div>
      </div>
    </div>
  );
}
