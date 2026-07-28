import { readFile } from "node:fs/promises";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

import type { LlmAnalysisInput, LlmProvider } from "@/lib/providers/types";
import {
  generatedContentSchema,
  type GeneratedContent,
} from "@/types/analysis";

const scriptMetadata = {
  quick: { label: "A版：15秒快速吸睛版", duration: 15 },
  social: { label: "B版：30秒社群版", duration: 30 },
  full: { label: "C版：60秒完整版", duration: 60 },
} as const;

export class OpenAiLlmProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: LlmAnalysisInput): Promise<GeneratedContent> {
    const transcriptWithTimestamps = input.transcript.segments.length
      ? input.transcript.segments
          .map(
            (segment) =>
              `[${segment.start.toFixed(1)}-${segment.end.toFixed(1)}秒] ${segment.text}`,
          )
          .join("\n")
      : input.transcript.text;

    const userContent: ChatCompletionContentPart[] = [
      {
        type: "text",
        text: [
          `影片真實總長度：${input.videoDurationSeconds.toFixed(2)} 秒`,
          `使用者需求：${JSON.stringify(input.brief, null, 2)}`,
          "真實逐字稿（含原片時間點）：",
          transcriptWithTimestamps,
          "",
          "以下是從原片等距擷取的畫面。每張圖片前的文字是其約略原片時間點。",
        ].join("\n"),
      },
    ];

    for (const frame of input.frames) {
      const image = await readFile(frame.path);
      userContent.push({
        type: "text",
        text: `約 ${frame.timestampSeconds.toFixed(1)} 秒的原片畫面：`,
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${image.toString("base64")}`,
          detail: "low",
        },
      });
    }

    const completion = await this.client.chat.completions.parse({
      model: process.env.OPENAI_LLM_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            "你是繁體中文媒體內容企劃與剪輯腳本編輯。",
            "只能根據提供的真實逐字稿、原片時間點、畫面截圖與使用者需求回答。",
            "不得捏造人物、產品、事件、畫面或原片中不存在的說法。",
            "每個剪輯段落的 startSeconds/endSeconds 必須落在原片總長度內，並引用真實可用片段。",
            "若素材不足以支撐指定版本，將 insufficientMaterial 設為 true，明確填寫 insufficiencyReason，寧可減少 segments 也不可捏造。",
            "三版文案 id 必須依序為 short、story、professional；三版剪輯 id 必須依序為 quick、social、full。",
            "taskSummary 要具體說明你如何理解使用者本次任務。",
            "所有輸出使用繁體中文，Hashtag 需包含 #。",
          ].join("\n"),
        },
        { role: "user", content: userContent },
      ],
      response_format: zodResponseFormat(
        generatedContentSchema,
        "media_analysis_result",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      throw new Error("The LLM did not return a valid structured result.");
    }

    const normalized = {
      ...parsed,
      editingScripts: parsed.editingScripts.map((script) => ({
        ...script,
        label: scriptMetadata[script.id].label,
        targetDurationSeconds: scriptMetadata[script.id].duration,
        sourceVideoDurationSeconds: input.videoDurationSeconds,
      })),
    };

    for (const script of normalized.editingScripts) {
      for (const segment of script.segments) {
        if (
          segment.startSeconds >= segment.endSeconds ||
          segment.endSeconds > input.videoDurationSeconds + 0.25
        ) {
          throw new Error(
            `LLM returned an invalid source time range for ${script.id}.`,
          );
        }
      }
    }

    return generatedContentSchema.parse(normalized);
  }
}
