export type EmbedKind = "iframe" | "link";

export type ParsedEmbed = {
  provider: "youtube" | "tiktok" | "instagram" | "facebook" | "threads" | "vimeo" | "link";
  embedUrl: string | null;
  pageUrl: string;
  kind: EmbedKind;
};

function hostOf(url: URL) {
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

export function parseEmbed(raw: string): ParsedEmbed | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = hostOf(parsed);
  const pageUrl = parsed.toString();

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return {
      provider: "youtube",
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
      pageUrl,
      kind: id ? "iframe" : "link",
    };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let id = parsed.searchParams.get("v");
    if (!id && parsed.pathname.startsWith("/embed/")) {
      id = parsed.pathname.split("/").filter(Boolean)[1];
    }
    if (!id && parsed.pathname.startsWith("/shorts/")) {
      id = parsed.pathname.split("/").filter(Boolean)[1];
    }
    return {
      provider: "youtube",
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
      pageUrl,
      kind: id ? "iframe" : "link",
    };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    const ok = id && /^\d+$/.test(id);
    return {
      provider: "vimeo",
      embedUrl: ok ? `https://player.vimeo.com/video/${id}` : null,
      pageUrl,
      kind: ok ? "iframe" : "link",
    };
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const videoIndex = parts.indexOf("video");
    const id = videoIndex >= 0 ? parts[videoIndex + 1] : null;
    return {
      provider: "tiktok",
      embedUrl: id ? `https://www.tiktok.com/embed/v2/${id}` : null,
      pageUrl,
      kind: id ? "iframe" : "link",
    };
  }
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    const id = parts[1];
    const embedable = (kind === "p" || kind === "reel" || kind === "tv") && id;
    return {
      provider: "instagram",
      embedUrl: embedable ? `https://www.instagram.com/${kind}/${id}/embed` : null,
      pageUrl,
      kind: embedable ? "iframe" : "link",
    };
  }
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") {
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(pageUrl)}&show_text=true&width=500`,
      pageUrl,
      kind: "iframe",
    };
  }
  if (host === "threads.net" || host.endsWith(".threads.net")) {
    return {
      provider: "threads",
      embedUrl: null,
      pageUrl,
      kind: "link",
    };
  }

  return {
    provider: "link",
    embedUrl: null,
    pageUrl,
    kind: "link",
  };
}
