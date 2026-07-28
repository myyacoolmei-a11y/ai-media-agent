import { after, NextResponse } from "next/server";
import { z } from "zod";

import { verifyProjectAccess } from "@/lib/jobs/access";
import {
  createAnalysisTasks,
  processProject,
} from "@/lib/jobs/process-project";
import { productionBriefSchema } from "@/types/analysis";

export const maxDuration = 900;

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

const regenerateSchema = z.object({
  instruction: z.string().trim().max(2000).default(""),
});

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await verifyProjectAccess(projectId);
  if (!access) {
    return NextResponse.json({ error: "無法存取此製作工作。" }, { status: 403 });
  }
  if (access.project.status === "processing") {
    return NextResponse.json({ error: "內容正在產生中。" }, { status: 409 });
  }

  const payload = regenerateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "調整需求格式不正確。" }, { status: 400 });
  }

  const brief = productionBriefSchema.parse(access.project.brief);
  const nextBrief = {
    ...brief,
    additionalNotes: [brief.additionalNotes, payload.data.instruction]
      .filter(Boolean)
      .join("\n"),
  };
  await access.supabase
    .from("projects")
    .update({ brief: nextBrief, status: "processing", error: null })
    .eq("id", projectId);
  await createAnalysisTasks(projectId);

  after(() => processProject(projectId, { reuseTranscript: true }));

  return NextResponse.json({ status: "processing" }, { status: 202 });
}
