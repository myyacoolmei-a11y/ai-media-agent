import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { signMediaAsset } from "@/lib/media/sign";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  altText: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  source: z.string().max(200).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const { id } = await context.params;
  const payload = patchSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "素材資料不正確。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .update({
      ...(payload.data.altText !== undefined ? { alt_text: payload.data.altText } : {}),
      ...(payload.data.caption !== undefined ? { caption: payload.data.caption } : {}),
      ...(payload.data.source !== undefined ? { source: payload.data.source } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ asset: await signMediaAsset(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
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
  await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
