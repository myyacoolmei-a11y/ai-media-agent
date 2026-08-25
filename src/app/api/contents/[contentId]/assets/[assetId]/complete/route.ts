import path from "node:path";

import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";

type RouteContext = {
  params: Promise<{ contentId: string; assetId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId, assetId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();
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

  const folder = path.posix.dirname(asset.storage_path);
  const fileName = path.posix.basename(asset.storage_path);
  const { data: signed, error: signedError } = await access.supabase.storage
    .from(asset.bucket)
    .createSignedUrl(asset.storage_path, 60);
  const listed = await access.supabase.storage
    .from(asset.bucket)
    .list(folder, { search: fileName, limit: 1 });
  const exists =
    Boolean(signed?.signedUrl) ||
    Boolean(listed.data?.some((object) => object.name === fileName));
  if (signedError) {
    console.error("asset complete signed url failed", signedError);
  }
  if (listed.error) {
    console.error("asset complete list failed", listed.error);
  }
  if (!exists) {
    await access.supabase
      .from("content_assets")
      .update({ status: "failed" })
      .eq("id", assetId);
    return NextResponse.json(
      { error: "媒體尚未成功儲存，請重新上傳。" },
      { status: 409 },
    );
  }

  const { data, error } = await access.supabase
    .from("content_assets")
    .update({ status: "ready" })
    .eq("id", assetId)
    .eq("user_id", access.user.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ asset: data });
}
