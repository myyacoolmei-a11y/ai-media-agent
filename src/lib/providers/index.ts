import { FfmpegVideoProcessingProvider } from "@/lib/providers/ffmpeg-video";
import { OpenAiLlmProvider } from "@/lib/providers/openai-llm";
import { OpenAiTranscriptionProvider } from "@/lib/providers/openai-transcription";
import { SupabaseMediaStorageProvider } from "@/lib/providers/supabase-storage";
import type {
  LlmProvider,
  MediaStorageProvider,
  TranscriptionProvider,
  VideoProcessingProvider,
} from "@/lib/providers/types";

export type ProviderRegistry = {
  storage: MediaStorageProvider;
  video: VideoProcessingProvider;
  transcription: TranscriptionProvider;
  llm: LlmProvider;
};

export function createProviders(): ProviderRegistry {
  return {
    storage: new SupabaseMediaStorageProvider(),
    video: new FfmpegVideoProcessingProvider(),
    transcription: new OpenAiTranscriptionProvider(),
    llm: new OpenAiLlmProvider(),
  };
}

export type {
  LlmProvider,
  MediaStorageProvider,
  TranscriptionProvider,
  VideoProcessingProvider,
};
