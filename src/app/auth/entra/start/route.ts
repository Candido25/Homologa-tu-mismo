import { randomBytes } from "node:crypto";
import { CryptoProvider } from "@azure/msal-node";
import { NextResponse, type NextRequest } from "next/server";
import { isEntraConfigured } from "@/lib/env";
import { getEntraClient, getEntraConfig } from "@/lib/entra/config";
import { safeNextPath, saveEntraAuthFlow } from "@/lib/entra/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isEntraConfigured()) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=La%20identidad%20todavía%20no%20está%20configurada.", request.url),
    );
  }

  try {
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const { verifier, challenge } = await new CryptoProvider().generatePkceCodes();
    const nextPath = safeNextPath(request.nextUrl.searchParams.get("siguiente"));
    const config = getEntraConfig();

    await saveEntraAuthFlow({
      state,
      codeVerifier: verifier,
      nonce,
      nextPath,
    });

    const client = await getEntraClient();
    const authorizationUrl = await client.getAuthCodeUrl({
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      responseMode: "form_post",
      state,
      nonce,
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
      prompt: "select_account",
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("entra_authorization_start_failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=No%20pudimos%20iniciar%20el%20acceso%20seguro.", request.url),
    );
  }
}
