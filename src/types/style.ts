import { z } from "zod";

export const referenceContentSchema = z.object({
  type: z.enum(["video", "article", "social", "other"]),
  url: z.string().url(),
  description: z.string().max(500),
});

export const brandStyleInputSchema = z.object({
  style_name: z.string().trim().min(2).max(100),
  brand_description: z.string().trim().min(5).max(2000),
  target_audience: z.string().trim().min(2).max(1000),
  brand_personality: z.string().trim().min(2).max(1000),
  preferred_tone: z.string().trim().min(2).max(1000),
  forbidden_tone: z.string().trim().max(1000),
  preferred_hook_style: z.string().trim().min(2).max(1000),
  preferred_story_structure: z.string().trim().min(2).max(1000),
  preferred_editing_pace: z.string().trim().min(2).max(1000),
  preferred_subtitle_style: z.string().trim().min(2).max(1000),
  preferred_color_direction: z.string().trim().min(2).max(1000),
  preferred_music_direction: z.string().trim().min(2).max(1000),
  preferred_cta: z.string().trim().min(2).max(1000),
  logo_position: z.string().trim().min(2).max(500),
  intro_template: z.string().trim().max(2000),
  outro_template: z.string().trim().max(2000),
  reference_content: z.array(referenceContentSchema).max(20),
  negative_examples: z.string().trim().max(3000),
});

export type BrandStyleInput = z.infer<typeof brandStyleInputSchema>;

export type BrandStyleProfile = BrandStyleInput & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type PreferenceSuggestion = {
  id: string;
  style_profile_id: string;
  feedback_type: string;
  occurrence_count: number;
  explanation: string;
  suggested_changes: Partial<BrandStyleInput>;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
};
