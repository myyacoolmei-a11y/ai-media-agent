import { legacyLabelsForSection, storyMatchesTaxonomy } from "@/lib/content/categories";
import { listPreviewDemoStories, getPreviewDemoStory } from "@/lib/content/preview-demo";
import { serializePublicContent } from "@/lib/content/public-query";
import { isVideoStory } from "@/lib/content/video";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem, PublicContentItem } from "@/types/content";

export type PublishedStoryQuery = {
  limit?: number;
  videosOnly?: boolean;
  category?: string;
  section?: string;
  topic?: string;
};

export async function listPublishedStories(
  options: PublishedStoryQuery = {},
): Promise<PublicContentItem[]> {
  if (isPreviewDemo()) {
    return listPreviewDemoStories(options);
  }
  try {
    const limit = options.limit ?? 30;
    let query = createAdminClient()
      .from("content_items")
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(options.videosOnly || options.section ? 80 : limit);

    if (options.topic && options.section) {
      query = query.eq("category", `${options.section}/${options.topic}`);
    } else if (options.section) {
      const legacy = legacyLabelsForSection(options.section);
      const parts = [
        `category.eq.${options.section}`,
        `category.like.${options.section}/%`,
        ...legacy.map((label) => `category.eq.${label}`),
      ];
      query = query.or(parts.join(","));
    } else if (options.category) {
      query = query.eq("category", options.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to list published stories", error.message);
      return [];
    }

    const items = await Promise.all(
      ((data ?? []) as ContentItem[]).map(serializePublicContent),
    );
    const matched = items.filter((item) =>
      storyMatchesTaxonomy(item.category, options),
    );
    if (options.videosOnly) {
      return matched.filter(isVideoStory).slice(0, limit);
    }
    return matched.slice(0, limit);
  } catch (error) {
    console.error("Failed to list published stories", error);
    return [];
  }
}

export async function getPublishedStory(slug: string) {
  if (isPreviewDemo()) {
    return getPreviewDemoStory(slug);
  }
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
