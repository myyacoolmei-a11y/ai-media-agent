import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  formatBytes,
} from "@/lib/content/limits";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { signMediaAsset } from "@/lib/media/sign";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";

const prepareSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(1024 * 1024 * 1024),
  type: z.enum(["image", "video"]),
  altText: z.string().max(300).optional().default(""),
  caption: z.string().max(500).optional().default(""),
  source: z.string().max(200).optional().default(""),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  if (isPreviewDemo()) {
    return NextResponse.json({ assets: [] });
  }
  const { data, error } = await createAdminClient()
    .from("media_assets")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ assets: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const assets = await Promise.all(
    (data ?? []).map((asset) => signMediaAsset(asset)),
  );
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const payload = prepareSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "媒體資料不完整。" }, { status: 400 });
  }
  const allowed =
    payload.data.type === "image"
      ? ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]
      : ["video/mp4", "video/quicktime", "video/webm"];
  if (!allowed.includes(payload.data.mimeType)) {
    return NextResponse.json({ error: "不支援這個檔案格式。" }, { status: 400 });
  }
  const maxBytes =
    payload.data.type === "image" ? MAX_IMAGE_UPLOAD_BYTES : MAX_VIDEO_UPLOAD_BYTES;
  if (payload.data.sizeBytes > maxBytes) {
    return NextResponse.json(
      { error: `檔案超過 ${formatBytes(maxBytes)}，請壓縮後再上傳。` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const assetId = crypto.randomUUID();
  const extension =
    path.extname(payload.data.fileName).toLowerCase().replace(/[^.\w]/g, "") ||
    (payload.data.type === "image" ? ".jpg" : ".mp4");
  const storagePath = `${user.id}/library/${assetId}${extension}`;
  const { data: upload, error: uploadError } = await supabase.storage
    .from("content-media")
    .createSignedUploadUrl(storagePath);
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: asset, error } = await supabase
    .from("media_assets")
    .insert({
      id: assetId,
      user_id: user.id,
      type: payload.data.type,
      bucket: "content-media",
      storage_path: storagePath,
      filename: payload.data.fileName,
      mime_type: payload.data.mimeType,
      file_size: payload.data.sizeBytes,
      alt_text: payload.data.altText,
      caption: payload.data.caption,
      source: payload.data.source,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json(
        { error: "請先在 Supabase SQL Editor 執行 media_assets 的 migration。" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      asset,
      upload: { path: storagePath, token: upload.token },
    },
    { status: 201 },
  );
}
