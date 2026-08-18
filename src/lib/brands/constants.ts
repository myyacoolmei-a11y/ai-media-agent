export const FENGBAO_BRAND_ID = "8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b";
export const FENGBAO_BRAND_SLUG = "fengbao";
export const FENGBAO_BRAND_NAME = "風曝";

export const ACTIVE_BRAND_COOKIE = "nf_active_brand";

export const LIMITED_EDITOR_LOCAL_PART = "cfac07151025";

export function emailLocalPart(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase().split("@")[0] ?? "";
}

export function isLimitedFengbaoAccount(email: string | null | undefined) {
  return emailLocalPart(email) === LIMITED_EDITOR_LOCAL_PART;
}

export function superAdminEmailsFromEnv() {
  return (process.env.SUPER_ADMIN_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
