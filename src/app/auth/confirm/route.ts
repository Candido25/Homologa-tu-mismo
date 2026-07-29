import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthProviderName, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/iniciar-sesion";
  destination.search = "";

  if (getAuthProviderName() !== "supabase" || !isSupabaseConfigured()) {
    destination.searchParams.set("error", "La autenticación todavía no está configurada.");
    return NextResponse.redirect(destination);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    destination.searchParams.set("error", "El enlace de confirmación no es válido.");
    return NextResponse.redirect(destination);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    destination.searchParams.set("error", "El enlace venció o ya fue utilizado.");
    return NextResponse.redirect(destination);
  }

  destination.pathname = "/panel";
  return NextResponse.redirect(destination);
}
