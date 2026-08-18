import { createAdminClient } from "@/lib/supabase/admin";
import { isPreviewDemo } from "@/lib/preview";
import type {
  SocialPlatform,
  SocialPublication,
  SocialPublicationStatus,
} from "@/types/social";

export type SocialListFilter = {
  userId: string;
  contentId?: string;
  platform?: SocialPlatform;
  status?: SocialPublicationStatus | "pending" | "success";
};

export const PREVIEW_SOCIAL_DB_BLOCKED =
  "Preview 不會寫入 production social_publications。請在 production 後台操作真實報導。";

function assertSocialDatabase() {
  if (isPreviewDemo()) {
    throw new Error(PREVIEW_SOCIAL_DB_BLOCKED);
  }
}

export async function listSocialPublications(
  filter: SocialListFilter,
): Promise<SocialPublication[]> {
  if (isPreviewDemo()) return [];

  const supabase = createAdminClient();
  let query = supabase
    .from("social_publications")
    .select("*, content_items(title)")
    .eq("user_id", filter.userId)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (filter.contentId) query = query.eq("content_item_id", filter.contentId);
  if (filter.platform) query = query.eq("platform", filter.platform);
  if (filter.status === "success") query = query.eq("status", "published");
  else if (filter.status === "pending") {
    query = query.in("status", ["draft", "queued", "publishing"]);
  } else if (filter.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<SocialPublication & { content_items?: { title?: string } }>).map(
    (row) => ({
      ...row,
      content_title: row.content_items?.title,
    }),
  );
}

export async function getSocialPublication(id: string, userId: string) {
  if (isPreviewDemo()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_publications")
    .select("*, content_items(title)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as SocialPublication & { content_items?: { title?: string } };
  return { ...row, content_title: row.content_items?.title };
}

export async function upsertSocialDraft(input: {
  userId: string;
  contentId: string;
  platform: SocialPlatform;
  socialText: string;
  mediaUrl?: string | null;
  status?: SocialPublicationStatus;
}) {
  assertSocialDatabase();
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("social_publications")
    .select("id")
    .eq("content_item_id", input.contentId)
    .eq("platform", input.platform)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      social_text: input.socialText,
      media_url: input.mediaUrl ?? null,
    };
    if (input.status) {
      patch.status = input.status;
      if (input.status !== "failed") patch.error_message = null;
    }
    const { data, error } = await supabase
      .from("social_publications")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as SocialPublication;
  }

  const { data, error } = await supabase
    .from("social_publications")
    .insert({
      user_id: input.userId,
      content_item_id: input.contentId,
      platform: input.platform,
      social_text: input.socialText,
      media_url: input.mediaUrl ?? null,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SocialPublication;
}

export async function markSocialPublishing(id: string, userId: string) {
  return updateSocialPublication(id, userId, {
    status: "publishing",
    error_message: null,
  });
}

export async function markSocialPublished(
  id: string,
  userId: string,
  result: { externalPostId?: string | null; externalUrl?: string | null },
) {
  return updateSocialPublication(id, userId, {
    status: "published",
    error_message: null,
    external_post_id: result.externalPostId ?? null,
    external_url: result.externalUrl ?? null,
    published_at: new Date().toISOString(),
  });
}

export async function markSocialFailed(
  id: string,
  userId: string,
  errorMessage: string,
) {
  return updateSocialPublication(id, userId, {
    status: "failed",
    error_message: errorMessage,
  });
}

export async function updateSocialPublication(
  id: string,
  userId: string,
  patch: Partial<
    Pick<
      SocialPublication,
      | "social_text"
      | "media_url"
      | "status"
      | "external_post_id"
      | "external_url"
      | "error_message"
      | "published_at"
    >
  >,
) {
  assertSocialDatabase();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_publications")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SocialPublication;
}
