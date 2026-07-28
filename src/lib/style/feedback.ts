import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandStyleInput } from "@/types/style";

type FeedbackInput = {
  userId: string;
  projectId: string;
  styleProfileId: string;
  originalSuggestion: unknown;
  userAction: string;
  finalChoice: unknown;
  feedbackType: string;
};

function textValue(value: unknown) {
  if (typeof value === "string") return value.slice(0, 1000);
  return JSON.stringify(value).slice(0, 1000);
}

function suggestedChanges(
  feedbackType: string,
  finalChoice: unknown,
): Partial<BrandStyleInput> | null {
  const value = textValue(finalChoice);
  if (feedbackType === "copy_edit") return { preferred_tone: value };
  if (feedbackType === "title_edit") return { preferred_hook_style: value };
  if (feedbackType === "segment_order") {
    return { preferred_story_structure: value };
  }
  if (feedbackType === "subtitle_style") {
    return { preferred_subtitle_style: value };
  }
  if (feedbackType === "editing_pace") {
    return { preferred_editing_pace: value };
  }
  if (feedbackType === "cta_edit") return { preferred_cta: value };
  if (feedbackType === "logo_position") return { logo_position: value };
  return null;
}

export async function recordStyleFeedback(input: FeedbackInput) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("style_feedback").insert({
    user_id: input.userId,
    project_id: input.projectId,
    style_profile_id: input.styleProfileId,
    original_suggestion: input.originalSuggestion,
    user_action: input.userAction,
    final_choice: input.finalChoice,
    feedback_type: input.feedbackType,
  });
  if (error) throw new Error(`Could not save style feedback: ${error.message}`);

  const changes = suggestedChanges(input.feedbackType, input.finalChoice);
  if (!changes) return;

  const { count } = await supabase
    .from("style_feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("style_profile_id", input.styleProfileId)
    .eq("feedback_type", input.feedbackType);
  if ((count ?? 0) < 3) return;

  const { data: existing } = await supabase
    .from("preference_suggestions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("style_profile_id", input.styleProfileId)
    .eq("feedback_type", input.feedbackType)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return;

  await supabase.from("preference_suggestions").insert({
    user_id: input.userId,
    style_profile_id: input.styleProfileId,
    feedback_type: input.feedbackType,
    occurrence_count: count,
    explanation: `你已多次${input.userAction}。是否把最近一次選擇保存為這套風格的預設偏好？`,
    suggested_changes: changes,
    status: "pending",
  });
}
