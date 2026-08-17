import { NextResponse } from "next/server";

export const PREVIEW_DEMO_COOKIE = "preview_demo_auth";

export const PREVIEW_DEMO_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "preview@ai-media.local",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-08-17T00:00:00.000Z",
};

export const PREVIEW_WRITE_BLOCKED =
  "Preview 為唯讀示範，不會寫入 production 資料庫。";

export function previewWriteBlocked() {
  return NextResponse.json({ error: PREVIEW_WRITE_BLOCKED }, { status: 403 });
}

function railwayEnvironmentName() {
  return (process.env.RAILWAY_ENVIRONMENT_NAME ?? "").trim();
}

function railwayGitBranch() {
  return (process.env.RAILWAY_GIT_BRANCH ?? "").trim();
}

export function isPreviewDemo() {
  if (process.env.PREVIEW_DEMO_CONTENT === "true") return true;
  if (process.env.PREVIEW_DEMO_CONTENT === "false") return false;

  const railwayEnv = railwayEnvironmentName();
  if (!railwayEnv || railwayEnv === "production") return false;

  const env = railwayEnv.toLowerCase();
  if (env === "preview" || /^pr[-_#\s]/.test(env) || env.includes("preview")) {
    return true;
  }

  const branch = railwayGitBranch();
  return Boolean(branch && branch !== "main");
}
