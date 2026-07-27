# AI Media Agent

AI Media Agent 是一個從媒體素材出發的 AI 內容工作流。第一階段聚焦單一體驗：上傳影片，取得逐字稿、內容重點、三版文案、標題、Hashtag 與封面文字。

## MVP routes

- `/` — 產品首頁與 Pipeline 說明
- `/projects/new` — 建立專案與影片上傳
- `/projects/[projectId]/processing` — AI 任務進度
- `/projects/[projectId]/results` — 完整內容輸出
- `POST /api/ai/tasks` — 未來 Queue/Worker 的 Mock 邊界

## Architecture

```text
Video upload
  → Supabase Storage
  → Media pre-processing
  → Whisper adapter
  → Transcript
  → Vision + LLM analysis
  → Copy / SEO / Hashtag / Cover text
  → AiResult
```

UI、AI orchestration 與 provider adapter 分離。`src/lib/ai/workflow.ts` 定義工作流與 provider contract，目前使用 `src/lib/mock-data.ts`，未呼叫外部 AI API。未來可把各 stage 接到 queue worker，不需更動前端資料模型。

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase Auth / Postgres / Storage + `@supabase/ssr`
- React Hook Form + Zod
- shadcn/ui conventions + Lucide React

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

未設定 Supabase 環境變數時，產品展示與 Mock Workflow 仍可執行。資料庫 migration 位於 `supabase/migrations/202607270001_initial_schema.sql`，包含六個 MVP domain tables、RLS policies 與 private media bucket。
