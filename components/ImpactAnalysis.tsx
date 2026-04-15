"use client";

interface Props {
  totalProperties: number;
  improved: number;
  worsened: number;
  unchanged: number;
  avgDelta: number;
}

export default function ImpactAnalysis({
  totalProperties,
  improved,
  worsened,
  unchanged,
  avgDelta,
}: Props) {
  const improvedPct = ((improved / totalProperties) * 100).toFixed(1);
  const worsenedPct = ((worsened / totalProperties) * 100).toFixed(1);
  const unchangedPct = ((unchanged / totalProperties) * 100).toFixed(1);

  return (
    <div className="bg-slate-700/30 rounded-lg p-3 space-y-3 border border-slate-600/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          📊 Auswirkung der Gewichtung
        </span>
        <span className="text-xs text-slate-500">
          {totalProperties.toLocaleString("de-DE")} Objekte
        </span>
      </div>

      {/* Impact Bars */}
      <div className="space-y-2">
        {/* Improved */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-green-400 font-medium">↑ Verbessert</span>
            <span className="text-green-400 font-mono">
              {improved.toLocaleString("de-DE")} ({improvedPct}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${improvedPct}%` }}
            />
          </div>
        </div>

        {/* Unchanged */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">→ Unverändert</span>
            <span className="text-slate-400 font-mono">
              {unchanged.toLocaleString("de-DE")} ({unchangedPct}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-600 transition-all duration-500"
              style={{ width: `${unchangedPct}%` }}
            />
          </div>
        </div>

        {/* Worsened */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-red-400 font-medium">↓ Verschlechtert</span>
            <span className="text-red-400 font-mono">
              {worsened.toLocaleString("de-DE")} ({worsenedPct}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
              style={{ width: `${worsenedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Average Delta */}
      <div className="pt-2 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Durchschnittliche Änderung:</span>
          <span
            className={`font-mono font-bold ${
              avgDelta > 0
                ? "text-green-400"
                : avgDelta < 0
                ? "text-red-400"
                : "text-slate-400"
            }`}
          >
            {avgDelta > 0 ? "+" : ""}
            {avgDelta.toFixed(1)} Punkte
          </span>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="text-[10px] text-slate-500 leading-relaxed">
        💡 Die Gewichtung verändert die WohnWert-Scores basierend auf deinen
        Prioritäten. Objekte mit starken Werten in hoch-gewichteten Dimensionen
        steigen im Ranking.
      </div>
    </div>
  );
}
