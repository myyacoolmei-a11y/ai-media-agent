const fallbackUrl = "https://placeholder.supabase.co";
const fallbackKey = "placeholder-anon-key";

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackUrl,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fallbackKey,
  isConfigured: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
