export const MEDIA_CATEGORIES = [
  "政治",
  "財經",
  "社會",
  "國際",
  "生活",
  "科技",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const DEFAULT_CATEGORY: MediaCategory = "政治";

export const publicNavItems = [
  { href: "/", label: "首頁" },
  { href: "/news", label: "最新" },
  ...MEDIA_CATEGORIES.map((category) => ({
    href: `/news?category=${encodeURIComponent(category)}`,
    label: category,
    category,
  })),
  { href: "/video", label: "影音" },
];

export function displayCategory(category: string | null | undefined) {
  if (!category || category === "未分類") return "報導";
  return category;
}
