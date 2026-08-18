import { notFound } from "next/navigation";

import { StyleProfileWorkspace } from "@/components/style-profile-workspace";
import { verifyStyleAccess } from "@/lib/style/access";
import type {
  BrandStyleProfile,
  PreferenceSuggestion,
} from "@/types/style";

type StylePageProps = {
  params: Promise<{ styleId: string }>;
};

export default async function StylePage({ params }: StylePageProps) {
  const { styleId } = await params;
  const access = await verifyStyleAccess(styleId);
  if (!access) notFound();
  const [feedbackQuery, suggestionQuery] = await Promise.all([
    access.supabase
      .from("style_feedback")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", access.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    access.supabase
      .from("preference_suggestions")
      .select("*")
      .eq("style_profile_id", styleId)
      .eq("user_id", access.user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <StyleProfileWorkspace
      style={access.style as BrandStyleProfile}
      initialFeedback={feedbackQuery.data ?? []}
      initialSuggestions={
        (suggestionQuery.data ?? []) as PreferenceSuggestion[]
      }
    />
  );
}
