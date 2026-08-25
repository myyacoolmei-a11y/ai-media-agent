import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo } from "@/lib/preview";
import { republishPublication } from "@/lib/social/publish-one";
import { PREVIEW_SOCIAL_DB_BLOCKED, getSocialPublication } from "@/lib/social/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) {
    return NextResponse.json({ error: PREVIEW_SOCIAL_DB_BLOCKED }, { status: 403 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const { id } = await context.params;
  const row = await getSocialPublication(id, user.id);
  if (!row) {
    return NextResponse.json({ error: "找不到社群發布紀錄。" }, { status: 404 });
  }
  if (row.platform === "threads" || row.platform === "tiktok") {
    return NextResponse.json(
      { error: "Threads / TikTok 這階段尚未啟用。" },
      { status: 409 },
    );
  }
  const access = await verifyContentAccess(row.content_item_id);
  if (!access) {
    return NextResponse.json({ error: "找不到對應報導。" }, { status: 404 });
  }
  if (access.content.status !== "published") {
    return NextResponse.json(
      { error: "請先發布 NEWS風曝，再同步社群。" },
      { status: 409 },
    );
  }
  const publication = await republishPublication(id, user.id, access.content);
  return NextResponse.json({ publication });
}
