import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyProjectAccess } from "@/lib/jobs/access";
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
  }),
]);

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await verifyProjectAccess(projectId);
  if (!access) {
    return NextResponse.json({ error: "無法存取此製作工作。" }, { status: 403 });
  }

  const [mediaQuery, tasksQuery, resultQuery] = await Promise.all([
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
      brief: access.project.brief,
      aiTaskSummary: access.project.ai_task_summary,
      selectedCopyVersion: access.project.selected_copy_version,
      selectedEditingVersion: access.project.selected_editing_version,
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

  if (payload.data.action === "select-versions") {
    const { error } = await access.supabase
      .from("projects")
      .update({
        selected_copy_version: payload.data.copyVersion,
        selected_editing_version: payload.data.editingVersion,
      })
      .eq("id", projectId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ saved: true });
  }

  const { data: latest, error: latestError } = await access.supabase
    .from("ai_results")
    .select("id")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (latestError || !latest) {
    return NextResponse.json({ error: "找不到可編輯的分析結果。" }, { status: 404 });
  }

  const { error } = await access.supabase
    .from("ai_results")
    .update({ content: payload.data.result })
    .eq("id", latest.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
