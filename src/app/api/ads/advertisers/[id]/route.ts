import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { advertiserInputSchema } from "@/types/ads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { id } = await context.params;
  const payload = advertiserInputSchema.partial().safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "廣告主資料不完整。" }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from("advertisers")
    .update({
      ...(payload.data.name ? { name: payload.data.name } : {}),
      ...(payload.data.logo !== undefined ? { logo: payload.data.logo } : {}),
      ...(payload.data.contactName !== undefined
        ? { contact_name: payload.data.contactName }
        : {}),
      ...(payload.data.phone !== undefined ? { phone: payload.data.phone } : {}),
      ...(payload.data.email !== undefined ? { email: payload.data.email } : {}),
      ...(payload.data.website !== undefined ? { website: payload.data.website } : {}),
      ...(payload.data.notes !== undefined ? { notes: payload.data.notes } : {}),
      ...(payload.data.status ? { status: payload.data.status } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advertiser: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { id } = await context.params;
  z.string().uuid().parse(id);
  const { error } = await createAdminClient().from("advertisers").delete().eq("id", id);
  if (error) {
    if (isMissingRelation(error)) return NextResponse.json({ deleted: false }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
