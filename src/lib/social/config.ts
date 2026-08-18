import { SITE_NAME } from "@/lib/brand";

function read(name: string) {
  return (process.env[name] ?? "").trim();
}

export function missingEnv(names: readonly string[]) {
  return names.filter((name) => !read(name));
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

export const FACEBOOK_REQUIRED_ENV = [
  "META_PAGE_ID",
  "META_PAGE_ACCESS_TOKEN",
] as const;

export const FACEBOOK_CREDENTIAL_ENV = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_PAGE_ID",
  "META_PAGE_ACCESS_TOKEN",
] as const;

export const INSTAGRAM_REQUIRED_ENV = [
  "META_PAGE_ACCESS_TOKEN",
  "META_INSTAGRAM_ACCOUNT_ID",
] as const;

export const INSTAGRAM_CREDENTIAL_ENV = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_PAGE_ID",
  "META_PAGE_ACCESS_TOKEN",
  "META_INSTAGRAM_ACCOUNT_ID",
] as const;

export function facebookConfig() {
  return {
    appId: read("META_APP_ID"),
    appSecret: read("META_APP_SECRET"),
    pageId: read("META_PAGE_ID"),
    pageAccessToken: read("META_PAGE_ACCESS_TOKEN"),
  };
}

export function facebookConfigured() {
  return missingEnv(FACEBOOK_REQUIRED_ENV).length === 0;
}

export function instagramConfig() {
  return {
    ...facebookConfig(),
    igUserId: read("META_INSTAGRAM_ACCOUNT_ID"),
  };
}

export function instagramConfigured() {
  const config = instagramConfig();
  return Boolean(config.pageAccessToken && config.igUserId);
}

export function threadsApiVersion() {
  return read("THREADS_API_VERSION") || "v1.0";
}

export function threadsGraphBase() {
  return `https://graph.threads.net/${threadsApiVersion()}`;
}

export const THREADS_CREDENTIAL_ENV = [
  "THREADS_APP_ID",
  "THREADS_APP_SECRET",
  "THREADS_USER_ID",
  "THREADS_ACCESS_TOKEN",
] as const;

export const THREADS_REQUIRED_ENV = [
  "THREADS_USER_ID",
  "THREADS_ACCESS_TOKEN",
] as const;

export function threadsConfig() {
  return {
    appId: read("THREADS_APP_ID"),
    appSecret: read("THREADS_APP_SECRET"),
    userId: read("THREADS_USER_ID"),
    accessToken: read("THREADS_ACCESS_TOKEN"),
  };
}

export function threadsConfigured() {
  return missingEnv(THREADS_REQUIRED_ENV).length === 0;
}

export const TIKTOK_REQUIRED_ENV = [
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_ACCESS_TOKEN",
] as const;

export function tiktokConfig() {
  return {
    clientKey: read("TIKTOK_CLIENT_KEY"),
    clientSecret: read("TIKTOK_CLIENT_SECRET"),
    accessToken: read("TIKTOK_ACCESS_TOKEN"),
    privacyLevel: read("TIKTOK_PRIVACY_LEVEL") || "PUBLIC_TO_EVERYONE",
    postingEnabled: read("TIKTOK_CONTENT_POSTING_ENABLED") === "true",
  };
}

export function tiktokCredentialsPresent() {
  return missingEnv(TIKTOK_REQUIRED_ENV).length === 0;
}

export function tiktokPostingEnabled() {
  return tiktokCredentialsPresent() && tiktokConfig().postingEnabled;
}

export { SITE_NAME };
