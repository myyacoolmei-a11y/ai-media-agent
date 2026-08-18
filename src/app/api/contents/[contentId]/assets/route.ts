import path from "node:path";

import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { contentAssetRequestSchema } from "@/types/content";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const allowedTypes = {
  image: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  video: new Set(["video/mp4", "video/quicktime", "video/webm"]),
  audio: new Set(["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4"]),
};

export async function POST(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();

  const payload = contentAssetRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "媒體資料不完整。" }, { status: 400 });
  }
  if (!allowedTypes[payload.data.assetType].has(payload.data.mimeType)) {
    return NextResponse.json({ error: "不支援這個媒體格式。" }, { status: 400 });
  }

  const assetId = crypto.randomUUID();
  const extension =
    path.extname(payload.data.fileName).toLowerCase().replace(/[^.\w]/g, "") ||
    (payload.data.assetType === "image" ? ".jpg" : ".mp4");
  const storagePath = `${access.user.id}/${contentId}/${assetId}${extension}`;
  const { data: upload, error: uploadError } = await access.supabase.storage
    .from("content-media")
    .createSignedUploadUrl(storagePath);
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: asset, error } = await access.supabase
    .from("content_assets")
    .insert({
      id: assetId,
      user_id: access.user.id,
      brand_id: access.content.brand_id ?? access.context?.brand.id,
      content_item_id: contentId,
      asset_type: payload.data.assetType,
      status: "pending",
      bucket: "content-media",
      storage_path: storagePath,
      file_name: payload.data.fileName,
      mime_type: payload.data.mimeType,
      size_bytes: payload.data.sizeBytes,
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      asset,
      upload: {
        path: storagePath,
        token: upload.token,
      },
    },
    { status: 201 },
  );
}
