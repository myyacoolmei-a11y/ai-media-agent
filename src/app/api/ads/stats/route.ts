import { NextResponse } from "next/server";

import { getAdStats } from "@/lib/ads/serve";
import { getAuthenticatedUser } from "@/lib/jobs/access";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  try {
    const stats = await getAdStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "無法讀取成效。" },
      { status: 500 },
    );
  }
}
