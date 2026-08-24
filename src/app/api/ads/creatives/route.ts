import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { creativeInputSchema } from "@/types/ads";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const campaignId = new URL(request.url).searchParams.get("campaignId");
  let query = createAdminClient().from("ad_creatives").select("*").order("created_at", { ascending: false });
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ creatives: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ creatives: data ?? [] });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const payload = creativeInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "素材資料不完整。" }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from("ad_creatives")
    .insert({
      campaign_id: payload.data.campaignId,
      type: payload.data.type,
      image_url: payload.data.imageUrl ?? null,
      video_url: payload.data.videoUrl ?? null,
      storage_bucket: payload.data.storageBucket ?? null,
      storage_path: payload.data.storagePath ?? null,
      headline: payload.data.headline,
      description: payload.data.description,
      cta_text: payload.data.ctaText,
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
  return NextResponse.json({ creative: data }, { status: 201 });
}
