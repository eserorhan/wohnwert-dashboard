"use client";

type HeatmapMode = "dots" | "wohnwert" | "nahversorgung" | "oepnv" | "pendelzeit" | "preis" | "luft" | "rendite_brutto" | "rendite_netto" | "rendite_cashflow" | "ww_preis" | "ww_standort" | "ww_infrastruktur" | "ww_ausstattung" | "ww_mobilitaet";

interface Layer {
  id: HeatmapMode;
  icon: string;
  label: string;
  desc: string;
  group?: string;
}

interface Overlay {
  id: string;
  icon: string;
  label: string;
  enabled: boolean;
}

interface Props {
  activeLayer: HeatmapMode;
  onLayerChange: (layer: HeatmapMode) => void;
  overlays: Overlay[];
  onOverlayToggle: (id: string) => void;
  onResetView: () => void;
}

const LAYERS: Layer[] = [
  // Basis
  { id: "dots", icon: "📍", label: "Inserate", desc: "Einzelne Inserate mit WohnWert-Farben", group: "basis" },
  { id: "wohnwert", icon: "⭐", label: "WohnWert", desc: "Gesamtqualität laut WohnWert-Index", group: "basis" },
  
  // Rendite (nur Kauf)
  { id: "rendite_brutto", icon: "💰", label: "R: Brutto", desc: "Bruttorendite für Kaufobjekte", group: "rendite" },
  { id: "rendite_netto", icon: "💵", label: "R: Netto", desc: "Nettorendite nach Kosten", group: "rendite" },
  { id: "rendite_cashflow", icon: "💸", label: "R: Cashflow", desc: "Monatlicher Cashflow", group: "rendite" },
  
  // WohnWert-Dimensionen
  { id: "ww_preis", icon: "💶", label: "WW: Preis", desc: "Preis-Leistungs-Verhältnis", group: "ww_dims" },
  { id: "ww_standort", icon: "📍", label: "WW: Standort", desc: "Standortqualität", group: "ww_dims" },
  { id: "ww_infrastruktur", icon: "🏗️", label: "WW: Infra", desc: "Infrastruktur-Score", group: "ww_dims" },
  { id: "ww_ausstattung", icon: "🛋️", label: "WW: Ausst.", desc: "Ausstattungs-Score", group: "ww_dims" },
  { id: "ww_mobilitaet", icon: "🚊", label: "WW: Mobil.", desc: "Mobilitäts-Score", group: "ww_dims" },
  
  // Infrastruktur & Umwelt
  { id: "preis", icon: "💶", label: "Preis/m²", desc: "Preis pro m² (teurer = wärmer)", group: "infra" },
  { id: "nahversorgung", icon: "🛒", label: "Nahvers.", desc: "Entfernung zum nächsten Supermarkt", group: "infra" },
  { id: "oepnv", icon: "🚊", label: "ÖPNV", desc: "ÖPNV-Qualitäts-Score", group: "infra" },
  { id: "pendelzeit", icon: "⏱️", label: "Pendeln", desc: "ÖPNV-Pendelzeit nach Düsseldorf Hbf", group: "infra" },
  { id: "luft", icon: "🌿", label: "Luft", desc: "Luftqualitätsindex (LQI)", group: "infra" },
];

export default function LayerSwitcher({ 
  activeLayer, 
  onLayerChange, 
  overlays, 
  onOverlayToggle,
  onResetView 
}: Props) {
  const groupedLayers = {
    basis: LAYERS.filter(l => l.group === "basis"),
    rendite: LAYERS.filter(l => l.group === "rendite"),
    ww_dims: LAYERS.filter(l => l.group === "ww_dims"),
    infra: LAYERS.filter(l => l.group === "infra"),
  };

  return (
    <div className="space-y-3">
      {/* Basis-Layer */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Basis
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {groupedLayers.basis.map(layer => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.desc}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeLayer === layer.id
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">{layer.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rendite-Layer */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          💰 Rendite (Kauf)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {groupedLayers.rendite.map(layer => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.desc}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeLayer === layer.id
                  ? "bg-green-600 text-white shadow-lg scale-105"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">{layer.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* WohnWert-Dimensionen */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          ⭐ WohnWert-Dimensionen
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {groupedLayers.ww_dims.map(layer => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.desc}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeLayer === layer.id
                  ? "bg-purple-600 text-white shadow-lg scale-105"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">{layer.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Infrastruktur & Umwelt */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          🏗️ Infrastruktur & Umwelt
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {groupedLayers.infra.map(layer => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.desc}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeLayer === layer.id
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">{layer.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Overlays */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Overlays
        </div>
        <div className="space-y-1.5">
          {overlays.map(overlay => (
            <button
              key={overlay.id}
              onClick={() => onOverlayToggle(overlay.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                overlay.enabled
                  ? "bg-blue-600/20 border border-blue-500/50 text-blue-300"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="text-base">{overlay.icon}</span>
              <span className="flex-1 text-left">{overlay.label}</span>
              <span className="text-xs">
                {overlay.enabled ? "✓" : "○"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset View */}
      <button
        onClick={onResetView}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
      >
        <span className="text-base">🗺️</span>
        <span>Zurück zur Übersicht</span>
      </button>
    </div>
  );
}
