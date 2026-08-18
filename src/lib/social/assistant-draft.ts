export const ASSISTANT_DRAFT_KEY = "news-fengbao-assistant-draft";

export type AssistantHandoffDraft = {
  title: string;
  summary: string;
  content: string;
  hashtags: string[];
  seoKeywords: string;
  videoUrl?: string;
};

export function readAssistantHandoffDraft(): AssistantHandoffDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ASSISTANT_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AssistantHandoffDraft;
    if (!parsed.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAssistantHandoffDraft(draft: AssistantHandoffDraft) {
  sessionStorage.setItem(ASSISTANT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearAssistantHandoffDraft() {
  sessionStorage.removeItem(ASSISTANT_DRAFT_KEY);
}
