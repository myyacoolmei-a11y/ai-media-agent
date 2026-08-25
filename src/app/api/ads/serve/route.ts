import { NextResponse } from "next/server";

import { getAdsForPlacement } from "@/lib/ads/serve";
import { AD_PLACEMENT_KEYS } from "@/types/ads";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placement = url.searchParams.get("placement") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "1") || 1, 8);
  if (!AD_PLACEMENT_KEYS.includes(placement as (typeof AD_PLACEMENT_KEYS)[number])) {
    return NextResponse.json({ error: "版位不正確。" }, { status: 400 });
  }
  const ads = await getAdsForPlacement(placement, limit);
  return NextResponse.json({ ads });
}
