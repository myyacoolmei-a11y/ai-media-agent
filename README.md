# AI Media Agent

AI Media Agent 是一套個人風格養成系統與專屬 AI 剪片師。使用者可以建立多套
Brand Style Profile；每個影片專案都必須指定一套風格，AI 會優先依照該 Profile
產生逐字稿、內容企劃、文案與剪輯腳本。

## MVP routes

公開前台只顯示 `published` 且已到發布時間的內容：

- `/` — 媒體首頁
- `/news` — 最新報導列表
- `/article/[slug]` — 單篇報導
- `/video` — 影音報導

私人後台沿用既有 Auth 與 `content_items`：

- `/login` — 管理員登入
- `/admin` — 後台首頁
- `/admin/content` — 內容列表
- `/admin/content/new` — 新增報導
- `/admin/content/[id]/edit` — 編輯報導
- `/admin/assistant` — AI 報導助手（影片上傳、語音辨識、畫面分析、文案、標題、SEO、Hashtag）
- `/admin/assistant/new` — 開始 AI 製作

舊網址會導向新路由：`/articles/[slug]`、`/admin/login`、`/admin/new`、`/admin/[id]/edit`、`/projects/new`、`/dashboard`。

既有 AI 製作與風格功能仍保留，改從後台進入：

- `/projects/new` 會導向 `/admin/assistant/new`
- `/projects/[projectId]/processing` — 真實處理工作進度
- `/projects/[projectId]/results` — 完整內容輸出
- `/signup` — 建立帳號
- `/forgot-password`、`/reset-password` — 密碼重設
- `/styles` — 多風格管理與 AI 學習紀錄
- `/styles/new` — 建立 Brand Style Profile
- `/dashboard` — 內容製作後台總覽
- `/dashboard/contents` — 草稿、預覽與已發布內容管理
- `/dashboard/contents/new` — 建立影片、圖文或文章內容
- `/dashboard/contents/[contentId]/edit` — 統一內容編輯器
- `/dashboard/contents/[contentId]/preview` — 發布前預覽
- `POST /api/projects` — 建立工作與 Supabase signed upload
- `POST /api/projects/[projectId]/complete` — 驗證上傳並啟動處理
- `GET/PATCH /api/projects/[projectId]` — 讀取與儲存結果
- `POST /api/projects/[projectId]/regenerate` — 使用原素材重新生成
- `GET/POST /api/contents` — 登入使用者的內容列表與建立草稿
- `GET/PATCH /api/contents/[contentId]` — 內容讀取與編輯
- `POST /api/contents/[contentId]/status` — 草稿／預覽／發布
- `POST /api/contents/[contentId]/assets` — 圖片與影片 signed upload
- `GET /api/public/contents` — 已發布內容公開列表
- `GET /api/public/contents/[slug]` — 已發布內容公開明細
- `POST /api/projects` — 建立工作與 Supabase signed upload
- `POST /api/projects/[projectId]/complete` — 驗證上傳並啟動處理
- `GET/PATCH /api/projects/[projectId]` — 讀取與儲存結果
- `POST /api/projects/[projectId]/regenerate` — 使用原素材重新生成
- `GET/POST /api/contents` — 登入使用者的內容列表與建立草稿
- `GET/PATCH /api/contents/[contentId]` — 內容讀取與編輯
- `POST /api/contents/[contentId]/status` — 草稿／預覽／發布
- `POST /api/contents/[contentId]/assets` — 圖片與影片 signed upload
- `GET /api/public/contents` — 已發布內容公開列表
- `GET /api/public/contents/[slug]` — 已發布內容公開明細

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

`projects` 與 `content_items` 負責不同生命週期：

- `projects`：AI 製作工作、逐字稿、分析任務與原始 AI 結果
- `content_items`：可人工編輯並提供媒體前台使用的正式內容

影片、圖文與文章都進入相同的 `draft → preview → published` 流程。公開 API
只查詢已發布且 `published_at <= now()` 的內容，媒體仍保存在 private Storage，
由 API 產生短期 signed URL。

Provider contracts 位於 `src/lib/providers/types.ts`：

- `MediaStorageProvider`
- `VideoProcessingProvider`
- `TranscriptionProvider`
- `LlmProvider`

目前提供 Supabase Storage、FFmpeg 與 OpenAI 實作；未設定必要環境變數時，
介面會阻止上傳並明確顯示設定缺失，不會回退到假資料。

## Authentication and personal style

Supabase Auth 是唯一身份來源。Project、Media、Transcript、AiResult（AiAnalysis）、
AiTask、BrandStyleProfile、StyleFeedback、PreferenceSuggestion、PersonalEditor
與 RenderJob 都永久綁定 `auth.users.id`，並由 RLS 隔離。

使用者對文案、標題、片段、剪輯順序、字幕、節奏、CTA、封面與 Logo 位置的修改
會寫入 `style_feedback`。相同偏好至少累積三次後才建立待確認的
`preference_suggestions`；系統不會自動修改 Brand Style Profile，只有使用者按下
「確認更新」後才會套用建議。

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

`202607290001_brand_style_auth.sql` 會移除無法歸屬帳號的舊匿名 MVP 專案，再將
所有內容資料改為不可為空的 `user_id`。Supabase Auth URL Configuration 必須允許：

```text
https://<your-domain>/auth/callback
https://<your-domain>/auth/confirm
```

Email confirmation 可在 Supabase Auth 設定中控制；正式上線建議啟用。

內容後台需要再套用：

```text
supabase/migrations/202608100001_content_backend.sql
```
