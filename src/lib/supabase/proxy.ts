import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeInternalPath } from "@/lib/auth/paths";
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

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";
  const protectedPath =
    (pathname.startsWith("/admin") && !isAdminLogin) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/styles");
  const authPath = isAdminLogin || pathname === "/login" || pathname === "/signup";

  if (protectedPath && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if (authPath && userId) {
    const url = request.nextUrl.clone();
    url.pathname = safeInternalPath(
      request.nextUrl.searchParams.get("next"),
      "/admin",
    );
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
