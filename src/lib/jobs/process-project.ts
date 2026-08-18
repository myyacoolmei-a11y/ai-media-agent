import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createProviders } from "@/lib/providers";
import { assertProvidersConfigured } from "@/lib/providers/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { productionBriefSchema } from "@/types/analysis";
import type { AiTaskType } from "@/types/domain";
import { brandStyleInputSchema } from "@/types/style";

const generationTasks: AiTaskType[] = [
  "summarize",
  "generate_copy",
  "generate_seo",
  "generate_cover",
];

async function updateTask(
  projectId: string,
  type: AiTaskType,
  values: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  const { data: task } = await supabase
    .from("ai_tasks")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (task) {
    await supabase.from("ai_tasks").update(values).eq("id", task.id);
  }
}

export async function createAnalysisTasks(projectId: string, userId: string) {
  const supabase = createAdminClient();
  const taskTypes: AiTaskType[] = [
    "extract_audio",
    "transcribe",
    "analyze_visuals",
    ...generationTasks,
  ];
  const { error } = await supabase.from("ai_tasks").insert(
    taskTypes.map((type) => ({
      user_id: userId,
      project_id: projectId,
      type,
      status: "queued",
      progress: 0,
      input: {},
    })),
  );

  if (error) {
    throw new Error(`Could not create analysis tasks: ${error.message}`);
  }
}

export async function processProject(
  projectId: string,
  options: { reuseTranscript?: boolean } = {},
) {
  assertProvidersConfigured();
  const supabase = createAdminClient();
  const providers = createProviders();
  const workspace = await mkdtemp(path.join(tmpdir(), "ai-media-"));
  let processedCleanup: (() => Promise<void>) | null = null;

  try {
    const [{ data: project, error: projectError }, { data: media, error: mediaError }] =
      await Promise.all([
        supabase
          .from("projects")
          .select("id, user_id, brand_id, style_profile_id, brief")
          .eq("id", projectId)
          .single(),
        supabase
          .from("media")
          .select("*")
          .eq("project_id", projectId)
          .eq("type", "video")
          .single(),
      ]);

    if (projectError || !project) {
      throw new Error(`Project could not be loaded: ${projectError?.message}`);
    }
    if (mediaError || !media) {
      throw new Error(`Uploaded video could not be loaded: ${mediaError?.message}`);
    }

    const brief = productionBriefSchema.parse(project.brief);
    const { data: brandStyle, error: styleError } = await supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("id", project.style_profile_id)
      .eq("brand_id", project.brand_id)
      .single();
    if (styleError || !brandStyle) {
      throw new Error("The selected Brand Style Profile could not be loaded.");
    }
    const brandStyleForAi = brandStyleInputSchema.parse(brandStyle);
    await supabase
      .from("projects")
      .update({ status: "processing", error: null })
      .eq("id", projectId);

    await updateTask(projectId, "extract_audio", {
      status: "processing",
      progress: 20,
      started_at: new Date().toISOString(),
    });

    const extension = path.extname(media.file_name) || ".mp4";
    const inputPath = path.join(workspace, `source${extension}`);
    await providers.storage.downloadToFile(
      { bucket: "project-media", path: media.storage_path },
      inputPath,
    );
    const processed = await providers.video.process(
      inputPath,
      path.join(workspace, "processed"),
    );
    processedCleanup = processed.cleanup;

    await supabase
      .from("media")
      .update({ duration_seconds: Math.round(processed.durationSeconds) })
      .eq("id", media.id);
    await updateTask(projectId, "extract_audio", {
      status: "completed",
      progress: 100,
      output: { durationSeconds: processed.durationSeconds },
      completed_at: new Date().toISOString(),
    });
    await updateTask(projectId, "analyze_visuals", {
      status: "completed",
      progress: 100,
      output: { sampledFrames: processed.frames.length },
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    let transcript;
    if (options.reuseTranscript) {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("media_id", media.id)
        .single();
      if (error || !data) {
        throw new Error("The existing transcript could not be loaded.");
      }
      transcript = {
        language: data.language,
        text: data.text,
        segments: data.segments,
      };
      await updateTask(projectId, "transcribe", {
        status: "completed",
        progress: 100,
        output: { reused: true },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    } else {
      await updateTask(projectId, "transcribe", {
        status: "processing",
        progress: 30,
        started_at: new Date().toISOString(),
      });
      transcript = await providers.transcription.transcribe(processed.audioPath);
      const { error } = await supabase.from("transcripts").upsert(
        {
          user_id: project.user_id,
          media_id: media.id,
          language: transcript.language,
          text: transcript.text,
          segments: transcript.segments,
        },
        { onConflict: "media_id" },
      );
      if (error) {
        throw new Error(`Could not save transcript: ${error.message}`);
      }
      await updateTask(projectId, "transcribe", {
        status: "completed",
        progress: 100,
        output: { segmentCount: transcript.segments.length },
        completed_at: new Date().toISOString(),
      });
    }

    for (const task of generationTasks) {
      await updateTask(projectId, task, {
        status: "processing",
        progress: 50,
        started_at: new Date().toISOString(),
      });
    }

    const result = await providers.llm.generate({
      transcript,
      brief,
      brandStyle: brandStyleForAi,
      videoDurationSeconds: processed.durationSeconds,
      frames: processed.frames,
    });
    const { data: latestResult } = await supabase
      .from("ai_results")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latestResult?.version ?? 0) + 1;
    const { error: resultError } = await supabase.from("ai_results").insert({
      user_id: project.user_id,
      project_id: projectId,
      model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
      version,
      content: result,
    });
    if (resultError) {
      throw new Error(`Could not save generated result: ${resultError.message}`);
    }

    for (const task of generationTasks) {
      await updateTask(projectId, task, {
        status: "completed",
        progress: 100,
        output: { resultVersion: version },
        completed_at: new Date().toISOString(),
      });
    }
    await supabase
      .from("projects")
      .update({
        status: "completed",
        ai_task_summary: result.taskSummary,
        error: null,
      })
      .eq("id", projectId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown media processing error";
    await Promise.all([
      supabase
        .from("projects")
        .update({ status: "failed", error: message })
        .eq("id", projectId),
      supabase
        .from("ai_tasks")
        .update({
          status: "failed",
          error: message,
          completed_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("status", "processing"),
    ]);
  } finally {
    await processedCleanup?.();
    await rm(workspace, { recursive: true, force: true });
  }
}
