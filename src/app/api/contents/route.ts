import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contentInputSchema,
  contentStatusSchema,
  contentTypeSchema,
} from "@/types/content";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = contentStatusSchema.safeParse(url.searchParams.get("status"));
  const type = contentTypeSchema.safeParse(url.searchParams.get("type"));
  const search = url.searchParams.get("search")?.trim();
  let query = createAdminClient()
    .from("content_items")
    .select(
      "id,title,slug,summary,category,content_type,status,published_at,updated_at,cover_asset_id",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (status.success) query = query.eq("status", status.data);
  if (type.success) query = query.eq("content_type", type.data);
  if (search) query = query.ilike("title", `%${search.replace(/[%_]/g, "")}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ contents: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const payload = contentInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "內容資料不完整。", issues: payload.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  if (payload.data.styleProfileId) {
    const { data: style } = await supabase
      .from("brand_style_profiles")
      .select("id")
      .eq("id", payload.data.styleProfileId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!style) {
      return NextResponse.json({ error: "品牌風格不存在。" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      user_id: user.id,
      title: payload.data.title,
      slug: payload.data.slug,
      summary: payload.data.summary,
      content: payload.data.content,
      video_url: payload.data.videoUrl || null,
      category: payload.data.category,
      content_type: payload.data.contentType,
      style_profile_id: payload.data.styleProfileId,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "這個網址代稱已被使用，請換一個 slug。"
            : error.message,
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }
  return NextResponse.json({ content: data }, { status: 201 });
}
