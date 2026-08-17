import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  isPreviewDemo,
  PREVIEW_DEMO_COOKIE,
  PREVIEW_DEMO_USER,
} from "@/lib/preview";

export async function GET() {
  if (!isPreviewDemo()) {
    return NextResponse.json({ enabled: false, authenticated: false });
  }

  const jar = await cookies();
  const authenticated = jar.get(PREVIEW_DEMO_COOKIE)?.value === "1";
  return NextResponse.json({
    enabled: true,
    authenticated,
    email: authenticated ? PREVIEW_DEMO_USER.email : null,
  });
}

export async function POST() {
  if (!isPreviewDemo()) {
    return NextResponse.json({ error: "不是 Preview 環境。" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, email: PREVIEW_DEMO_USER.email });
  response.cookies.set(PREVIEW_DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export async function DELETE() {
  if (!isPreviewDemo()) {
    return NextResponse.json({ error: "不是 Preview 環境。" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_DEMO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
