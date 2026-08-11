const storageVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getProviderStatus() {
  const missing = storageVariables.filter((name) => !process.env[name]);

  return {
    configured: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? null
        : "尚未設定 Supabase，因此無法上傳素材。",
  };
}

export function assertProvidersConfigured() {
  const status = getProviderStatus();

  if (!status.configured) {
    throw new Error(status.message ?? "Provider configuration is incomplete.");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("尚未設定 AI API，因此無法執行此付費功能。");
  }
}

export function getAiProviderStatus() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    missing: process.env.OPENAI_API_KEY ? [] : ["OPENAI_API_KEY"],
    message: process.env.OPENAI_API_KEY
      ? null
      : "尚未設定 AI API。素材上傳與手動編輯仍可使用。",
  };
}
