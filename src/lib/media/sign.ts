import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaAsset } from "@/types/media";

async function signedUrl(
  bucket: string,
  path: string,
  expiresIn: number,
  width?: number,
) {
  const supabase = createAdminClient();
  if (width) {
    const transformed = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn, {
      transform: { width, quality: 72, resize: "contain" },
    });
    if (transformed.data?.signedUrl) return transformed.data.signedUrl;
  }
  const raw = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return raw.data?.signedUrl ?? null;
}

export async function signMediaAsset(
  asset: MediaAsset,
  expiresIn = 60 * 60 * 24,
): Promise<MediaAsset> {
  const full = await signedUrl(asset.bucket, asset.storage_path, expiresIn, asset.type === "image" ? 1400 : undefined);
  const thumb =
    asset.type === "image"
      ? await signedUrl(asset.bucket, asset.storage_path, expiresIn, 640)
      : full;
  return {
    ...asset,
    signed_url: full ?? asset.url ?? undefined,
    signed_thumb_url: thumb ?? full ?? undefined,
  };
}

export async function signMediaPath(
  bucket: string,
  path: string,
  width?: number | null,
  expiresIn = 60 * 60 * 12,
) {
  return signedUrl(bucket, path, expiresIn, width ?? undefined);
}
