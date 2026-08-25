import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignInputSchema } from "@/types/ads";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*, advertisers(name), ad_campaign_placements(placement_id, rotation_mode, ad_placements(key,code,name))")
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ campaigns: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const payload = campaignInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "活動資料不完整。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      advertiser_id: payload.data.advertiserId,
      name: payload.data.name,
      start_date: payload.data.startDate.slice(0, 10),
      end_date: payload.data.endDate.slice(0, 10),
      status: payload.data.status,
      priority: payload.data.priority,
      target_url: payload.data.targetUrl ?? null,
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ error: "請先執行廣告系統 migration。" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (payload.data.placementKeys.length) {
    const { data: placements } = await supabase
      .from("ad_placements")
      .select("id,key")
      .in("key", payload.data.placementKeys);
    if (placements?.length) {
      await supabase.from("ad_campaign_placements").insert(
        placements.map((placement) => ({
          campaign_id: data.id,
          placement_id: placement.id,
          rotation_mode: payload.data.rotationMode,
        })),
      );
    }
  }

  return NextResponse.json({ campaign: data }, { status: 201 });
}
