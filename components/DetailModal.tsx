"use client";
import React, { useState, useEffect } from "react";
import { PropertyDetail } from "@/lib/types";
import { WohnwertBadge, WohnwertBar } from "./WohnwertBadge";
import { X, MapPin, Home, Euro, Train, Trees, School, Stethoscope, ShoppingCart, Dumbbell, Bookmark, BookmarkCheck, AlertTriangle, Info, Share2, Check } from "lucide-react";
import TrueCostCalculator from "./TrueCostCalculator";
import RenditeCalculator from "./RenditeCalculator";
import AffordabilityCalculator from "./AffordabilityCalculator";

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info
        size={12}
        className="text-slate-500 hover:text-slate-300 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-700 text-xs text-slate-200 rounded shadow-lg whitespace-nowrap max-w-[200px] text-center">
          {text}
        </span>
      )}
    </span>
  );
}

function Row({ label, value, unit, info }: { label: string; value: string | number | null | undefined; unit?: string; info?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-1 border-b border-slate-700/50 text-sm">
      <span className="text-slate-400 flex items-center">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <span className="text-slate-200 font-medium">{value}{unit ? ` ${unit}` : ""}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function OsmRow({ icon, label, count, nearest }: { icon: React.ReactNode; label: string; count: number | null; nearest: number | null }) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-slate-700/50 text-sm">
      <span className="text-slate-400 w-4">{icon}</span>
      <span className="text-slate-400 flex-1">{label}</span>
      <span className="text-slate-300">{count ?? "–"} im 1km</span>
      <span className="text-slate-500 text-xs">{nearest != null ? `${Math.round(nearest)}m` : "–"}</span>
    </div>
  );
}

export default function DetailModal({ property, onClose, isFav, onToggleFav }: {
  property: PropertyDetail;
  onClose: () => void;
  isFav?: boolean;
  onToggleFav?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "kosten" | "rendite" | "leistbar">("details");
  const isMiete = property.market_type === "Miete";

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleShare = () => {
    const url = `${window.location.origin}?id=${property.scoutId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const preis = isMiete
    ? `${property.baseRent?.toLocaleString("de-DE")}€ kalt`
    : `${property.buyingPrice?.toLocaleString("de-DE")}€`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-start justify-between gap-3 z-10">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{property.zipCode} {property.geo_ortsteil ?? property.geo_kreis}</p>
            <h2 className="text-base font-semibold text-white truncate">{property.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <WohnwertBadge score={property.wohnwert_index} klasse={property.wohnwert_klasse} size="sm" />
              <span className="text-sm font-bold text-white">{preis}</span>
              <span className="text-sm text-slate-400">{property.pricePerSqm?.toFixed(0)}€/m²</span>
              {property.is_bargain ? <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">🏷️ Schnäppchen</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleShare}
              className={`p-1.5 rounded-lg transition-colors ${
                copied ? "text-green-400 bg-green-500/20" : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
              }`}
              title={copied ? "Link kopiert!" : "Link kopieren"}>
              {copied ? <Check size={18} /> : <Share2 size={18} />}
            </button>
            {onToggleFav && (
              <button onClick={onToggleFav}
                className={`p-1.5 rounded-lg transition-colors ${
                  isFav ? "text-amber-400 bg-amber-500/20" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                }`}
                title={isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}>
                {isFav ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-[88px] z-10 bg-slate-900 border-b border-slate-700 px-4 flex gap-1 overflow-x-auto">
          {[
            { id: "details" as const, label: "📋 Details" },
            { id: "kosten" as const, label: "💰 Wahre Kosten" },
            { id: "rendite" as const, label: "📈 Rendite" },
            { id: "leistbar" as const, label: "🏦 Leistbar?" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
        <div className="p-4 space-y-4">
          {/* Ausreißer / Scam-Warnung */}
          {property.is_outlier && (
            <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/60 rounded-xl p-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Verdächtiges Inserat</p>
                <p className="text-xs text-red-400/80 mt-0.5">
                  Preis oder Merkmale weichen stark vom Marktdurchschnitt ab.
                  Vor Kontaktaufnahme bitte sorgfältig prüfen.
                </p>
              </div>
            </div>
          )}
          {/* Bild */}
          {property.image_url && (
            <img src={property.image_url} alt={property.title}
              className="w-full h-48 object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}

          {/* WohnWert Dimensionen */}
          {property.ww_dim_preis != null && (
            <Section title="WohnWert-Index">
              <WohnwertBar dims={{
                preis: property.ww_dim_preis ?? 0,
                standort: property.ww_dim_standort ?? 0,
                infrastruktur: property.ww_dim_infrastruktur ?? 0,
                ausstattung: property.ww_dim_ausstattung ?? 0,
                mobilitaet: property.ww_dim_mobilitaet ?? 0,
              }} />
            </Section>
          )}

          {/* Basis-Daten */}
          <Section title="Objekt">
            <Row label="Typ" value={`${property.object_type} / ${property.market_type}`} />
            <Row label="Wohnfläche" value={property.livingSpace} unit="m²" />
            <Row label="Zimmer" value={property.noRooms} />
            <Row label="Etage" value={property.floor != null ? `${property.floor}. OG` : null} />
            <Row label="Baujahr" value={property.yearConstructed} />
            <Row label="Zustand" value={property.condition} />
            <Row label="Ausstattungs-Score" value={property.equip_score?.toFixed(0)} unit="/ 100" info="Bewertet Balkon, Garten, EBK, Aufzug etc." />
            <div className="flex gap-3 pt-1 flex-wrap">
              {property.balcony_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🏠 Balkon</span> : null}
              {property.garden_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🌿 Garten</span> : null}
              {property.cellar_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">📦 Keller</span> : null}
              {property.lift_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🛗 Aufzug</span> : null}
              {property.hasKitchen_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🍳 EBK</span> : null}
              {property.barrierFree_bool ? <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">♿ Barrierefrei</span> : null}
              {property.isNewBuilding ? <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">🆕 Neubau</span> : null}
              {property.isPrivateOffer ? <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">👤 Privat</span> : null}
            </div>
          </Section>

          {/* Kosten */}
          <Section title="Kosten">
            {isMiete ? (
              <>
                <Row label="Kaltmiete" value={property.baseRent?.toLocaleString("de-DE")} unit="€/Monat" />
                <Row label="Nebenkosten" value={property.serviceCharge?.toLocaleString("de-DE")} unit="€/Monat" />
                <Row label="Warmmiete" value={property.totalRent?.toLocaleString("de-DE")} unit="€/Monat" />
                <Row label="Kaution" value={property.deposit_numeric?.toLocaleString("de-DE")} unit="€" />
                <Row label="Gesamtkosten (inkl. Strom+Internet)" value={property.total_monthly_cost?.toLocaleString("de-DE")} unit="€/Monat" />
                <Row label="Mietbelastungsquote" value={property.mietbelastungsquote?.toFixed(1)} unit="%" />
              </>
            ) : (
              <>
                <Row label="Kaufpreis" value={property.buyingPrice?.toLocaleString("de-DE")} unit="€" />
                <Row label="Preis/m²" value={property.pricePerSqm?.toFixed(0)} unit="€/m²" />
                <Row label="Kaufpreis/Einkommen" value={property.kaufpreis_einkommen_ratio?.toFixed(1)} unit="× Jahreseinkommen" />
              </>
            )}
            <Row label="Affordability-Score" value={property.affordability_score?.toFixed(0)} unit="/ 100" info="Wie erschwinglich ist die Miete im Verhältnis zum Einkommen?" />
            <Row label="Preis-Fairness-Score" value={property.preis_fairness_score?.toFixed(0)} unit="/ 100" info="Vergleich mit ähnlichen Objekten in der Region" />
            <Row label="IS24-Perzentil" value={property.is24_pricePercentile != null ? `${(property.is24_pricePercentile * 100).toFixed(0)}%` : null} info="Position im Preisvergleich (50% = Median)" />
            <Row label="IS24-Kategorie" value={property.is24_kategorie} info="Preiskategorie laut ImmoScout24" />
          </Section>

          {/* Infrastruktur OSM */}
          <Section title="Infrastruktur (OSM)">
            <OsmRow icon={<ShoppingCart size={12} />} label="Supermärkte" count={property.osm_supermarket_count} nearest={property.osm_supermarket_nearest_m} />
            <OsmRow icon={<School size={12} />} label="Schulen" count={property.osm_school_count} nearest={property.osm_school_nearest_m} />
            <OsmRow icon={<Stethoscope size={12} />} label="Ärzte" count={property.osm_doctor_count} nearest={property.osm_doctor_nearest_m} />
            <OsmRow icon={<Trees size={12} />} label="Parks" count={property.osm_park_count} nearest={property.osm_park_nearest_m} />
            <OsmRow icon={<Train size={12} />} label="ÖPNV (500m)" count={property.osm_oepnv_count} nearest={property.osm_oepnv_nearest_m} />
            <OsmRow icon={<Dumbbell size={12} />} label="Fitness" count={property.osm_fitness_count} nearest={property.osm_fitness_nearest_m} />
            <Row label="Amenity-Score" value={property.osm_amenity_score?.toFixed(0)} unit="/ 100" />
          </Section>

          {/* Luftqualität */}
          {property.air_lqi != null && (
            <Section title="Luftqualität">
              <Row label="Luftqualitätsindex (LQI)" value={`${property.air_lqi} – ${property.air_lqi_text}`} />
              <Row label="Luft-Score" value={property.air_score?.toFixed(0)} unit="/ 100" />
              <Row label="Messstation" value={property.air_station_name} />
              <Row label="Entfernung zur Station" value={property.air_station_dist_km?.toFixed(1)} unit="km" />
              <div className="mt-2 text-xs text-slate-500">
                LQI: 1 = sehr gut, 2 = gut, 3 = mäßig, 4 = schlecht, 5 = sehr schlecht
              </div>
            </Section>
          )}

          {/* INKAR Kreis-Daten */}
          <Section title={`Kreis: ${property.inkar_kreis_name}`}>
            <Row label="Verfügbares Einkommen" value={property.inkar_verfuegb_einkommen_ew?.toLocaleString("de-DE")} unit="€/EW" />
            <Row label="Kaufkraftindex" value={property.inkar_kaufkraftindex?.toFixed(1)} />
            <Row label="Arbeitslosenquote" value={property.inkar_arbeitslosenquote?.toFixed(1)} unit="%" />
            <Row label="Ärzte/100.000 EW" value={property.inkar_aerzte_je_100k} />
            <Row label="Kreis-Attraktivität" value={property.kreis_attraktivitaet?.toFixed(0)} unit="/ 100" />
          </Section>

          {/* ÖPNV + Pendelzeit */}
          <Section title="ÖPNV + Pendelzeit">
            <Row label="ÖPNV-Kategorie" value={property.oepnv_kategorie} />
            <Row label="ÖPNV-Score" value={property.oepnv_score?.toFixed(0)} unit="/ 100" />
            <Row label="Nächster Hbf" value={property.nearest_hbf ? `${property.nearest_hbf.charAt(0).toUpperCase() + property.nearest_hbf.slice(1)} (${property.nearest_hbf_km} km)` : null} />
            <Row label="Nächstes Stadtzentrum" value={property.nearest_zentrum_km != null ? `${property.nearest_zentrum_km} km` : null} />
            <Row label="Pendelzeit Auto" value={property.pendel_auto_min} unit="Min (geschätzt)" />
            <Row label="Pendelzeit ÖPNV" value={property.pendel_oepnv_min} unit="Min (geschätzt)" />
            <Row label="Pendelzeit Fahrrad" value={property.pendel_fahrrad_min} unit="Min (geschätzt)" />
            <Row label="Zone Düsseldorf" value={property.pendel_zone_ddorf} />
            <Row label="Zone Köln" value={property.pendel_zone_koeln} />
            {property.dist_hbf_duesseldorf_km != null && (
              <div className="flex gap-3 pt-1 flex-wrap text-xs text-slate-400">
                <span>Ddorf: {property.dist_hbf_duesseldorf_km} km</span>
                <span>Köln: {property.dist_hbf_koeln_km} km</span>
                <span>Wupp: {property.dist_hbf_wuppertal_km} km</span>
              </div>
            )}
          </Section>

          {/* Lage-Beschreibung */}
          {property.text_lage && (
            <Section title="Lage">
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{property.text_lage}</p>
            </Section>
          )}

          {/* Anbieter */}
          {(property.agent_name || property.agent_company) && (
            <Section title="Anbieter">
              <Row label="Name" value={property.agent_name} />
              <Row label="Unternehmen" value={property.agent_company} />
            </Section>
          )}

          {/* IS24 Link */}
          <a
            href={`https://www.immobilienscout24.de/expose/${property.scoutId}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm">
            Auf ImmoScout24 ansehen →
          </a>
        </div>
        )}

        {/* Tab: Wahre Kosten */}
        {activeTab === "kosten" && (
          <div className="p-4">
            <TrueCostCalculator property={property} />
          </div>
        )}

        {/* Tab: Rendite */}
        {activeTab === "rendite" && (
          <div className="p-4">
            <RenditeCalculator property={property} />
          </div>
        )}

        {/* Tab: Leistbarkeit */}
        {activeTab === "leistbar" && (
          <div className="p-4">
            <AffordabilityCalculator property={property} />
          </div>
        )}
      </div>
    </div>
  );
}
