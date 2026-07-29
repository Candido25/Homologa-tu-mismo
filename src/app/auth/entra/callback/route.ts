import { NextResponse, type NextRequest } from "next/server";
import { isEntraConfigured } from "@/lib/env";
import { getEntraClient, getEntraConfig } from "@/lib/entra/config";
import {
  consumeEntraAuthFlow,
  createEntraSession,
  setEntraSessionCookie,
} from "@/lib/entra/session";

export const runtime = "nodejs";

type Claims = Record<string, unknown>;

function claim(claims: Claims, name: string) {
  const value = claims[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function emailClaim(claims: Claims) {
  const direct = claim(claims, "email") || claim(claims, "preferred_username");
  if (direct) return direct.toLowerCase();
  const emails = claims.emails;
  if (!Array.isArray(emails)) return null;
  const first = emails.find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return first?.trim().toLowerCase() || null;
}

function loginError(request: NextRequest, message: string) {
  const destination = new URL("/iniciar-sesion", request.url);
  destination.searchParams.set("error", message);
  return NextResponse.redirect(destination, 303);
}

export async function POST(request: NextRequest) {
  if (!isEntraConfigured()) {
    return loginError(request, "La identidad todavía no está configurada.");
  }

  const form = await request.formData();
  const state = form.get("state");
  const code = form.get("code");
  const providerError = form.get("error");

  if (typeof providerError === "string") {
    return loginError(request, "El acceso fue cancelado o rechazado.");
  }
  if (typeof state !== "string" || typeof code !== "string") {
    return loginError(request, "La respuesta de identidad no es válida.");
  }

  const flow = await consumeEntraAuthFlow(state);
  if (!flow) {
    return loginError(request, "La solicitud de acceso venció o ya fue utilizada.");
  }

  try {
    const config = getEntraConfig();
    const client = await getEntraClient();
    const result = await client.acquireTokenByCode({
      code,
      codeVerifier: flow.codeVerifier,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
    });
    const claims = (result.idTokenClaims || {}) as Claims;
    const issuer = claim(claims, "iss");
    const subject = claim(claims, "sub");
    const tenantId = claim(claims, "tid");
    const audience = claim(claims, "aud");
    const nonce = claim(claims, "nonce");

    if (
      !issuer ||
      !subject ||
      tenantId !== config.tenantId ||
      audience !== config.clientId ||
      nonce !== flow.nonce
    ) {
      throw new Error("Las claims obligatorias de identidad no coinciden.");
    }

    const token = await createEntraSession({
      issuer,
      subject,
      email: emailClaim(claims),
      emailVerified: claims.email_verified === true,
      displayName: claim(claims, "name"),
    });
    const response = NextResponse.redirect(new URL(flow.nextPath, request.url), 303);
    setEntraSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("entra_authorization_callback_failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return loginError(request, "No pudimos completar el acceso seguro.");
  }
}
