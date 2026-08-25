import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { advertiserInputSchema } from "@/types/ads";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { data, error } = await createAdminClient()
    .from("advertisers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ advertisers: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ advertisers: data ?? [] });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const payload = advertiserInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "廣告主資料不完整。" }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from("advertisers")
    .insert({
      name: payload.data.name,
      logo: payload.data.logo ?? null,
      contact_name: payload.data.contactName,
      phone: payload.data.phone,
      email: payload.data.email,
      website: payload.data.website ?? null,
      notes: payload.data.notes,
      status: payload.data.status,
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingRelation(error)) {
      return NextResponse.json(
        { error: "請先執行廣告系統 migration。" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ advertiser: data }, { status: 201 });
}
