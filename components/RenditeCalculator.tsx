"use client";
import { useState, useMemo } from "react";
import { PropertyDetail } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// NRW-spezifische Kaufnebenkosten
const NRW_NEBENKOSTEN = {
  grunderwerbsteuer: 0.065,  // 6,5% NRW
  notar: 0.015,              // 1,5%
  grundbuch: 0.005,          // 0,5%
  makler: 0.0357,            // 3,57% (Käuferanteil)
};

function Slider({ label, value, onChange, min, max, step, unit, info }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; info?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{value.toLocaleString("de-DE")}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-blue-500" />
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function RenditeCalculator({ property }: { property: PropertyDetail }) {
  const isMiete = property.market_type === "Miete";
  const kaufpreis = property.buyingPrice ?? 0;

  // Kapitalanlage-Parameter
  const [eigenkapitalPct, setEigenkapitalPct] = useState(20);
  const [zinssatz, setZinssatz] = useState(3.8);
  const [tilgung, setTilgung] = useState(2.0);
  const [wertentwicklung, setWertentwicklung] = useState(2.0);
  const [instandhaltungPct, setInstandhaltungPct] = useState(1.0);
  const [mietsteigerung, setMietsteigerung] = useState(1.5);
  const [horizont, setHorizont] = useState(20);

  // Miete vs. Kauf Parameter
  const [aktuelleKaltmiete, setAktuelleKaltmiete] = useState(
    isMiete ? (property.baseRent ?? 800) : Math.round((kaufpreis * 0.04) / 12)
  );
  const [anlagerendite, setAnlagerendite] = useState(5.0); // ETF Sparplan

  // Berechnungen
  const nebenkosten = useMemo(() => {
    const nk = NRW_NEBENKOSTEN;
    return {
      grunderwerbsteuer: kaufpreis * nk.grunderwerbsteuer,
      notar: kaufpreis * nk.notar,
      grundbuch: kaufpreis * nk.grundbuch,
      makler: kaufpreis * nk.makler,
      gesamt: kaufpreis * (nk.grunderwerbsteuer + nk.notar + nk.grundbuch + nk.makler),
    };
  }, [kaufpreis]);

  const gesamtinvestition = kaufpreis + nebenkosten.gesamt;
  const eigenkapital = gesamtinvestition * (eigenkapitalPct / 100);
  const darlehen = gesamtinvestition - eigenkapital;
  const monatlicheRate = darlehen * (zinssatz + tilgung) / 100 / 12;
  const instandhaltung = kaufpreis * (instandhaltungPct / 100) / 12;

  // Rendite-Kennzahlen (Kapitalanlage)
  const jahresmiete = aktuelleKaltmiete * 12;
  const bruttorendite = kaufpreis > 0 ? (jahresmiete / kaufpreis) * 100 : 0;
  const jahreskosten = instandhaltung * 12 + (kaufpreis * 0.0035); // + Grundsteuer Schätzung
  const nettorendite = gesamtinvestition > 0 ? ((jahresmiete - jahreskosten) / gesamtinvestition) * 100 : 0;
  const monatsCashflow = aktuelleKaltmiete - monatlicheRate - instandhaltung;

  // Eigenkapitalrendite
  const ekRendite = eigenkapital > 0 ? ((jahresmiete - jahreskosten - (darlehen * zinssatz / 100)) / eigenkapital) * 100 : 0;

  // Miete vs. Kauf Vergleich (Vermögensentwicklung über Zeit)
  const vergleichsData = useMemo(() => {
    const data = [];
    let kaufVermoegen = -eigenkapital; // Initial: Eigenkapital investiert
    let mietVermoegen = 0;             // Initial: Eigenkapital wird angelegt
    let mietSparplan = eigenkapital;   // Eigenkapital in ETF
    let aktMiete = aktuelleKaltmiete;
    let immowert = kaufpreis;
    let restschuld = darlehen;

    for (let jahr = 0; jahr <= horizont; jahr++) {
      if (jahr === 0) {
        data.push({
          jahr,
          kauf: 0,
          miete: 0,
        });
        continue;
      }

      // Kaufen: Wertsteigerung + Tilgung
      immowert *= (1 + wertentwicklung / 100);
      const jahrTilgung = darlehen * (tilgung / 100);
      restschuld = Math.max(0, restschuld - jahrTilgung);
      kaufVermoegen = immowert - restschuld - nebenkosten.gesamt;

      // Mieten: Gesparte Differenz + Rendite auf Eigenkapital
      const kaufMonatlich = monatlicheRate + instandhaltung;
      aktMiete *= (1 + mietsteigerung / 100);
      const mietMonatlich = aktMiete + (property.serviceCharge ?? 200);
      const differenz = Math.max(0, kaufMonatlich - mietMonatlich);
      mietSparplan = mietSparplan * (1 + anlagerendite / 100) + differenz * 12;
      mietVermoegen = mietSparplan;

      data.push({
        jahr,
        kauf: Math.round(kaufVermoegen),
        miete: Math.round(mietVermoegen),
      });
    }
    return data;
  }, [kaufpreis, eigenkapital, darlehen, zinssatz, tilgung, wertentwicklung, monatlicheRate, instandhaltung, aktuelleKaltmiete, mietsteigerung, anlagerendite, horizont, nebenkosten.gesamt, property.serviceCharge]);

  // Break-Even finden
  const breakEven = vergleichsData.find(d => d.kauf > d.miete && d.jahr > 0)?.jahr;

  // Rendite-Bewertung
  const bruttoColor = bruttorendite >= 5 ? "text-green-400" : bruttorendite >= 3.5 ? "text-yellow-400" : "text-red-400";
  const cashflowColor = monatsCashflow >= 0 ? "text-green-400" : "text-red-400";

  if (isMiete) {
    // Für Mietobjekte: Vereinfachte Ansicht
    return (
      <div className="space-y-5">
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">💡 Miete vs. Kauf</h4>
          <p className="text-sm text-slate-300 mb-3">
            Um dieses Objekt als Eigentum zu kaufen, bräuchtest du ca.:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Geschätzter Kaufpreis"
              value={`${((aktuelleKaltmiete * 12) / 0.04).toLocaleString("de-DE", { maximumFractionDigits: 0 })}€`}
              sub="Bei 4% Bruttorendite"
            />
            <Metric
              label="Eigenkapital (20%)"
              value={`${(((aktuelleKaltmiete * 12) / 0.04) * 0.2).toLocaleString("de-DE", { maximumFractionDigits: 0 })}€`}
              sub="+ Kaufnebenkosten"
            />
          </div>
          <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Aktuelle Miete</span>
              <span className="text-white font-medium">{aktuelleKaltmiete.toLocaleString("de-DE")}€ kalt</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Geschätzte Kaufrate</span>
              <span className="text-white font-medium">{Math.round(((aktuelleKaltmiete * 12) / 0.04) * 0.058 / 12).toLocaleString("de-DE")}€/Monat</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Geschätzt bei 3,8% Zins + 2% Tilgung
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Parameter */}
      <div className="bg-slate-800/50 rounded-xl p-3 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finanzierungs-Parameter</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Slider label="Eigenkapital" value={eigenkapitalPct} onChange={setEigenkapitalPct} min={0} max={100} step={5} unit="%" />
          <Slider label="Zinssatz" value={zinssatz} onChange={setZinssatz} min={1} max={8} step={0.1} unit="%" />
          <Slider label="Tilgung" value={tilgung} onChange={setTilgung} min={1} max={5} step={0.5} unit="%" />
          <Slider label="Wertentwicklung" value={wertentwicklung} onChange={setWertentwicklung} min={0} max={5} step={0.5} unit="% p.a." />
          <Slider label="Instandhaltung" value={instandhaltungPct} onChange={setInstandhaltungPct} min={0.5} max={3} step={0.25} unit="%" />
          <Slider label="Anlagehorizont" value={horizont} onChange={setHorizont} min={5} max={30} step={1} unit=" Jahre" />
        </div>
      </div>

      {/* Kaufnebenkosten */}
      <div className="bg-slate-800/50 rounded-xl p-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kaufnebenkosten NRW</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Grunderwerbsteuer (6,5%)</span><span className="text-slate-200">{nebenkosten.grunderwerbsteuer.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Notar (1,5%)</span><span className="text-slate-200">{nebenkosten.notar.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Grundbuch (0,5%)</span><span className="text-slate-200">{nebenkosten.grundbuch.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Makler (3,57%)</span><span className="text-slate-200">{nebenkosten.makler.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between pt-1 border-t border-slate-700">
            <span className="text-white font-bold">Gesamt Nebenkosten</span>
            <span className="text-white font-bold">{nebenkosten.gesamt.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Gesamtinvestition</span>
            <span className="text-blue-400 font-bold">{gesamtinvestition.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span>
          </div>
        </div>
      </div>

      {/* Rendite-Kennzahlen */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rendite-Kennzahlen</h4>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Bruttorendite" value={`${bruttorendite.toFixed(1)}%`} sub="Jahreskaltmiete / Kaufpreis" color={bruttoColor} />
          <Metric label="Nettorendite" value={`${nettorendite.toFixed(1)}%`} sub="Nach Kosten / Gesamtinvest" color={nettorendite >= 2 ? "text-green-400" : "text-yellow-400"} />
          <Metric label="Cashflow/Monat" value={`${monatsCashflow >= 0 ? "+" : ""}${monatsCashflow.toFixed(0)}€`} sub="Miete - Rate - Kosten" color={cashflowColor} />
          <Metric label="EK-Rendite" value={`${ekRendite.toFixed(1)}%`} sub="Auf eingesetztes Eigenkapital" color={ekRendite >= 5 ? "text-green-400" : "text-yellow-400"} />
        </div>
      </div>

      {/* Finanzierung */}
      <div className="bg-slate-800/50 rounded-xl p-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monatliche Belastung</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Eigenkapital</span><span className="text-slate-200">{eigenkapital.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Darlehen</span><span className="text-slate-200">{darlehen.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Monatsrate (Zins + Tilgung)</span><span className="text-white font-medium">{monatlicheRate.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span></div>
          <div className="flex justify-between"><span className="text-slate-400">+ Instandhaltung</span><span className="text-slate-300">{instandhaltung.toFixed(0)}€</span></div>
          <div className="flex justify-between pt-1 border-t border-slate-700">
            <span className="text-white font-bold">Gesamt monatlich</span>
            <span className="text-white font-bold">{(monatlicheRate + instandhaltung).toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span>
          </div>
        </div>
      </div>

      {/* Miete vs. Kauf Vergleich */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📈 Vermögensentwicklung: Kaufen vs. Mieten</h4>
        <div className="bg-slate-800/50 rounded-xl p-3 mb-2">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <Slider label="Vergleichsmiete (kalt)" value={aktuelleKaltmiete} onChange={setAktuelleKaltmiete} min={200} max={3000} step={50} unit="€" />
            <Slider label="Mietsteigerung" value={mietsteigerung} onChange={setMietsteigerung} min={0} max={4} step={0.5} unit="% p.a." />
          </div>
          <Slider label="Anlagerendite (ETF)" value={anlagerendite} onChange={setAnlagerendite} min={0} max={10} step={0.5} unit="% p.a." />
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vergleichsData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="jahr" tick={{ fill: "#94a3b8", fontSize: 10 }} label={{ value: "Jahre", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                formatter={(val: number) => `${val.toLocaleString("de-DE")}€`}
                labelFormatter={l => `Jahr ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="kauf" stroke="#22c55e" strokeWidth={2} name="Kaufen" dot={false} />
              <Line type="monotone" dataKey="miete" stroke="#3b82f6" strokeWidth={2} name="Mieten + Anlage" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {breakEven && (
          <div className="mt-2 bg-green-950/30 border border-green-800/40 rounded-lg p-2 text-center">
            <span className="text-sm text-green-400 font-medium">
              ✅ Kaufen lohnt sich ab Jahr {breakEven} ({new Date().getFullYear() + breakEven})
            </span>
          </div>
        )}
        {!breakEven && horizont > 0 && (
          <div className="mt-2 bg-blue-950/30 border border-blue-800/40 rounded-lg p-2 text-center">
            <span className="text-sm text-blue-400 font-medium">
              📊 Bei diesen Parametern ist Mieten + Anlage über {horizont} Jahre vorteilhafter
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
