export type ProjectStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export type MediaType = "video" | "image" | "audio";
export type TaskStatus = "queued" | "processing" | "completed" | "failed";

export type AiTaskType =
  | "extract_audio"
  | "transcribe"
  | "analyze_visuals"
  | "summarize"
  | "generate_copy"
  | "generate_seo"
  | "generate_cover";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  projectId: string;
  type: MediaType;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  createdAt: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  id: string;
  mediaId: string;
  language: string;
  text: string;
  segments: TranscriptSegment[];
  createdAt: string;
}

export interface CopyVariant {
  id: "short" | "story" | "professional";
  label: string;
  content: string;
}

export interface EditingDirection {
  id: "quick" | "social" | "full";
  label: string;
  duration: string;
  description: string;
  scenes: string[];
}

export interface AiResultContent {
  summary: string[];
  copyVariants: CopyVariant[];
  editingDirections: EditingDirection[];
  titles: string[];
  hashtags: string[];
  coverTexts: string[];
  visualInsights: string[];
}

export interface AiResult {
  id: string;
  projectId: string;
  model: string;
  version: number;
  content: AiResultContent;
  createdAt: string;
}

export interface AiTask {
  id: string;
  projectId: string;
  type: AiTaskType;
  status: TaskStatus;
  progress: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
