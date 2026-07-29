import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthProviderName,
  getPublicSupabaseConfig,
  isLocalTestAuthEnabled,
  isSupabaseConfigured,
} from "@/lib/env";

const protectedPrefixes = ["/panel", "/expedientes"];
const authPrefixes = ["/iniciar-sesion", "/crear-cuenta"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPrefixes.some((prefix) => pathname.startsWith(prefix));
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (isAuthPage && isLocalTestAuthEnabled()) {
      return NextResponse.redirect(new URL("/panel", request.url));
    }
    return response;
  }

  if (provider !== "supabase" || !isSupabaseConfigured()) {
    return response;
  }

  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/iniciar-sesion", request.url);
    loginUrl.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
