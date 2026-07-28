import type {
  AnalysisTranscriptSegment,
  GeneratedContent,
  ProductionBrief,
} from "@/types/analysis";

export type StoredMedia = {
  bucket: string;
  path: string;
};

export type SignedUpload = StoredMedia & {
  token: string;
};

export type VideoFrame = {
  timestampSeconds: number;
  path: string;
};

export type ProcessedVideo = {
  durationSeconds: number;
  audioPath: string;
  frames: VideoFrame[];
  cleanup: () => Promise<void>;
};

export type TranscriptionResult = {
  language: string;
  text: string;
  segments: AnalysisTranscriptSegment[];
};

export type LlmAnalysisInput = {
  transcript: TranscriptionResult;
  brief: ProductionBrief;
  videoDurationSeconds: number;
  frames: VideoFrame[];
};

export interface MediaStorageProvider {
  createUpload(path: string): Promise<SignedUpload>;
  downloadToFile(media: StoredMedia, destination: string): Promise<void>;
}

export interface VideoProcessingProvider {
  process(inputPath: string, workspacePath: string): Promise<ProcessedVideo>;
}

export interface TranscriptionProvider {
  transcribe(audioPath: string): Promise<TranscriptionResult>;
}

export interface LlmProvider {
  generate(input: LlmAnalysisInput): Promise<GeneratedContent>;
}
