import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  MediaStorageProvider,
  SignedUpload,
  StoredMedia,
} from "@/lib/providers/types";

const MEDIA_BUCKET = "project-media";

export class SupabaseMediaStorageProvider
  implements MediaStorageProvider
{
  async createUpload(path: string): Promise<SignedUpload> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Could not create upload URL: ${error.message}`);
    }

    return {
      bucket: MEDIA_BUCKET,
      path,
      token: data.token,
    };
  }

  async downloadToFile(media: StoredMedia, destination: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(media.bucket)
      .createSignedUrl(media.path, 600);

    if (error) {
      throw new Error(`Could not create media download URL: ${error.message}`);
    }

    const response = await fetch(data.signedUrl);

    if (!response.ok || !response.body) {
      throw new Error(`Could not download stored media (${response.status}).`);
    }

    await pipeline(
      Readable.fromWeb(response.body as import("node:stream/web").ReadableStream),
      createWriteStream(destination),
    );
  }
}
