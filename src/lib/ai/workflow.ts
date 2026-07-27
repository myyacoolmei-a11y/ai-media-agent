import type { AiTaskType } from "@/types/domain";

export interface WorkflowStage {
  id: AiTaskType;
  name: string;
  description: string;
  provider: string;
}

export const AI_WORKFLOW: WorkflowStage[] = [
  {
    id: "extract_audio",
    name: "媒體預處理",
    description: "驗證檔案、抽取音軌並建立分析素材",
    provider: "Media Processor",
  },
  {
    id: "transcribe",
    name: "語音辨識",
    description: "以 Whisper 產生含時間碼的逐字稿",
    provider: "Whisper Adapter",
  },
  {
    id: "analyze_visuals",
    name: "畫面理解",
    description: "辨識場景、人物、物件與視覺節奏",
    provider: "Vision Adapter",
  },
  {
    id: "summarize",
    name: "重點整理",
    description: "融合逐字稿與畫面資訊，萃取內容主軸",
    provider: "LLM Adapter",
  },
  {
    id: "generate_copy",
    name: "文案生成",
    description: "生成精簡、故事、專業三種版本",
    provider: "LLM Adapter",
  },
  {
    id: "generate_seo",
    name: "SEO 與 Hashtag",
    description: "產生標題、搜尋關鍵字與社群標籤",
    provider: "SEO Agent",
  },
  {
    id: "generate_cover",
    name: "封面文字",
    description: "生成適合縮圖的高辨識短句",
    provider: "Creative Agent",
  },
];

export interface AiProvider {
  execute<TInput, TOutput>(input: TInput): Promise<TOutput>;
}

/**
 * The orchestration boundary for future queue workers.
 * MVP pages consume mock tasks; production providers can implement this
 * interface without coupling UI, storage, or database code to one AI vendor.
 */
export class AiWorkflow {
  constructor(
    private readonly providers: Partial<Record<AiTaskType, AiProvider>>,
  ) {}

  async run<TInput, TOutput>(stage: AiTaskType, input: TInput) {
    const provider = this.providers[stage];

    if (!provider) {
      throw new Error(`AI provider is not configured for stage: ${stage}`);
    }

    return provider.execute<TInput, TOutput>(input);
  }
}
