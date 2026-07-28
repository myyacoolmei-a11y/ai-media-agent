import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_PREFIX = "ai-media-project-";

export function createAccessToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashAccessToken(token) };
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function setProjectAccessCookie(
  response: NextResponse,
  projectId: string,
  token: string,
) {
  response.cookies.set(`${COOKIE_PREFIX}${projectId}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/`,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function verifyProjectAccess(projectId: string) {
  const token = (await cookies()).get(`${COOKIE_PREFIX}${projectId}`)?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project?.access_token_hash) return null;

  const actual = Buffer.from(hashAccessToken(token), "hex");
  const expected = Buffer.from(project.access_token_hash, "hex");

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  return { supabase, project };
}
