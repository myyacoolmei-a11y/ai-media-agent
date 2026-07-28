import { z } from "zod";

export const productionBriefSchema = z.object({
  originalRequest: z.string().trim().min(5).max(2000),
  purpose: z.string().trim().min(1).max(120),
  platforms: z.array(z.string().min(1)).min(1).max(5),
  style: z.string().trim().min(1).max(120),
  targetDuration: z.enum(["15 秒", "30 秒", "60 秒", "由 AI 建議"]),
  additionalNotes: z.string().trim().max(2000),
});

export type ProductionBrief = z.infer<typeof productionBriefSchema>;

export const uploadRequestSchema = z.object({
  styleProfileId: z.string().uuid(),
  brief: productionBriefSchema,
  file: z.object({
    name: z.string().min(1).max(255),
    type: z
      .string()
      .refine((value) => value.startsWith("video/"), "Only video is supported"),
    size: z.number().int().positive().max(500 * 1024 * 1024),
  }),
});

export const transcriptSegmentSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  text: z.string(),
});

export type AnalysisTranscriptSegment = z.infer<
  typeof transcriptSegmentSchema
>;

export const editingSegmentSchema = z
  .object({
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().positive(),
    visualDescription: z.string(),
    subtitle: z.string(),
    transition: z.string(),
  })
  .refine((segment) => segment.startSeconds < segment.endSeconds, {
    message: "Segment start must be before its end.",
  });

export const editingScriptSchema = z.object({
  id: z.enum(["quick", "social", "full"]),
  label: z.string(),
  targetDurationSeconds: z.number().int().positive(),
  sourceVideoDurationSeconds: z.number().positive(),
  hook: z.string(),
  segments: z.array(editingSegmentSchema),
  backgroundMusicMood: z.string(),
  editingPace: z.string(),
  subtitleStyle: z.string(),
  logoPosition: z.string(),
  callToAction: z.string(),
  coverTitle: z.string(),
  insufficientMaterial: z.boolean(),
  insufficiencyReason: z.string(),
});

export const generatedContentSchema = z.object({
  taskSummary: z.string(),
  styleApplicationSummary: z.string(),
  summary: z.array(z.string()).min(1).max(6),
  copyVariants: z
    .array(
      z.object({
        id: z.enum(["short", "story", "professional"]),
        label: z.string(),
        content: z.string(),
      }),
    )
    .length(3),
  titles: z.array(z.string()).length(3),
  hashtags: z.array(z.string()).min(3).max(12),
  coverTexts: z.array(z.string()).length(3),
  editingScripts: z.array(editingScriptSchema).length(3),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;

export type AnalysisProjectResponse = {
  project: {
    id: string;
    name: string;
    status: "draft" | "uploading" | "processing" | "completed" | "failed";
    styleProfileId: string;
    styleProfileName: string;
    brief: ProductionBrief;
    aiTaskSummary: string | null;
    selectedCopyVersion: "short" | "story" | "professional" | null;
    selectedEditingVersion: "quick" | "social" | "full" | null;
    selectedCoverText: string | null;
    error: string | null;
  };
  media: {
    fileName: string;
    durationSeconds: number | null;
  } | null;
  transcript: {
    text: string;
    segments: AnalysisTranscriptSegment[];
  } | null;
  result: GeneratedContent | null;
  tasks: Array<{
    type: string;
    status: string;
    progress: number;
    error: string | null;
  }>;
};
