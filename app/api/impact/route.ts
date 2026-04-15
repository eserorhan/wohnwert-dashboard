import { NextRequest, NextResponse } from "next/server";
import { getMapData, filterProperties } from "@/lib/db";
import type { Filters } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse filters from query params (same as properties route)
  const filters: Filters = {
    market_type: (searchParams.get("market_type") as any) || "all",
    object_type: (searchParams.get("object_type") as any) || "all",
    wohnwert_min: Number(searchParams.get("wohnwert_min")) || 0,
    wohnwert_max: Number(searchParams.get("wohnwert_max")) || 100,
    price_min: Number(searchParams.get("price_min")) || 0,
    price_max: Number(searchParams.get("price_max")) || 50,
    total_price_min: Number(searchParams.get("total_price_min")) || 0,
    total_price_max: Number(searchParams.get("total_price_max")) || 0,
    size_min: Number(searchParams.get("size_min")) || 0,
    size_max: Number(searchParams.get("size_max")) || 1000,
    rooms_min: Number(searchParams.get("rooms_min")) || 1,
    kreis: searchParams.get("kreis") || "all",
    search: searchParams.get("search") || "",
    is_bargain: searchParams.get("is_bargain") === "true",
    oepnv_kategorie: (searchParams.get("oepnv_kategorie") as any) || "all",
    pendel_ziel: (searchParams.get("pendel_ziel") as any) || "duesseldorf",
    pendel_max_min: Number(searchParams.get("pendel_max_min")) || 120,
    
    // WohnWert weights
    gewicht_preis: Number(searchParams.get("gewicht_preis")) || 20,
    gewicht_standort: Number(searchParams.get("gewicht_standort")) || 20,
    gewicht_infrastruktur: Number(searchParams.get("gewicht_infrastruktur")) || 20,
    gewicht_ausstattung: Number(searchParams.get("gewicht_ausstattung")) || 20,
    gewicht_mobilitaet: Number(searchParams.get("gewicht_mobilitaet")) || 20,
    
    // Rendite filters
    rendite_brutto_min: Number(searchParams.get("rendite_brutto_min")) || 0,
    rendite_netto_min: Number(searchParams.get("rendite_netto_min")) || 0,
    rendite_cashflow_min: Number(searchParams.get("rendite_cashflow_min")) || -500,
    rendite_eigenkapital: Number(searchParams.get("rendite_eigenkapital")) || 20,
    rendite_zinssatz: Number(searchParams.get("rendite_zinssatz")) || 3.8,
  };

  // Load all properties
  const allData = getMapData();

  // Get properties with custom weights
  const customProps = filterProperties(allData, filters);

  // Get properties with standard weights for comparison
  const standardFilters = { ...filters, gewicht_preis: 20, gewicht_standort: 20, gewicht_infrastruktur: 20, gewicht_ausstattung: 20, gewicht_mobilitaet: 20 };
  const standardProps = filterProperties(allData, standardFilters);

  // Create lookup map for standard scores
  const standardScores = new Map(
    standardProps.map(p => [p.scoutId, p.wohnwert_index ?? 0])
  );

  // Calculate impact
  let improved = 0;
  let worsened = 0;
  let unchanged = 0;
  let totalDelta = 0;

  customProps.forEach(p => {
    const customScore = p.wohnwert_index ?? 0;
    const standardScore = standardScores.get(p.scoutId) ?? 0;
    const delta = customScore - standardScore;

    if (delta > 0.5) improved++;
    else if (delta < -0.5) worsened++;
    else unchanged++;

    totalDelta += delta;
  });

  const avgDelta = customProps.length > 0 ? totalDelta / customProps.length : 0;

  return NextResponse.json({
    total: customProps.length,
    improved,
    worsened,
    unchanged,
    avgDelta,
  });
}
