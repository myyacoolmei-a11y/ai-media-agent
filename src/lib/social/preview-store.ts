import type {
  SocialPlatform,
  SocialPublication,
  SocialPublicationStatus,
} from "@/types/social";

const rows = new Map<string, SocialPublication>();

function nowIso() {
  return new Date().toISOString();
}

export type SocialListFilter = {
  userId?: string;
  contentId?: string;
  platform?: SocialPlatform;
  status?: SocialPublicationStatus | "pending" | "success";
};

function matches(row: SocialPublication, filter: SocialListFilter) {
  if (filter.userId && row.user_id !== filter.userId) return false;
  if (filter.contentId && row.content_item_id !== filter.contentId) return false;
  if (filter.platform && row.platform !== filter.platform) return false;
  if (filter.status === "success") return row.status === "published";
  if (filter.status === "pending") {
    return (
      row.status === "draft" ||
      row.status === "queued" ||
      row.status === "publishing"
    );
  }
  if (filter.status && row.status !== filter.status) return false;
  return true;
}

export function listPreviewSocialPublications(
  filter: SocialListFilter = {},
): SocialPublication[] {
  return [...rows.values()]
    .filter((row) => matches(row, filter))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getPreviewSocialPublication(id: string) {
  return rows.get(id) ?? null;
}

export function upsertPreviewSocialPublication(input: {
  userId: string;
  contentId: string;
  platform: SocialPlatform;
  socialText: string;
  mediaUrl?: string | null;
  status?: SocialPublicationStatus;
}): SocialPublication {
  const existing = listPreviewSocialPublications({
    contentId: input.contentId,
    platform: input.platform,
  })[0];
  const timestamp = nowIso();
  const row: SocialPublication = existing
    ? {
        ...existing,
        social_text: input.socialText,
        media_url: input.mediaUrl ?? existing.media_url,
        status: input.status ?? existing.status,
        error_message:
          input.status && input.status !== "failed"
            ? null
            : existing.error_message,
        updated_at: timestamp,
      }
    : {
        id: crypto.randomUUID(),
        user_id: input.userId,
        content_item_id: input.contentId,
        platform: input.platform,
        social_text: input.socialText,
        media_url: input.mediaUrl ?? null,
        status: input.status ?? "draft",
        external_post_id: null,
        external_url: null,
        error_message: null,
        published_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      };
  rows.set(row.id, row);
  return row;
}

export function updatePreviewSocialPublication(
  id: string,
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
  const existing = rows.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updated_at: nowIso() };
  rows.set(id, next);
  return next;
}
