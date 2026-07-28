import { notFound, redirect } from "next/navigation";

import { StyleProfileWorkspace } from "@/components/style-profile-workspace";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BrandStyleProfile,
  PreferenceSuggestion,
} from "@/types/style";

type StylePageProps = {
  params: Promise<{ styleId: string }>;
};

export default async function StylePage({ params }: StylePageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  const { styleId } = await params;
  const supabase = createAdminClient();
  const [styleQuery, feedbackQuery, suggestionQuery] = await Promise.all([
    supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("id", styleId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("style_feedback")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("preference_suggestions")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!styleQuery.data) notFound();

  return (
    <StyleProfileWorkspace
      style={styleQuery.data as BrandStyleProfile}
      initialFeedback={feedbackQuery.data ?? []}
      initialSuggestions={
        (suggestionQuery.data ?? []) as PreferenceSuggestion[]
      }
    />
  );
}
