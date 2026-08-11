import { z } from "zod";

import { subtitleCueSchema, videoClipSchema } from "@/types/content";

export const renderSettingsSchema = z.object({
  sourceAssetId: z.string().uuid(),
  clips: z
    .array(
      videoClipSchema.refine(
        (clip) => clip.startSeconds < clip.endSeconds,
        "片段結束時間必須晚於開始時間",
      ),
    )
    .min(1)
    .max(50),
  subtitles: z
    .array(
      subtitleCueSchema.refine(
        (cue) => cue.startSeconds < cue.endSeconds,
        "字幕結束時間必須晚於開始時間",
      ),
    )
    .max(1000),
  burnSubtitles: z.boolean(),
  subtitleStyle: z.string().max(500),
});

export type RenderSettings = z.infer<typeof renderSettingsSchema>;
