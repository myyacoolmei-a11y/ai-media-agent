import { NextResponse } from "next/server";

import { isMissingRelation } from "@/lib/db/missing";
import { createAdminClient } from "@/lib/supabase/admin";
import { adEventInputSchema } from "@/types/ads";

export async function POST(request: Request) {
  const payload = adEventInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "事件資料不正確。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: placement } = await supabase
    .from("ad_placements")
    .select("id")
    .eq("key", payload.data.placementKey)
    .maybeSingle();
  const { error } = await supabase.from("ad_events").insert({
    campaign_id: payload.data.campaignId,
    creative_id: payload.data.creativeId ?? null,
    placement_id: placement?.id ?? null,
    article_id: payload.data.articleId ?? null,
    event_type: payload.data.eventType,
  });
  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json({ recorded: false }, { status: 202 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ recorded: true });
}
