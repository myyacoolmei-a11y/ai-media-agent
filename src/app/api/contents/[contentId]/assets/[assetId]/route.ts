import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyContentAccess } from "@/lib/content/access";

type RouteContext = {
  params: Promise<{ contentId: string; assetId: string }>;
};

const assetUpdateSchema = z.object({
  altText: z.string().max(500),
  sortOrder: z.number().int().min(0).max(1000),
});

export async function PATCH(request: Request, context: RouteContext) {
  const { contentId, assetId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const payload = assetUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "媒體設定不正確。" }, { status: 400 });
  }
  const { data, error } = await access.supabase
    .from("content_assets")
    .update({
      alt_text: payload.data.altText,
      sort_order: payload.data.sortOrder,
    })
    .eq("id", assetId)
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ asset: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { contentId, assetId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const { data: asset } = await access.supabase
    .from("content_assets")
    .select("*")
    .eq("id", assetId)
    .eq("content_item_id", contentId)
    .eq("user_id", access.user.id)
    .single();
  if (!asset) {
    return NextResponse.json({ error: "找不到媒體資料。" }, { status: 404 });
  }

  if (asset.bucket === "content-media") {
    await access.supabase.storage.from(asset.bucket).remove([asset.storage_path]);
  }
  const { error } = await access.supabase
    .from("content_assets")
    .delete()
    .eq("id", assetId)
    .eq("user_id", access.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
