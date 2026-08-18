import { articlePermalink } from "@/lib/social/config";
import { getSocialPublisher } from "@/lib/social/registry";
import {
  getSocialPublication,
  markSocialFailed,
  markSocialPublished,
  markSocialPublishing,
  upsertSocialDraft,
} from "@/lib/social/store";
import type { SocialPlatform, SocialPublication } from "@/types/social";
import type { ContentItem } from "@/types/content";

export async function publishOnePlatform(input: {
  userId: string;
  content: ContentItem;
  platform: SocialPlatform;
  text: string;
  mediaUrl?: string | null;
}): Promise<SocialPublication> {
  const row = await upsertSocialDraft({
    userId: input.userId,
    contentId: input.content.id,
    platform: input.platform,
    socialText: input.text,
    mediaUrl: input.mediaUrl ?? input.content.cover_image ?? null,
    status: "queued",
  });
  const publishing = await markSocialPublishing(row.id, input.userId);
  const current = publishing ?? row;
  const publisher = getSocialPublisher(input.platform);
  const result = await publisher.publish({
    text: input.text,
    mediaUrl: input.mediaUrl ?? input.content.cover_image ?? input.content.video_url,
    articleUrl: articlePermalink(input.content.slug),
    title: input.content.title,
    hasVideo: Boolean(input.content.video_url) || input.content.content_type === "video",
  });
  if (result.ok) {
    return (
      (await markSocialPublished(current.id, input.userId, {
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
      })) ?? current
    );
  }
  return (
    (await markSocialFailed(
      current.id,
      input.userId,
      result.error || "發布失敗",
    )) ?? current
  );
}

export async function republishPublication(
  id: string,
  userId: string,
  content: ContentItem,
) {
  const row = await getSocialPublication(id, userId);
  if (!row) return null;
  return publishOnePlatform({
    userId,
    content,
    platform: row.platform,
    text: row.social_text,
    mediaUrl: row.media_url ?? content.cover_image,
  });
}
