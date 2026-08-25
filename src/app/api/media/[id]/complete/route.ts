import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { signMediaAsset } from "@/lib/media/sign";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const { id } = await context.params;
  const supabase = createAdminClient();
  const { data: asset } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!asset) {
    return NextResponse.json({ error: "找不到素材。" }, { status: 404 });
  }
  const folder = asset.storage_path.split("/").slice(0, -1).join("/");
  const fileName = asset.storage_path.split("/").pop() ?? "";
  const { data: objects, error: storageError } = await supabase.storage
    .from(asset.bucket)
    .list(folder, { search: fileName, limit: 1 });
  if (storageError || !objects?.some((object) => object.name === fileName)) {
    await supabase.from("media_assets").update({ status: "failed" }).eq("id", id);
    return NextResponse.json({ error: "檔案尚未成功儲存。" }, { status: 409 });
  }
  const { data, error } = await supabase
    .from("media_assets")
    .update({ status: "ready" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ asset: await signMediaAsset(data) });
}
