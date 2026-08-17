import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyContentAccess } from "@/lib/content/access";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const statusSchema = z.object({
  status: z.enum(["draft", "preview", "published"]),
});

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const payload = statusSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "狀態不正確。" }, { status: 400 });
  }

  if (
    payload.data.status === "published" &&
    (!access.content.title.trim() ||
      !access.content.summary.trim() ||
      !access.content.content.trim())
  ) {
    return NextResponse.json(
      { error: "發布前必須完成標題、摘要與內容。" },
      { status: 400 },
    );
  }

  const { data: latestRevision } = await access.supabase
    .from("content_revisions")
    .select("version")
    .eq("content_item_id", contentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latestRevision?.version ?? 0) + 1;
  const { error: revisionError } = await access.supabase
    .from("content_revisions")
    .insert({
      user_id: access.user.id,
      content_item_id: contentId,
      version,
      snapshot: access.content,
    });
  if (revisionError) {
    return NextResponse.json(
      { error: `無法建立內容版本：${revisionError.message}` },
      { status: 500 },
    );
  }

  const { data, error } = await access.supabase
    .from("content_items")
    .update({
      status: payload.data.status,
      published_at:
        payload.data.status === "published"
          ? access.content.published_at ?? new Date().toISOString()
          : access.content.published_at,
    })
    .eq("id", contentId)
    .eq("user_id", access.user.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ content: data });
}
