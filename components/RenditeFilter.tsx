"use client";
import { useState } from "react";
import SmartSlider from "./SmartSlider";

interface RenditeFilterValues {
  brutto_min: number;
  netto_min: number;
  cashflow_min: number;
  eigenkapital: number;
  zinssatz: number;
}

interface Props {
  values: RenditeFilterValues;
  onChange: (values: RenditeFilterValues) => void;
  resultCount?: number;
}


export default function RenditeFilter({ values, onChange, resultCount }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  const isActive = values.brutto_min > 0 || values.netto_min > 0 || values.cashflow_min > -500;
  
  const reset = () => {
    onChange({
      brutto_min: 0,
      netto_min: 0,
      cashflow_min: -500,
      eigenkapital: 20,
      zinssatz: 3.8,
    });
  };
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">📈 Rendite-Filter</span>
          <span className="text-xs text-slate-500">(nur Kauf)</span>
          {isActive && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Aktiv</span>}
        </div>
        <span className="text-slate-400 text-xs">{expanded ? "▼" : "▶"}</span>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
          {/* Rendite-Kriterien */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rendite-Kriterien</div>
            
            <SmartSlider
              label="Bruttorendite ≥"
              value={values.brutto_min}
              onChange={v => onChange({ ...values, brutto_min: v })}
              min={0}
              max={8}
              step={0.5}
              precision={0.1}
              unit="%"
            />
            
            <SmartSlider
              label="Nettorendite ≥"
              value={values.netto_min}
              onChange={v => onChange({ ...values, netto_min: v })}
              min={0}
              max={6}
              step={0.5}
              precision={0.1}
              unit="%"
            />
            
            <SmartSlider
              label="Cashflow/Monat ≥"
              value={values.cashflow_min}
              onChange={v => onChange({ ...values, cashflow_min: v })}
              min={-500}
              max={500}
              step={50}
              precision={10}
              unit="€"
            />
          </div>
          
          {/* Finanzierungs-Parameter */}
          <div className="space-y-2.5 pt-2 border-t border-slate-700/50">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finanzierung</div>
            
            <SmartSlider
              label="Eigenkapital"
              value={values.eigenkapital}
              onChange={v => onChange({ ...values, eigenkapital: v })}
              min={0}
              max={50}
              step={5}
              precision={1}
              unit="%"
            />
            
            <SmartSlider
              label="Zinssatz"
              value={values.zinssatz}
              onChange={v => onChange({ ...values, zinssatz: v })}
              min={2}
              max={6}
              step={0.1}
              precision={0.05}
              unit="%"
            />
          </div>
          
          {/* Ergebnis */}
          {resultCount !== undefined && (
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
              <div className="text-xs font-bold text-blue-400">
                {isActive ? `📊 ${resultCount} Objekte gefunden` : "💡 Setze Filter um Ergebnisse zu sehen"}
              </div>
              {isActive && resultCount > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Alle Objekte erfüllen deine Rendite-Kriterien
                </div>
              )}
              {isActive && resultCount === 0 && (
                <div className="text-xs text-red-400 mt-1">
                  Keine Objekte gefunden. Versuche die Filter zu lockern.
                </div>
              )}
            </div>
          )}
          
          {/* Reset */}
          {isActive && (
            <button
              onClick={reset}
              className="w-full text-xs text-slate-400 hover:text-slate-200 py-1.5 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-colors">
              ↺ Filter zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
