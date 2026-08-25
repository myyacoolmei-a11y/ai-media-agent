import { NextResponse } from "next/server";
import { z } from "zod";

import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import { parseOptionalIsoDate } from "@/lib/content/dates";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { contentInputSchema } from "@/types/content";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const updateSchema = contentInputSchema.extend({
  coverAssetId: z.string().uuid().nullable(),
});

export async function GET(_request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  return NextResponse.json({
    content: await loadContentWithAssets(access.content),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();

  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "內容資料不完整。", issues: payload.error.issues },
      { status: 400 },
    );
  }
  if (payload.data.styleProfileId) {
    const { data: style } = await access.supabase
      .from("brand_style_profiles")
      .select("id")
      .eq("id", payload.data.styleProfileId)
      .eq("user_id", access.user.id)
      .maybeSingle();
    if (!style) {
      return NextResponse.json({ error: "品牌風格不存在。" }, { status: 400 });
    }
  }
  const publishedAt = parseOptionalIsoDate(payload.data.publishedAt);
  if (!publishedAt.ok) {
    return NextResponse.json({ error: "發布時間格式不正確。" }, { status: 400 });
  }
  if (
    access.content.status === "published" &&
    publishedAt.value === null
  ) {
    return NextResponse.json(
      { error: "已發布內容必須有發布時間。" },
      { status: 400 },
    );
  }

  if (payload.data.coverAssetId) {
    const { data: asset } = await access.supabase
      .from("content_assets")
      .select("id")
      .eq("id", payload.data.coverAssetId)
      .eq("content_item_id", contentId)
      .eq("user_id", access.user.id)
      .eq("asset_type", "image")
      .eq("status", "ready")
      .maybeSingle();
    if (!asset) {
      return NextResponse.json(
        { error: "封面圖片不存在或尚未上傳完成。" },
        { status: 400 },
      );
    }
  }

  const { data, error } = await access.supabase
    .from("content_items")
    .update({
      title: payload.data.title,
      slug: payload.data.slug,
      summary: payload.data.summary,
      content: payload.data.content,
      video_url: payload.data.videoUrl || null,
      category: payload.data.category,
      content_type: payload.data.contentType,
      style_profile_id: payload.data.styleProfileId,
      cover_asset_id: payload.data.coverAssetId,
      ...(payload.data.sponsored !== undefined
        ? { sponsored: payload.data.sponsored }
        : {}),
      ...(payload.data.sponsorId !== undefined
        ? { sponsor_id: payload.data.sponsorId }
        : {}),
      ...(payload.data.sponsorLabel !== undefined
        ? { sponsor_label: payload.data.sponsorLabel }
        : {}),
      ...(publishedAt.value !== undefined
        ? { published_at: publishedAt.value }
        : {}),
    })
    .eq("id", contentId)
    .eq("user_id", access.user.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "這個網址代稱已被使用。"
            : error.message,
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }
  return NextResponse.json({ content: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();
  await access.supabase
    .from("content_items")
    .update({ status: "archived", published_at: null })
    .eq("id", contentId)
    .eq("user_id", access.user.id);
  return NextResponse.json({ archived: true });
}
