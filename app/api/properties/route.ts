import { NextRequest, NextResponse } from "next/server";
import { getMapData, filterProperties } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const filters = {
      market_type: sp.get("market_type") ?? undefined,
      object_type: sp.get("object_type") ?? undefined,
      wohnwert_min: sp.has("wohnwert_min") ? Number(sp.get("wohnwert_min")) : undefined,
      wohnwert_max: sp.has("wohnwert_max") ? Number(sp.get("wohnwert_max")) : undefined,
      price_min: sp.has("price_min") ? Number(sp.get("price_min")) : undefined,
      price_max: sp.has("price_max") ? Number(sp.get("price_max")) : undefined,
      size_min: sp.has("size_min") ? Number(sp.get("size_min")) : undefined,
      rooms_min: sp.has("rooms_min") ? Number(sp.get("rooms_min")) : undefined,
      kreis: sp.get("kreis") ?? undefined,
      is_bargain: sp.get("is_bargain") === "true",
      total_price_min: sp.has("total_price_min") ? Number(sp.get("total_price_min")) : undefined,
      total_price_max: sp.has("total_price_max") ? Number(sp.get("total_price_max")) : undefined,
      pendel_max_min: sp.has("pendel_max_min") ? Number(sp.get("pendel_max_min")) : undefined,
      pendel_ziel: sp.get("pendel_ziel") ?? undefined,
      oepnv_kategorie: sp.get("oepnv_kategorie") ?? undefined,
      search: sp.get("search") ?? undefined,
      gewicht_preis: sp.has("gewicht_preis") ? Number(sp.get("gewicht_preis")) : undefined,
      gewicht_standort: sp.has("gewicht_standort") ? Number(sp.get("gewicht_standort")) : undefined,
      gewicht_infrastruktur: sp.has("gewicht_infrastruktur") ? Number(sp.get("gewicht_infrastruktur")) : undefined,
      gewicht_ausstattung: sp.has("gewicht_ausstattung") ? Number(sp.get("gewicht_ausstattung")) : undefined,
      gewicht_mobilitaet: sp.has("gewicht_mobilitaet") ? Number(sp.get("gewicht_mobilitaet")) : undefined,
      rendite_brutto_min: sp.has("rendite_brutto_min") ? Number(sp.get("rendite_brutto_min")) : undefined,
      rendite_netto_min: sp.has("rendite_netto_min") ? Number(sp.get("rendite_netto_min")) : undefined,
      rendite_cashflow_min: sp.has("rendite_cashflow_min") ? Number(sp.get("rendite_cashflow_min")) : undefined,
      rendite_eigenkapital: sp.has("rendite_eigenkapital") ? Number(sp.get("rendite_eigenkapital")) : undefined,
      rendite_zinssatz: sp.has("rendite_zinssatz") ? Number(sp.get("rendite_zinssatz")) : undefined,
    };
    const limit = Math.min(Number(sp.get("limit") ?? 5000), 10000);
    const all = getMapData();
    const filtered = filterProperties(all, filters);
    const sorted = [...filtered].sort((a, b) => (b.wohnwert_index ?? 0) - (a.wohnwert_index ?? 0));
    return NextResponse.json({ total: filtered.length, rows: sorted.slice(0, limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Data error" }, { status: 500 });
  }
}
