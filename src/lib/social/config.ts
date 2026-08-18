import { SITE_NAME } from "@/lib/brand";

function read(name: string) {
  return (process.env[name] ?? "").trim();
}

export function getPublicSiteUrl() {
  const explicit = read("PUBLIC_SITE_URL") || read("NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const railway = read("RAILWAY_PUBLIC_DOMAIN");
  if (railway) {
    return railway.startsWith("http")
      ? railway.replace(/\/$/, "")
      : `https://${railway.replace(/\/$/, "")}`;
  }
  return "";
}

export function articlePermalink(slug: string) {
  const base = getPublicSiteUrl();
  return base && slug ? `${base}/article/${slug}` : "";
}

export function metaGraphVersion() {
  return read("META_GRAPH_API_VERSION") || "v21.0";
}

export function metaGraphBase() {
  return `https://graph.facebook.com/${metaGraphVersion()}`;
}

export function facebookConfig() {
  return {
    appId: read("META_APP_ID"),
    appSecret: read("META_APP_SECRET"),
    pageId: read("META_PAGE_ID"),
    pageAccessToken: read("META_PAGE_ACCESS_TOKEN"),
  };
}

export function instagramConfig() {
  return {
    ...facebookConfig(),
    igUserId: read("META_INSTAGRAM_ACCOUNT_ID"),
  };
}

export function facebookConfigured() {
  const config = facebookConfig();
  return Boolean(config.pageId && config.pageAccessToken);
}

export function instagramConfigured() {
  const config = instagramConfig();
  return Boolean(
    config.pageAccessToken && (config.igUserId || config.pageId),
  );
}

export { SITE_NAME };
