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
      {
        source: "/projects/new",
        destination: "/admin/assistant/new",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/dashboard/contents",
        destination: "/admin/content",
        permanent: false,
      },
      {
        source: "/dashboard/contents/new",
        destination: "/admin/content/new",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
