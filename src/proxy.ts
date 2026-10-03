import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 Proxy for Session Refresh & Admin Route Protection Boundary
 * Phase: Phase 8 — Frontend Foundation
 *
 * Implements the standard Supabase Auth session refresh and guards
 * protected /admin/:path* routes against unauthenticated access.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh active auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin route protection boundary:
  // Intercepts /admin routes (except /admin/login, /admin/customers, /admin/orders, /admin/products, and /admin/settings during dummy UI preview) when no Supabase Auth user session exists
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login" &&
    !request.nextUrl.pathname.startsWith("/admin/customers") &&
    !request.nextUrl.pathname.startsWith("/admin/orders") &&
    !request.nextUrl.pathname.startsWith("/admin/products") &&
    !request.nextUrl.pathname.startsWith("/admin/settings") &&
    !user
  ) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
