import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { data, error } = await createAdminClient()
    .from("ad_placements")
    .select("*")
    .order("code", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ placements: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ placements: data ?? [] });
}
