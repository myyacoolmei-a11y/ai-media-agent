import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  async redirects() {
    return [
      {
        source: "/articles/:slug",
        destination: "/article/:slug",
        permanent: true,
      },
      {
        source: "/admin/login",
        destination: "/login?next=/admin",
        permanent: false,
      },
      {
        source: "/admin/new",
        destination: "/admin/content/new",
        permanent: false,
      },
      {
        source: "/admin/:id/edit",
        destination: "/admin/content/:id/edit",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
