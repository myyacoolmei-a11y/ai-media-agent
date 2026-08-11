import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyProjectAccess } from "@/lib/jobs/access";
import { generatedContentSchema } from "@/types/analysis";

const importSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(request: Request) {
  const payload = importSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Project ID 不正確。" }, { status: 400 });
  }
  const access = await verifyProjectAccess(payload.data.projectId);
  if (!access) {
    return NextResponse.json({ error: "找不到 Project 或沒有權限。" }, { status: 404 });
  }
  const { data: existing } = await access.supabase
    .from("content_items")
    .select("*")
    .eq("project_id", payload.data.projectId)
    .eq("user_id", access.user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ content: existing });
  }
  const { data: aiResult } = await access.supabase
    .from("ai_results")
    .select("content")
    .eq("project_id", payload.data.projectId)
    .eq("user_id", access.user.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  const generated = generatedContentSchema.safeParse(aiResult?.content);
  const preferred = generated.success
    ? generated.data.copyVariants.find(
        (variant) => variant.id === "professional",
      ) ?? generated.data.copyVariants[0]
    : null;
  const id = crypto.randomUUID();
  const { data, error } = await access.supabase
    .from("content_items")
    .insert({
      id,
      user_id: access.user.id,
      project_id: payload.data.projectId,
      style_profile_id: access.project.style_profile_id,
      title: generated.success
        ? generated.data.titles[0]
        : access.project.name,
      slug: `content-${id.slice(0, 8)}`,
      summary: generated.success
        ? generated.data.summary.join(" ")
        : access.project.brief?.originalRequest || "",
      content: preferred?.content ?? "",
      video_url: null,
      category: access.project.brief?.purpose || "未分類",
      content_type: "video",
      status: "draft",
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: projectMedia } = await access.supabase
    .from("media")
    .select("*")
    .eq("project_id", payload.data.projectId)
    .eq("user_id", access.user.id)
    .order("created_at", { ascending: true });
  if (projectMedia?.length) {
    await access.supabase.from("content_assets").insert(
      projectMedia.map((media, index) => ({
        user_id: access.user.id,
        content_item_id: id,
        asset_type:
          media.type === "image"
            ? "image"
            : media.type === "audio"
              ? "audio"
              : "video",
        status: "ready",
        bucket: "project-media",
        storage_path: media.storage_path,
        file_name: media.file_name,
        mime_type: media.mime_type,
        size_bytes: media.size_bytes,
        duration_seconds: media.duration_seconds,
        sort_order: index,
      })),
    );
  }
  return NextResponse.json({ content: data }, { status: 201 });
}
