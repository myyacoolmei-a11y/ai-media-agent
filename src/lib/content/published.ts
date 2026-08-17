import { serializePublicContent } from "@/lib/content/public-query";
import { isVideoStory } from "@/lib/content/video";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem, PublicContentItem } from "@/types/content";

export async function listPublishedStories(options: {
  limit?: number;
  videosOnly?: boolean;
} = {}): Promise<PublicContentItem[]> {
  try {
    const limit = options.limit ?? 30;
    const { data, error } = await createAdminClient()
      .from("content_items")
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(options.videosOnly ? 80 : limit);

    if (error) {
      console.error("Failed to list published stories", error.message);
      return [];
    }

    const items = await Promise.all(
      ((data ?? []) as ContentItem[]).map(serializePublicContent),
    );
    if (options.videosOnly) {
      return items.filter(isVideoStory).slice(0, limit);
    }
    return items;
  } catch (error) {
    console.error("Failed to list published stories", error);
    return [];
  }
}

export async function getPublishedStory(slug: string) {
  try {
    const { data, error } = await createAdminClient()
      .from("content_items")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return serializePublicContent(data as ContentItem);
  } catch (error) {
    console.error("Failed to load published story", error);
    return null;
  }
}
