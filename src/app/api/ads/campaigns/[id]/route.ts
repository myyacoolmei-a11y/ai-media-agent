import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignInputSchema } from "@/types/ads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const payload = campaignInputSchema.partial().safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "活動資料不完整。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .update({
      ...(payload.data.advertiserId ? { advertiser_id: payload.data.advertiserId } : {}),
      ...(payload.data.name ? { name: payload.data.name } : {}),
      ...(payload.data.startDate ? { start_date: payload.data.startDate.slice(0, 10) } : {}),
      ...(payload.data.endDate ? { end_date: payload.data.endDate.slice(0, 10) } : {}),
      ...(payload.data.status ? { status: payload.data.status } : {}),
      ...(payload.data.priority !== undefined ? { priority: payload.data.priority } : {}),
      ...(payload.data.targetUrl !== undefined ? { target_url: payload.data.targetUrl } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray((body as { placementKeys?: unknown }).placementKeys)) {
    await supabase.from("ad_campaign_placements").delete().eq("campaign_id", id);
    if ((payload.data.placementKeys ?? []).length) {
      const { data: placements } = await supabase
        .from("ad_placements")
        .select("id,key")
        .in("key", payload.data.placementKeys ?? []);
      if (placements?.length) {
        await supabase.from("ad_campaign_placements").insert(
          placements.map((placement) => ({
            campaign_id: id,
            placement_id: placement.id,
            rotation_mode: payload.data.rotationMode ?? "priority",
          })),
        );
      }
    }
  }

  return NextResponse.json({ campaign: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { id } = await context.params;
  const { error } = await createAdminClient().from("ad_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
