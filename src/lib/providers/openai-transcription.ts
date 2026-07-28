import { createReadStream } from "node:fs";

import OpenAI from "openai";
import type { TranscriptionVerbose } from "openai/resources/audio/transcriptions";

import type {
  TranscriptionProvider,
  TranscriptionResult,
} from "@/lib/providers/types";

export class OpenAiTranscriptionProvider
  implements TranscriptionProvider
{
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    const response = (await this.client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })) as TranscriptionVerbose;

    if (!response.text.trim()) {
      throw new Error("The transcription provider returned an empty transcript.");
    }

    return {
      language: response.language || "unknown",
      text: response.text,
      segments: (response.segments ?? []).map((segment) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
      })),
    };
  }
}
