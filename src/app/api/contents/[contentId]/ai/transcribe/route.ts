import { after, NextResponse } from "next/server";
import { z } from "zod";

import { verifyContentAccess } from "@/lib/content/access";
import { transcribeContent } from "@/lib/jobs/transcribe-content";
import { getAiProviderStatus } from "@/lib/providers/config";

export const maxDuration = 900;

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const requestSchema = z.object({
  sourceAssetId: z.string().uuid(),
});

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!getAiProviderStatus().configured) {
    return NextResponse.json(
      { error: "尚未設定語音辨識 API。手動輸入字幕仍可使用。" },
      { status: 503 },
    );
  }
  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "請先選擇來源影片。" }, { status: 400 });
  }
  const { data: asset } = await access.supabase
    .from("content_assets")
    .select("*")
    .eq("id", payload.data.sourceAssetId)
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .eq("asset_type", "video")
    .eq("status", "ready")
    .single();
  if (!asset) {
    return NextResponse.json({ error: "找不到可轉錄的影片。" }, { status: 404 });
  }

  const usageEventId = crypto.randomUUID();
  await access.supabase.from("ai_usage_events").insert({
    id: usageEventId,
    user_id: access.user.id,
    content_item_id: contentId,
    feature: "optional_transcription",
    provider: "openai",
    model: process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1",
    status: "requested",
  });
  after(() =>
    transcribeContent({
      contentId,
      userId: access.user.id,
      asset,
      usageEventId,
    }),
  );

  return NextResponse.json(
    {
      status: "processing",
      message: "已由使用者主動啟動語音辨識，此操作可能產生 API 費用。",
    },
    { status: 202 },
  );
}
