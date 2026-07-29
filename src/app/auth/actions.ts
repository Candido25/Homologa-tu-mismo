"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getApplicationUrl,
  getAuthProviderName,
  isLocalTestAuthEnabled,
  isSupabaseConfigured,
} from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/panel";
}

function authRedirect(path: string, parameter: "error" | "mensaje", message: string) {
  redirect(`${path}?${parameter}=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const nextPath = safeNextPath(text(formData, "siguiente"));
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      authRedirect("/iniciar-sesion", "error", "La identidad ficticia local no está configurada.");
    }
    redirect(nextPath);
  }

  if (provider === "entra") {
    authRedirect("/iniciar-sesion", "error", "Microsoft Entra External ID todavía no está configurado.");
  }

  if (!isSupabaseConfigured()) {
    authRedirect("/iniciar-sesion", "error", "La autenticación todavía no está configurada.");
  }

  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  if (!email || password.length < 8) {
    authRedirect("/iniciar-sesion", "error", "Revisa el correo y la contraseña.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/iniciar-sesion", "error", "No pudimos iniciar sesión con esos datos.");
  }

  redirect(nextPath);
}

export async function signUp(formData: FormData) {
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      authRedirect("/crear-cuenta", "error", "La identidad ficticia local no está configurada.");
    }
    redirect("/panel");
  }

  if (provider === "entra") {
    authRedirect("/crear-cuenta", "error", "Microsoft Entra External ID todavía no está configurado.");
  }

  if (!isSupabaseConfigured()) {
    authRedirect("/crear-cuenta", "error", "La creación de cuentas todavía no está configurada.");
  }

  const displayName = text(formData, "displayName");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const acceptedTerms = formData.get("terms") === "on";

  if (displayName.length < 2 || !email || password.length < 8 || !acceptedTerms) {
    authRedirect("/crear-cuenta", "error", "Completa los datos y acepta los términos para continuar.");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || getApplicationUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    authRedirect("/crear-cuenta", "error", "No pudimos crear la cuenta. Revisa los datos o intenta más tarde.");
  }

  if (data.session) {
    redirect("/panel");
  }

  authRedirect(
    "/iniciar-sesion",
    "mensaje",
    "Revisa tu correo y confirma la cuenta antes de iniciar sesión.",
  );
}

export async function signOut() {
  const provider = getAuthProviderName();

  if (provider === "supabase" && isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
