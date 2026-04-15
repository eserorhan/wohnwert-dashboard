"use client";
import { Filters } from "@/lib/types";
import WohnwertGewichtung from "./WohnwertGewichtung";
import RenditeFilter from "./RenditeFilter";
import CollapsibleSection from "./CollapsibleSection";
import LayerSwitcher from "./LayerSwitcher";
import SmartSlider from "./SmartSlider";
import { useState } from "react";

type HeatmapMode = "dots" | "wohnwert" | "nahversorgung" | "oepnv" | "pendelzeit" | "preis" | "luft" | "rendite_brutto" | "rendite_netto" | "rendite_cashflow" | "ww_preis" | "ww_standort" | "ww_infrastruktur" | "ww_ausstattung" | "ww_mobilitaet";

const FILTER_PRESETS: { label: string; emoji: string; filters: Partial<Filters> }[] = [
  { label: "Studenten", emoji: "🎓", filters: { market_type: "Miete", rooms_min: 1, total_price_max: 800, size_min: 20 } },
  { label: "Familie", emoji: "👨‍👩‍👧", filters: { rooms_min: 3, size_min: 80, oepnv_kategorie: "all" } },
  { label: "Pendler", emoji: "🚆", filters: { oepnv_kategorie: "A", pendel_max_min: 45 } },
  { label: "Schnäppchen", emoji: "💰", filters: { is_bargain: true, wohnwert_min: 40 } },
];

const KREISE = [
  "all", "Düsseldorf", "Köln", "Wuppertal", "Kreis Mettmann", "Rhein-Kreis Neuss",
  "Rheinisch-Bergischer Kreis", "Kreis Viersen", "Leverkusen", "Remscheid",
  "Solingen", "Kreis Heinsberg", "Mönchengladbach", "Duisburg", "Mülheim an der Ruhr",
  "Bonn", "Rhein-Sieg-Kreis", "Oberbergischer Kreis", "Kreis Düren",
];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
  heatmapMode?: HeatmapMode;
  onHeatmapChange?: (mode: HeatmapMode) => void;
  showNoiseMap?: boolean;
  onNoiseMapToggle?: () => void;
  onResetMapView?: () => void;
  impactData?: { total: number; improved: number; worsened: number; unchanged: number; avgDelta: number } | null;
}

export default function FilterPanel({ 
  filters, 
  onChange, 
  resultCount,
  heatmapMode = "dots",
  onHeatmapChange = () => {},
  showNoiseMap = false,
  onNoiseMapToggle = () => {},
  onResetMapView = () => {},
  impactData = null
}: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const [showFavorites, setShowFavorites] = useState(false);

  const handleExit = () => {
    localStorage.removeItem("wohnwert_favorites");
    window.location.href = "/";
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-700 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏠</span> WohnWert
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">NRW Immobilien-Analyse</p>
        </div>
        <button
          onClick={handleExit}
          title="Exit / Reset"
          className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Ergebnis-Counter */}
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{resultCount.toLocaleString("de-DE")}</div>
          <div className="text-slate-400 text-xs">Inserate gefunden</div>
        </div>

        {/* Suche */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Suche</label>
          <input
            type="text"
            placeholder="PLZ, Stadtteil, Straße..."
            value={filters.search}
            onChange={e => set({ search: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter-Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Schnellfilter</label>
          <div className="grid grid-cols-2 gap-1.5">
            {FILTER_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => onChange({ ...DEFAULT_FILTERS, ...p.filters })}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-slate-300 transition-colors"
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basis-Filter Section */}
        <CollapsibleSection title="Basis-Filter" defaultOpen={true}>
          {/* Markt-Typ */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Markt</label>
            <div className="grid grid-cols-3 gap-1">
              {(["all", "Miete", "Kauf"] as const).map(v => (
                <button key={v}
                  onClick={() => set({ market_type: v })}
                  className={`py-1.5 text-sm rounded-md font-medium transition-colors ${
                    filters.market_type === v
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}>
                  {v === "all" ? "Alle" : v}
                </button>
              ))}
            </div>
          </div>

          {/* Objekt-Typ */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Typ</label>
            <div className="grid grid-cols-3 gap-1">
              {(["all", "Wohnung", "Haus"] as const).map(v => (
                <button key={v}
                  onClick={() => set({ object_type: v })}
                  className={`py-1.5 text-sm rounded-md font-medium transition-colors ${
                    filters.object_type === v
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}>
                  {v === "all" ? "Alle" : v}
                </button>
              ))}
            </div>
          </div>

          {/* WohnWert */}
          <div className="space-y-2">
            <SmartSlider
              label="WohnWert Min"
              value={filters.wohnwert_min}
              min={0}
              max={100}
              step={5}
              precision={1}
              unit=""
              onChange={v => set({ wohnwert_min: v })}
            />
            <SmartSlider
              label="WohnWert Max"
              value={filters.wohnwert_max}
              min={0}
              max={100}
              step={5}
              precision={1}
              unit=""
              onChange={v => set({ wohnwert_max: v })}
            />
          </div>

          {/* Preis/m² */}
          <div className="space-y-2">
            <SmartSlider
              label="Preis/m² Min"
              value={filters.price_min}
              min={0}
              max={50}
              step={1}
              precision={0.5}
              unit="€"
              onChange={v => set({ price_min: v })}
            />
            <SmartSlider
              label="Preis/m² Max"
              value={filters.price_max}
              min={0}
              max={50}
              step={1}
              precision={0.5}
              unit="€"
              onChange={v => set({ price_max: v })}
            />
          </div>

          {/* Absoluter Preis (Kaufpreis / Kaltmiete) */}
          <div className="space-y-2">
            <SmartSlider
              label={filters.market_type === "Miete" ? "Kaltmiete Min" : "Kaufpreis Min"}
              value={filters.total_price_min}
              min={filters.market_type === "Miete" ? 200 : 50000}
              max={filters.market_type === "Miete" ? 5000 : 2000000}
              step={filters.market_type === "Kauf" ? 10000 : 50}
              precision={filters.market_type === "Kauf" ? 5000 : 10}
              unit="€"
              onChange={v => set({ total_price_min: v })}
            />
            <SmartSlider
              label={filters.market_type === "Miete" ? "Kaltmiete Max" : "Kaufpreis Max"}
              value={filters.total_price_max}
              min={filters.market_type === "Miete" ? 200 : 50000}
              max={filters.market_type === "Miete" ? 5000 : 2000000}
              step={filters.market_type === "Kauf" ? 10000 : 50}
              precision={filters.market_type === "Kauf" ? 5000 : 10}
              unit="€"
              onChange={v => set({ total_price_max: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Erweiterte Filter Section */}
        <CollapsibleSection title="Erweiterte Filter" defaultOpen={false}>
          {/* Wohnfläche */}
          <SmartSlider
            label="Wohnfläche Min"
            value={filters.size_min}
            min={0}
            max={300}
            step={10}
            precision={5}
            unit="m²"
            onChange={v => set({ size_min: v })}
          />

          {/* Zimmer */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Zimmer: ab {filters.rooms_min}
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r}
                  onClick={() => set({ rooms_min: r })}
                  className={`py-1.5 text-sm rounded-md font-medium transition-colors ${
                    filters.rooms_min === r
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}>
                  {r}+
                </button>
              ))}
            </div>
          </div>

          {/* Kreis */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Kreis</label>
            <select
              value={filters.kreis}
              onChange={e => set({ kreis: e.target.value })}
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-md border border-slate-600 p-2 focus:outline-none focus:border-blue-500">
              {KREISE.map(k => (
                <option key={k} value={k}>{k === "all" ? "Alle Kreise" : k}</option>
              ))}
            </select>
          </div>

          {/* Schnäppchen */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.is_bargain}
                onChange={e => set({ is_bargain: e.target.checked })}
                className="w-4 h-4 rounded accent-green-500" />
              <span className="text-sm text-slate-200">Nur Schnäppchen 🏷️</span>
            </label>
          </div>

          {/* ÖPNV Kategorie */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">ÖPNV-Qualität</label>
            <div className="grid grid-cols-2 gap-1">
              {(["all", "exzellent", "gut", "ok", "schlecht"] as const).map(v => (
                <button key={v}
                  onClick={() => set({ oepnv_kategorie: v })}
                  className={`py-1.5 text-xs rounded-md font-medium transition-colors ${
                    filters.oepnv_kategorie === v
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}>
                  {v === "all" ? "Alle" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Pendel-Ziel */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">🚂 Pendel-Ziel</label>
            <div className="grid grid-cols-3 gap-1">
              {(["duesseldorf", "koeln", "wuppertal"] as const).map(v => (
                <button key={v}
                  onClick={() => set({ pendel_ziel: v })}
                  className={`py-1.5 text-xs rounded-md font-medium transition-colors ${
                    filters.pendel_ziel === v
                      ? "bg-teal-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}>
                  {v === "duesseldorf" ? "Ddorf" : v === "koeln" ? "Köln" : "Wupp."}
                </button>
              ))}
            </div>
          </div>

          {/* Max Pendelzeit */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Max. Pendelzeit: {filters.pendel_max_min >= 120 ? "egal" : `${filters.pendel_max_min} Min`}
            </label>
            <input type="range" min={10} max={120} step={5} value={filters.pendel_max_min}
              onChange={e => set({ pendel_max_min: Number(e.target.value) })}
              className="w-full accent-teal-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-0.5">
              <span>10 Min</span><span>egal</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Personalisierung Section */}
        <CollapsibleSection title="🎛️ Personalisierung" defaultOpen={false} badge={filters.gewicht_preis !== 20 || filters.rendite_brutto_min > 0 ? "Aktiv" : undefined}>
          {/* WohnWert-Gewichtung */}
        <WohnwertGewichtung
          weights={{
            preis: filters.gewicht_preis,
            standort: filters.gewicht_standort,
            infrastruktur: filters.gewicht_infrastruktur,
            ausstattung: filters.gewicht_ausstattung,
            mobilitaet: filters.gewicht_mobilitaet,
          }}
          onChange={w => set({
            gewicht_preis: w.preis,
            gewicht_standort: w.standort,
            gewicht_infrastruktur: w.infrastruktur,
            gewicht_ausstattung: w.ausstattung,
            gewicht_mobilitaet: w.mobilitaet,
          })}
          impactData={impactData ?? undefined}
        />

          {/* Rendite-Filter */}
          <RenditeFilter
            values={{
              brutto_min: filters.rendite_brutto_min,
              netto_min: filters.rendite_netto_min,
              cashflow_min: filters.rendite_cashflow_min,
              eigenkapital: filters.rendite_eigenkapital,
              zinssatz: filters.rendite_zinssatz,
            }}
            onChange={v => set({
              rendite_brutto_min: v.brutto_min,
              rendite_netto_min: v.netto_min,
              rendite_cashflow_min: v.cashflow_min,
              rendite_eigenkapital: v.eigenkapital,
              rendite_zinssatz: v.zinssatz,
            })}
            resultCount={resultCount}
          />
        </CollapsibleSection>

        {/* Karten-Layer Section */}
        <CollapsibleSection title="🗺️ Karten-Layer" defaultOpen={false}>
          <LayerSwitcher
            activeLayer={heatmapMode}
            onLayerChange={onHeatmapChange}
            overlays={[
              { id: "noise", icon: "🔊", label: "Lärmkarte", enabled: showNoiseMap },
              { id: "favorites", icon: "⭐", label: "Favoriten", enabled: showFavorites },
            ]}
            onOverlayToggle={(id) => {
              if (id === "noise") onNoiseMapToggle();
              if (id === "favorites") setShowFavorites(!showFavorites);
            }}
            onResetView={onResetMapView}
          />
        </CollapsibleSection>

        {/* Reset */}
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-md transition-colors">
          Filter zurücksetzen
        </button>
      </div>
    </aside>
  );
}

export const DEFAULT_FILTERS: Filters = {
  market_type: "all",
  object_type: "all",
  wohnwert_min: 0,
  wohnwert_max: 100,
  price_min: 0,
  price_max: 50,
  total_price_min: 0,
  total_price_max: 2000000,
  size_min: 0,
  size_max: 500,
  rooms_min: 1,
  kreis: "all",
  is_bargain: false,
  pendel_max_min: 120,
  pendel_ziel: "duesseldorf",
  oepnv_kategorie: "all",
  search: "",
  gewicht_preis: 20,
  gewicht_standort: 20,
  gewicht_infrastruktur: 20,
  gewicht_ausstattung: 20,
  gewicht_mobilitaet: 20,
  rendite_brutto_min: 0,
  rendite_netto_min: 0,
  rendite_cashflow_min: -500,
  rendite_eigenkapital: 20,
  rendite_zinssatz: 3.8,
};
