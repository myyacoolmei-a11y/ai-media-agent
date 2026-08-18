import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { verifyStyleAccess } from "@/lib/style/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandStyleInputSchema } from "@/types/style";

type RouteContext = {
  params: Promise<{ styleId: string }>;
};

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), style: brandStyleInputSchema }),
  z.object({
    action: z.literal("duplicate"),
    styleName: z.string().trim().min(2).max(100),
  }),
  z.object({ action: z.literal("reset-learning") }),
]);

export async function GET(_request: Request, context: RouteContext) {
  const { styleId } = await context.params;
  const access = await verifyStyleAccess(styleId);
  if (!access) {
    return NextResponse.json({ error: "找不到此風格。" }, { status: 404 });
  }
  const [feedbackQuery, suggestionsQuery] = await Promise.all([
    access.supabase
      .from("style_feedback")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", access.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    access.supabase
      .from("preference_suggestions")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", access.user.id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    style: access.style,
    feedback: feedbackQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const { styleId } = await context.params;
  const access = await verifyStyleAccess(styleId);
  if (!access) {
    return NextResponse.json({ error: "找不到此風格。" }, { status: 404 });
  }
  const payload = actionSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "操作資料不正確。" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const existing = access.style;

  if (payload.data.action === "update") {
    const { data, error } = await supabase
      .from("brand_style_profiles")
      .update(payload.data.style)
      .eq("id", styleId)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ style: data });
  }

  if (payload.data.action === "duplicate") {
    const styleFields = brandStyleInputSchema.parse(existing);
    const { data, error } = await supabase
      .from("brand_style_profiles")
      .insert({
        ...styleFields,
        user_id: user.id,
        brand_id: existing.brand_id ?? access.context.brand.id,
        style_name: payload.data.styleName,
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ style: data }, { status: 201 });
  }

  await Promise.all([
    supabase
      .from("style_feedback")
      .delete()
      .eq("style_profile_id", styleId)
      .eq("user_id", user.id),
    supabase
      .from("preference_suggestions")
      .delete()
      .eq("style_profile_id", styleId)
      .eq("user_id", user.id),
  ]);
  return NextResponse.json({ reset: true });
}
