import path from "node:path";

import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
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
  const extension =
    path.extname(parsed.data.file.name).toLowerCase().replace(/[^.\w]/g, "") ||
    ".mp4";
  const storagePath = `${user.id}/${projectId}/source${extension}`;

  const { data: styleProfile } = await supabase
    .from("brand_style_profiles")
    .select("id,style_name")
    .eq("id", parsed.data.styleProfileId)
    .eq("user_id", user.id)
    .single();
  if (!styleProfile) {
    return NextResponse.json(
      { error: "請選擇有效的品牌風格。" },
      { status: 400 },
    );
  }
  const brief = {
    ...parsed.data.brief,
    style: styleProfile.style_name,
  };

  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    user_id: user.id,
    style_profile_id: styleProfile.id,
    name: parsed.data.file.name,
    description: brief.originalRequest,
    status: "uploading",
    brief,
  });
  if (projectError) {
    return NextResponse.json(
      { error: `無法建立製作工作：${projectError.message}` },
      { status: 500 },
    );
  }

  const { error: mediaError } = await supabase.from("media").insert({
    id: mediaId,
    user_id: user.id,
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
    return NextResponse.json(
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
