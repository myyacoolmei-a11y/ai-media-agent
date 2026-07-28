# AI Media Agent

AI Media Agent 是一個從媒體素材出發的 AI 內容工作流。第一階段聚焦單一體驗：上傳影片，取得逐字稿、內容重點、三版文案、標題、Hashtag 與封面文字。

## MVP routes

- `/` — 影片內容製作入口
- `/projects/new` — 建立專案與影片上傳
- `/projects/[projectId]/processing` — 真實處理工作進度
- `/projects/[projectId]/results` — 完整內容輸出
- `POST /api/projects` — 建立工作與 Supabase signed upload
- `POST /api/projects/[projectId]/complete` — 驗證上傳並啟動處理
- `GET/PATCH /api/projects/[projectId]` — 讀取與儲存結果
- `POST /api/projects/[projectId]/regenerate` — 使用原素材重新生成

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

影片會直接上傳至 private Supabase Storage。Railway 上的 Next.js worker
使用 FFmpeg 擷取音訊與代表畫面，透過 OpenAI 語音辨識取得含時間點逐字稿，
再把逐字稿、畫面、原片長度與完整製作需求送給 LLM。結構化結果與每次重新生成版本
都寫入 Supabase。

Provider contracts 位於 `src/lib/providers/types.ts`：

- `MediaStorageProvider`
- `VideoProcessingProvider`
- `TranscriptionProvider`
- `LlmProvider`

目前提供 Supabase Storage、FFmpeg 與 OpenAI 實作；未設定必要環境變數時，
介面會阻止上傳並明確顯示設定缺失，不會回退到假資料。

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

部署前必須依序套用 `supabase/migrations` 內的 migrations，並設定
`.env.example` 列出的必要環境變數。FFmpeg 與 FFprobe 預設由 npm 套件提供，
也可用環境變數指定 Railway image 內的 binary。
