import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let userId: string | undefined;
  if (supabaseConfig.isConfigured) {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub;
  }

  const protectedPath =
    (request.nextUrl.pathname.startsWith("/admin") &&
      request.nextUrl.pathname !== "/admin/login") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/styles");
  const authPath =
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";

  if (protectedPath && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if (authPath && userId) {
    const url = request.nextUrl.clone();
    url.pathname =
      request.nextUrl.pathname === "/admin/login" ? "/admin" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
