import { AI_WORKFLOW } from "@/lib/ai/workflow";
import type { AiResult, AiTask, Media, Project, Transcript } from "@/types/domain";

export const DEMO_PROJECT_ID = "demo-project";

export const mockProject: Project = {
  id: DEMO_PROJECT_ID,
  userId: "demo-user",
  name: "品牌故事｜工作室的一天",
  description: "將幕後花絮整理成社群內容",
  status: "completed",
  createdAt: "2026-07-27T09:12:00.000Z",
  updatedAt: "2026-07-27T09:18:42.000Z",
};

export const mockMedia: Media = {
  id: "media-demo-01",
  projectId: DEMO_PROJECT_ID,
  type: "video",
  fileName: "studio-behind-the-scenes.mp4",
  storagePath: "demo-user/demo-project/studio-behind-the-scenes.mp4",
  mimeType: "video/mp4",
  sizeBytes: 86_400_000,
  durationSeconds: 94,
  createdAt: "2026-07-27T09:12:30.000Z",
};

export const mockTranscript: Transcript = {
  id: "transcript-demo-01",
  mediaId: mockMedia.id,
  language: "zh-TW",
  text: "每一件作品開始以前，我們都先問：它能為誰創造真正的價值？今天帶你看看一個想法如何從草圖，變成可以被感受的品牌體驗。",
  segments: [
    { start: 0, end: 7, text: "每一件作品開始以前，我們都先問：" },
    { start: 7, end: 14, text: "它能為誰創造真正的價值？" },
    { start: 14, end: 23, text: "今天帶你看看一個想法如何從草圖，" },
    { start: 23, end: 30, text: "變成可以被感受的品牌體驗。" },
  ],
  createdAt: "2026-07-27T09:14:05.000Z",
};

export const mockTasks: AiTask[] = AI_WORKFLOW.map((stage, index) => ({
  id: `task-${index + 1}`,
  projectId: DEMO_PROJECT_ID,
  type: stage.id,
  status: "completed",
  progress: 100,
  input: {},
  output: { stage: stage.name },
  error: null,
  startedAt: `2026-07-27T09:${13 + index}:00.000Z`,
  completedAt: `2026-07-27T09:${13 + index}:40.000Z`,
  createdAt: "2026-07-27T09:12:40.000Z",
}));

export const mockAiResult: AiResult = {
  id: "result-demo-01",
  projectId: DEMO_PROJECT_ID,
  model: "mock/ai-media-agent-v1",
  version: 1,
  content: {
    summary: [
      "以使用者價值作為每件作品的起點",
      "呈現從草圖、協作到成品的完整創作過程",
      "品牌核心是讓設計成為可被感受的體驗",
    ],
    visualInsights: ["工作室自然光場景", "手繪草圖特寫", "團隊協作與成品切換"],
    titles: [
      "一個好品牌，從問對問題開始",
      "90 秒看見品牌如何誕生",
      "從草圖到體驗：我們的創作日常",
    ],
    hashtags: [
      "#品牌設計",
      "#創意工作室",
      "#幕後花絮",
      "#品牌故事",
      "#設計思考",
      "#內容行銷",
    ],
    coverTexts: ["好品牌，從這裡開始", "一個想法如何被看見", "設計背後的真實日常"],
    copyVariants: [
      {
        id: "short",
        label: "精簡版",
        content:
          "每一個好作品，都始於一個對的問題。帶你走進我們的工作室，看一個想法如何從草圖，成為真正能被感受的品牌體驗。",
      },
      {
        id: "story",
        label: "故事版",
        content:
          "桌上的第一張草圖，通常不是答案，而是一次對話的開始。我們反覆問、反覆修改，讓每個選擇都回到使用者真正需要的價值。這 90 秒，是一個品牌從模糊想法走向清晰體驗的過程。",
      },
      {
        id: "professional",
        label: "專業版",
        content:
          "品牌設計不只關乎視覺，而是策略、內容與體驗的整合。從需求梳理、概念發展到設計落地，我們以使用者價值為核心，建立一致且具辨識度的品牌溝通。",
      },
    ],
  },
  createdAt: "2026-07-27T09:18:42.000Z",
};
