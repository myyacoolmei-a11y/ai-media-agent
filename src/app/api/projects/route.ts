import path from "node:path";

import { NextResponse } from "next/server";

import { createAccessToken, setProjectAccessCookie } from "@/lib/jobs/access";
import { getProviderStatus } from "@/lib/providers/config";
import { SupabaseMediaStorageProvider } from "@/lib/providers/supabase-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadRequestSchema } from "@/types/analysis";

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export async function POST(request: Request) {
  const providerStatus = getProviderStatus();
  if (!providerStatus.configured) {
    return NextResponse.json(
      {
        error: providerStatus.message,
        missing: providerStatus.missing,
      },
      { status: 503 },
    );
  }

  const parsed = uploadRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "影片格式或製作需求不正確。", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (!allowedVideoTypes.has(parsed.data.file.type)) {
    return NextResponse.json(
      { error: "影片格式或製作需求不正確。" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const storage = new SupabaseMediaStorageProvider();
  const projectId = crypto.randomUUID();
  const mediaId = crypto.randomUUID();
  const { token, hash } = createAccessToken();
  const extension =
    path.extname(parsed.data.file.name).toLowerCase().replace(/[^.\w]/g, "") ||
    ".mp4";
  const storagePath = `anonymous/${projectId}/source${extension}`;

  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    user_id: null,
    name: parsed.data.file.name,
    description: parsed.data.brief.originalRequest,
    status: "uploading",
    brief: parsed.data.brief,
    access_token_hash: hash,
  });
  if (projectError) {
    return NextResponse.json(
      { error: `無法建立製作工作：${projectError.message}` },
      { status: 500 },
    );
  }

  const { error: mediaError } = await supabase.from("media").insert({
    id: mediaId,
    project_id: projectId,
    type: "video",
    file_name: parsed.data.file.name,
    storage_path: storagePath,
    mime_type: parsed.data.file.type,
    size_bytes: parsed.data.file.size,
  });
  if (mediaError) {
    await supabase.from("projects").delete().eq("id", projectId);
    return NextResponse.json(
      { error: `無法建立素材資料：${mediaError.message}` },
      { status: 500 },
    );
  }

  try {
    const upload = await storage.createUpload(storagePath);
    const response = NextResponse.json(
      {
        projectId,
        upload: {
          bucket: upload.bucket,
          path: upload.path,
          token: upload.token,
        },
      },
      { status: 201 },
    );
    setProjectAccessCookie(response, projectId, token);
    return response;
  } catch (error) {
    await supabase.from("projects").delete().eq("id", projectId);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "無法準備影片上傳。",
      },
      { status: 500 },
    );
  }
}
