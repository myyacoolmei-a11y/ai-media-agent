const VIDEO_TYPES = new Set(["video", "short_video", "audio_report"]);

export function isVideoStory(item: {
  contentType: string;
  videoUrl: string | null;
  media?: Array<{ type: string }>;
}) {
  return (
    VIDEO_TYPES.has(item.contentType) ||
    Boolean(item.videoUrl) ||
    Boolean(item.media?.some((asset) => asset.type === "video"))
  );
}

export function isDirectVideoUrl(url: string) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return [".mp4", ".webm", ".mov", ".m4v"].some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

export function getVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeVideoUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
