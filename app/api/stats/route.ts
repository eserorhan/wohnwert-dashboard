import { NextResponse } from "next/server";
import { getMapData } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export async function GET() {
  try {
    const data = getMapData();
    const mieteData = data.filter(p => p.market_type === "Miete");
    const kaufData = data.filter(p => p.market_type === "Kauf");

    const kreisMap = new Map<string, { ww: number[]; psqm_miete: number[]; psqm_kauf: number[]; lat: number[]; lng: number[]; count: number }>();
    const wwKlassen: Record<string, number> = {};

    for (const p of data) {
      const k = p.inkar_kreis_name;
      if (!kreisMap.has(k)) kreisMap.set(k, { ww: [], psqm_miete: [], psqm_kauf: [], lat: [], lng: [], count: 0 });
      const entry = kreisMap.get(k)!;
      entry.count++;
      if (p.wohnwert_index != null) entry.ww.push(p.wohnwert_index);
      if (p.lat) entry.lat.push(p.lat);
      if (p.lng) entry.lng.push(p.lng);
      if (p.market_type === "Miete" && p.pricePerSqm) entry.psqm_miete.push(p.pricePerSqm);
      if (p.market_type === "Kauf" && p.pricePerSqm) entry.psqm_kauf.push(p.pricePerSqm);
      if (p.wohnwert_klasse) wwKlassen[p.wohnwert_klasse] = (wwKlassen[p.wohnwert_klasse] ?? 0) + 1;
    }

    const kreis_data = Array.from(kreisMap.entries()).map(([name, v]) => ({
      inkar_kreis_name: name, count: v.count,
      median_ww: Math.round(avg(v.ww) * 10) / 10,
      median_psqm_miete: Math.round(avg(v.psqm_miete)),
      median_psqm_kauf: Math.round(avg(v.psqm_kauf)),
      center_lat: Math.round(avg(v.lat) * 10000) / 10000,
      center_lng: Math.round(avg(v.lng) * 10000) / 10000,
    })).sort((a, b) => b.count - a.count);

    const lats = data.map(p => p.lat).filter(Boolean) as number[];
    const lngs = data.map(p => p.lng).filter(Boolean) as number[];

    let oepnv_stats = {};
    try {
      const p = path.join(process.cwd(), "public", "data", "oepnv_stats.json");
      oepnv_stats = JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch { /* optional file */ }

    // Get last update time from properties_map.json
    let last_updated: string | null = null;
    try {
      const mapPath = path.join(process.cwd(), "public", "data", "properties_map.json");
      const stat = fs.statSync(mapPath);
      last_updated = stat.mtime.toISOString();
    } catch { /* ignore */ }

    return NextResponse.json({
      total: data.length,
      last_updated,
      miete: mieteData.length,
      kauf: kaufData.length,
      ...oepnv_stats,
      median_miete_psqm: Math.round(avg(mieteData.map(p => p.pricePerSqm ?? 0).filter(Boolean)) * 100) / 100,
      median_kauf_psqm: Math.round(avg(kaufData.map(p => p.pricePerSqm ?? 0).filter(Boolean))),
      median_wohnwert: Math.round(avg(data.map(p => p.wohnwert_index ?? 0).filter(Boolean)) * 10) / 10,
      kreis_data,
      wohnwert_klassen: wwKlassen,
      bbox: {
        min_lat: Math.min(...lats), max_lat: Math.max(...lats),
        min_lng: Math.min(...lngs), max_lng: Math.max(...lngs),
        center_lat: Math.round(avg(lats) * 10000) / 10000,
        center_lng: Math.round(avg(lngs) * 10000) / 10000,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Data error" }, { status: 500 });
  }
}
