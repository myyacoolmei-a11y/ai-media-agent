import { createReadStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { verifyContentAccess } from "@/lib/content/access";
import { getAiProviderStatus } from "@/lib/providers/config";
import { SupabaseMediaStorageProvider } from "@/lib/providers/supabase-storage";
import { brandStyleInputSchema } from "@/types/style";

export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const requestSchema = z.object({
  sourceAssetId: z.string().uuid(),
  prompt: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!getAiProviderStatus().configured) {
    return NextResponse.json(
      { error: "尚未設定 AI 圖片 API。一般圖片工具仍可使用。" },
      { status: 503 },
    );
  }
  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "請選擇圖片並輸入修圖需求。" }, { status: 400 });
  }
  const { data: source } = await access.supabase
    .from("content_assets")
    .select("*")
    .eq("id", payload.data.sourceAssetId)
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .eq("asset_type", "image")
    .eq("status", "ready")
    .single();
  if (
    !source ||
    !["image/png", "image/jpeg", "image/webp"].includes(source.mime_type) ||
    source.size_bytes > 50 * 1024 * 1024
  ) {
    return NextResponse.json(
      { error: "來源圖片不存在或超過 AI 修圖的 50MB 限制。" },
      { status: 400 },
    );
  }

  let styleContext = "";
  if (access.content.style_profile_id) {
    const { data } = await access.supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("id", access.content.style_profile_id)
      .eq("user_id", access.user.id)
      .maybeSingle();
    const style = brandStyleInputSchema.safeParse(data);
    if (style.success) {
      styleContext = `\n品牌圖片風格：${style.data.image_visual_style || style.data.preferred_color_direction}。`;
    }
  }

  const eventId = crypto.randomUUID();
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
  await access.supabase.from("ai_usage_events").insert({
    id: eventId,
    user_id: access.user.id,
    content_item_id: contentId,
    feature: "optional_image_edit",
    provider: "openai",
    model,
    status: "requested",
  });
  const workspace = await mkdtemp(path.join(tmpdir(), "image-edit-"));

  try {
    const inputPath = path.join(
      workspace,
      `source${path.extname(source.file_name) || ".png"}`,
    );
    await new SupabaseMediaStorageProvider().downloadToFile(
      { bucket: source.bucket, path: source.storage_path },
      inputPath,
    );
    const response = await new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }).images.edit({
      model,
      image: createReadStream(inputPath),
      prompt: `${payload.data.prompt}${styleContext}\n保留原始主體與真實內容，不新增文字、Logo、人物或不存在的商品。`,
      response_format: "b64_json",
      size: "auto",
    });
    const encoded = response.data?.[0]?.b64_json;
    if (!encoded) throw new Error("AI 圖片服務沒有回傳圖片。");
    const output = Buffer.from(encoded, "base64");
    const assetId = crypto.randomUUID();
    const storagePath = `${access.user.id}/${contentId}/ai-edit-${assetId}.png`;
    const { error: uploadError } = await access.supabase.storage
      .from("content-media")
      .upload(storagePath, output, {
        contentType: "image/png",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { data: asset, error: assetError } = await access.supabase
      .from("content_assets")
      .insert({
        id: assetId,
        user_id: access.user.id,
        content_item_id: contentId,
        asset_type: "image",
        status: "ready",
        bucket: "content-media",
        storage_path: storagePath,
        file_name: `ai-edit-${assetId}.png`,
        mime_type: "image/png",
        size_bytes: output.length,
        variant_of: source.id,
        transform_settings: {
          generatedByAi: true,
          prompt: payload.data.prompt,
        },
      })
      .select("*")
      .single();
    if (assetError) throw assetError;
    await access.supabase
      .from("ai_usage_events")
      .update({ status: "completed" })
      .eq("id", eventId);
    return NextResponse.json({
      asset,
      costNotice: "此圖片由使用者主動呼叫付費 AI 修圖服務產生。",
    });
  } catch (error) {
    await access.supabase
      .from("ai_usage_events")
      .update({ status: "failed" })
      .eq("id", eventId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 修圖失敗。" },
      { status: 500 },
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
