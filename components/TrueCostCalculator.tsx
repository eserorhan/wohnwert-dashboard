"use client";
import { useState } from "react";
import { PropertyDetail } from "@/lib/types";
import { Info } from "lucide-react";

// NRW-spezifische Defaults
const DEFAULTS = {
  strom_person: 45,           // €/Monat pro Person
  internet: 35,               // €/Monat
  deutschlandticket: 49,      // €/Monat
  vrr_monatsticket: 110,      // €/Monat
  auto_km_kosten: 0.30,       // €/km (Benzin + Verschleiß + Versicherung)
  auto_versicherung: 70,      // €/Monat
  auto_stellplatz: 80,        // €/Monat (Stadtgebiet)
  kita_durchschnitt: 350,     // €/Monat (NRW Durchschnitt)
  schulessen: 70,             // €/Monat
  gez: 18.36,                 // €/Monat
  haftpflicht: 8,             // €/Monat
  hausrat: 15,                // €/Monat
  lebensmittel_person: 250,   // €/Monat pro Person
  zeitwert_stunde: 15,        // €/Stunde (Opportunitätskosten)
  arbeitstage_monat: 21,
};

function CostBar({ label, amount, total, color, info }: { label: string; amount: number; total: number; color: string; info?: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-400 flex items-center gap-1">
          {label}
          {info && (
            <span className="group relative">
              <Info size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-0 mb-1 px-2 py-1 bg-slate-700 text-xs text-slate-200 rounded shadow-lg whitespace-nowrap">{info}</span>
            </span>
          )}
        </span>
        <span className="text-slate-200 font-medium">{amount.toFixed(0)}€</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TrueCostCalculator({ property }: { property: PropertyDetail }) {
  const isMiete = property.market_type === "Miete";
  const [personen, setPersonen] = useState(2);
  const [kinder, setKinder] = useState(0);
  const [kitaKinder, setKitaKinder] = useState(0);
  const [hatAuto, setHatAuto] = useState(false);
  const [pendelKm, setPendelKm] = useState(property.nearest_hbf_km ? Math.round(property.nearest_hbf_km * 2) : 20);
  const [nettoeinkommen, setNettoeinkommen] = useState(3500);

  // Wohnkosten
  const warmmiete = isMiete
    ? (property.totalRent ?? (property.baseRent ?? 0) + (property.serviceCharge ?? 0))
    : 0;
  const kaufFinanzierung = !isMiete
    ? ((property.buyingPrice ?? 0) * 0.038 / 12) + ((property.buyingPrice ?? 0) * 0.02 / 12) // 3.8% Zins + 2% Tilgung
    : 0;
  const kaufNebenkosten = !isMiete ? (property.buyingPrice ?? 0) * 0.001 / 12 * 3.5 : 0; // Instandhaltung + Grundsteuer
  const wohnkosten = isMiete ? warmmiete : (kaufFinanzierung + kaufNebenkosten);
  const strom = DEFAULTS.strom_person * personen;
  const internet = DEFAULTS.internet;
  const gez = DEFAULTS.gez;

  // Mobilität
  const oepnv = DEFAULTS.deutschlandticket * (personen - kinder);
  const autoKostenMonat = hatAuto
    ? (pendelKm * 2 * DEFAULTS.arbeitstage_monat * DEFAULTS.auto_km_kosten) + DEFAULTS.auto_versicherung + DEFAULTS.auto_stellplatz
    : 0;
  const mobilität = oepnv + autoKostenMonat;

  // Familie
  const kita = kitaKinder * DEFAULTS.kita_durchschnitt;
  const schulessen = (kinder - kitaKinder) > 0 ? (kinder - kitaKinder) * DEFAULTS.schulessen : 0;
  const familie = kita + schulessen;

  // Versicherungen
  const versicherungen = DEFAULTS.haftpflicht + DEFAULTS.hausrat;

  // Lebensmittel
  const lebensmittel = DEFAULTS.lebensmittel_person * personen;

  // Gesamt
  const gesamtMonat = wohnkosten + strom + internet + gez + mobilität + familie + versicherungen + lebensmittel;

  // Zeitkosten
  const pendelMinTag = property.pendel_oepnv_min ?? property.pendel_auto_min ?? 30;
  const pendelStundenJahr = (pendelMinTag * 2 * DEFAULTS.arbeitstage_monat * 12) / 60;
  const zeitwertJahr = pendelStundenJahr * DEFAULTS.zeitwert_stunde;

  // Belastungsquote
  const belastung = nettoeinkommen > 0 ? (gesamtMonat / nettoeinkommen) * 100 : 0;
  const belastungColor = belastung < 40 ? "text-green-400" : belastung < 55 ? "text-yellow-400" : "text-red-400";
  const belastungLabel = belastung < 40 ? "✅ Komfortabel" : belastung < 55 ? "⚠️ Grenzwertig" : "🚨 Zu hoch";

  return (
    <div className="space-y-5">
      {/* Eingabe-Parameter */}
      <div className="bg-slate-800/50 rounded-xl p-3 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deine Situation</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Nettoeinkommen (Haushalt)</label>
            <input type="number" value={nettoeinkommen} onChange={e => setNettoeinkommen(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Personen im Haushalt</label>
            <select value={personen} onChange={e => setPersonen(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? "Person" : "Personen"}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Kinder</label>
            <select value={kinder} onChange={e => { const k = Number(e.target.value); setKinder(k); if (kitaKinder > k) setKitaKinder(k); }}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white">
              {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Davon in Kita</label>
            <select value={kitaKinder} onChange={e => setKitaKinder(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white">
              {Array.from({ length: kinder + 1 }, (_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={hatAuto} onChange={e => setHatAuto(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700" />
            <label className="text-xs text-slate-400">Auto vorhanden</label>
          </div>
          {hatAuto && (
            <div>
              <label className="text-xs text-slate-500 block mb-1">Pendelstrecke (einfach)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={80} value={pendelKm} onChange={e => setPendelKm(Number(e.target.value))}
                  className="flex-1" />
                <span className="text-xs text-slate-300 w-12 text-right">{pendelKm} km</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kostenaufschlüsselung */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Monatliche Gesamtkosten</h4>
        <CostBar label="🏠 Wohnen (warm)" amount={wohnkosten} total={gesamtMonat} color="#3b82f6" info={isMiete ? "Kaltmiete + Nebenkosten" : "Finanzierung + Instandhaltung"} />
        <CostBar label="⚡ Strom + Internet + GEZ" amount={strom + internet + gez} total={gesamtMonat} color="#8b5cf6" info={`${strom.toFixed(0)}€ Strom + ${internet}€ Internet + ${gez}€ GEZ`} />
        <CostBar label="🚇 Mobilität" amount={mobilität} total={gesamtMonat} color="#06b6d4" info={hatAuto ? `ÖPNV ${oepnv.toFixed(0)}€ + Auto ${autoKostenMonat.toFixed(0)}€` : `Deutschlandticket × ${personen - kinder}`} />
        {familie > 0 && <CostBar label="👶 Familie (Kita/Schulessen)" amount={familie} total={gesamtMonat} color="#f59e0b" info={`Kita ${kita.toFixed(0)}€ + Schulessen ${schulessen.toFixed(0)}€`} />}
        <CostBar label="🛒 Lebensmittel" amount={lebensmittel} total={gesamtMonat} color="#22c55e" info={`${DEFAULTS.lebensmittel_person}€ × ${personen} Personen`} />
        <CostBar label="🛡️ Versicherungen" amount={versicherungen} total={gesamtMonat} color="#64748b" info="Haftpflicht + Hausrat" />
      </div>

      {/* Summe */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-white">Gesamt pro Monat</span>
          <span className="text-xl font-bold text-white">{gesamtMonat.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-slate-400">Gesamt pro Jahr</span>
          <span className="text-sm font-medium text-slate-300">{(gesamtMonat * 12).toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-slate-400">Belastungsquote</span>
          <span className={`text-sm font-bold ${belastungColor}`}>{belastung.toFixed(1)}% — {belastungLabel}</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(belastung, 100)}%`,
            background: belastung < 40 ? "#22c55e" : belastung < 55 ? "#eab308" : "#ef4444"
          }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>0%</span><span>30% ideal</span><span>40% max</span><span>55%+</span>
        </div>
      </div>

      {/* Zeitkosten */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">⏱️ Versteckte Zeitkosten</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-slate-400">Pendelzeit/Tag</div>
            <div className="text-white font-bold">{(pendelMinTag * 2)} Min</div>
          </div>
          <div>
            <div className="text-slate-400">Pendelzeit/Jahr</div>
            <div className="text-white font-bold">{pendelStundenJahr.toFixed(0)} Stunden</div>
          </div>
          <div>
            <div className="text-slate-400">Zeitwert/Jahr</div>
            <div className="text-amber-400 font-bold">{zeitwertJahr.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€</div>
          </div>
          <div>
            <div className="text-slate-400">Volle Arbeitstage</div>
            <div className="text-white font-bold">{(pendelStundenJahr / 8).toFixed(1)} Tage</div>
          </div>
        </div>
        <p className="text-xs text-amber-400/60 mt-2">
          Bei {DEFAULTS.zeitwert_stunde}€/h Bewertung verlierst du {zeitwertJahr.toLocaleString("de-DE", { maximumFractionDigits: 0 })}€/Jahr an "Lebenszeit" durch Pendeln.
        </p>
      </div>
    </div>
  );
}
