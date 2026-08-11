import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { OpenAiContentTextProvider } from "@/lib/providers/openai-content-text";
import { getAiProviderStatus } from "@/lib/providers/config";
import { textAiRequestSchema } from "@/types/content-ai";
import { brandStyleInputSchema } from "@/types/style";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const provider = getAiProviderStatus();
  if (!provider.configured) {
    return NextResponse.json(
      { error: "尚未設定 AI API，因此無法執行此選配功能。" },
      { status: 503 },
    );
  }
  const payload = textAiRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "請先提供要處理的文字。" }, { status: 400 });
  }

  let style = null;
  if (access.content.style_profile_id) {
    const { data } = await access.supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("id", access.content.style_profile_id)
      .eq("user_id", access.user.id)
      .maybeSingle();
    const parsed = brandStyleInputSchema.safeParse(data);
    if (parsed.success) style = parsed.data;
  }

  const eventId = crypto.randomUUID();
  await access.supabase.from("ai_usage_events").insert({
    id: eventId,
    user_id: access.user.id,
    content_item_id: contentId,
    feature: `text_${payload.data.action}`,
    provider: "openai",
    model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
    status: "requested",
  });

  try {
    const result = await new OpenAiContentTextProvider().generate({
      action: payload.data.action,
      sourceText: payload.data.sourceText,
      style,
    });
    await access.supabase
      .from("ai_usage_events")
      .update({ status: "completed" })
      .eq("id", eventId);
    return NextResponse.json({
      result,
      costNotice: "此結果由使用者主動呼叫付費文字 AI 產生。",
    });
  } catch (error) {
    await access.supabase
      .from("ai_usage_events")
      .update({ status: "failed" })
      .eq("id", eventId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 文字處理失敗。" },
      { status: 500 },
    );
  }
}
