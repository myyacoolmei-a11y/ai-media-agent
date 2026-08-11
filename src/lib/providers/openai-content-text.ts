import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { buildBrandStylePrompt } from "@/lib/style/prompt-context";
import {
  textAiResultSchema,
  type TextAiAction,
  type TextAiResult,
} from "@/types/content-ai";
import type { BrandStyleInput } from "@/types/style";

const actionInstructions: Record<TextAiAction, string> = {
  organize: "整理原文結構，保留事實，讓段落與重點更清楚。",
  rewrite: "依品牌風格改寫原文，不新增原文不存在的事實。",
  title: "以原文為基礎產生清楚、可信且符合品牌風格的標題。",
  summary: "產生精準摘要，不誇大，不加入原文沒有的資訊。",
  article: "把原文整理為可發布的完整文章，保留可驗證的資訊。",
  social: "為 Facebook、Instagram、Threads 分別產生合適的社群文案。",
};

export class OpenAiContentTextProvider {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("尚未設定 OPENAI_API_KEY。");
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: {
    action: TextAiAction;
    sourceText: string;
    style: BrandStyleInput | null;
  }): Promise<TextAiResult> {
    const completion = await this.client.chat.completions.parse({
      model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            "你是繁體中文自媒體內容編輯。",
            "只處理文字，不生成圖片或影片。",
            "不得捏造人物、數字、事件或來源。",
            buildBrandStylePrompt(input.style),
          ].join("\n\n"),
        },
        {
          role: "user",
          content: `${actionInstructions[input.action]}\n\n原始內容：\n${input.sourceText}`,
        },
      ],
      response_format: zodResponseFormat(
        textAiResultSchema,
        "content_text_result",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new Error("AI 未回傳有效文字結果。");
    return parsed;
  }
}
