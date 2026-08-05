"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getApplicationUrl,
  getAuthProviderName,
  isEntraConfigured,
  isLocalTestAuthEnabled,
  isSupabaseConfigured,
} from "@/lib/env";
import { revokeCurrentEntraSession } from "@/lib/entra/session";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/panel";
}

export async function signInAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const nextPath = safeNextPath(text(formData, "siguiente"));
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      return { error: "La identidad ficticia local no está configurada." };
    }
    redirect(nextPath);
  }

  if (provider === "entra") {
    if (!isEntraConfigured()) {
      return { error: "Microsoft Entra External ID todavía no está configurado." };
    }
    redirect(`/auth/entra/start?siguiente=${encodeURIComponent(nextPath)}`);
  }

  if (!isSupabaseConfigured()) {
    return { error: "La autenticación todavía no está configurada." };
  }

  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  if (!email || password.length < 8) {
    return { error: "Revisa el correo y la contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "No pudimos iniciar sesión con esos datos." };
  }

  redirect(nextPath);
}

export async function signUpAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      return { error: "La identidad ficticia local no está configurada." };
    }
    redirect("/panel");
  }

  if (provider === "entra") {
    if (!isEntraConfigured()) {
      return { error: "Microsoft Entra External ID todavía no está configurado." };
    }
    if (formData.get("terms") !== "on") {
      return { error: "Acepta los términos para continuar." };
    }
    redirect("/auth/entra/start?siguiente=/panel");
  }

  if (!isSupabaseConfigured()) {
    return { error: "La creación de cuentas todavía no está configurada." };
  }

  const displayName = text(formData, "displayName");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const acceptedTerms = formData.get("terms") === "on";

  if (displayName.length < 2 || !email || password.length < 8 || !acceptedTerms) {
    return { error: "Completa los datos y acepta los términos para continuar." };
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
    return { error: "No pudimos crear la cuenta. Revisa los datos o intenta más tarde." };
  }

  if (data.session) {
    redirect("/panel");
  }

  // Si no hay sesión, se requiere confirmación por email
  // Podríamos redirigir o devolver un mensaje de éxito. Redirigir como antes para mantener flujo,
  // pero esta vez usando un query param en login. O simplemente devolver un mensaje.
  return { message: "Revisa tu correo y confirma la cuenta antes de iniciar sesión." };
}

export async function recoverPasswordAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "La autenticación todavía no está configurada." };
  }

  const email = text(formData, "email").toLowerCase();
  if (!email) {
    return { error: "Ingresa un correo electrónico válido." };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || getApplicationUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/panel/cambiar-clave`,
  });

  if (error) {
    return { error: "No se pudo enviar el enlace de recuperación. Verifica tu correo." };
  }

  return { message: "Hemos enviado un enlace de recuperación a tu correo." };
}

export async function signOut() {
  const provider = getAuthProviderName();

  if (provider === "entra" && isEntraConfigured()) {
    await revokeCurrentEntraSession();
    redirect("/auth/entra/sign-out");
  }

  if (provider === "supabase" && isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
