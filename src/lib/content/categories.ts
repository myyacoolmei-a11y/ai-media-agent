export type MediaTopic = {
  slug: string;
  label: string;
};

export type MediaSection = {
  slug: string;
  label: string;
  href: string;
  topics: MediaTopic[];
};

export const MEDIA_SECTIONS: MediaSection[] = [
  {
    slug: "local",
    label: "地方",
    href: "/category/local",
    topics: [
      { slug: "taichung", label: "台中" },
      { slug: "changhua", label: "彰化" },
      { slug: "city", label: "城市焦點" },
      { slug: "community", label: "社區" },
      { slug: "clubs", label: "社團" },
    ],
  },
  {
    slug: "business",
    label: "財經",
    href: "/category/business",
    topics: [],
  },
  {
    slug: "society",
    label: "社會",
    href: "/category/society",
    topics: [],
  },
  {
    slug: "lifestyle",
    label: "生活",
    href: "/category/lifestyle",
    topics: [],
  },
  {
    slug: "technology",
    label: "科技",
    href: "/category/technology",
    topics: [],
  },
  {
    slug: "people",
    label: "人物",
    href: "/category/people",
    topics: [
      { slug: "founders", label: "創業人物" },
      { slug: "corporate", label: "企業人物" },
      { slug: "local-figures", label: "地方人物" },
    ],
  },
  {
    slug: "video",
    label: "影音",
    href: "/video",
    topics: [],
  },
];

const LEGACY_SECTION_LABELS: Record<string, string> = {
  政治: "地方",
  國際: "生活",
};

export function legacyLabelsForSection(sectionLabel: string) {
  return Object.entries(LEGACY_SECTION_LABELS)
    .filter(([, mapped]) => mapped === sectionLabel)
    .map(([from]) => from);
}

export const CATEGORY_PAGES = MEDIA_SECTIONS.filter(
  (section) => section.slug !== "video",
);

export const MEDIA_CATEGORIES = MEDIA_SECTIONS.map((section) => section.label);

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const DEFAULT_CATEGORY: MediaCategory = "地方";

export const publicNavItems = [
  { href: "/", label: "首頁" },
  { href: "/news", label: "最新" },
  ...CATEGORY_PAGES.map((section) => ({
    href: section.href,
    label: section.label,
  })),
  { href: "/video", label: "影音" },
];

export function getSectionBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return MEDIA_SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function getSectionByLabel(label: string | null | undefined) {
  if (!label) return null;
  const mapped = LEGACY_SECTION_LABELS[label] ?? label;
  return MEDIA_SECTIONS.find((section) => section.label === mapped) ?? null;
}

export function getTopicBySlug(section: MediaSection, slug: string | null | undefined) {
  if (!slug) return null;
  return section.topics.find((topic) => topic.slug === slug) ?? null;
}

export function composeCategory(sectionLabel: string, topicLabel?: string | null) {
  if (!topicLabel) return sectionLabel;
  return `${sectionLabel}/${topicLabel}`;
}

export function parseCategory(category: string | null | undefined): {
  section: string;
  topic: string | null;
} {
  if (!category || category === "未分類") {
    return { section: "", topic: null };
  }

  const mapped = LEGACY_SECTION_LABELS[category] ?? category;
  const [rawSection, ...rest] = mapped.split("/");
  const rawTopic = rest.join("/") || null;
  const section = getSectionByLabel(rawSection);
  if (section) {
    const topic = rawTopic
      ? section.topics.find((item) => item.label === rawTopic) ?? null
      : null;
    return { section: section.label, topic: topic?.label ?? rawTopic };
  }

  for (const item of MEDIA_SECTIONS) {
    const topic = item.topics.find(
      (entry) => entry.label === mapped || entry.slug === mapped,
    );
    if (topic) return { section: item.label, topic: topic.label };
  }

  return { section: rawSection, topic: rawTopic };
}

export function displayCategory(category: string | null | undefined) {
  const { section, topic } = parseCategory(category);
  if (!section) return "報導";
  return topic ? `${section} · ${topic}` : section;
}

export function categoryHref(category: string | null | undefined) {
  const { section, topic } = parseCategory(category);
  const match = getSectionByLabel(section);
  if (!match) return "/news";
  if (match.slug === "video") return "/video";
  const topicMatch = topic
    ? match.topics.find((item) => item.label === topic)
    : null;
  if (topicMatch) return `${match.href}?topic=${encodeURIComponent(topicMatch.slug)}`;
  return match.href;
}

export function matchesSection(
  category: string | null | undefined,
  sectionLabel: string,
) {
  return parseCategory(category).section === sectionLabel;
}

export function matchesTopic(
  category: string | null | undefined,
  sectionLabel: string,
  topicLabel: string,
) {
  const parsed = parseCategory(category);
  return parsed.section === sectionLabel && parsed.topic === topicLabel;
}

export function storyMatchesTaxonomy(
  category: string | null | undefined,
  options: {
    category?: string;
    section?: string;
    topic?: string;
  },
) {
  if (options.category) {
    return category === options.category || displayCategory(category) === options.category;
  }
  if (options.section && options.topic) {
    return matchesTopic(category, options.section, options.topic);
  }
  if (options.section) {
    return matchesSection(category, options.section);
  }
  return true;
}

export function localFocusStories<T extends { category: string }>(stories: T[]) {
  const local = getSectionBySlug("local");
  if (!local) return [];
  const club = local.topics.find((topic) => topic.slug === "clubs");
  return stories.filter((story) => {
    const parsed = parseCategory(story.category);
    if (parsed.section !== local.label) return false;
    if (club && parsed.topic === club.label) return false;
    return true;
  });
}
