import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandStyleInputSchema } from "@/types/style";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  if (isPreviewDemo()) {
    return NextResponse.json({ styles: [] });
  }

  const { data, error } = await createAdminClient()
    .from("brand_style_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ styles: data ?? [] });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const payload = brandStyleInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "風格資料不完整。", issues: payload.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_style_profiles")
    .insert({ ...payload.data, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.code === "23505" ? "已有相同名稱的風格。" : error.message,
      },
      { status: 500 },
    );
  }

  await supabase.from("personal_editors").upsert(
    { user_id: user.id, active_style_profile_id: data.id },
    { onConflict: "user_id" },
  );
  return NextResponse.json({ style: data }, { status: 201 });
}
