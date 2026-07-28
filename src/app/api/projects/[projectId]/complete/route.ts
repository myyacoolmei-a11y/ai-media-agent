import path from "node:path";

import { after, NextResponse } from "next/server";

import {
  createAnalysisTasks,
  processProject,
} from "@/lib/jobs/process-project";
import { verifyProjectAccess } from "@/lib/jobs/access";

export const maxDuration = 900;

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await verifyProjectAccess(projectId);

  if (!access) {
    return NextResponse.json({ error: "無法存取此製作工作。" }, { status: 403 });
  }

  if (
    access.project.status === "processing" ||
    access.project.status === "completed"
  ) {
    return NextResponse.json({ projectId, status: access.project.status });
  }

  const { data: media, error: mediaError } = await access.supabase
    .from("media")
    .select("*")
    .eq("project_id", projectId)
    .single();
  if (mediaError || !media) {
    return NextResponse.json({ error: "找不到上傳素材。" }, { status: 404 });
  }

  const folder = path.posix.dirname(media.storage_path);
  const fileName = path.posix.basename(media.storage_path);
  const { data: objects, error: storageError } = await access.supabase.storage
    .from("project-media")
    .list(folder, { search: fileName, limit: 1 });

  if (storageError || !objects?.some((object) => object.name === fileName)) {
    return NextResponse.json(
      { error: "影片尚未成功儲存，請重新上傳。" },
      { status: 409 },
    );
  }

  await createAnalysisTasks(projectId, access.user.id);
  await access.supabase
    .from("projects")
    .update({ status: "processing", error: null })
    .eq("id", projectId);

  after(() => processProject(projectId));

  return NextResponse.json({ projectId, status: "processing" }, { status: 202 });
}
