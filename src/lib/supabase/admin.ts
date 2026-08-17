import { createClient } from "@supabase/supabase-js";

import { isPreviewDemo } from "@/lib/preview";
import { supabaseConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  if (isPreviewDemo()) {
    throw new Error("Preview 環境不會連線 production Supabase。");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseConfig.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
