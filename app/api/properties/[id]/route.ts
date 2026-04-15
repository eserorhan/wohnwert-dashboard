import { NextRequest, NextResponse } from "next/server";
import { getDetailData, getMapPin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scoutId = Number(id);

    const detail = getDetailData();
    const row = detail[scoutId];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Merge ÖPNV fields from map data (already in memory from pre-warming)
    const mapPin = getMapPin(scoutId);
    const merged = mapPin ? { ...row, ...mapPin } : row;

    return NextResponse.json(merged);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Data error" }, { status: 500 });
  }
}
