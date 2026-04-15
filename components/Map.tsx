"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyPin } from "@/lib/types";

type HeatmapMode = "dots" | "wohnwert" | "nahversorgung" | "oepnv" | "pendelzeit" | "preis" | "luft" | "rendite_brutto" | "rendite_netto" | "rendite_cashflow" | "ww_preis" | "ww_standort" | "ww_infrastruktur" | "ww_ausstattung" | "ww_mobilitaet";

const HEATMAP_MODES: { id: HeatmapMode; label: string; desc: string }[] = [
  { id: "dots",        label: "Inserate",      desc: "Einzelne Inserate mit WohnWert-Farben" },
  { id: "wohnwert",    label: "WohnWert",       desc: "Gesamtqualität laut WohnWert-Index" },
  { id: "nahversorgung",label: "Nahversorgung", desc: "Entfernung zum nächsten Supermarkt" },
  { id: "oepnv",       label: "ÖPNV",           desc: "ÖPNV-Qualitäts-Score" },
  { id: "pendelzeit",  label: "Pendelzeit",     desc: "ÖPNV-Pendelzeit nach Düsseldorf Hbf (invertiert)" },
  { id: "preis",       label: "Preisniveau",    desc: "Preis pro m² (teurer = wärmer)" },
  { id: "luft",        label: "Luftqualität",   desc: "Luftqualitätsindex (LQI) der nächsten Messstation" },
  { id: "rendite_brutto", label: "Rendite (Brutto)", desc: "Bruttorendite für Kaufobjekte" },
  { id: "rendite_netto", label: "Rendite (Netto)", desc: "Nettorendite nach Kosten" },
  { id: "rendite_cashflow", label: "Cashflow", desc: "Monatlicher Cashflow" },
  { id: "ww_preis", label: "WW: Preis", desc: "WohnWert-Dimension: Preis-Leistung" },
  { id: "ww_standort", label: "WW: Standort", desc: "WohnWert-Dimension: Standortqualität" },
  { id: "ww_infrastruktur", label: "WW: Infrastruktur", desc: "WohnWert-Dimension: Infrastruktur" },
  { id: "ww_ausstattung", label: "WW: Ausstattung", desc: "WohnWert-Dimension: Ausstattung" },
  { id: "ww_mobilitaet", label: "WW: Mobilität", desc: "WohnWert-Dimension: Mobilität" },
];

interface Props {
  properties: PropertyPin[];
  onSelect: (p: PropertyPin) => void;
  selected: PropertyPin | null;
  heatmapMode?: HeatmapMode;
  onHeatmapChange?: (mode: HeatmapMode) => void;
  showNoiseMap?: boolean;
  onNoiseMapToggle?: () => void;
  onMapReady?: (map: any) => void;
}

function toGeoJSON(properties: PropertyPin[]) {
  return {
    type: "FeatureCollection" as const,
    features: properties
      .filter(p => p.lat && p.lng)
      .map(p => {
        // Normalised 0-1 scores for heatmap weights
        const ww       = (p.wohnwert_index ?? 50) / 100;
        const nahv     = p.osm_supermarket_nearest_m != null
          ? Math.max(0, 1 - Math.min(p.osm_supermarket_nearest_m, 1500) / 1500) : 0.5;
        const oepnv    = (p.oepnv_score ?? 50) / 100;
        const pendel   = p.pendel_oepnv_min != null
          ? Math.max(0, 1 - Math.min(p.pendel_oepnv_min, 90) / 90) : 0.5;
        const preis    = p.pricePerSqm != null
          ? Math.min(p.pricePerSqm, 30) / 30 : 0.5;
        const luft     = (p.air_score ?? 50) / 100;
        
        // Rendite-Berechnungen (nur für Kauf-Objekte)
        const kaufpreis = p.buyingPrice ?? 0;
        const vergleichsmiete = (p.pricePerSqm ?? 0) * (p.livingSpace ?? 0) * 0.04 / 12;
        const bruttorendite = kaufpreis > 0 ? Math.min((vergleichsmiete * 12) / kaufpreis * 100, 10) / 10 : 0;
        const nebenkosten = kaufpreis * 0.122;
        const jahreskosten = kaufpreis * 0.01 + kaufpreis * 0.0035;
        const nettorendite = kaufpreis > 0 ? Math.min(((vergleichsmiete * 12) - jahreskosten) / (kaufpreis + nebenkosten) * 100, 8) / 8 : 0;
        const darlehen = (kaufpreis + nebenkosten) * 0.8;
        const monatsrate = darlehen * 0.058 / 12;
        const instandhaltung = kaufpreis * 0.01 / 12;
        const cashflow = vergleichsmiete - monatsrate - instandhaltung;
        const cashflowNorm = Math.max(0, Math.min((cashflow + 500) / 1000, 1));
        
        // WohnWert-Subscores (falls vorhanden, sonst Fallback)
        const wwPreis = ((p as any).ww_dim_preis ?? 50) / 100;
        const wwStandort = ((p as any).ww_dim_standort ?? 50) / 100;
        const wwInfrastruktur = ((p as any).ww_dim_infrastruktur ?? 50) / 100;
        const wwAusstattung = ((p as any).ww_dim_ausstattung ?? 50) / 100;
        const wwMobilitaet = ((p as any).ww_dim_mobilitaet ?? 50) / 100;

        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
          properties: {
            scoutId: p.scoutId,
            wohnwert_index: p.wohnwert_index ?? 50,
            wohnwert_klasse: p.wohnwert_klasse ?? "",
            market_type: p.market_type,
            pricePerSqm: p.pricePerSqm ?? 0,
            livingSpace: p.livingSpace ?? 0,
            noRooms: p.noRooms ?? 0,
            title: p.title ?? "",
            zipCode: p.zipCode ?? "",
            geo_ortsteil: p.geo_ortsteil ?? p.geo_kreis ?? "",
            // Heatmap scores (0–1)
            hw_wohnwert:      ww,
            hw_nahversorgung: nahv,
            hw_oepnv:         oepnv,
            hw_pendelzeit:    pendel,
            hw_preis:         preis,
            hw_luft:          luft,
            hw_rendite_brutto: bruttorendite,
            hw_rendite_netto: nettorendite,
            hw_rendite_cashflow: cashflowNorm,
            hw_ww_preis: wwPreis,
            hw_ww_standort: wwStandort,
            hw_ww_infrastruktur: wwInfrastruktur,
            hw_ww_ausstattung: wwAusstattung,
            hw_ww_mobilitaet: wwMobilitaet,
          },
        };
      }),
  };
}

const SOURCE_ID = "properties";
const SOURCE_RAW = "properties-raw";

const DOT_LAYERS   = ["clusters", "cluster-count", "unclustered", "selected"];
const HEAT_LAYERS  = [
  "hm-wohnwert","hm-nahversorgung","hm-oepnv","hm-pendelzeit","hm-preis","hm-luft",
  "hm-rendite_brutto","hm-rendite_netto","hm-rendite_cashflow",
  "hm-ww_preis","hm-ww_standort","hm-ww_infrastruktur","hm-ww_ausstattung","hm-ww_mobilitaet"
];
const HEAT_KEY_MAP: Record<string, string> = {
  "hm-wohnwert":     "hw_wohnwert",
  "hm-nahversorgung":"hw_nahversorgung",
  "hm-oepnv":        "hw_oepnv",
  "hm-pendelzeit":   "hw_pendelzeit",
  "hm-preis":        "hw_preis",
  "hm-luft":         "hw_luft",
  "hm-rendite_brutto": "hw_rendite_brutto",
  "hm-rendite_netto": "hw_rendite_netto",
  "hm-rendite_cashflow": "hw_rendite_cashflow",
  "hm-ww_preis": "hw_ww_preis",
  "hm-ww_standort": "hw_ww_standort",
  "hm-ww_infrastruktur": "hw_ww_infrastruktur",
  "hm-ww_ausstattung": "hw_ww_ausstattung",
  "hm-ww_mobilitaet": "hw_ww_mobilitaet",
};

export default function Map({
  properties,
  onSelect,
  selected,
  heatmapMode = "dots",
  onHeatmapChange = () => {},
  showNoiseMap = false,
  onNoiseMapToggle = () => {},
  onMapReady = () => {}
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  const propsRef = useRef(properties);
  propsRef.current = properties;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const heatmapModeRef = useRef<HeatmapMode>(heatmapMode);
  heatmapModeRef.current = heatmapMode;

  // Init map + layers once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("maplibre-gl").then(({ default: mgl }) => {
      const map = new mgl.Map({
        container: containerRef.current!,
        style: {
          version: 8,
          sources: {
            carto: {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "\u00a9 CARTO \u00b7 \u00a9 OpenStreetMap contributors",
              maxzoom: 19,
            },
          },
          layers: [{ id: "carto", type: "raster", source: "carto" }],
        },
        center: [6.9163, 51.1124],
        zoom: 9,
        maxZoom: 18,
      });

      map.addControl(new mgl.NavigationControl({ showCompass: false }), "top-right");
      
      mapRef.current = map;
      onMapReady(map);

      map.on("load", () => {
        // WMS Lärmkarte NRW (Straßenlärm LDEN 24h)
        map.addSource("laerm-wms", {
          type: "raster",
          tiles: [
            "https://www.wms.nrw.de/umwelt/laerm_stufe4?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=Strasse_LDEN&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
          ],
          tileSize: 256,
          attribution: "© LANUV NRW Lärmkartierung",
        });
        map.addLayer({
          id: "laerm-layer",
          type: "raster",
          source: "laerm-wms",
          layout: { visibility: "none" },
          paint: { "raster-opacity": 0.6 },
        }, "carto"); // Insert below base layer

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: toGeoJSON(propsRef.current),
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 40,
        });
        // Second source without clustering for heatmap modes
        map.addSource(SOURCE_RAW, {
          type: "geojson",
          data: toGeoJSON(propsRef.current),
        });

        // Cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step", ["get", "point_count"],
              "#6366f1", 10,
              "#4f46e5", 50,
              "#3730a3", 200,
              "#1e1b4b",
            ],
            "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 22, 200, 28],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.85,
          },
        });

        // Cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 11,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          },
          paint: { "text-color": "#f8fafc" },
        });

        // Individual points
        map.addLayer({
          id: "unclustered",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 5,
            "circle-color": [
              "match", ["get", "wohnwert_klasse"],
              "exzellent",            "#0d9488",
              "gut",                  "#2563eb",
              "durchschnittlich",     "#64748b",
              "unterdurchschnittlich","#d97706",
              "mangelhaft",           "#dc2626",
              "#64748b",
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(255,255,255,0.7)",
          },
        });

        // Selected highlight layer
        map.addLayer({
          id: "selected",
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "scoutId"], -1],
          paint: {
            "circle-radius": 10,
            "circle-color": "#f59e0b",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#fff",
          },
        });

        // ── Heatmap circle layers (one per factor, initially hidden) ──────────────
        for (const [layerId, weightKey] of Object.entries(HEAT_KEY_MAP)) {
          map.addLayer({
            id: layerId,
            type: "circle",
            source: SOURCE_RAW,  // Use non-clustered source
            layout: { visibility: "none" },
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 5, 14, 10],
              "circle-opacity": 0.6,
              "circle-stroke-width": 0.5,
              "circle-stroke-color": "#fff",
              "circle-color": [
                "interpolate", ["linear"], ["get", weightKey],
                0,   "#ef4444",   // red (bad/expensive)
                0.3, "#f97316",   // orange
                0.5, "#eab308",   // yellow
                0.7, "#84cc16",   // light green
                1,   "#16a34a",   // dark green (good/cheap)
              ],
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
        }

        // Click on single point
        map.on("click", "unclustered", (e) => {
          if (!e.features?.length) return;
          const feat = e.features[0];
          const sid = feat.properties?.scoutId;
          const match = propsRef.current.find(p => p.scoutId === sid);
          if (!match) return;
          onSelectRef.current(match);

          popupRef.current?.remove();
          const price = match.market_type === "Miete"
            ? `${match.pricePerSqm?.toFixed(2)} €/m²`
            : `${match.pricePerSqm?.toLocaleString("de-DE")} €/m²`;

          popupRef.current = new mgl.Popup({ closeButton: false, maxWidth: "230px", offset: 12 })
            .setLngLat([match.lng, match.lat])
            .setHTML(`
              <div style="padding:10px 12px;font-family:system-ui;font-size:12px;line-height:1.5;color:#f1f5f9">
                <div style="font-weight:600;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;color:#f8fafc">${match.title ?? ""}</div>
                <div style="color:#94a3b8;font-size:11px">${match.zipCode} ${match.geo_ortsteil}</div>
                <div style="display:flex;gap:10px;margin-top:6px;color:#cbd5e1">
                  <span>${match.livingSpace?.toFixed(0)} m²</span>
                  <span>${match.noRooms} Zi.</span>
                  <span style="font-weight:600;color:#f8fafc">${price}</span>
                </div>
                <div style="margin-top:6px;padding:3px 7px;background:#0f172a;border-radius:5px;display:inline-block;border:1px solid #334155;color:#94a3b8;font-size:11px">
                  WohnWert <strong style="color:#60a5fa">${match.wohnwert_index?.toFixed(0)}</strong> · ${match.wohnwert_klasse}
                </div>
              </div>
            `)
            .addTo(map);
        });

        // Click cluster → zoom in
        map.on("click", "clusters", (e) => {
          if (!e.features?.length) return;
          const clusterId = e.features[0].properties?.cluster_id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map.getSource(SOURCE_ID) as any).getClusterExpansionZoom(clusterId, (_: unknown, zoom: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.easeTo({ center: ((e.features![0].geometry as any).coordinates as [number, number]), zoom, duration: 400 });
          });
        });

        map.on("mouseenter", "unclustered", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "unclustered", () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      });

      mapRef.current = map;
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle layer visibility when heatmap mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded?.()) return;
    const activeHeat = heatmapMode !== "dots" ? `hm-${heatmapMode}` : null;
    for (const id of DOT_LAYERS)  map.setLayoutProperty?.(id, "visibility", heatmapMode === "dots" ? "visible" : "none");
    for (const id of HEAT_LAYERS) map.setLayoutProperty?.(id, "visibility", id === activeHeat ? "visible" : "none");
    if (heatmapMode === "dots") popupRef.current?.remove();
  }, [heatmapMode]);

  // Update both sources when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const geo = toGeoJSON(properties);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const src = map.getSource?.(SOURCE_ID) as any;
      if (src?.setData) src.setData(geo);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const srcRaw = map.getSource?.(SOURCE_RAW) as any;
      if (srcRaw?.setData) srcRaw.setData(geo);
    };
    if (map.isStyleLoaded?.()) update();
    else map.once?.("load", update);
  }, [properties]);

  // Highlight selected point
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded?.()) return;
    const filter: unknown[] = selected
      ? ["==", ["get", "scoutId"], selected.scoutId]
      : ["==", ["get", "scoutId"], -1];
    map.setFilter?.("selected", filter);
    if (selected) map.easeTo?.({ center: [selected.lng, selected.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 });
  }, [selected]);

  // Toggle noise map layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded?.()) return;
    const layer = map.getLayer?.("laerm-layer");
    if (layer) {
      map.setLayoutProperty?.("laerm-layer", "visibility", showNoiseMap ? "visible" : "none");
    }
  }, [showNoiseMap]);

  const activeMeta = HEATMAP_MODES.find(m => m.id === heatmapMode)!;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Anzahl */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 pointer-events-none shadow-sm">
        {properties.length.toLocaleString("de-DE")} Inserate
      </div>

      {/* Heatmap mode selector */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <div className="bg-white/95 border border-slate-200 rounded-lg shadow p-1.5 flex flex-col gap-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-0.5">Kartenebene</div>
          {HEATMAP_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => onHeatmapChange(m.id)}
              title={m.desc}
              className={`text-left text-[11px] px-2 py-1 rounded transition-colors ${
                heatmapMode === m.id
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {/* Lärmkarte Toggle */}
        <button
          onClick={onNoiseMapToggle}
          title="Lärmkarte NRW (Straßenlärm LDEN 24h)"
          className={`bg-white/95 border border-slate-200 rounded-lg shadow px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 transition-colors ${
            showNoiseMap ? "bg-orange-100 border-orange-300 text-orange-700" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="text-sm">🔊</span>
          <span>Lärmkarte {showNoiseMap ? "an" : "aus"}</span>
        </button>
        {/* Reset View Button */}
        <button
          onClick={() => {
            mapRef.current?.flyTo({ center: [6.9163, 51.1124], zoom: 9, duration: 1000 });
          }}
          title="Zurück zur Übersicht"
          className="bg-white/95 border border-slate-200 rounded-lg shadow px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">🗺️</span>
          <span>Übersicht</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 right-3 bg-white/95 border border-slate-200 rounded-lg p-2.5 text-[11px] pointer-events-none shadow">
        {heatmapMode === "dots" ? (
          <>
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-1.5">WohnWert</div>
            <div className="space-y-1.5">
              {[
                ["#0d9488", "Exzellent"],
                ["#2563eb", "Gut"],
                ["#64748b", "Durchschnitt"],
                ["#d97706", "Unter Ø"],
                ["#dc2626", "Mangelhaft"],
              ].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/80" style={{ background: c }} />
                  <span className="text-slate-500">{l}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-indigo-500" />
                <span className="text-slate-400">Cluster</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-2">{activeMeta.label}</div>
            <div className="w-28 h-2.5 rounded-full mb-1.5" style={{
              background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #16a34a)"
            }} />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{heatmapMode === "preis" ? "günstig" : heatmapMode === "pendelzeit" ? "kurz" : "schlecht"}</span>
              <span>{heatmapMode === "preis" ? "teuer" : heatmapMode === "pendelzeit" ? "lang" : "gut"}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 max-w-[120px] leading-tight">{activeMeta.desc}</p>
          </>
        )}
      </div>
    </div>
  );
}
