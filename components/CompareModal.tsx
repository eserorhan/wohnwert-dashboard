"use client";
import { PropertyDetail } from "@/lib/types";
import { X } from "lucide-react";

interface Props {
  properties: PropertyDetail[];
  onClose: () => void;
  onRemove: (scoutId: number) => void;
}

const COMPARE_ROWS: { label: string; key: keyof PropertyDetail | ((p: PropertyDetail) => string | number | null); unit?: string }[] = [
  { label: "Typ", key: p => `${p.object_type} / ${p.market_type}` },
  { label: "Wohnfläche", key: "livingSpace", unit: "m²" },
  { label: "Zimmer", key: "noRooms" },
  { label: "Baujahr", key: "yearConstructed" },
  { label: "Etage", key: "floor" },
  { label: "Kaltmiete", key: "baseRent", unit: "€" },
  { label: "Kaufpreis", key: "buyingPrice", unit: "€" },
  { label: "Preis/m²", key: "pricePerSqm", unit: "€/m²" },
  { label: "WohnWert", key: "wohnwert_index", unit: "/ 100" },
  { label: "WohnWert-Klasse", key: "wohnwert_klasse" },
  { label: "Preis-Dimension", key: "ww_dim_preis", unit: "/ 100" },
  { label: "Standort-Dimension", key: "ww_dim_standort", unit: "/ 100" },
  { label: "Infrastruktur-Dimension", key: "ww_dim_infrastruktur", unit: "/ 100" },
  { label: "Ausstattung-Dimension", key: "ww_dim_ausstattung", unit: "/ 100" },
  { label: "Mobilität-Dimension", key: "ww_dim_mobilitaet", unit: "/ 100" },
  { label: "ÖPNV-Kategorie", key: "oepnv_kategorie" },
  { label: "ÖPNV-Score", key: "oepnv_score", unit: "/ 100" },
  { label: "Nächster Hbf", key: p => p.nearest_hbf ? `${p.nearest_hbf} (${p.nearest_hbf_km} km)` : null },
  { label: "Pendelzeit ÖPNV", key: "pendel_oepnv_min", unit: "Min" },
  { label: "Supermarkt", key: "osm_supermarket_nearest_m", unit: "m" },
  { label: "Luftqualität (LQI)", key: p => p.air_lqi ? `${p.air_lqi} (${p.air_lqi_text})` : null },
  { label: "Luft-Score", key: "air_score", unit: "/ 100" },
  { label: "Kreis", key: "inkar_kreis_name" },
  { label: "Stadtteil", key: "geo_ortsteil" },
];

function getValue(p: PropertyDetail, row: typeof COMPARE_ROWS[0]): string {
  const val = typeof row.key === "function" ? row.key(p) : p[row.key];
  if (val == null || val === "") return "–";
  if (typeof val === "number") {
    const formatted = val >= 1000 ? val.toLocaleString("de-DE") : val.toFixed(val % 1 === 0 ? 0 : 1);
    return row.unit ? `${formatted} ${row.unit}` : formatted;
  }
  return String(val) + (row.unit ? ` ${row.unit}` : "");
}

function getScoreColor(val: number | null | undefined): string {
  if (val == null) return "";
  if (val >= 70) return "text-green-400";
  if (val >= 50) return "text-yellow-400";
  if (val >= 30) return "text-orange-400";
  return "text-red-400";
}

export default function CompareModal({ properties, onClose, onRemove }: Props) {
  if (properties.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Favoriten vergleichen ({properties.length})</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-2 text-slate-400 font-medium w-40">Merkmal</th>
                {properties.map(p => (
                  <th key={p.scoutId} className="text-left py-2 px-2 min-w-[180px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white font-medium text-xs line-clamp-2">{p.title}</div>
                        <div className="text-slate-500 text-xs">{p.zipCode} {p.geo_ortsteil}</div>
                      </div>
                      <button
                        onClick={() => onRemove(p.scoutId)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Aus Vergleich entfernen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => {
                const values = properties.map(p => getValue(p, row));
                const allEmpty = values.every(v => v === "–");
                if (allEmpty) return null;

                return (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-2 text-slate-400">{row.label}</td>
                    {properties.map((p, j) => {
                      const val = typeof row.key === "function" ? null : p[row.key];
                      const isScore = row.label.includes("Score") || row.label.includes("Dimension") || row.label === "WohnWert";
                      const scoreColor = isScore && typeof val === "number" ? getScoreColor(val) : "";
                      
                      return (
                        <td key={p.scoutId} className={`py-2 px-2 text-slate-200 ${scoreColor}`}>
                          {values[j]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Tipp: Füge bis zu 4 Favoriten hinzu, um sie zu vergleichen
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
