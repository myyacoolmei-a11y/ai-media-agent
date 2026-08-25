import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { mapMediaError } from "@/lib/media/upload-errors";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const maxDuration = 60;

export async function POST(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();

  let file: File | null = null;
  try {
    const form = await request.formData();
    const uploaded = form.get("file");
    file = uploaded instanceof File ? uploaded : null;
  } catch (error) {
    console.error("article image form parse failed", error);
    return NextResponse.json(
      { error: "圖片上傳失敗：無法讀取檔案。" },
      { status: 400 },
    );
  }

  if (!file || file.size <= 0) {
    return NextResponse.json(
      { error: "圖片上傳失敗：檔案格式不支援" },
      { status: 400 },
    );
  }
  if (!allowedImageTypes.has(file.type)) {
    return NextResponse.json(
      { error: "圖片上傳失敗：檔案格式不支援" },
      { status: 400 },
    );
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "圖片上傳失敗：檔案太大，請換一張較小的照片。" },
      { status: 400 },
    );
  }

  const assetId = crypto.randomUUID();
  const extension =
    file.type === "image/webp"
      ? ".webp"
      : file.type === "image/png"
        ? ".png"
        : file.type === "image/gif"
          ? ".gif"
          : ".jpg";
  const storagePath = `${access.user.id}/${contentId}/${assetId}${extension}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await access.supabase.storage
    .from("content-media")
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("content-media upload failed", {
      contentId,
      userId: access.user.id,
      storagePath,
      message: uploadError.message,
      statusCode:
        "statusCode" in uploadError ? uploadError.statusCode : undefined,
    });
    return NextResponse.json(
      { error: mapMediaError(uploadError) },
      { status: 500 },
    );
  }

  const { data: signed, error: signError } = await access.supabase.storage
    .from("content-media")
    .createSignedUrl(storagePath, 60 * 60 * 24);
  if (signError || !signed?.signedUrl) {
    console.error("content-media signed url failed", signError);
    return NextResponse.json(
      { error: "圖片上傳失敗：無法產生預覽網址。" },
      { status: 500 },
    );
  }

  const { data: asset, error } = await access.supabase
    .from("content_assets")
    .insert({
      id: assetId,
      user_id: access.user.id,
      content_item_id: contentId,
      asset_type: "image",
      status: "ready",
      bucket: "content-media",
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("*")
    .single();
  if (error) {
    console.error("content_assets insert failed", error);
    return NextResponse.json({ error: mapMediaError(error) }, { status: 500 });
  }

  return NextResponse.json(
    {
      asset: {
        ...asset,
        signed_url: signed.signedUrl,
      },
    },
    { status: 201 },
  );
}
