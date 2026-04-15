"use client";
import { useState } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  precision?: number;
  unit?: string;
  onChange: (value: number) => void;
  showImpact?: boolean;
  impact?: { improved: number; worsened: number };
}

export default function SmartSlider({
  label,
  value,
  min,
  max,
  step,
  precision = 1,
  unit = "%",
  onChange,
  showImpact = false,
  impact,
}: Props) {
  const [showPrecision, setShowPrecision] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handlePrecisionSubmit = () => {
    onChange(tempValue);
    setShowPrecision(false);
  };

  const formatValue = (val: number) => {
    const decimals = precision < 1 ? 1 : 0;
    return val.toFixed(decimals);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <button
          onClick={() => {
            setTempValue(value);
            setShowPrecision(true);
          }}
          className="text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors"
        >
          {formatValue(value)}{unit}
        </button>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        
        {/* Progress Bar */}
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>

      {showImpact && impact && (
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="text-green-400">↑ {impact.improved}</span>
          <span className="text-red-400">↓ {impact.worsened}</span>
        </div>
      )}

      {/* Precision Modal */}
      {showPrecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrecision(false)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Präzise Eingabe</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(Number(e.target.value))}
                  step={precision}
                  min={min}
                  max={max}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePrecisionSubmit();
                    if (e.key === "Escape") setShowPrecision(false);
                  }}
                />
                <span className="text-white">{unit}</span>
              </div>

              {/* Quick Values */}
              <div className="flex gap-2 flex-wrap">
                {[
                  min,
                  Math.round((min + max) * 0.25),
                  Math.round((min + max) * 0.5),
                  Math.round((min + max) * 0.75),
                  max,
                ].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTempValue(v)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      tempValue === v
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {v}{unit}
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                📊 Änderung: {formatValue(value)}{unit} → {formatValue(tempValue)}{unit}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrecisionSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
              >
                ✓ Übernehmen
              </button>
              <button
                onClick={() => setShowPrecision(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
