import { NextResponse, type NextRequest } from "next/server";
import { isEntraConfigured } from "@/lib/env";
import { getEntraConfig } from "@/lib/entra/config";
import { revokeCurrentEntraSession } from "@/lib/entra/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isEntraConfigured()) return NextResponse.redirect(new URL("/", request.url));

  await revokeCurrentEntraSession();
  const config = getEntraConfig();
  const destination = new URL(config.logoutUrl);
  destination.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
  return NextResponse.redirect(destination);
}
