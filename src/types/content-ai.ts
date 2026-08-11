import { z } from "zod";

export const textAiActionSchema = z.enum([
  "organize",
  "rewrite",
  "title",
  "summary",
  "article",
  "social",
]);

export const textAiRequestSchema = z.object({
  action: textAiActionSchema,
  sourceText: z.string().trim().min(1).max(100_000),
});

export const textAiResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  socialCopy: z.object({
    facebook: z.string(),
    instagram: z.string(),
    threads: z.string(),
  }),
  styleApplication: z.string(),
});

export type TextAiAction = z.infer<typeof textAiActionSchema>;
export type TextAiResult = z.infer<typeof textAiResultSchema>;
