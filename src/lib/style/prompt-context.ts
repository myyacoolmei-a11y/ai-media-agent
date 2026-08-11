import type { BrandStyleInput } from "@/types/style";

export function buildBrandStylePrompt(style: BrandStyleInput | null) {
  if (!style) {
    return "沒有指定 Brand Style Profile。保持清楚、準確，不捏造資訊。";
  }

  return [
    `品牌名稱：${style.brand_name || style.style_name}`,
    `品牌描述：${style.brand_description}`,
    `目標讀者：${style.target_audience}`,
    `文章語氣：${style.article_tone || style.preferred_tone}`,
    `常用文字風格：${style.text_style || style.brand_personality}`,
    `不喜歡的表達：${style.forbidden_expressions || style.forbidden_tone}`,
    `故事結構：${style.preferred_story_structure}`,
    `社群文案風格：${style.social_copy_style || style.preferred_tone}`,
    `常用 CTA：${style.preferred_cta}`,
    "必須遵守以上規則，不要複製參考內容，也不要使用禁用表達。",
  ].join("\n");
}
