import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyContentAccess } from "@/lib/content/access";
import { publishOnePlatform } from "@/lib/social/publish-one";
import { socialPlatformSchema } from "@/types/social";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

const bodySchema = z.object({
  platforms: z.array(socialPlatformSchema).min(1).max(4),
  drafts: z
    .object({
      facebook: z.string().max(8000).optional(),
      instagram: z.string().max(4000).optional(),
      threads: z.string().max(2000).optional(),
      tiktok: z.string().max(4000).optional(),
    })
    .optional(),
  mediaUrl: z.string().max(2000).nullable().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (access.content.status !== "published") {
    return NextResponse.json(
      { error: "請先發布 NEWS風曝，再同步社群。網站狀態不會因社群失敗而回滾。" },
      { status: 409 },
    );
  }
  const payload = bodySchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "請至少選擇一個社群平台。" }, { status: 400 });
  }

  const publications = [];
  for (const platform of payload.data.platforms) {
    publications.push(
      await publishOnePlatform({
        userId: access.user.id,
        content: access.content,
        platform,
        text: payload.data.drafts?.[platform] ?? "",
        mediaUrl:
          payload.data.mediaUrl ??
          access.content.video_url ??
          access.content.cover_image,
      }),
    );
  }
  return NextResponse.json({ publications });
}
