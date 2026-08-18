import OpenAI from "openai";
import { z } from "zod";

import { SITE_NAME } from "@/lib/brand";
import { articlePermalink } from "@/lib/social/config";
import type { SocialCopySet } from "@/types/social";

const copySchema = z.object({
  facebook: z.string().min(1),
  instagram: z.string().min(1),
  threads: z.string().min(1),
  tiktok: z.string().nullable(),
});

export type SocialCopyInput = {
  title: string;
  summary: string;
  content: string;
  slug?: string;
  hashtags?: string[];
  seoKeywords?: string;
  hasVideo?: boolean;
  articleUrl?: string;
};

function fallbackCopy(input: SocialCopyInput): SocialCopySet {
  const url = input.articleUrl || articlePermalink(input.slug ?? "");
  const tags = (input.hashtags ?? [])
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 8)
    .join(" ");
  const summary = (input.summary || input.content).replace(/\s+/g, " ").trim();
  const short = summary.slice(0, 180);
  return {
    facebook: [
      input.title,
      "",
      short,
      "",
      `閱讀完整報導：${url || `${SITE_NAME}官網`}`,
    ].join("\n"),
    instagram: [
      input.title,
      "",
      short.slice(0, 120),
      "",
      tags || `#${SITE_NAME} #地方新聞`,
    ].join("\n"),
    threads: [
      `${input.title.replace(/。+$/, "")}。`,
      short.slice(0, 90),
      url ? `完整內容：${url}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    tiktok: input.hasVideo
      ? [`${input.title}`, short.slice(0, 80), tags || "#新聞 #現場"].join("\n")
      : null,
  };
}

export async function generateSocialCopy(
  input: SocialCopyInput,
): Promise<SocialCopySet> {
  const fallback = fallbackCopy(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const url = input.articleUrl || articlePermalink(input.slug ?? "");
  const client = new OpenAI({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "你是繁體中文媒體社群編輯，為 NEWS風曝 依平台改寫文案。",
            "不要把正式新聞全文複製到社群。",
            "只根據提供的報導改寫，不得捏造事實。",
            "輸出 JSON：facebook、instagram、threads、tiktok。",
            "facebook：含新聞標題、100-200字摘要、CTA，並附文章連結。",
            "instagram：精簡有吸引力，含 hashtag；不要把外部連結當主要閱讀方式。",
            "threads：自然短句、觀點型，可附文章連結。",
            "tiktok：若 hasVideo 為 false，tiktok 必須是 null；若為 true，給短影音標題、說明與 hashtag。",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            site: SITE_NAME,
            title: input.title,
            summary: input.summary,
            content: input.content.slice(0, 6000),
            hashtags: input.hashtags ?? [],
            seoKeywords: input.seoKeywords ?? "",
            hasVideo: Boolean(input.hasVideo),
            articleUrl: url,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = copySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback;
    return {
      ...parsed.data,
      tiktok: input.hasVideo ? parsed.data.tiktok : null,
    };
  } catch {
    return fallback;
  }
}
