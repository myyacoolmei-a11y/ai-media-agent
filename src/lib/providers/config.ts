const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;

export function getProviderStatus() {
  const missing = requiredVariables.filter((name) => !process.env[name]);

  return {
    configured: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? null
        : "尚未設定 AI API，因此無法進行真實分析。",
  };
}

export function assertProvidersConfigured() {
  const status = getProviderStatus();

  if (!status.configured) {
    throw new Error(status.message ?? "Provider configuration is incomplete.");
  }
}
