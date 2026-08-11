import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createProviders } from "@/lib/providers";
import { assertProvidersConfigured } from "@/lib/providers/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function transcribeContent(input: {
  contentId: string;
  userId: string;
  asset: {
    bucket: string;
    storage_path: string;
    file_name: string;
  };
  usageEventId: string;
}) {
  assertProvidersConfigured();
  const supabase = createAdminClient();
  const providers = createProviders();
  const workspace = await mkdtemp(path.join(tmpdir(), "content-transcribe-"));

  try {
    const inputPath = path.join(
      workspace,
      `source${path.extname(input.asset.file_name) || ".mp4"}`,
    );
    await providers.storage.downloadToFile(
      { bucket: input.asset.bucket, path: input.asset.storage_path },
      inputPath,
    );
    const processed = await providers.video.process(
      inputPath,
      path.join(workspace, "processed"),
    );
    const transcript = await providers.transcription.transcribe(
      processed.audioPath,
    );
    const { data: content } = await supabase
      .from("content_items")
      .select("production_data")
      .eq("id", input.contentId)
      .eq("user_id", input.userId)
      .single();
    const current = (content?.production_data ?? {}) as Record<string, unknown>;
    await supabase
      .from("content_items")
      .update({
        production_data: {
          ...current,
          sourceAssetId: current.sourceAssetId ?? null,
          clips: current.clips ?? [],
          burnSubtitles: current.burnSubtitles ?? true,
          subtitleStyle: current.subtitleStyle ?? "白色底部字幕",
          transcript: transcript.text,
          subtitles: transcript.segments.map((segment, index) => ({
            id: `subtitle-${index + 1}`,
            startSeconds: segment.start,
            endSeconds: segment.end,
            text: segment.text.trim(),
          })),
        },
      })
      .eq("id", input.contentId)
      .eq("user_id", input.userId);
    await supabase
      .from("ai_usage_events")
      .update({ status: "completed" })
      .eq("id", input.usageEventId);
    await processed.cleanup();
  } catch (error) {
    await supabase
      .from("ai_usage_events")
      .update({ status: "failed" })
      .eq("id", input.usageEventId);
    throw error;
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
