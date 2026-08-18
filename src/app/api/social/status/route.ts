import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { socialPlatformLabels } from "@/lib/social/platforms";
import { listSocialPublishers } from "@/lib/social/registry";
import type { SocialConnection } from "@/types/social";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const connections: SocialConnection[] = [];
  for (const publisher of listSocialPublishers()) {
    const status = await publisher.getConnection();
    connections.push({
      platform: publisher.platform,
      connected: status.connected,
      label: socialPlatformLabels[publisher.platform],
      reason: status.connected
        ? status.accountName ?? "已連線"
        : status.reason ?? "尚未連線",
      state: status.state,
      adapter: "official_api",
      accountName: status.accountName ?? null,
      missingEnv: status.missingEnv ?? [],
    });
  }
  return NextResponse.json({ connections });
}
