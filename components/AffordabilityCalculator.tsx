"use client";
import { useState, useMemo } from "react";
import { PropertyDetail } from "@/lib/types";

function Gauge({ value, max, label, thresholds }: {
  value: number; max: number; label: string;
  thresholds: { green: number; yellow: number };
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value <= thresholds.green ? "#22c55e" : value <= thresholds.yellow ? "#eab308" : "#ef4444";
  const emoji = value <= thresholds.green ? "✅" : value <= thresholds.yellow ? "⚠️" : "🚨";
  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${pct * 2.64} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-xs text-slate-400 mt-1">{emoji} {label}</div>
    </div>
  );
}

function ResultBanner({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-xl p-3 border ${ok ? "bg-green-950/30 border-green-800/40" : "bg-red-950/30 border-red-800/40"}`}>
      <div className={`text-sm font-bold ${ok ? "text-green-400" : "text-red-400"}`}>{ok ? "✅" : "🚨"} {title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{text}</div>
    </div>
  );
}

export default function AffordabilityCalculator({ property }: { property: PropertyDetail }) {
  const isMiete = property.market_type === "Miete";
  const kaufpreis = property.buyingPrice ?? 0;
  const kaltmiete = property.baseRent ?? 0;
  const warmmiete = property.totalRent ?? (kaltmiete + (property.serviceCharge ?? 0));

  // User-Eingaben
  const [nettoHaushalt, setNettoHaushalt] = useState(3500);
  const [sparrate, setSparrate] = useState(500);
  const [bestehendeKredite, setBestehendeKredite] = useState(0);
  const [eigenkapitalVorhanden, setEigenkapitalVorhanden] = useState(50000);
  const [zinssatz, setZinssatz] = useState(3.8);

  // Berechnung Miet-Leistbarkeit
  const mietBelastung = nettoHaushalt > 0 ? (warmmiete / nettoHaushalt) * 100 : 0;
  const kaltBelastung = nettoHaushalt > 0 ? (kaltmiete / nettoHaushalt) * 100 : 0;
  const restNachMiete = nettoHaushalt - warmmiete - bestehendeKredite;
  const mietLeistbar = mietBelastung <= 40 && restNachMiete >= 800;

  // Berechnung Kauf-Leistbarkeit
  const kaufnebenkosten = kaufpreis * 0.122; // ~12,2% NRW
  const gesamtKauf = kaufpreis + kaufnebenkosten;
  const ekQuote = gesamtKauf > 0 ? (eigenkapitalVorhanden / gesamtKauf) * 100 : 0;
  const darlehen = Math.max(0, gesamtKauf - eigenkapitalVorhanden);
  const monatsrate = darlehen * (zinssatz + 2) / 100 / 12; // Zins + 2% Tilgung
  const kaufBelastung = nettoHaushalt > 0 ? ((monatsrate + bestehendeKredite) / nettoHaushalt) * 100 : 0;
  const restNachKauf = nettoHaushalt - monatsrate - bestehendeKredite;

  // Bank-Kriterien
  const bankMaxRate = nettoHaushalt * 0.35; // Max 35% Belastung
  const bankMaxDarlehen = bankMaxRate > 0 ? (bankMaxRate * 12) / ((zinssatz + 2) / 100) : 0;
  const bankMaxKaufpreis = (bankMaxDarlehen + eigenkapitalVorhanden) / 1.122; // Inkl. Nebenkosten

  // Empfohlener Maximal-Kaufpreis
  const maxKaufpreisKonservativ = bankMaxKaufpreis * 0.85; // 15% Puffer

  // Kauf leistbar?
  const kaufLeistbar = kaufBelastung <= 35 && ekQuote >= 15 && restNachKauf >= 800;
  const kaufGrenzwertig = kaufBelastung <= 40 && ekQuote >= 10 && restNachKauf >= 500;

  const results = useMemo(() => {
    const checks = [];

    if (isMiete) {
      checks.push({ ok: mietBelastung <= 30, label: "Warmmiete < 30% Netto", value: `${mietBelastung.toFixed(1)}%`, ideal: "< 30%" });
      checks.push({ ok: mietBelastung <= 40, label: "Warmmiete < 40% Netto", value: `${mietBelastung.toFixed(1)}%`, ideal: "< 40%" });
      checks.push({ ok: restNachMiete >= 800, label: "Rest nach Miete ≥ 800€", value: `${restNachMiete.toFixed(0)}€`, ideal: "≥ 800€" });
      checks.push({ ok: restNachMiete >= sparrate, label: "Sparrate möglich", value: `${(restNachMiete - sparrate).toFixed(0)}€ Puffer`, ideal: `≥ ${sparrate}€` });
    } else {
      checks.push({ ok: kaufBelastung <= 35, label: "Rate < 35% Netto (Bank)", value: `${kaufBelastung.toFixed(1)}%`, ideal: "< 35%" });
      checks.push({ ok: ekQuote >= 20, label: "Eigenkapital ≥ 20%", value: `${ekQuote.toFixed(1)}%`, ideal: "≥ 20%" });
      checks.push({ ok: restNachKauf >= 800, label: "Rest nach Rate ≥ 800€", value: `${restNachKauf.toFixed(0)}€`, ideal: "≥ 800€" });
      checks.push({ ok: eigenkapitalVorhanden >= kaufnebenkosten, label: "EK deckt Nebenkosten", value: `${eigenkapitalVorhanden.toLocaleString("de-DE")}€ vs. ${kaufnebenkosten.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€`, ideal: `≥ ${kaufnebenkosten.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€` });
    }
    return checks;
  }, [isMiete, mietBelastung, restNachMiete, sparrate, kaufBelastung, ekQuote, restNachKauf, eigenkapitalVorhanden, kaufnebenkosten]);

  return (
    <div className="space-y-5">
      {/* Eingaben */}
      <div className="bg-slate-800/50 rounded-xl p-3 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deine Finanzen</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Nettoeinkommen (Haushalt)</label>
            <input type="number" value={nettoHaushalt} onChange={e => setNettoHaushalt(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" step={100} />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Bestehende Kredite/Monat</label>
            <input type="number" value={bestehendeKredite} onChange={e => setBestehendeKredite(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" step={50} />
          </div>
          {!isMiete && (
            <>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Eigenkapital vorhanden</label>
                <input type="number" value={eigenkapitalVorhanden} onChange={e => setEigenkapitalVorhanden(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" step={5000} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Aktueller Zinssatz</label>
                <input type="number" value={zinssatz} onChange={e => setZinssatz(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" step={0.1} min={0.5} max={10} />
              </div>
            </>
          )}
          {isMiete && (
            <div>
              <label className="text-xs text-slate-500 block mb-1">Gewünschte Sparrate</label>
              <input type="number" value={sparrate} onChange={e => setSparrate(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" step={50} />
            </div>
          )}
        </div>
      </div>

      {/* Gauges */}
      <div className="flex justify-around">
        {isMiete ? (
          <>
            <Gauge value={kaltBelastung} max={100} label="Kaltmiete" thresholds={{ green: 25, yellow: 33 }} />
            <Gauge value={mietBelastung} max={100} label="Warmmiete" thresholds={{ green: 30, yellow: 40 }} />
          </>
        ) : (
          <>
            <Gauge value={kaufBelastung} max={100} label="Kreditrate" thresholds={{ green: 30, yellow: 40 }} />
            <Gauge value={ekQuote} max={100} label="EK-Quote" thresholds={{ green: 100, yellow: 15 }} />
          </>
        )}
      </div>

      {/* Ergebnis */}
      {isMiete ? (
        <ResultBanner
          ok={mietLeistbar}
          title={mietLeistbar ? "Diese Wohnung kannst du dir leisten!" : "Diese Wohnung wird finanziell eng!"}
          text={mietLeistbar
            ? `Dir bleiben nach Warmmiete noch ${restNachMiete.toFixed(0)}€ pro Monat für Lebenshaltung und Sparen.`
            : `Deine Warmmiete beträgt ${mietBelastung.toFixed(0)}% deines Einkommens. Empfohlen sind max. 30-40%.`}
        />
      ) : (
        <ResultBanner
          ok={kaufLeistbar}
          title={kaufLeistbar ? "Dieser Kauf ist für dich finanzierbar!" : kaufGrenzwertig ? "Dieser Kauf ist grenzwertig leistbar." : "Dieser Kauf übersteigt dein Budget!"}
          text={kaufLeistbar
            ? `Monatsrate ${monatsrate.toFixed(0)}€ (${kaufBelastung.toFixed(0)}% Belastung). Dir bleiben ${restNachKauf.toFixed(0)}€ pro Monat.`
            : `Monatsrate ${monatsrate.toFixed(0)}€ = ${kaufBelastung.toFixed(0)}% deines Einkommens. Banken empfehlen max. 35%.`}
        />
      )}

      {/* Checkliste */}
      <div className="bg-slate-800/50 rounded-xl p-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Finanz-Check</h4>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={r.ok ? "text-green-400" : "text-red-400"}>{r.ok ? "✅" : "❌"}</span>
              <span className="text-slate-300 flex-1">{r.label}</span>
              <span className="text-xs text-slate-400">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Maximaler Kaufpreis (nur bei Kauf) */}
      {!isMiete && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">🏦 Was sagt die Bank?</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-400">Max. Monatsrate (35%)</div>
              <div className="text-white font-bold">{bankMaxRate.toFixed(0)}€</div>
            </div>
            <div>
              <div className="text-slate-400">Max. Darlehen</div>
              <div className="text-white font-bold">{bankMaxDarlehen.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</div>
            </div>
            <div>
              <div className="text-slate-400">Max. Kaufpreis</div>
              <div className="text-blue-400 font-bold">{bankMaxKaufpreis.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</div>
            </div>
            <div>
              <div className="text-slate-400">Empfohlen (mit Puffer)</div>
              <div className="text-green-400 font-bold">{maxKaufpreisKonservativ.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</div>
            </div>
          </div>
          {kaufpreis > bankMaxKaufpreis ? (
            <div className="mt-3 text-xs text-red-400">
              🚨 Kaufpreis ({kaufpreis.toLocaleString("de-DE")}€) liegt über dem Bank-Maximum ({bankMaxKaufpreis.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€).
              Du benötigst mehr Eigenkapital oder ein höheres Einkommen.
            </div>
          ) : (
            <div className="mt-3 text-xs text-green-400">
              ✅ Kaufpreis ({kaufpreis.toLocaleString("de-DE")}€) liegt im finanzierbaren Bereich.
            </div>
          )}
        </div>
      )}

      {/* Maximale Miete (nur bei Miete) */}
      {isMiete && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">💡 Dein Budget</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-400">Max. Warmmiete (30%)</div>
              <div className="text-green-400 font-bold">{(nettoHaushalt * 0.30).toFixed(0)}€</div>
            </div>
            <div>
              <div className="text-slate-400">Max. Warmmiete (40%)</div>
              <div className="text-yellow-400 font-bold">{(nettoHaushalt * 0.40).toFixed(0)}€</div>
            </div>
            <div>
              <div className="text-slate-400">Übrig nach Miete</div>
              <div className="text-white font-bold">{restNachMiete.toFixed(0)}€</div>
            </div>
            <div>
              <div className="text-slate-400">Übrig nach Sparen</div>
              <div className={(restNachMiete - sparrate) >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                {(restNachMiete - sparrate).toFixed(0)}€
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
