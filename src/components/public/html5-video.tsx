export function Html5Video({
  src,
  poster,
  caption,
  title,
  className,
}: {
  src: string;
  poster?: string | null;
  caption?: string | null;
  title?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="html5-video aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <video
          src={src}
          poster={poster ?? undefined}
          controls
          playsInline
          preload="metadata"
          title={title}
          className="size-full object-contain"
        >
          你的瀏覽器不支援影片播放。
        </video>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-[11px] text-zinc-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
