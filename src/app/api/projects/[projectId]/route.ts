import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyProjectAccess } from "@/lib/jobs/access";
import { recordStyleFeedback } from "@/lib/style/feedback";
import { generatedContentSchema } from "@/types/analysis";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save-result"),
    result: generatedContentSchema,
  }),
  z.object({
    action: z.literal("select-versions"),
    copyVersion: z.enum(["short", "story", "professional"]),
    editingVersion: z.enum(["quick", "social", "full"]),
    coverText: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("record-feedback"),
    feedbackType: z.enum(["segment_adopted", "segment_removed"]),
    originalSuggestion: z.unknown(),
    userAction: z.string().min(1).max(200),
    finalChoice: z.unknown(),
  }),
]);

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await verifyProjectAccess(projectId);
  if (!access) {
    return NextResponse.json({ error: "無法存取此製作工作。" }, { status: 403 });
  }

  const [mediaQuery, tasksQuery, resultQuery, styleQuery] = await Promise.all([
    access.supabase
      .from("media")
      .select("*")
      .eq("project_id", projectId)
      .limit(1)
      .maybeSingle(),
    access.supabase
      .from("ai_tasks")
      .select("type,status,progress,error,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    access.supabase
      .from("ai_results")
      .select("*")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    access.supabase
      .from("brand_style_profiles")
      .select("id,style_name")
      .eq("id", access.project.style_profile_id)
      .single(),
  ]);

  let transcript = null;
  if (mediaQuery.data) {
    const transcriptQuery = await access.supabase
      .from("transcripts")
      .select("text,segments,language")
      .eq("media_id", mediaQuery.data.id)
      .maybeSingle();
    transcript = transcriptQuery.data;
  }
  const validatedResult = generatedContentSchema.safeParse(
    resultQuery.data?.content,
  );

  return NextResponse.json({
    project: {
      id: access.project.id,
      name: access.project.name,
      status: access.project.status,
      styleProfileId: access.project.style_profile_id,
      styleProfileName: styleQuery.data?.style_name ?? "未命名風格",
      brief: access.project.brief,
      aiTaskSummary: access.project.ai_task_summary,
      selectedCopyVersion: access.project.selected_copy_version,
      selectedEditingVersion: access.project.selected_editing_version,
      selectedCoverText: access.project.selected_cover_text,
      error: access.project.error,
    },
    media: mediaQuery.data
      ? {
          fileName: mediaQuery.data.file_name,
          durationSeconds: mediaQuery.data.duration_seconds,
        }
      : null,
    transcript,
    result: validatedResult.success ? validatedResult.data : null,
    tasks: tasksQuery.data ?? [],
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await verifyProjectAccess(projectId);
  if (!access) {
    return NextResponse.json({ error: "無法存取此製作工作。" }, { status: 403 });
  }

  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "儲存內容格式不正確。", issues: payload.error.issues },
      { status: 400 },
    );
  }

  if (payload.data.action === "record-feedback") {
    await recordStyleFeedback({
      userId: access.user.id,
      projectId,
      styleProfileId: access.project.style_profile_id,
      originalSuggestion: payload.data.originalSuggestion,
      userAction: payload.data.userAction,
      finalChoice: payload.data.finalChoice,
      feedbackType: payload.data.feedbackType,
    });
    return NextResponse.json({ saved: true });
  }

  if (payload.data.action === "select-versions") {
    const { error } = await access.supabase
      .from("projects")
      .update({
        selected_copy_version: payload.data.copyVersion,
        selected_editing_version: payload.data.editingVersion,
        selected_cover_text: payload.data.coverText,
      })
      .eq("id", projectId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await recordStyleFeedback({
      userId: access.user.id,
      projectId,
      styleProfileId: access.project.style_profile_id,
      originalSuggestion: {
        copyVersion: access.project.selected_copy_version,
        editingVersion: access.project.selected_editing_version,
        coverText: access.project.selected_cover_text,
      },
      userAction: "採用內容版本",
      finalChoice: {
        copyVersion: payload.data.copyVersion,
        editingVersion: payload.data.editingVersion,
        coverText: payload.data.coverText,
      },
      feedbackType: payload.data.coverText
        ? "cover_selected"
        : "version_selected",
    });
    return NextResponse.json({ saved: true });
  }

  const { data: latest, error: latestError } = await access.supabase
    .from("ai_results")
    .select("id,content")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (latestError || !latest) {
    return NextResponse.json({ error: "找不到可編輯的分析結果。" }, { status: 404 });
  }

  const original = generatedContentSchema.safeParse(latest.content);
  if (!original.success) {
    return NextResponse.json({ error: "原始分析結果格式不正確。" }, { status: 409 });
  }
  const feedbackItems: Array<{
    originalSuggestion: unknown;
    userAction: string;
    finalChoice: unknown;
    feedbackType: string;
  }> = [];
  payload.data.result.copyVariants.forEach((variant) => {
    const before = original.data.copyVariants.find((item) => item.id === variant.id);
    if (before && before.content !== variant.content) {
      feedbackItems.push({
        originalSuggestion: before.content,
        userAction: "修改文案",
        finalChoice: variant.content,
        feedbackType: "copy_edit",
      });
    }
  });
  payload.data.result.titles.forEach((title, index) => {
    if (title !== original.data.titles[index]) {
      feedbackItems.push({
        originalSuggestion: original.data.titles[index],
        userAction: "改寫標題",
        finalChoice: title,
        feedbackType: "title_edit",
      });
    }
  });
  payload.data.result.editingScripts.forEach((script) => {
    const before = original.data.editingScripts.find((item) => item.id === script.id);
    if (!before) return;
    const fields = [
      ["subtitleStyle", "修改字幕樣式", "subtitle_style"],
      ["editingPace", "修改影片節奏", "editing_pace"],
      ["callToAction", "變更 CTA", "cta_edit"],
      ["logoPosition", "調整 Logo 位置", "logo_position"],
    ] as const;
    fields.forEach(([field, action, feedbackType]) => {
      if (before[field] !== script[field]) {
        feedbackItems.push({
          originalSuggestion: before[field],
          userAction: action,
          finalChoice: script[field],
          feedbackType,
        });
      }
    });
    const beforeRanges = before.segments.map((segment) => [
      segment.startSeconds,
      segment.endSeconds,
    ]);
    const afterRanges = script.segments.map((segment) => [
      segment.startSeconds,
      segment.endSeconds,
    ]);
    if (JSON.stringify(beforeRanges) !== JSON.stringify(afterRanges)) {
      feedbackItems.push({
        originalSuggestion: beforeRanges,
        userAction:
          script.segments.length < before.segments.length
            ? "拒絕片段"
            : "調整剪輯順序",
        finalChoice: afterRanges,
        feedbackType:
          script.segments.length < before.segments.length
            ? "segment_removed"
            : "segment_order",
      });
    }
  });

  const { error } = await access.supabase
    .from("ai_results")
    .update({ content: payload.data.result })
    .eq("id", latest.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  for (const item of feedbackItems) {
    await recordStyleFeedback({
      userId: access.user.id,
      projectId,
      styleProfileId: access.project.style_profile_id,
      ...item,
    });
  }

  return NextResponse.json({ saved: true });
}
