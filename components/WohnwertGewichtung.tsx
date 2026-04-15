"use client";
import { useState } from "react";
import SmartSlider from "./SmartSlider";
import ImpactAnalysis from "./ImpactAnalysis";

interface WohnwertWeights {
  preis: number;
  standort: number;
  infrastruktur: number;
  ausstattung: number;
  mobilitaet: number;
}

interface Props {
  weights: WohnwertWeights;
  onChange: (weights: WohnwertWeights) => void;
  impactData?: {
    total: number;
    improved: number;
    worsened: number;
    unchanged: number;
    avgDelta: number;
  };
}

const PRESETS = {
  standard: { preis: 20, standort: 20, infrastruktur: 20, ausstattung: 20, mobilitaet: 20 },
  student: { preis: 80, standort: 40, infrastruktur: 60, ausstattung: 20, mobilitaet: 90 },
  familie: { preis: 70, standort: 60, infrastruktur: 100, ausstattung: 50, mobilitaet: 60 },
  investor: { preis: 100, standort: 70, infrastruktur: 40, ausstattung: 20, mobilitaet: 50 },
  premium: { preis: 30, standort: 80, infrastruktur: 70, ausstattung: 90, mobilitaet: 60 },
};

const LABELS = {
  preis: "💰 Preis",
  standort: "📍 Standort",
  infrastruktur: "🏗️ Infrastruktur",
  ausstattung: "🛋️ Ausstattung",
  mobilitaet: "🚇 Mobilität",
};


export default function WohnwertGewichtung({ weights, onChange, impactData }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  const isCustom = JSON.stringify(weights) !== JSON.stringify(PRESETS.standard);
  
  const applyPreset = (preset: keyof typeof PRESETS) => {
    onChange(PRESETS[preset]);
  };
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">🎛️ WohnWert-Gewichtung</span>
          {isCustom && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Personalisiert</span>}
        </div>
        <span className="text-slate-400 text-xs">{expanded ? "▼" : "▶"}</span>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([key, preset]) => {
              const active = JSON.stringify(weights) === JSON.stringify(preset);
              const labels: Record<string, string> = {
                standard: "⚖️ Standard",
                student: "🎓 Student",
                familie: "👨‍👩‍👧 Familie",
                investor: "💰 Investor",
                premium: "🏖️ Premium",
              };
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key as keyof typeof PRESETS)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    active
                      ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}>
                  {labels[key]}
                </button>
              );
            })}
          </div>
          
          {/* Sliders */}
          <div className="space-y-2.5">
            {(Object.keys(weights) as Array<keyof WohnwertWeights>).map(key => (
              <SmartSlider
                key={key}
                label={LABELS[key]}
                value={weights[key]}
                min={0}
                max={100}
                step={10}
                precision={5}
                unit="%"
                onChange={v => onChange({ ...weights, [key]: v })}
              />
            ))}
          </div>
          
          {/* Impact Analysis */}
          {impactData && isCustom && (
            <ImpactAnalysis
              totalProperties={impactData.total}
              improved={impactData.improved}
              worsened={impactData.worsened}
              unchanged={impactData.unchanged}
              avgDelta={impactData.avgDelta}
            />
          )}
          
          {/* Warning - Subscores not available */}
          <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5">
            ⚠️ <strong>Feature in Entwicklung:</strong> Die WohnWert-Subscores (Preis, Standort, Infrastruktur, Ausstattung, Mobilität) sind noch nicht in den Daten verfügbar. Die Gewichtung kann daher aktuell nicht angewendet werden. Die Daten werden in Kürze ergänzt.
          </div>
          
          {/* Info */}
          {isCustom && impactData && (
            <div className="text-xs text-slate-400 bg-blue-950/30 border border-blue-800/40 rounded-lg p-2">
              💡 Die WohnWert-Scores werden nach deinen Prioritäten neu berechnet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
