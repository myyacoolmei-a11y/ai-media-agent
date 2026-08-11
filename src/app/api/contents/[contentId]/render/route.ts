import { after, NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { renderContentVideo } from "@/lib/jobs/render-content-video";
import { renderSettingsSchema } from "@/types/render";

export const maxDuration = 900;

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const payload = renderSettingsSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "請至少保留一個有效影片片段。", issues: payload.error.issues },
      { status: 400 },
    );
  }
  const { data: source } = await access.supabase
    .from("content_assets")
    .select("*")
    .eq("id", payload.data.sourceAssetId)
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .eq("asset_type", "video")
    .eq("status", "ready")
    .single();
  if (!source) {
    return NextResponse.json({ error: "找不到來源影片。" }, { status: 404 });
  }

  const renderJobId = crypto.randomUUID();
  const { error } = await access.supabase.from("render_jobs").insert({
    id: renderJobId,
    user_id: access.user.id,
    project_id: access.content.project_id,
    content_item_id: contentId,
    status: "queued",
    settings: payload.data,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await access.supabase
    .from("content_items")
    .update({ production_data: payload.data })
    .eq("id", contentId)
    .eq("user_id", access.user.id);

  after(() =>
    renderContentVideo({
      renderJobId,
      contentId,
      userId: access.user.id,
      source,
      settings: payload.data,
    }),
  );

  return NextResponse.json(
    {
      renderJobId,
      status: "queued",
      costNotice: "此渲染使用 FFmpeg，不會呼叫 AI API。",
    },
    { status: 202 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const { data } = await access.supabase
    .from("render_jobs")
    .select("*")
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return NextResponse.json({ renderJob: null });

  let outputUrl = null;
  if (data.output_storage_path) {
    const { data: signed } = await access.supabase.storage
      .from("content-media")
      .createSignedUrl(data.output_storage_path, 3600);
    outputUrl = signed?.signedUrl ?? null;
  }
  return NextResponse.json({ renderJob: data, outputUrl });
}
