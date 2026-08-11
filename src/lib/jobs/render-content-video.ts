import { execFile } from "node:child_process";
import {
  copyFile,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegStatic from "ffmpeg-static";

import { SupabaseMediaStorageProvider } from "@/lib/providers/supabase-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RenderSettings } from "@/types/render";

const execFileAsync = promisify(execFile);

function srtTime(seconds: number) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const ms = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export async function renderContentVideo(input: {
  renderJobId: string;
  contentId: string;
  userId: string;
  source: {
    bucket: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
  };
  settings: RenderSettings;
}) {
  const supabase = createAdminClient();
  const workspace = await mkdtemp(path.join(tmpdir(), "content-render-"));
  const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic;

  try {
    if (!ffmpegPath) throw new Error("FFmpeg 不支援目前執行環境。");
    await supabase
      .from("render_jobs")
      .update({ status: "processing", error: null })
      .eq("id", input.renderJobId);

    const sourcePath = path.join(
      workspace,
      `source${path.extname(input.source.file_name) || ".mp4"}`,
    );
    await new SupabaseMediaStorageProvider().downloadToFile(
      { bucket: input.source.bucket, path: input.source.storage_path },
      sourcePath,
    );

    const clipPaths: string[] = [];
    for (const [index, clip] of input.settings.clips.entries()) {
      const clipPath = path.join(workspace, `clip-${index}.mp4`);
      await execFileAsync(
        ffmpegPath,
        [
          "-y",
          "-ss",
          String(clip.startSeconds),
          "-to",
          String(clip.endSeconds),
          "-i",
          sourcePath,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          clipPath,
        ],
        { maxBuffer: 20 * 1024 * 1024 },
      );
      clipPaths.push(clipPath);
    }

    const concatList = path.join(workspace, "clips.txt");
    await writeFile(
      concatList,
      clipPaths.map((clipPath) => `file '${clipPath}'`).join("\n"),
    );
    const mergedPath = path.join(workspace, "merged.mp4");
    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatList,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        mergedPath,
      ],
      { maxBuffer: 20 * 1024 * 1024 },
    );

    const outputPath = path.join(workspace, "output.mp4");
    if (input.settings.burnSubtitles && input.settings.subtitles.length) {
      const subtitlePath = path.join(workspace, "subtitles.srt");
      await writeFile(
        subtitlePath,
        input.settings.subtitles
          .map(
            (cue, index) =>
              `${index + 1}\n${srtTime(cue.startSeconds)} --> ${srtTime(cue.endSeconds)}\n${cue.text}\n`,
          )
          .join("\n"),
      );
      await execFileAsync(
        ffmpegPath,
        [
          "-y",
          "-i",
          mergedPath,
          "-vf",
          `subtitles=${subtitlePath}:force_style='FontSize=22,Alignment=2,MarginV=36,Outline=2'`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "copy",
          "-movflags",
          "+faststart",
          outputPath,
        ],
        { maxBuffer: 20 * 1024 * 1024 },
      );
    } else {
      await copyFile(mergedPath, outputPath);
    }

    const outputStoragePath = `${input.userId}/${input.contentId}/render-${input.renderJobId}.mp4`;
    const output = await readFile(outputPath);
    const { error: uploadError } = await supabase.storage
      .from("content-media")
      .upload(outputStoragePath, output, {
        contentType: "video/mp4",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const outputStat = await stat(outputPath);
    const assetId = crypto.randomUUID();
    const { error: assetError } = await supabase.from("content_assets").insert({
      id: assetId,
      user_id: input.userId,
      content_item_id: input.contentId,
      asset_type: "video",
      status: "ready",
      bucket: "content-media",
      storage_path: outputStoragePath,
      file_name: `render-${input.renderJobId}.mp4`,
      mime_type: "video/mp4",
      size_bytes: outputStat.size,
      variant_of: input.settings.sourceAssetId,
      transform_settings: input.settings,
    });
    if (assetError) throw assetError;

    const { data: content } = await supabase
      .from("content_items")
      .select("production_data")
      .eq("id", input.contentId)
      .eq("user_id", input.userId)
      .single();
    await supabase
      .from("content_items")
      .update({
        production_data: {
          ...((content?.production_data ?? {}) as Record<string, unknown>),
          outputAssetId: assetId,
        },
      })
      .eq("id", input.contentId)
      .eq("user_id", input.userId);

    await supabase
      .from("render_jobs")
      .update({
        status: "completed",
        output_storage_path: outputStoragePath,
        output_asset_id: assetId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.renderJobId);
  } catch (error) {
    await supabase
      .from("render_jobs")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message : "影片渲染失敗。",
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.renderJobId);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
