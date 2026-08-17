import { ExternalLink } from "lucide-react";

import { getVideoEmbedUrl, isDirectVideoUrl } from "@/lib/content/video";

export function StoryVideo({ url, title }: { url: string; title: string }) {
  const embed = getVideoEmbedUrl(url);
  if (embed) {
    return (
      <div className="aspect-video overflow-hidden rounded-3xl bg-black">
        <iframe
          src={embed}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        className="aspect-video w-full rounded-3xl bg-black"
      >
        你的瀏覽器不支援影片播放。
      </video>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-zinc-300 hover:border-white/15"
    >
      觀看相關影片
      <ExternalLink className="size-4" />
    </a>
  );
}
